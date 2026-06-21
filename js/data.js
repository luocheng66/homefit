/**
 * 数据存储层 - 性能优化版
 * 使用内存缓存减少localStorage读写
 */

const STORAGE_KEYS = {
    USER_PROFILE: 'homefit_user_profile',
    WEIGHT_RECORDS: 'homefit_weight_records',
    WORKOUT_LOGS: 'homefit_workout_logs',
    DIET_RECORDS: 'homefit_diet_records',
    SETTINGS: 'homefit_settings',
    STREAK: 'homefit_streak',
    ACHIEVEMENTS: 'homefit_achievements'
};

// 写入队列和定时器
let writeQueue = {};
let writeTimer = null;

class DataManager {
    constructor() {
        // 批量加载数据到内存
        this.userProfile = this.load(STORAGE_KEYS.USER_PROFILE) || null;
        this.weightRecords = this.load(STORAGE_KEYS.WEIGHT_RECORDS) || {};
        this.workoutLogs = this.load(STORAGE_KEYS.WORKOUT_LOGS) || {};
        this.dietRecords = this.load(STORAGE_KEYS.DIET_RECORDS) || {};
        this.settings = this.load(STORAGE_KEYS.SETTINGS) || this.getDefaultSettings();
        this.streak = this.load(STORAGE_KEYS.STREAK) || { current: 0, longest: 0, lastDate: null };
        this.achievements = this.load(STORAGE_KEYS.ACHIEVEMENTS) || [];
    }

