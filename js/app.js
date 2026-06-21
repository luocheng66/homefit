/**
 * 主应用模块 - 性能优化版
 */

// 工具函数：防抖
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 工具函数：节流
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// 缓存DOM元素
const DOMCache = {};

function getCachedElement(id) {
    if (!DOMCache[id]) {
        DOMCache[id] = document.getElementById(id);
    }
    return DOMCache[id];
}

function clearDOMCache() {
    Object.keys(DOMCache).forEach(key => delete DOMCache[key]);
}

/**
 * 应用初始化
 */
function initApp() {
    // 使用 requestAnimationFrame 确保DOM已渲染
    requestAnimationFrame(() => {
        if (dataManager.isOnboardingComplete()) {
            document.getElementById('onboarding').classList.add('hidden');
            document.getElementById('mainApp').classList.remove('hidden');
            initMainApp();
        } else {
            document.getElementById('onboarding').classList.remove('hidden');
            document.getElementById('mainApp').classList.add('hidden');
        }
    });
}

/**
 * 初始化主应用
 */
function initMainApp() {
    // 分批初始化，避免阻塞主线程
    requestAnimationFrame(() => {
        initWeightModule();
        initMotivationModule();
    });

    // 延迟加载非关键模块
    setTimeout(() => {
        initWorkoutModule();
        initReportModule();
        bindKeyboardEvents();
    }, 100);

    console.log('蜕变·HomeFit 应用初始化完成！');
}

/**
 * 绑定键盘事件
 */
function bindKeyboardEvents() {
    const handleEscape = throttle(function(e) {
        if (e.key === 'Escape') {
            const feedback = getCachedElement('workoutFeedback');
            if (feedback && !feedback.classList.contains('hidden')) {
                feedback.classList.add('hidden');
            }

            const editModal = getCachedElement('editWeightModal');
            if (editModal && !editModal.classList.contains('hidden')) {
                editModal.classList.add('hidden');
            }

            closeSettings();
        }
    }, 100);

    document.addEventListener('keydown', handleEscape);
}

/**
 * 显示提示消息（防抖版本）
 */
const showToast = debounce(function(message) {
    const toast = getCachedElement('toast');
    if (toast) {
        toast.textContent = message;
        toast.classList.remove('hidden');

        setTimeout(() => {
            toast.classList.add('hidden');
        }, 2500);
    }
}, 300);

/**
 * 切换页面（使用事件委托优化）
 */
function switchPage(element) {
    const page = element.dataset.page;
    if (!page) return;

    // 批量更新DOM
    requestAnimationFrame(() => {
        // 更新导航状态
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        element.classList.add('active');

        // 隐藏所有页面
        const pages = ['dashboard', 'workoutPage', 'weightHistoryPage', 'weeklyReportPage'];
        pages.forEach(id => {
            const el = getCachedElement(id);
            if (el) el.classList.add('hidden');
        });

        // 显示目标页面
        switch (page) {
            case 'dashboard':
                showDashboard();
                break;
            case 'workout':
                showWorkoutPage();
                break;
            case 'weight':
                showWeightPage();
                break;
            case 'report':
                showReportPage();
                break;
        }
    });
}

function showDashboard() {
    const dashboard = getCachedElement('dashboard');
    if (dashboard) {
        dashboard.classList.remove('hidden');
        // 延迟更新数据
        setTimeout(() => {
            updateWeightDisplay();
        }, 50);
    }
}

function showWorkoutPage() {
    const workoutPage = getCachedElement('workoutPage');
    if (workoutPage) {
        workoutPage.classList.remove('hidden');
        startWorkout();
    }
}

function showWeightPage() {
    const weightPage = getCachedElement('weightHistoryPage');
    if (weightPage) {
        weightPage.classList.remove('hidden');
        // 延迟渲染图表
        setTimeout(() => {
            renderWeightHistory();
            updateWeightStats();
            renderWeightDetailChart();
        }, 50);
    }
}

function showReportPage() {
    const reportPage = getCachedElement('weeklyReportPage');
    if (reportPage) {
        reportPage.classList.remove('hidden');
        // 延迟渲染
        setTimeout(() => {
            showWeeklyReport();
        }, 50);
    }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', initApp);
