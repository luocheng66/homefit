/**
 * 体重追踪模块
 */

let currentEditDate = null;

/**
 * 初始化体重模块
 */
function initWeightModule() {
    loadTodayWeight();
    updateWeightDisplay();
    renderWeightHistory();
}

/**
 * 加载今日体重
 */
function loadTodayWeight() {
    const today = dataManager.formatDate(new Date());
    const record = dataManager.getWeightRecord(today);

    if (record) {
        if (record.morning) {
            document.getElementById('morningWeight').value = record.morning;
        }
        if (record.evening) {
            document.getElementById('eveningWeight').value = record.evening;
        }
        updateWeightDiff();
    }
}

/**
 * 保存今日体重
 */
function saveTodayWeight() {
    const morningWeight = document.getElementById('morningWeight').value;
    const eveningWeight = document.getElementById('eveningWeight').value;

    if (!morningWeight && !eveningWeight) {
        showToast('请输入至少一项体重数据');
        return;
    }

    const today = dataManager.formatDate(new Date());
    dataManager.saveWeightRecord(today, morningWeight, eveningWeight);

    showToast('体重记录已保存');
    updateWeightDisplay();
    updateWeightDiff();
    checkWeightMilestones();
}

/**
 * 更新体重差显示
 */
function updateWeightDiff() {
    const morningWeight = parseFloat(document.getElementById('morningWeight').value);
    const eveningWeight = parseFloat(document.getElementById('eveningWeight').value);
    const diffEl = document.getElementById('weightDiff');

    if (morningWeight && eveningWeight) {
        const diff = (eveningWeight - morningWeight).toFixed(1);
        const isPositive = diff > 0;
        diffEl.innerHTML = `今日净重变化: <span class="${isPositive ? 'positive' : 'negative'}">${isPositive ? '+' : ''}${diff}kg</span>`;
    } else {
        diffEl.textContent = '';
    }
}

/**
 * 更新体重显示
 */
function updateWeightDisplay() {
    const startWeight = dataManager.getStartWeight();
    const currentWeight = dataManager.getLatestWeight();
    const targetWeight = dataManager.getTargetWeight();
    const plan = dataManager.calculatePlan();

    if (!startWeight || !currentWeight || !targetWeight || !plan) return;

    // 更新进度环
    const totalWeightToChange = Math.abs(startWeight - targetWeight);
    const weightChanged = Math.abs(startWeight - currentWeight);
    const progress = Math.min((weightChanged / totalWeightToChange) * 100, 100);

    const circumference = 2 * Math.PI * 54;
    const offset = circumference - (progress / 100) * circumference;
    document.getElementById('progressRing').style.strokeDashoffset = offset;

    // 更新剩余重量
    const remaining = (currentWeight - targetWeight).toFixed(1);
    document.getElementById('progressRemaining').textContent = `${remaining > 0 ? '-' : '+'}${Math.abs(remaining)}kg`;

    // 更新预计天数
    const weeklyRate = parseFloat(plan.weeklyRate);
    const weeksRemaining = Math.abs(remaining) / weeklyRate;
    const daysRemaining = Math.ceil(weeksRemaining * 7);
    document.getElementById('progressETA').textContent = daysRemaining;

    // 更新当前速率
    const weeklyChange = dataManager.calculateWeightChange(7);
    if (weeklyChange) {
        document.getElementById('progressRate').textContent = Math.abs(weeklyChange);
    }

    // 更新进度环颜色
    const isWeightLoss = plan.isWeightLoss;
    const ring = document.getElementById('progressRing');
    if (isWeightLoss) {
        ring.style.stroke = '#4CAF50';
    } else {
        ring.style.stroke = '#FF9800';
    }
}

/**
 * 检查体重里程碑
 */
function checkWeightMilestones() {
    const startWeight = dataManager.getStartWeight();
    const currentWeight = dataManager.getLatestWeight();

    if (!startWeight || !currentWeight) return;

    const weightLoss = startWeight - currentWeight;
    const milestones = [1, 2, 5, 10, 15, 20];

    milestones.forEach(milestone => {
        if (weightLoss >= milestone && weightLoss < milestone + 0.5) {
            showMilestoneAlert(milestone);
        }
    });
}

/**
 * 显示里程碑提醒
 */
