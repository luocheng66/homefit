/**
 * 训练模块
 */

let workoutTimer = null;
let workoutStartTime = null;
let currentExerciseIndex = 0;
let exercises = [];

/**
 * 初始化训练模块
 */
function initWorkoutModule() {
    updateTodayWorkout();
}

/**
 * 更新今日训练显示
 */
function updateTodayWorkout() {
    const workout = dataManager.getTodayWorkout();
    if (!workout) return;

    document.getElementById('workoutType').textContent = workout.type;
    document.getElementById('workoutDuration').textContent = workout.duration > 0 ? `约${workout.duration}分钟` : '休息日';
    document.getElementById('workoutMuscles').textContent = workout.muscles.length > 0 ? workout.muscles.join('、') : '好好休息';
}

/**
 * 开始训练
 */
function startWorkout() {
    const workout = dataManager.getTodayWorkout();
    if (!workout || workout.duration === 0) {
        showToast('今天是休息日，好好放松吧！');
        return;
    }

    // 生成训练动作
    exercises = generateExercises(workout);
    currentExerciseIndex = 0;

    // 显示训练页面
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('workoutPage').classList.remove('hidden');
    document.getElementById('workoutTitle').textContent = workout.type;

    // 渲染训练动作
    renderExercises();

    // 开始计时
    workoutStartTime = Date.now();
    startWorkoutTimer();
}

/**
 * 开始最低限度训练
 */
function startMinimumWorkout() {
    exercises = [
        { name: '平板支撑', duration: '30秒', icon: '🧘', sets: '1组' },
        { name: '深蹲', duration: '10次', icon: '🦵', sets: '1组' },
        { name: '俯卧撑', duration: '10次', icon: '💪', sets: '1组' },
        { name: '拉伸', duration: '2分钟', icon: '🤸', sets: '1组' }
    ];

    currentExerciseIndex = 0;

    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('workoutPage').classList.remove('hidden');
    document.getElementById('workoutTitle').textContent = '最低限度训练';

    renderExercises();

    workoutStartTime = Date.now();
    startWorkoutTimer();
}

/**
 * 生成训练动作
 */
function generateExercises(workout) {
    const profile = dataManager.getUserProfile();
    const isIndoor = profile.environment === 'indoor';
    const healthConditions = profile.healthConditions || [];

    let allExercises = [];

    // 热身
    const warmup = [
        { name: '开合跳', duration: '30秒', icon: '⭐', sets: '1组', phase: 'warmup' },
        { name: '高抬腿', duration: '30秒', icon: '🦵', sets: '1组', phase: 'warmup' },
        { name: '手臂环绕', duration: '20秒', icon: '🔄', sets: '1组', phase: 'warmup' },
        { name: '动态拉伸', duration: '2分钟', icon: '🤸', sets: '1组', phase: 'warmup' }
    ];

    // 根据训练类型生成主体动作
    let mainExercises = [];

    if (isIndoor) {
        mainExercises = getIndoorExercises(workout.type, healthConditions);
    } else {
        mainExercises = getOutdoorExercises(workout.type, healthConditions);
    }

    // 整理放松
    const cooldown = [
        { name: '深呼吸', duration: '1分钟', icon: '🌬️', sets: '1组', phase: 'cooldown' },
        { name: '全身拉伸', duration: '3分钟', icon: '🧘', sets: '1组', phase: 'cooldown' },
        { name: '冥想放松', duration: '1分钟', icon: '🧠', sets: '1组', phase: 'cooldown' }
    ];

    return [...warmup, ...mainExercises, ...cooldown];
}

/**
 * 获取室内训练动作
 */
