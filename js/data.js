/**
 * 数据存储层 - 支持多用户
 * 使用内存缓存减少localStorage读写
 */

// 写入队列和定时器
let writeQueue = {};
let writeTimer = null;

class DataManager {
    constructor() {
        this.dataKey = null;
        this.userData = null;
    }

    // 初始化当前用户数据
    initForUser() {
        this.dataKey = authManager.getUserDataKey();
        if (!this.dataKey) return false;

        const data = authManager.getUserData();
        if (data) {
            this.userData = data;
        } else {
            // 初始化空数据
            this.userData = {
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
            this.save();
        }
        return true;
    }

    save() {
        if (this.dataKey && this.userData) {
            authManager.saveUserData(this.userData);
        }
    }

    // ============ 用户档案 ============

    saveUserProfile(profile) {
        this.userData.userProfile = profile;
        this.save();
    }

    getUserProfile() {
        return this.userData?.userProfile || null;
    }

    isOnboardingComplete() {
        return this.userData?.userProfile?.onboardingComplete === true;
    }

    // ============ 体重记录 ============

    saveWeightRecord(date, morning, evening) {
        if (!this.userData) return;

        this.userData.weightRecords[date] = {
            morning: morning ? parseFloat(morning) : null,
            evening: evening ? parseFloat(evening) : null,
            updatedAt: new Date().toISOString()
        };
        this.save();
        this.updateStreak();
    }

    getWeightRecord(date) {
        return this.userData?.weightRecords[date] || null;
    }

    getWeightRecords() {
        return this.userData?.weightRecords || {};
    }

    getRecentWeightRecords(days = 7) {
        const records = [];
        const today = new Date();

        for (let i = 0; i < days; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateKey = this.formatDate(date);
            const record = this.userData?.weightRecords[dateKey];

            if (record) {
                records.push({
                    date: dateKey,
                    ...record
                });
            }
        }

        return records.reverse();
    }

    getLatestWeight() {
        const dates = Object.keys(this.userData?.weightRecords || {}).sort().reverse();
        if (dates.length === 0) return null;

        const latest = this.userData.weightRecords[dates[0]];
        return latest.morning || latest.evening;
    }

    getStartWeight() {
        return this.userData?.userProfile?.currentWeight || null;
    }

    getTargetWeight() {
        return this.userData?.userProfile?.targetWeight || null;
    }

    getWeeklyAverageWeight() {
        const records = this.getRecentWeightRecords(7);
        if (records.length === 0) return null;

        let totalWeight = 0;
        let count = 0;

        records.forEach(record => {
            if (record.morning) {
                totalWeight += record.morning;
                count++;
            }
        });

        return count > 0 ? (totalWeight / count).toFixed(1) : null;
    }

    calculateWeightChange(days = 7) {
        const records = this.getRecentWeightRecords(days);
        if (records.length < 2) return null;

        const first = records[0].morning || records[0].evening;
        const last = records[records.length - 1].morning || records[records.length - 1].evening;

        if (first && last) {
            return (last - first).toFixed(1);
        }
        return null;
    }

    // ============ 训练记录 ============

    saveWorkoutLog(date, log) {
        if (!this.userData) return;

        this.userData.workoutLogs[date] = {
            ...log,
            completedAt: new Date().toISOString()
        };
        this.save();
    }

    getWorkoutLog(date) {
        return this.userData?.workoutLogs[date] || null;
    }

    getWorkoutLogs() {
        return this.userData?.workoutLogs || {};
    }

    getWeeklyWorkoutCount() {
        const today = new Date();
        let count = 0;

        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateKey = this.formatDate(date);

            if (this.userData?.workoutLogs[dateKey]) {
                count++;
            }
        }

        return count;
    }

    getWeeklyWorkoutDuration() {
        const today = new Date();
        let totalDuration = 0;

        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateKey = this.formatDate(date);

            if (this.userData?.workoutLogs[dateKey]) {
                totalDuration += this.userData.workoutLogs[dateKey].duration || 0;
            }
        }