function showMilestoneAlert(kg) {
    const messages = {
        1: '太棒了！你已经减掉了1公斤！继续加油！',
        2: '2公斤达成！你的努力正在见效！',
        5: '5公斤里程碑！这是一个巨大的成就！',
        10: '10公斤！你简直太厉害了！',
        15: '15公斤！你的蜕变令人惊叹！',
        20: '20公斤！你已经彻底改变了自己！'
    };

    showToast(`🎉 ${messages[kg] || `${kg}公斤达成！`}`);
}

/**
 * 切换图表范围
 */
function switchChartRange(element) {
    document.querySelectorAll('.chart-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    element.classList.add('active');

    const days = parseInt(element.dataset.range);
    renderWeightChart(days);
}

/**
 * 渲染体重历史
 */
function renderWeightHistory() {
    const records = dataManager.getWeightRecords();
    const dates = Object.keys(records).sort().reverse();

    const listEl = document.getElementById('weightList');
    if (!listEl) return;

    listEl.innerHTML = dates.slice(0, 30).map(date => {
        const record = records[date];
        const change = calculateDayChange(date);

        return `
            <div class="weight-record">
                <div class="weight-record-date">${formatDisplayDate(date)}</div>
                <div class="weight-record-values">
                    <div class="weight-record-morning">
                        <span class="weight-record-label">起床</span>
                        <span class="weight-record-value">${record.morning || '-'}</span>
                    </div>
                    <div class="weight-record-evening">
                        <span class="weight-record-label">睡前</span>
                        <span class="weight-record-value">${record.evening || '-'}</span>
                    </div>
                </div>
                <div class="weight-record-change">
                    <span class="weight-record-change-value ${change > 0 ? 'positive' : 'negative'}">
                        ${change ? (change > 0 ? '+' : '') + change + 'kg' : '-'}
                    </span>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * 计算单日变化
 */
function calculateDayChange(date) {
    const record = dataManager.getWeightRecord(date);
    if (!record || !record.morning || !record.evening) return null;
    return (record.evening - record.morning).toFixed(1);
}

/**
 * 格式化显示日期
 */
function formatDisplayDate(dateStr) {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    const weekDay = weekDays[date.getDay()];
    return `${month}月${day}日 周${weekDay}`;
}

/**
 * 切换体重编辑模式
 */
function toggleWeightEdit() {
    const modal = document.getElementById('editWeightModal');
    modal.classList.toggle('hidden');
}

/**
 * 打开编辑体重弹窗
 */
function openEditModal(date) {
    currentEditDate = date;
    const record = dataManager.getWeightRecord(date);

    document.getElementById('editDate').textContent = formatDisplayDate(date);
    document.getElementById('editMorningWeight').value = record?.morning || '';
    document.getElementById('editEveningWeight').value = record?.evening || '';

    document.getElementById('editWeightModal').classList.remove('hidden');
}

/**
 * 关闭编辑弹窗
 */
function closeEditModal() {
    document.getElementById('editWeightModal').classList.add('hidden');
    currentEditDate = null;
}

/**
 * 保存编辑后的体重
 */
function saveEditedWeight() {
    if (!currentEditDate) return;

    const morningWeight = document.getElementById('editMorningWeight').value;
    const eveningWeight = document.getElementById('editEveningWeight').value;

    dataManager.saveWeightRecord(currentEditDate, morningWeight, eveningWeight);

    closeEditModal();
    renderWeightHistory();
    updateWeightDisplay();
    showToast('体重记录已更新');
}

/**
 * 更新体重统计
 */
function updateWeightStats() {
    const weekChange = dataManager.calculateWeightChange(7);
    const monthChange = dataManager.calculateWeightChange(30);
    const startWeight = dataManager.getStartWeight();
    const currentWeight = dataManager.getLatestWeight();

    const weekEl = document.getElementById('weekChange');
    const monthEl = document.getElementById('monthChange');
    const totalEl = document.getElementById('totalChange');

    if (weekEl && weekChange) {
        weekEl.textContent = `${weekChange > 0 ? '+' : ''}${weekChange}kg`;
        weekEl.className = `stat-value ${weekChange > 0 ? 'positive' : 'negative'}`;
    }

    if (monthEl && monthChange) {
        monthEl.textContent = `${monthChange > 0 ? '+' : ''}${monthChange}kg`;
        monthEl.className = `stat-value ${monthChange > 0 ? 'positive' : 'negative'}`;
    }

    if (totalEl && startWeight && currentWeight) {
        const totalChange = (currentWeight - startWeight).toFixed(1);
        totalEl.textContent = `${totalChange > 0 ? '+' : ''}${totalChange}kg`;
        totalEl.className = `stat-value ${totalChange > 0 ? 'positive' : 'negative'}`;
    }
}
