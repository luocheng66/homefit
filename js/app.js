/**
 * 主应用模块
 */

/**
 * 应用初始化
 */
function initApp() {
    // 检查是否已完成引导
    if (dataManager.isOnboardingComplete()) {
        document.getElementById('onboarding').classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');
        initMainApp();
    } else {
        document.getElementById('onboarding').classList.remove('hidden');
        document.getElementById('mainApp').classList.add('hidden');
    }
}

/**
 * 初始化主应用
 */
function initMainApp() {
    initWeightModule();
    initWorkoutModule();
    initMotivationModule();
    initReportModule();

    // 绑定键盘事件
    bindKeyboardEvents();

    console.log('蜕变·HomeFit 应用初始化完成！');
}

/**
 * 绑定键盘事件
 */
function bindKeyboardEvents() {
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            // 关闭各种弹窗
            const feedback = document.getElementById('workoutFeedback');
            if (feedback && !feedback.classList.contains('hidden')) {
                feedback.classList.add('hidden');
            }

            const editModal = document.getElementById('editWeightModal');
            if (editModal && !editModal.classList.contains('hidden')) {
                editModal.classList.add('hidden');
            }

            closeSettings();
        }
    });
}

/**
 * 显示提示消息
 */
function showToast(message) {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = message;
        toast.classList.remove('hidden');

        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', initApp);
