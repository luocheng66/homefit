/**
 * 账号认证模块
 * 管理用户登录、注册、数据隔离
 */

const AUTH_KEY = 'homefit_current_user';
const USERS_KEY = 'homefit_users';

class AuthManager {
    constructor() {
        this.currentUser = this.loadCurrentUser();
        this.users = this.loadUsers();
    }

    loadCurrentUser() {
        try {
            return localStorage.getItem(AUTH_KEY);
        } catch (e) {
            return null;
        }
    }

    loadUsers() {
        try {
            const data = localStorage.getItem(USERS_KEY);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            return {};
        }
    }

    saveCurrentUser(username) {
        localStorage.setItem(AUTH_KEY, username);
        this.currentUser = username;
    }

    saveUsers() {
        localStorage.setItem(USERS_KEY, JSON.stringify(this.users));
    }

    // 检查是否已登录
    isLoggedIn() {
        return !!this.currentUser && !!this.users[this.currentUser];
    }

    // 获取当前用户名
    getCurrentUser() {
        return this.currentUser;
    }

    // 注册新用户
    register(username, password) {
        if (!username || username.trim().length === 0) {
            return { success: false, message: '请输入用户名' };
        }

        username = username.trim().toLowerCase();

        if (username.length < 2) {
            return { success: false, message: '用户名至少2个字符' };
        }

        if (this.users[username]) {
            return { success: false, message: '该用户名已存在' };
        }

        // 创建新用户
        this.users[username] = {
            password: this.hashPassword(password),
            createdAt: new Date().toISOString(),
            dataKey: `homefit_data_${username}`
        };

        this.saveUsers();
        this.saveCurrentUser(username);

        // 初始化用户数据
        this.initUserData(username);

        return { success: true, message: '注册成功' };
    }

    // 登录
    login(username, password) {
        if (!username || username.trim().length === 0) {
            return { success: false, message: '请输入用户名' };
        }

        username = username.trim().toLowerCase();

        const user = this.users[username];
        if (!user) {
            return { success: false, message: '用户不存在' };
        }

        if (user.password !== this.hashPassword(password)) {
            return { success: false, message: '密码错误' };
        }

        this.saveCurrentUser(username);

        return { success: true, message: '登录成功' };
    }

    // 登出
    logout() {
        localStorage.removeItem(AUTH_KEY);
        this.currentUser = null;
    }

    // 检查用户是否已完成引导
    isOnboardingComplete() {
        if (!this.currentUser) return false;

        const userData = this.getUserData();
        return userData && userData.userProfile && userData.userProfile.onboardingComplete;
    }

    // 获取当前用户的数据存储key
    getUserDataKey() {
        if (!this.currentUser) return null;
        return `homefit_data_${this.currentUser}`;
    }

    // 获取当前用户数据
    getUserData() {
        const key = this.getUserDataKey();
        if (!key) return null;

        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    }

    // 保存当前用户数据
    saveUserData(data) {
        const key = this.getUserDataKey();
        if (!key) return;

        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.error('保存用户数据失败:', e);
        }
    }

    // 初始化新用户数据
    initUserData(username) {
        const key = `homefit_data_${username}`;
        const initialData = {
            userProfile: null,
            weightRecords: {},
            workoutLogs: {},
            dietRecords: {},
            streak: { current: 0, longest: 0, lastDate: null },
            achievements: [],
            settings: {
                unit: 'kg',
                voiceEnabled: true,
                voiceStyle: 'encouraging',
                notifications: true
            }
        };

        localStorage.setItem(key, JSON.stringify(initialData));
    }

    // 简单密码哈希（注意：这只是基本混淆，不适用于生产环境）
    hashPassword(password) {
        if (!password) return '';
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(36);
    }

    // 获取所有用户列表（用于登录页面显示）
    getUsersList() {
        return Object.keys(this.users).map(username => ({
            username,
            createdAt: this.users[username].createdAt
        }));
    }

    // 删除用户
    deleteUser(username) {
        if (this.users[username]) {
            delete this.users[username];
            this.saveUsers();
            localStorage.removeItem(`homefit_data_${username}`);

            if (this.currentUser === username) {
                this.logout();
            }
            return true;
        }
        return false;
    }
}

// 创建全局认证管理实例
const authManager = new AuthManager();