function getIndoorExercises(type, healthConditions) {
    const hasKneeIssue = healthConditions.includes('knee');
    const hasBackIssue = healthConditions.includes('back');

    const exercises = {
        '全身力量': [
            { name: '深蹲', duration: '15次', icon: '🦵', sets: '3组', phase: 'main' },
            { name: '俯卧撑', duration: '12次', icon: '💪', sets: '3组', phase: 'main' },
            { name: '哑铃划船', duration: '12次', icon: '🏋️', sets: '3组', phase: 'main' },
            { name: '平板支撑', duration: '30秒', icon: '🧘', sets: '3组', phase: 'main' },
            { name: '弓步蹲', duration: '10次/侧', icon: '🦵', sets: '3组', phase: 'main' }
        ],
        '核心强化+有氧': [
            { name: '卷腹', duration: '20次', icon: '🔄', sets: '3组', phase: 'main' },
            { name: '俄罗斯转体', duration: '15次/侧', icon: '🔄', sets: '3组', phase: 'main' },
            { name: '登山者', duration: '30秒', icon: '⛰️', sets: '3组', phase: 'main' },
            { name: '开合跳', duration: '1分钟', icon: '⭐', sets: '3组', phase: 'main' },
            { name: '高抬腿', duration: '30秒', icon: '🦵', sets: '3组', phase: 'main' }
        ],
        '上下肢超级组': [
            { name: '哑铃推举', duration: '12次', icon: '🏋️', sets: '3组', phase: 'main' },
            { name: '哑铃弯举', duration: '12次', icon: '💪', sets: '3组', phase: 'main' },
            { name: '深蹲跳', duration: '10次', icon: '🦵', sets: '3组', phase: 'main' },
            { name: '俯卧撑', duration: '12次', icon: '💪', sets: '3组', phase: 'main' },
            { name: '臀桥', duration: '15次', icon: '🍑', sets: '3组', phase: 'main' }
        ],
        'HIIT燃脂': [
            { name: '波比跳', duration: '10次', icon: '🔥', sets: '4组', phase: 'main' },
            { name: '高抬腿', duration: '30秒', icon: '🦵', sets: '4组', phase: 'main' },
            { name: '登山者', duration: '30秒', icon: '⛰️', sets: '4组', phase: 'main' },
            { name: '深蹲跳', duration: '10次', icon: '🦵', sets: '4组', phase: 'main' },
            { name: '开合跳', duration: '30秒', icon: '⭐', sets: '4组', phase: 'main' }
        ],
        '休息/瑜伽拉伸': [
            { name: '猫牛式', duration: '10次', icon: '🐱', sets: '2组', phase: 'main' },
            { name: '下犬式', duration: '30秒', icon: '🐕', sets: '2组', phase: 'main' },
            { name: '战士一式', duration: '30秒/侧', icon: '🧘', sets: '2组', phase: 'main' },
            { name: '坐姿前屈', duration: '30秒', icon: '🧘', sets: '2组', phase: 'main' }
        ],
        '积极休息': [
            { name: '散步', duration: '30分钟', icon: '🚶', sets: '1组', phase: 'main' },
            { name: '轻度拉伸', duration: '10分钟', icon: '🤸', sets: '1组', phase: 'main' }
        ]
    };

    let selected = exercises[type] || exercises['全身力量'];

    // 根据健康状况调整动作
    if (hasKneeIssue) {
        selected = selected.filter(e => !e.name.includes('跳') && !e.name.includes('蹲'));
        selected.push({ name: '坐姿腿屈伸', duration: '15次', icon: '🦵', sets: '3组', phase: 'main' });
    }

    if (hasBackIssue) {
        selected = selected.filter(e => !e.name.includes('划船') && !e.name.includes('硬拉'));
    }

    return selected;
}

/**
 * 获取室外训练动作
 */
