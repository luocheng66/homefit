/**
 * 激励模块
 */

// 激励语录库
const motivationQuotes = {
    start: [
        { quote: '种下一棵树最好的时间是十年前，其次是今天。你的每一个动作都在雕刻未来。', source: '蜕变·HomeFit' },
        { quote: '千里之行，始于足下。今天，你迈出了最重要的一步。', source: '蜕变·HomeFit' },
        { quote: '不要等待完美的时机，现在就是最好的开始。', source: '蜕变·HomeFit' }
    ],
    plateau: [
        { quote: '平静的海面练不出精湛的水手。体重不变，不代表你没在变强。坚持就是突破！', source: '蜕变·HomeFit' },
        { quote: '平台期是身体在适应，是突破的前夜。你的坚持终将获得回报。', source: '蜕变·HomeFit' },
        { quote: '每一次训练都在改变你的身体，即使体重秤还没告诉你。', source: '蜕变·HomeFit' }
    ],
    breakthrough: [
        { quote: '你做到了！曲线向下延展的每一毫米，都是你汗水的勋章。', source: '蜕变·HomeFit' },
        { quote: '突破！你的努力正在创造奇迹，继续保持这份激情！', source: '蜕变·HomeFit' },
        { quote: '每一次突破都证明，你比想象中更强大。', source: '蜕变·HomeFit' }
    ],
    indoor: [
        { quote: '把客厅变成健身房，你就拥有了改变世界的能量场。', source: '蜕变·HomeFit' },
        { quote: '家是你的战场，每一次训练都是对自己的投资。', source: '蜕变·HomeFit' },
        { quote: '不需要华丽的器械，你的身体就是最好的工具。', source: '蜕变·HomeFit' }
    ],
    outdoor: [
        { quote: '迎着风奔跑，把烦恼都甩在身后。世界是你的跑道。', source: '蜕变·HomeFit' },
        { quote: '大自然是最好的健身房，每一步都是新的开始。', source: '蜕变·HomeFit' },
        { quote: '呼吸新鲜空气，感受阳光，这是属于你的运动时光。', source: '蜕变·HomeFit' }
    ],
    rest: [
        { quote: '休息不是停滞，而是为了让肌肉生长、让意志充电。享受今天的恢复。', source: '蜕变·HomeFit' },
        { quote: '休息是训练的一部分。今天好好休息，明天继续战斗。', source: '蜕变·HomeFit' },
        { quote: '给身体时间恢复，它会用更强的状态回报你。', source: '蜕变·HomeFit' }
    ],
    streak: [
        { quote: '连续打卡不是负担，是你对自己的承诺。每一天都在变得更好。', source: '蜕变·HomeFit' },
        { quote: '坚持是一种习惯，而你正在培养这个最珍贵的习惯。', source: '蜕变·HomeFit' },
        { quote: '一天一天，一步一步，你正在创造属于自己的奇迹。', source: '蜕变·HomeFit' }
    ]
};

/**
 * 初始化激励模块
 */
function initMotivationModule() {
    loadDailyMotivation();
    updateStreakDisplay();
    loadBadges();
}

/**
 * 加载每日激励
 */
function loadDailyMotivation() {
    const profile = dataManager.getUserProfile();
    const workout = dataManager.getTodayWorkout();
    const streak = dataManager.getStreak();

    let category = 'start';

    // 根据情况选择激励类型
    if (workout && workout.type.includes('休息')) {
        category = 'rest';
    } else if (profile && profile.environment === 'indoor') {
        category = 'indoor';
    } else if (profile && profile.environment === 'outdoor') {
        category = 'outdoor';
    }

    if (streak.current >= 7) {
        category = 'streak';
    }

    // 检查是否平台期
    const weekChange = dataManager.calculateWeightChange(7);
    if (weekChange && Math.abs(parseFloat(weekChange)) < 0.3) {
        category = 'plateau';
    }

    // 检查是否突破
    if (weekChange && parseFloat(weekChange) < -1) {
        category = 'breakthrough';
    }

    const quotes = motivationQuotes[category];
    const randomIndex = Math.floor(Math.random() * quotes.length);
    const selected = quotes[randomIndex];

    document.getElementById('motivationQuote').textContent = selected.quote;
    document.getElementById('motivationSource').textContent = `— ${selected.source}`;

    // 更新背景
    updateMotivationBackground(category);
}

/**
 * 更新激励背景
 */
function updateMotivationBackground(category) {
    const bg = document.querySelector('.motivation-bg');
    const gradients = {
        start: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        plateau: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        breakthrough: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        indoor: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        outdoor: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        rest: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        streak: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
    };

    if (bg) {
        bg.style.background = gradients[category] || gradients.start;
    }
}

/**
 * 更新连续打卡显示
 */
function updateStreakDisplay() {
    const streak = dataManager.getStreak();
    document.getElementById('streakNumber').textContent = streak.current;
    loadBadges();
}

/**
 * 加载徽章
 */
function loadBadges() {
    const achievements = dataManager.getAchievements();
    const badgesContainer = document.getElementById('streakBadges');

    if (!badgesContainer) return;

    const allBadges = [
        { id: 'streak_3', icon: '✨', name: '3天' },
        { id: 'streak_7', icon: '🔥', name: '7天' },
        { id: 'streak_14', icon: '⭐', name: '14天' },
        { id: 'streak_30', icon: '🏆', name: '30天' },
        { id: 'streak_60', icon: '💎', name: '60天' },
        { id: 'streak_100', icon: '👑', name: '100天' }
    ];

    badgesContainer.innerHTML = allBadges.map(badge => {
        const earned = achievements.includes(badge.id);
        return `
            <div class="badge ${earned ? 'earned' : ''}" title="${badge.name}">
                ${badge.icon}
            </div>
        `;
    }).join('');
}

/**
 * 分享激励
 */
function shareMotivation() {
    const quote = document.getElementById('motivationQuote').textContent;

    // 创建分享卡片
    const shareCard = document.createElement('div');
    shareCard.className = 'share-card';
    shareCard.innerHTML = `
        <div class="share-card-header">
            <div class="share-card-logo">🏋️ 蜕变·HomeFit</div>
            <div class="share-card-title">每日激励</div>
        </div>
        <div class="share-card-content">
            <div class="share-card-quote">${quote}</div>
            <div class="share-card-date">${new Date().toLocaleDateString('zh-CN')}</div>
        </div>
        <div class="share-card-footer">坚持蜕变，遇见更好的自己</div>
    `;

    // 创建弹窗
    const modal = document.createElement('div');
    modal.className = 'edit-weight-modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 420px;">
            ${shareCard.outerHTML}
            <div class="modal-actions" style="margin-top: 20px;">
                <button class="btn-secondary" onclick="this.closest('.edit-weight-modal').remove()">关闭</button>
                <button class="btn-primary" onclick="copyQuote()">复制文字</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

/**
 * 复制语录
 */
function copyQuote() {
    const quote = document.getElementById('motivationQuote').textContent;
    navigator.clipboard.writeText(quote).then(() => {
        showToast('已复制到剪贴板');
    }).catch(() => {
        showToast('复制失败，请手动复制');
    });
}
