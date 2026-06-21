/**
 * 体重追踪模块 - 性能优化版
 */

let currentEditDate = null;

// 防抖保存
const debouncedSaveWeight = debounce(function(date, morning, evening) {
    dataManager.saveWeightRecord(date, morning, evening);
}, 500);

/**
 * 初始化体重模块
 */
function initWeightModule() {
    loadTodayWeight();
    // 延迟更新显示
    requestAnimationFrame(() => {
        updateWeightDisplay();
    });
}

/**
 * 加载今日体重
 */
function loadTodayWeight() {
    const today = dataManager.formatDate(new Date());
    const record = dataManager.getWeightRecord(today);

    if (record) {
        const morningInput = document.getElementById('morningWeight');
        const eveningInput = document.getElementById('eveningWeight');

        if (morningInput && record.morning) {
            morningInput.value = record.morning;
        }
        if (eveningInput && record.evening) {
            eveningInput.value = record.evening;
        }
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
    checkWeightMilestones();

    // 清除图表缓存
    if (typeof clearChartCache === 'function') {
        clearChartCache();
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

    // 使用 requestAnimationFrame 优化动画
    requestAnimationFrame(() => {
        // 更新进度环
        const totalWeightToChange = Math.abs(startWeight - targetWeight);
        const weightChanged = Math.abs(startWeight - currentWeight);
        const progress = Math.min((weightChanged / totalWeightToChange) * 100, 100);

        const circumference = 2 * Math.PI * 54;
        const offset = circumference - (progress / 100) * circumference;

        const progressRing = document.getElementById('progressRing');
        if (progressRing) {
            progressRing.style.strokeDashoffset = offset;
        }

        // 更新剩余重量
        const remaining = (currentWeight - targetWeight).toFixed(1);
        const remainingEl = document.getElementById('progressRemaining');
        if (remainingEl) {
            remainingEl.textContent = `${remaining > 0 ? '-' : '+'}${Math.abs(remaining)}kg`;
        }

        // 更新预计天数
        const weeklyRate = parseFloat(plan.weeklyRate);
        const weeksRemaining = Math.abs(remaining) / weeklyRate;
        const daysRemaining = Math.ceil(weeksRemaining * 7);
        const etaEl = document.getElementById('progressETA');
        if (etaEl) {
            etaEl.textContent = daysRemaining;
        }

        // 更新当前速率
        const weeklyChange = dataManager.calculateWeightChange(7);
        if (weeklyChange) {
            const rateEl = document.getElementById('progressRate');
            if (rateEl) {
                rateEl.textContent = Math.abs(weeklyChange);
            }
        }
    });
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

    for (const milestone of milestones) {
        if (weightLoss >= milestone && weightLoss < milestone + 0.5) {
            showMilestoneAlert(milestone);
            break;
        }
    }
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
    clearChartCache();
    renderWeightChart(days);
}

/**
 * 渲染体重历史（优化版 - 虚拟滚动）
 */
function renderWeightHistory() {
    const records = dataManager.getWeightRecords();
    const dates = Object.keys(records).sort().reverse();

    const listEl = document.getElementById('weightList');
    if (!listEl) return;

    // 只渲染前30条
    const visibleDates = dates.slice(0, 30);

    // 使用 DocumentFragment 批量插入
    const fragment = document.createDocumentFragment();

    visibleDates.forEach(date => {
        const record = records[date];
        const change = calculateDayChange(date);

        const div = document.createElement('div');
        div.className = 'weight-record';
        div.onclick = () => openEditModal(date);

        div.innerHTML = `
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
        `;

        fragment.appendChild(div);
    });

    listEl.innerHTML = '';
    listEl.appendChild(fragment);
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
    clearChartCache();
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
