/**
 * 主应用模块 - 支持多用户
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
    // 检查登录状态
    if (authManager.isLoggedIn()) {
        // 已登录，初始化用户数据
        dataManager.initForUser();

        // 检查是否已完成引导
        if (dataManager.isOnboardingComplete()) {
            showMainApp();
        } else {
            showOnboarding();
        }
    } else {
        // 未登录，显示登录页面
        showAuthPage();
    }
}

/**
 * 显示登录页面
 */
function showAuthPage() {
    document.getElementById('authPage').classList.remove('hidden');
    document.getElementById('onboarding').classList.add('hidden');
    document.getElementById('mainApp').classList.add('hidden');

    // 加载已有用户列表
    loadExistingUsers();
}

/**
 * 显示引导问卷
 */
function showOnboarding() {
    document.getElementById('authPage').classList.add('hidden');
    document.getElementById('onboarding').classList.remove('hidden');
    document.getElementById('mainApp').classList.add('hidden');
}

/**
 * 显示主应用
 */
function showMainApp() {
    document.getElementById('authPage').classList.add('hidden');
    document.getElementById('onboarding').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');

    // 分批初始化
    requestAnimationFrame(() => {
        initWeightModule();
        initMotivationModule();
    });

    setTimeout(() => {
        initWorkoutModule();
        initReportModule();
        bindKeyboardEvents();
    }, 100);
}

/**
 * 加载已有用户列表
 */
function loadExistingUsers() {
    const users = authManager.getUsersList();
    const existingUsersEl = document.getElementById('existingUsers');
    const usersListEl = document.getElementById('usersList');

    if (users.length > 0) {
        existingUsersEl.classList.remove('hidden');
        usersListEl.innerHTML = users.map(user => `
            <div class="user-chip" onclick="quickLogin('${user.username}')">
                <span class="user-chip-icon">👤</span>
                <span>${user.username}</span>
            </div>
        `).join('');
    } else {
        existingUsersEl.classList.add('hidden');
    }
}

/**
 * 快速登录（选择已有账号）
 */
function quickLogin(username) {
    document.getElementById('loginUsername').value = username;
    document.getElementById('loginPassword').focus();
}

/**
 * 显示登录表单
 */
function showLogin() {
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('registerForm').classList.add('hidden');
    clearAuthError();
}

/**
 * 显示注册表单
 */
function showRegister() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.remove('hidden');
    clearAuthError();
}

/**
 * 清除错误提示
 */
function clearAuthError() {
    const loginError = document.getElementById('loginError');
    const registerError = document.getElementById('registerError');
    if (loginError) loginError.textContent = '';
    if (registerError) registerError.textContent = '';
}

/**
 * 显示错误提示
 */
function showAuthError(message, type = 'register') {
    const errorEl = document.getElementById(type === 'login' ? 'loginError' : 'registerError');
    if (errorEl) {
        errorEl.textContent = message;
    }
}

/**
 * 处理登录
 */
function handleLogin() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    if (!username || !password) {
        showAuthError('请输入用户名和密码', 'login');
        return;
    }

    const result = authManager.login(username, password);

    if (result.success) {
        // 登录成功
        dataManager.initForUser();

        if (dataManager.isOnboardingComplete()) {
            showMainApp();
        } else {
            showOnboarding();
        }
    } else {
        showAuthError(result.message, 'login');
    }
}

/**
 * 处理注册
 */
function handleRegister() {
    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;

    console.log('注册:', username, password, confirmPassword);

    if (!username || !password || !confirmPassword) {
        showAuthError('请填写所有字段', 'register');
        return;
    }

    if (password !== confirmPassword) {
        showAuthError('两次输入的密码不一致', 'register');
        return;
    }

    if (password.length < 4) {
        showAuthError('密码至少4位', 'register');
        return;
    }

    const result = authManager.register(username, password);
    console.log('注册结果:', result);

    if (result.success) {
        // 注册成功，进入引导问卷
        dataManager.initForUser();
        showOnboarding();
    } else {
        showAuthError(result.message, 'register');
    }
}

/**
 * 登出
 */
function handleLogout() {
    if (confirm('确定要退出登录吗？')) {
        authManager.logout();
        clearDOMCache();
        showAuthPage();
    }
}

/**
 * 初始化主应用（保留兼容）
 */
function initMainApp() {
    showMainApp();
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
 * 显示提示消息
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
 * 切换页面
 */
function switchPage(element) {
    const page = element.dataset.page;
    if (!page) return;

    requestAnimationFrame(() => {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        element.classList.add('active');

        const pages = ['dashboard', 'workoutPage', 'weightHistoryPage', 'weeklyReportPage'];
        pages.forEach(id => {
            const el = getCachedElement(id);
            if (el) el.classList.add('hidden');
        });

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
        setTimeout(() => {
            showWeeklyReport();
        }, 50);
    }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', initApp);