    load(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('加载数据失败:', e);
            return null;
        }
    }

    // 批量写入优化
    save(key, data) {
        writeQueue[key] = data;

        if (!writeTimer) {
            writeTimer = setTimeout(() => {
                this.flushWrites();
            }, 100);
        }
    }

    flushWrites() {
        try {
            Object.entries(writeQueue).forEach(([key, data]) => {
                localStorage.setItem(key, JSON.stringify(data));
            });
            writeQueue = {};
        } catch (e) {
            console.error('保存数据失败:', e);
        }
        writeTimer = null;
    }

    getDefaultSettings() {
        return {
            unit: 'kg',
            voiceEnabled: true,
            voiceStyle: 'encouraging',
            notifications: true
        };
    }

    // ============ 用户档案 ============

    saveUserProfile(profile) {
        this.userProfile = profile;
        this.save(STORAGE_KEYS.USER_PROFILE, profile);
    }

    getUserProfile() {
        return this.userProfile;
    }

    isOnboardingComplete() {
        return this.userProfile && this.userProfile.onboardingComplete;
    }

    // ============ 体重记录 ============

    saveWeightRecord(date, morning, evening) {
        this.weightRecords[date] = {
            morning: morning ? parseFloat(morning) : null,
            evening: evening ? parseFloat(evening) : null,
            updatedAt: new Date().toISOString()
        };
        this.save(STORAGE_KEYS.WEIGHT_RECORDS, this.weightRecords);
        this.updateStreak();
    }

    getWeightRecord(date) {
        return this.weightRecords[date] || null;
    }

    getWeightRecords() {
        return this.weightRecords;
    }

    getRecentWeightRecords(days = 7) {
        const records = [];
        const today = new Date();

        for (let i = 0; i < days; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateKey = this.formatDate(date);
            const record = this.weightRecords[dateKey];

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
        const dates = Object.keys(this.weightRecords).sort().reverse();
        if (dates.length === 0) return null;

        const latest = this.weightRecords[dates[0]];
        return latest.morning || latest.evening;
    }

    getStartWeight() {
        if (!this.userProfile) return null;
        return this.userProfile.currentWeight;
    }

    getTargetWeight() {
        if (!this.userProfile) return null;
        return this.userProfile.targetWeight;
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
        this.workoutLogs[date] = {
            ...log,
            completedAt: new Date().toISOString()
        };
        this.save(STORAGE_KEYS.WORKOUT_LOGS, this.workoutLogs);
    }

    getWorkoutLog(date) {
        return this.workoutLogs[date] || null;
    }

    getWorkoutLogs() {
        return this.workoutLogs;
    }

    getWeeklyWorkoutCount() {
        const today = new Date();
        let count = 0;

        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateKey = this.formatDate(date);

            if (this.workoutLogs[dateKey]) {
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

            if (this.workoutLogs[dateKey]) {
                totalDuration += this.workoutLogs[dateKey].duration || 0;
            }
        }

        return totalDuration;
    }

    // ============ 饮食记录 ============

    saveDietRecord(date, meals) {
        this.dietRecords[date] = meals;
        this.save(STORAGE_KEYS.DIET_RECORDS, this.dietRecords);
    }

    getDietRecord(date) {
        return this.dietRecords[date] || null;
    }

    // ============ 连续打卡 ============

    updateStreak() {
        const today = this.formatDate(new Date());
        const yesterday = this.formatDate(new Date(Date.now() - 86400000));

        if (this.streak.lastDate === today) {
            return;
        }

        if (this.streak.lastDate === yesterday) {
            this.streak.current++;
            this.streak.longest = Math.max(this.streak.current, this.streak.longest);
        } else if (this.streak.lastDate !== today) {
            this.streak.current = 1;
        }

        this.streak.lastDate = today;
        this.save(STORAGE_KEYS.STREAK, this.streak);
        this.checkAchievements();
    }

    getStreak() {
        return this.streak;
    }

    // ============ 成就系统 ============

    checkAchievements() {
        const newAchievements = [];

        const streakMilestones = [3, 7, 14, 30, 60, 100];
        streakMilestones.forEach(days => {
            const id = `streak_${days}`;
            if (this.streak.current >= days && !this.achievements.includes(id)) {
                this.achievements.push(id);
                newAchievements.push({
                    id,
                    name: `连续打卡${days}天`,
                    icon: this.getStreakIcon(days)
                });
            }
        });

        const totalWorkouts = Object.keys(this.workoutLogs).length;
        const workoutMilestones = [1, 10, 50, 100];
        workoutMilestones.forEach(count => {
            const id = `workout_${count}`;
            if (totalWorkouts >= count && !this.achievements.includes(id)) {
                this.achievements.push(id);
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
                if (weightLoss >= kg && !this.achievements.includes(id)) {
                    this.achievements.push(id);
                    newAchievements.push({
                        id,
                        name: `减重${kg}kg`,
                        icon: '⚖️'
                    });
                }
            });
        }

        this.save(STORAGE_KEYS.ACHIEVEMENTS, this.achievements);
        return newAchievements;
    }

    getAchievements() {
        return this.achievements;
    }

    getStreakIcon(days) {
        if (days >= 100) return '👑';
        if (days >= 60) return '💎';
        if (days >= 30) return '🏆';
        if (days >= 14) return '⭐';
        if (days >= 7) return '🔥';
        return '✨';
    }

    // ============ 计划计算 ============

    calculatePlan() {
        if (!this.userProfile) return null;

        const { currentWeight, targetWeight, duration, environment } = this.userProfile;
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
        const workoutDays = Object.keys(this.workoutLogs).length;
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
        if (!this.userProfile) return 1;
        const startDate = new Date(this.userProfile.createdAt);
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
            userProfile: this.userProfile,
            weightRecords: this.weightRecords,
            workoutLogs: this.workoutLogs,
            dietRecords: this.dietRecords,
            streak: this.streak,
            achievements: this.achievements
        };
    }

    importData(data) {
        try {
            if (data.version) {
                this.userProfile = data.userProfile;
                this.weightRecords = data.weightRecords || {};
                this.workoutLogs = data.workoutLogs || {};
                this.dietRecords = data.dietRecords || {};
                this.streak = data.streak || { current: 0, longest: 0, lastDate: null };
                this.achievements = data.achievements || [];

                this.save(STORAGE_KEYS.USER_PROFILE, this.userProfile);
                this.save(STORAGE_KEYS.WEIGHT_RECORDS, this.weightRecords);
                this.save(STORAGE_KEYS.WORKOUT_LOGS, this.workoutLogs);
                this.save(STORAGE_KEYS.DIET_RECORDS, this.dietRecords);
                this.save(STORAGE_KEYS.STREAK, this.streak);
                this.save(STORAGE_KEYS.ACHIEVEMENTS, this.achievements);

                return true;
            }
            return false;
        } catch (e) {
            console.error('导入数据失败:', e);
            return false;
        }
    }

    resetAllData() {
        Object.values(STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });

        this.userProfile = null;
        this.weightRecords = {};
        this.workoutLogs = {};
        this.dietRecords = {};
        this.settings = this.getDefaultSettings();
        this.streak = { current: 0, longest: 0, lastDate: null };
        this.achievements = [];
    }
}

const dataManager = new DataManager();
