/**
 * 周报模块
 */

/**
 * 初始化周报模块
 */
function initReportModule() {
    // 周报在打开时生成
}

/**
 * 显示周报页面
 */
function showWeeklyReport() {
    const report = dataManager.generateWeeklyReport();
    if (!report) return;

    // 更新周报内容
    document.getElementById('reportWeek').textContent = report.weekNumber;
    document.getElementById('reportDate').textContent = `${report.startDate} 至 ${report.endDate}`;

    document.getElementById('reportStartWeight').textContent = report.startWeight ? `${report.startWeight}kg` : '-';
    document.getElementById('reportEndWeight').textContent = report.endWeight ? `${report.endWeight}kg` : '-';
    document.getElementById('reportWeightChange').textContent = report.weightChange ? `${report.weightChange > 0 ? '+' : ''}${report.weightChange}kg` : '-';

    document.getElementById('reportWorkouts').textContent = `${report.workoutCount}次`;
    document.getElementById('reportDuration').textContent = `${report.workoutDuration}分钟`;

    // 效率评价
    const efficiencyEl = document.getElementById('reportEfficiency');
    if (report.efficiency) {
        efficiencyEl.textContent = report.efficiency.message;
        efficiencyEl.className = `report-efficiency efficiency-${report.efficiency.status}`;
    }

    document.getElementById('reportSuggestion').textContent = report.suggestion;

    // 生成激励语录
    const motivation = generateReportMotivation(report);
    document.getElementById('reportMotivation').textContent = motivation;

    // 渲染图表
    setTimeout(() => {
        renderReportChart();
    }, 100);
}

/**
 * 生成周报激励语录
 */
function generateReportMotivation(report) {
    if (!report.weightChange) {
        return '继续记录体重，下周就能看到你的进步！';
    }

    const change = parseFloat(report.weightChange);

    if (change < -1) {
        return '太棒了！这一周你取得了显著的进步。你的努力正在创造奇迹，继续保持这份激情！';
    } else if (change < 0) {
        return '稳步前进！虽然变化不大，但每一点进步都值得庆祝。坚持就是胜利！';
    } else if (change === 0) {
        return '体重没有变化，但这不代表你没有进步。身体可能在进行内部调整，继续保持训练和健康饮食！';
    } else {
        return '体重有所上升，不必气馁。可能是水分波动或肌肉增长。继续坚持训练，关注身体的整体变化！';
    }
}

/**
 * 导出周报
 */
function exportReport(format) {
    if (format === 'pdf') {
        exportReportAsPDF();
    } else if (format === 'image') {
        exportReportAsImage();
    }
}

/**
 * 导出为PDF
 */
function exportReportAsPDF() {
    showToast('PDF导出功能开发中...');

    // 这里可以集成jsPDF库
    // const doc = new jsPDF();
    // doc.html(document.getElementById('reportContent'), {
    //     callback: function(doc) {
    //         doc.save('周报.pdf');
    //     }
    // });
}

/**
 * 导出为图片
 */
function exportReportAsImage() {
    showToast('图片导出功能开发中...');

    // 这里可以集成html2canvas库
    // html2canvas(document.getElementById('reportContent')).then(canvas => {
    //     const link = document.createElement('a');
    //     link.download = '周报.png';
    //     link.href = canvas.toDataURL();
    //     link.click();
    // });
}

/**
 * 切换页面
 */
function switchPage(element) {
    const page = element.dataset.page;

    // 更新导航状态
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    element.classList.add('active');

    // 隐藏所有页面
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('workoutPage').classList.add('hidden');
    document.getElementById('weightHistoryPage').classList.add('hidden');
    document.getElementById('weeklyReportPage').classList.add('hidden');

    // 显示目标页面
    switch (page) {
        case 'dashboard':
            document.getElementById('dashboard').classList.remove('hidden');
            updateWeightDisplay();
            break;
        case 'workout':
            document.getElementById('workoutPage').classList.remove('hidden');
            startWorkout();
            break;
        case 'weight':
            document.getElementById('weightHistoryPage').classList.remove('hidden');
            renderWeightHistory();
            updateWeightStats();
            renderWeightDetailChart();
            break;
        case 'report':
            document.getElementById('weeklyReportPage').classList.remove('hidden');
            showWeeklyReport();
            break;
    }
}

/**
 * 显示设置
 */