function getOutdoorExercises(type, healthConditions) {
    const exercises = {
        '法特莱克跑': [
            { name: '快走热身', duration: '5分钟', icon: '🚶', sets: '1组', phase: 'main' },
            { name: '慢跑', duration: '3分钟', icon: '🏃', sets: '1组', phase: 'main' },
            { name: '快跑', duration: '1分钟', icon: '🏃', sets: '4组', phase: 'main' },
            { name: '慢走恢复', duration: '2分钟', icon: '🚶', sets: '4组', phase: 'main' },
            { name: '慢跑放松', duration: '5分钟', icon: '🏃', sets: '1组', phase: 'main' }
        ],
        '快走+自重训练': [
            { name: '快走', duration: '20分钟', icon: '🚶', sets: '1组', phase: 'main' },
            { name: '深蹲', duration: '15次', icon: '🦵', sets: '2组', phase: 'main' },
            { name: '俯卧撑', duration: '10次', icon: '💪', sets: '2组', phase: 'main' },
            { name: '弓步蹲', duration: '10次/侧', icon: '🦵', sets: '2组', phase: 'main' }
        ],
        '间歇冲刺': [
            { name: '慢跑热身', duration: '5分钟', icon: '🏃', sets: '1组', phase: 'main' },
            { name: '全力冲刺', duration: '30秒', icon: '🏃', sets: '6组', phase: 'main' },
            { name: '慢走恢复', duration: '90秒', icon: '🚶', sets: '6组', phase: 'main' },
            { name: '慢跑放松', duration: '5分钟', icon: '🏃', sets: '1组', phase: 'main' }
        ],
        '台阶训练+跳绳': [
            { name: '台阶上下', duration: '2分钟', icon: '🪜', sets: '4组', phase: 'main' },
            { name: '跳绳', duration: '1分钟', icon: '⏭️', sets: '4组', phase: 'main' },
            { name: '台阶跳跃', duration: '30秒', icon: '🪜', sets: '3组', phase: 'main' },
            { name: '快走恢复', duration: '2分钟', icon: '🚶', sets: '3组', phase: 'main' }
        ],
        '公园长椅训练': [
            { name: '三头臂屈伸', duration: '12次', icon: '💪', sets: '3组', phase: 'main' },
            { name: '保加利亚分腿蹲', duration: '10次/侧', icon: '🦵', sets: '3组', phase: 'main' },
            { name: '上斜俯卧撑', duration: '12次', icon: '💪', sets: '3组', phase: 'main' },
            { name: '坐姿抬腿', duration: '15次', icon: '🦵', sets: '3组', phase: 'main' }
        ]
    };

    return exercises[type] || exercises['快走+自重训练'];
}

/**
 * 渲染训练动作
 */
function renderExercises() {
    const warmupExercises = exercises.filter(e => e.phase === 'warmup');
    const mainExercises = exercises.filter(e => e.phase === 'main');
    const cooldownExercises = exercises.filter(e => e.phase === 'cooldown');

    document.getElementById('warmupExercises').innerHTML = renderExerciseList(warmupExercises, 0);
    document.getElementById('mainExercises').innerHTML = renderExerciseList(mainExercises, warmupExercises.length);
    document.getElementById('cooldownExercises').innerHTML = renderExerciseList(cooldownExercises, warmupExercises.length + mainExercises.length);

    highlightCurrentExercise();
}

/**
 * 渲染动作列表
 */
function renderExerciseList(exerciseList, startIndex) {
    return exerciseList.map((exercise, index) => {
        const globalIndex = startIndex + index;
        return `
            <div class="exercise-item" data-index="${globalIndex}">
                <div class="exercise-icon">${exercise.icon}</div>
                <div class="exercise-info">
                    <div class="exercise-name">${exercise.name}</div>
                    <div class="exercise-detail">${exercise.duration}</div>
                    <div class="exercise-sets">${exercise.sets}</div>
                </div>
                <div class="exercise-status"></div>
            </div>
        `;
    }).join('');
}

/**
 * 高亮当前动作
 */