        return totalDuration;
    }

    // ============ 饮食记录 ============

    saveDietRecord(date, meals) {
        if (!this.userData) return;

        this.userData.dietRecords[date] = meals;
        this.save();
    }

    getDietRecord(date) {
        return this.userData?.dietRecords[date] || null;
    }

    // ============ 连续打卡 ============

    updateStreak() {
        if (!this.userData) return;

        const today = this.formatDate(new Date());
        const yesterday = this.formatDate(new Date(Date.now() - 86400000));

        if (this.userData.streak.lastDate === today) {
            return;
        }

        if (this.userData.streak.lastDate === yesterday) {
            this.userData.streak.current++;
            this.userData.streak.longest = Math.max(this.userData.streak.current, this.userData.streak.longest);
        } else {
            this.userData.streak.current = 1;
        }

        this.userData.streak.lastDate = today;
        this.save();
        this.checkAchievements();
    }

    getStreak() {
        return this.userData?.streak || { current: 0, longest: 0, lastDate: null };
    }

    // ============ 成就系统 ============

    checkAchievements() {
        if (!this.userData) return [];

        const newAchievements = [];

        const streakMilestones = [3, 7, 14, 30, 60, 100];
        streakMilestones.forEach(days => {
            const id = `streak_${days}`;
            if (this.userData.streak.current >= days && !this.userData.achievements.includes(id)) {
                this.userData.achievements.push(id);
                newAchievements.push({
                    id,
                    name: `连续打卡${days}天`,
                    icon: this.getStreakIcon(days)
                });
            }
        });

        const totalWorkouts = Object.keys(this.userData.workoutLogs || {}).length;
        const workoutMilestones = [1, 10, 50, 100];
        workoutMilestones.forEach(count => {
            const id = `workout_${count}`;
            if (totalWorkouts >= count && !this.userData.achievements.includes(id)) {
                this.userData.achievements.push(id);
                newAchievements.push({
                    id,
                    name: `完成${count}次训练`,
                    icon: '💪'
                });
            }
        });

        const startWeight = this.getStartWeight();
        const currentWeight = this.getLatestWeight();
        if (startWeight && currentWeight) {
            const weightLoss = startWeight - currentWeight;
            const weightMilestones = [1, 2, 5, 10, 20];
            weightMilestones.forEach(kg => {
                const id = `weight_${kg}`;
                if (weightLoss >= kg && !this.userData.achievements.includes(id)) {
                    this.userData.achievements.push(id);
                    newAchievements.push({
                        id,
                        name: `减重${kg}kg`,
                        icon: '⚖️'
                    });
                }
            });
        }

        this.save();
        return newAchievements;
    }

    getAchievements() {
        return this.userData?.achievements || [];
    }

    getStreakIcon(days) {
        if (days >= 100) return '👑';
        if (days >= 60) return '💎';
        if (days >= 30) return '🏆';
        if (days >= 14) return '⭐';
        if (days >= 7) return '🔥';
        return '✨';
    }

    // ============ 设置 ============

    getSettings() {
        return this.userData?.settings || {
            unit: 'kg',
            voiceEnabled: true,
            voiceStyle: 'encouraging',
            notifications: true
        };
    }

    saveSettings(settings) {
        if (!this.userData) return;
        this.userData.settings = settings;
        this.save();
    }

    // ============ 计划计算 ============

    calculatePlan() {
        const profile = this.getUserProfile();
        if (!profile) return null;

        const { currentWeight, targetWeight, duration, environment } = profile;
        const weightDiff = Math.abs(currentWeight - targetWeight);
        const isWeightLoss = targetWeight < currentWeight;
        const weeklyRate = (weightDiff / duration).toFixed(2);

        const endDate = new Date();
        endDate.setDate(endDate.getDate() + (duration * 7));

        return {
            weightDiff: weightDiff.toFixed(1),
            weeklyRate,
            isWeightLoss,
            endDate: this.formatDate(endDate),
            environment,
            duration,
            weeklyPlan: this.generateWeeklyPlan(environment, isWeightLoss)
        };
    }

    generateWeeklyPlan(environment, isWeightLoss) {
        if (environment === 'indoor') {
            return this.generateIndoorPlan(isWeightLoss);
        } else {
            return this.generateOutdoorPlan(isWeightLoss);
        }
    }

    generateIndoorPlan(isWeightLoss) {
        return {
            monday: { type: '全身力量', duration: 40, muscles: ['胸', '背', '腿', '核心'], intensity: 'high' },
            tuesday: { type: '核心强化+有氧', duration: 35, muscles: ['核心', '全身'], intensity: 'medium' },
            wednesday: { type: '休息/瑜伽拉伸', duration: 20, muscles: ['全身'], intensity: 'low' },
            thursday: { type: '上下肢超级组', duration: 40, muscles: ['上肢', '下肢'], intensity: 'high' },
            friday: { type: 'HIIT燃脂', duration: 30, muscles: ['全身'], intensity: 'high' },
            saturday: { type: '积极休息', duration: 30, muscles: ['全身'], intensity: 'low' },
            sunday: { type: '完全休息', duration: 0, muscles: [], intensity: 'rest' }
        };
    }

    generateOutdoorPlan(isWeightLoss) {
        return {
            monday: { type: '法特莱克跑', duration: 40, muscles: ['心肺', '腿部'], intensity: 'high' },
            tuesday: { type: '快走+自重训练', duration: 45, muscles: ['全身'], intensity: 'medium' },
            wednesday: { type: '休息/拉伸', duration: 20, muscles: ['全身'], intensity: 'low' },
            thursday: { type: '间歇冲刺', duration: 35, muscles: ['心肺', '腿部'], intensity: 'high' },
            friday: { type: '台阶训练+跳绳', duration: 40, muscles: ['腿部', '核心'], intensity: 'high' },
            saturday: { type: '公园长椅训练', duration: 35, muscles: ['上肢', '下肢'], intensity: 'medium' },
            sunday: { type: '完全休息', duration: 0, muscles: [], intensity: 'rest' }
        };
    }

    getTodayWorkout() {
        const plan = this.calculatePlan();
        if (!plan) return null;

        const today = new Date();
        const dayOfWeek = today.getDay();
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayName = days[dayOfWeek];

        return {
            ...plan.weeklyPlan[dayName],
            dayOfWeek: dayName
        };
    }

    calculateEfficiency() {
        const startWeight = this.getStartWeight();
        const currentWeight = this.getLatestWeight();
        const plan = this.calculatePlan();

        if (!startWeight || !currentWeight || !plan) return null;

        const weightChange = startWeight - currentWeight;
        const workoutDays = Object.keys(this.userData?.workoutLogs || {}).length;
        const efficiency = workoutDays > 0 ? (weightChange / workoutDays).toFixed(2) : 0;

        const expectedChange = plan.weeklyRate * (workoutDays / 7);
        const deviation = Math.abs(weightChange - expectedChange) / expectedChange * 100;

        let status = 'good';
        let message = '';

        if (plan.isWeightLoss) {
            if (weightChange > expectedChange * 1.5) {
                status = 'warning';
                message = '减重速度过快，建议适当增加营养摄入，确保充足睡眠。';
            } else if (deviation < 20) {
                status = 'good';
                message = '你的进度非常理想，继续保持这个节奏！';
            } else if (weightChange < expectedChange * 0.5) {
                status = 'warning';
                message = '进度稍慢，可以尝试调整训练强度或检查饮食习惯。';
            } else {
                status = 'good';
                message = '进度良好，坚持就是胜利！';
            }
        }

        return {
            efficiency,
            status,
            message,
            weightChange: weightChange.toFixed(1),
            workoutDays
        };
    }

    generateWeeklyReport() {
        const today = new Date();
        const weekAgo = new Date(today.getTime() - 7 * 86400000);

        const startWeight = this.getWeightRecord(this.formatDate(weekAgo))?.morning;
        const endWeight = this.getLatestWeight();
        const weightChange = startWeight && endWeight ? (endWeight - startWeight).toFixed(1) : null;

        const workoutCount = this.getWeeklyWorkoutCount();
        const workoutDuration = this.getWeeklyWorkoutDuration();

        const efficiency = this.calculateEfficiency();

        let suggestion = '';
        if (weightChange && parseFloat(weightChange) > 0) {
            suggestion = '本周体重有所上升，不必气馁。建议检查饮食中的隐藏热量，如酱料和含糖饮料。同时可以适当增加训练强度。';
        } else if (weightChange && parseFloat(weightChange) < -1.5) {
            suggestion = '本周减重较多，建议适当增加优质碳水和蛋白质摄入，确保每天睡眠7-9小时。';
        } else {
            suggestion = '继续保持当前的训练和饮食节奏。记住，持之以恒比偶尔的高强度更重要。';
        }

        return {
            weekNumber: this.getWeekNumber(),
            startDate: this.formatDate(weekAgo),
            endDate: this.formatDate(today),
            startWeight,
            endWeight,
            weightChange,
            workoutCount,
            workoutDuration,
            efficiency,
            suggestion
        };
    }

    getWeekNumber() {
        const profile = this.getUserProfile();
        if (!profile) return 1;
        const startDate = new Date(profile.createdAt);
        const today = new Date();
        const diffTime = Math.abs(today - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.ceil(diffDays / 7);
    }

    formatDate(date) {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    exportAllData() {
        return {
            version: '1.0',
            exportDate: new Date().toISOString(),
            ...this.userData
        };
    }

    importData(data) {
        try {
            if (data.version) {
                this.userData = {
                    userProfile: data.userProfile,
                    weightRecords: data.weightRecords || {},
                    workoutLogs: data.workoutLogs || {},
                    dietRecords: data.dietRecords || {},
                    streak: data.streak || { current: 0, longest: 0, lastDate: null },
                    achievements: data.achievements || [],
                    settings: data.settings || {
                        unit: 'kg',
                        voiceEnabled: true,
                        voiceStyle: 'encouraging',
                        notifications: true
                    }
                };
                this.save();
                return true;
            }
            return false;
        } catch (e) {
            console.error('导入数据失败:', e);
            return false;
        }
    }

    resetAllData() {
        this.userData = {
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
        this.save();
    }
}

const dataManager = new DataManager();