function showSettings() {
    const profile = dataManager.getUserProfile();
    const settings = dataManager.getSettings();
    const currentUser = authManager.getCurrentUser();

    const settingsHTML = `
        <div class="settings-page" id="settingsPage">
            <div class="settings-header">
                <button class="btn-back" onclick="closeSettings()">← 返回</button>
                <h2>设置</h2>
                <div></div>
            </div>

            <div class="settings-content">
                <div class="settings-section">
                    <div class="settings-section-title">当前账号</div>
                    <div class="settings-item">
                        <div class="settings-item-left">
                            <span class="settings-item-icon">👤</span>
                            <span class="settings-item-label">用户名</span>
                        </div>
                        <span class="settings-item-value">${currentUser}</span>
                    </div>
                </div>

                <div class="settings-section">
                    <div class="settings-section-title">个人信息</div>
                    <div class="settings-item">
                        <div class="settings-item-left">
                            <span class="settings-item-icon">👤</span>
                            <span class="settings-item-label">性别</span>
                        </div>
                        <span class="settings-item-value">${profile?.gender === 'male' ? '男' : '女'}</span>
                    </div>
                    <div class="settings-item">
                        <div class="settings-item-left">
                            <span class="settings-item-icon">📅</span>
                            <span class="settings-item-label">年龄</span>
                        </div>
                        <span class="settings-item-value">${profile?.age}岁</span>
                    </div>
                    <div class="settings-item">
                        <div class="settings-item-left">
                            <span class="settings-item-icon">📏</span>
                            <span class="settings-item-label">身高</span>
                        </div>
                        <span class="settings-item-value">${profile?.height}cm</span>
                    </div>
                    <div class="settings-item">
                        <div class="settings-item-left">
                            <span class="settings-item-icon">⚖️</span>
                            <span class="settings-item-label">目标体重</span>
                        </div>
                        <span class="settings-item-value">${profile?.targetWeight}kg</span>
                    </div>
                </div>

                <div class="settings-section">
                    <div class="settings-section-title">偏好设置</div>
                    <div class="settings-item">
                        <div class="settings-item-left">
                            <span class="settings-item-icon">🔊</span>
                            <span class="settings-item-label">语音引导</span>
                        </div>
                        <label class="switch">
                            <input type="checkbox" ${settings.voiceEnabled ? 'checked' : ''} onchange="toggleVoice(this.checked)">
                            <span class="switch-slider"></span>
                        </label>
                    </div>
                    <div class="settings-item">
                        <div class="settings-item-left">
                            <span class="settings-item-icon">🔔</span>
                            <span class="settings-item-label">提醒通知</span>
                        </div>
                        <label class="switch">
                            <input type="checkbox" ${settings.notifications ? 'checked' : ''} onchange="toggleNotifications(this.checked)">
                            <span class="switch-slider"></span>
                        </label>
                    </div>
                </div>

                <div class="settings-section">
                    <div class="settings-section-title">数据管理</div>
                    <div class="settings-item" onclick="exportData()">
                        <div class="settings-item-left">
                            <span class="settings-item-icon">📥</span>
                            <span class="settings-item-label">导出数据</span>
                        </div>
                        <span class="settings-item-arrow">›</span>
                    </div>
                    <div class="settings-item" onclick="importData()">
                        <div class="settings-item-left">
                            <span class="settings-item-icon">📤</span>
                            <span class="settings-item-label">导入数据</span>
                        </div>
                        <span class="settings-item-arrow">›</span>
                    </div>
                    <div class="settings-item danger" onclick="resetData()">
                        <div class="settings-item-left">
                            <span class="settings-item-icon">🗑️</span>
                            <span class="settings-item-label">重置所有数据</span>
                        </div>
                        <span class="settings-item-arrow">›</span>
                    </div>
                </div>

                <div class="settings-section">
                    <div class="settings-section-title">账号</div>
                    <div class="settings-item danger" onclick="handleLogout()">
                        <div class="settings-item-left">
                            <span class="settings-item-icon">🚪</span>
                            <span class="settings-item-label">退出登录</span>
                        </div>
                        <span class="settings-item-arrow">›</span>
                    </div>
                </div>

                <div class="settings-section">
                    <div class="settings-section-title">关于</div>
                    <div class="settings-item">
                        <div class="settings-item-left">
                            <span class="settings-item-icon">ℹ️</span>
                            <span class="settings-item-label">版本</span>
                        </div>
                        <span class="settings-item-value">1.0.0</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', settingsHTML);
}

/**
 * 关闭设置
 */
function closeSettings() {
    const settingsPage = document.getElementById('settingsPage');
    if (settingsPage) {
        settingsPage.remove();
    }
}

/**
 * 切换语音
 */
function toggleVoice(enabled) {
    const settings = dataManager.getSettings();
    settings.voiceEnabled = enabled;
    dataManager.saveSettings(settings);
    showToast(enabled ? '语音引导已开启' : '语音引导已关闭');
}

/**
 * 切换通知
 */
function toggleNotifications(enabled) {
    const settings = dataManager.getSettings();
    settings.notifications = enabled;
    dataManager.saveSettings(settings);
    showToast(enabled ? '提醒通知已开启' : '提醒通知已关闭');
}

/**
 * 导出数据
 */
function exportData() {
    const data = dataManager.exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `homefit_backup_${dataManager.formatDate(new Date())}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('数据已导出');
}

/**
 * 导入数据
 */
function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const data = JSON.parse(event.target.result);
                if (dataManager.importData(data)) {
                    showToast('数据导入成功');
                    location.reload();
                } else {
                    showToast('数据格式无效');
                }
            } catch (e) {
                showToast('导入失败，请检查文件');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

/**
 * 重置数据
 */
function resetData() {
    if (confirm('确定要重置所有数据吗？此操作不可恢复！')) {
        if (confirm('再次确认：是否删除所有数据？')) {
            dataManager.resetAllData();
            showToast('数据已重置');
            location.reload();
        }
    }
}