function highlightCurrentExercise() {
    document.querySelectorAll('.exercise-item').forEach((item, index) => {
        item.classList.remove('active');
        if (index === currentExerciseIndex) {
            item.classList.add('active');
            item.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    });
}

/**
 * 完成当前动作
 */
function completeExercise() {
    const currentItem = document.querySelector(`.exercise-item[data-index="${currentExerciseIndex}"]`);
    if (currentItem) {
        currentItem.classList.remove('active');
        currentItem.classList.add('completed');
    }

    currentExerciseIndex++;

    if (currentExerciseIndex >= exercises.length) {
        // 所有动作完成
        completeWorkout();
    } else {
        highlightCurrentExercise();
    }
}

/**
 * 完成训练
 */
function completeWorkout() {
    // 停止计时
    if (workoutTimer) {
        clearInterval(workoutTimer);
        workoutTimer = null;
    }

    // 计算训练时长
    const duration = Math.round((Date.now() - workoutStartTime) / 60000);

    // 保存训练记录
    const today = dataManager.formatDate(new Date());
    dataManager.saveWorkoutLog(today, {
        type: document.getElementById('workoutTitle').textContent,
        duration,
        exercisesCompleted: exercises.length,
        effortRating: 5
    });

    // 显示完成动画
    showWorkoutComplete(duration);
}

/**
 * 显示训练完成动画
 */
function showWorkoutComplete(duration) {
    const workout = dataManager.getTodayWorkout();
    const calories = Math.round(duration * 6); // 简单估算

    const completeHTML = `
        <div class="workout-complete-animation">
            <div class="complete-celebration">
                <div class="complete-emoji">🎉</div>
                <div class="complete-title">训练完成！</div>
                <div class="complete-subtitle">你太棒了！</div>
                <div class="complete-stats">
                    <div class="complete-stat">
                        <span class="complete-stat-value">${duration}</span>
                        <span class="complete-stat-label">分钟</span>
                    </div>
                    <div class="complete-stat">
                        <span class="complete-stat-value">${exercises.length}</span>
                        <span class="complete-stat-label">动作</span>
                    </div>
                </div>
                <button class="btn-primary" onclick="closeWorkoutComplete()">继续</button>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', completeHTML);
}

/**
 * 关闭训练完成动画
 */
function closeWorkoutComplete() {
    const completeEl = document.querySelector('.workout-complete-animation');
    if (completeEl) {
        completeEl.remove();
    }

    // 显示训练反馈
    document.getElementById('workoutFeedback').classList.remove('hidden');
}

/**
 * 提交训练反馈
 */
function submitFeedback() {
    const rating = document.getElementById('effortRating').value;
    const today = dataManager.formatDate(new Date());
    const log = dataManager.getWorkoutLog(today);

    if (log) {
        log.effortRating = parseInt(rating);
        dataManager.saveWorkoutLog(today, log);
    }

    document.getElementById('workoutFeedback').classList.add('hidden');

    // 根据反馈调整下次训练
    adjustNextWorkout(rating);

    // 返回首页
    backToDashboard();
    showToast('感谢反馈！训练已完成');
}

/**
 * 根据反馈调整训练
 */
function adjustNextWorkout(rating) {
    const profile = dataManager.getUserProfile();
    if (!profile) return;

    // 简单的调整逻辑
    if (rating <= 3) {
        // 太轻松，增加强度
        showToast('下次训练会增加一点挑战！');
    } else if (rating >= 8) {
        // 太累，适当降低
        showToast('下次训练会适当调整强度');
    }
}

/**
 * 开始计时器
 */
function startWorkoutTimer() {
    workoutTimer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - workoutStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const seconds = (elapsed % 60).toString().padStart(2, '0');
        document.getElementById('workoutTimer').textContent = `${minutes}:${seconds}`;
    }, 1000);
}

/**
 * 返回首页
 */
function backToDashboard() {
    document.getElementById('workoutPage').classList.add('hidden');
    document.getElementById('weightHistoryPage').classList.add('hidden');
    document.getElementById('weeklyReportPage').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');

    // 刷新数据
    updateWeightDisplay();
    updateTodayWorkout();
    updateStreakDisplay();
}
