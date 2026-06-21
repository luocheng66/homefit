/**
 * 引导问卷模块
 */

// 临时存储用户选择
let onboardingData = {
    gender: null,
    age: null,
    height: null,
    currentWeight: null,
    targetWeight: null,
    duration: null,
    environment: null,
    indoorEquipment: [],
    indoorSpace: null,
    outdoorArea: null,
    outdoorPreference: null,
    outdoorFitness: null,
    healthConditions: []
};

let currentStep = 'welcome';
let weightUnit = 'kg';

// 步骤顺序
const steps = [
    'welcome', 'gender', 'age', 'height', 'current-weight',
    'target-weight', 'duration', 'environment',
    'indoor-detail', 'outdoor-detail', 'health',
    'generating', 'complete'
];

/**
 * 下一步
 */
function nextStep(step) {
    // 隐藏当前步骤
    const currentEl = document.getElementById(`step-${currentStep}`);
    if (currentEl) {
        currentEl.classList.remove('active');
    }

    // 显示下一步
    const nextEl = document.getElementById(`step-${step}`);
    if (nextEl) {
        nextEl.classList.add('active');
    }

    currentStep = step;
    updateProgress();
}

/**
 * 更新进度条
 */
function updateProgress() {
    const currentIndex = steps.indexOf(currentStep);
    const progress = ((currentIndex + 1) / steps.length) * 100;

    document.getElementById('onboardingProgress').style.width = `${progress}%`;
    document.getElementById('progressText').textContent = `${currentIndex + 1}/${steps.length}`;
}

/**
 * 选择选项
 */
function selectOption(element, field) {
    // 移除其他选中状态
    const parent = element.parentElement;
    parent.querySelectorAll('.option-card').forEach(card => {
        card.classList.remove('selected');
    });

    // 添加选中状态
    element.classList.add('selected');
    onboardingData[field] = element.dataset.value;

    // 自动跳转下一步
    setTimeout(() => {
        if (field === 'gender') {
            nextStep('age');
        }
    }, 300);
}

/**
 * 保存年龄
 */
function saveAge() {
    const age = parseInt(document.getElementById('ageInput').value);
    if (!age || age < 10 || age > 80) {
        showToast('请输入有效年龄（10-80岁）');
        return;
    }
    onboardingData.age = age;
    nextStep('height');
}

/**
 * 保存身高
 */
function saveHeight() {
    const height = parseInt(document.getElementById('heightInput').value);
    if (!height || height < 100 || height > 250) {
        showToast('请输入有效身高（100-250cm）');
        return;
    }
    onboardingData.height = height;
    nextStep('current-weight');
}

/**
 * 切换单位
 */
function toggleUnit(element) {
    document.querySelectorAll('.unit-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    element.classList.add('active');
    weightUnit = element.dataset.unit;
    document.querySelectorAll('.weight-unit').forEach(el => {
        el.textContent = weightUnit;
    });
}

/**
 * 保存当前体重
 */
function saveCurrentWeight() {
    let weight = parseFloat(document.getElementById('currentWeightInput').value);
    if (!weight || weight < 20 || weight > 300) {
        showToast('请输入有效体重');
        return;
    }

    // 如果是磅，转换为公斤
    if (weightUnit === 'lb') {
        weight = weight * 0.453592;
    }

    onboardingData.currentWeight = Math.round(weight * 10) / 10;
    updateBMIInfo();
    nextStep('target-weight');
}

/**
 * 更新BMI信息
 */
function updateBMIInfo() {
    const { height, currentWeight } = onboardingData;
    if (!height || !currentWeight) return;

    const heightM = height / 100;
    const bmi = (currentWeight / (heightM * heightM)).toFixed(1);
    const minNormal = (18.5 * heightM * heightM).toFixed(1);
    const maxNormal = (24 * heightM * heightM).toFixed(1);

    let category = '';
    if (bmi < 18.5) category = '偏瘦';
    else if (bmi < 24) category = '正常';
    else if (bmi < 28) category = '偏胖';
    else category = '肥胖';

    document.getElementById('bmiInfo').innerHTML = `
        <p>你的BMI: <span class="bmi-value">${bmi}</span> (<span class="bmi-category">${category}</span>)</p>
        <p>健康体重范围: ${minNormal}kg - ${maxNormal}kg</p>
    `;

    // 存储理想体重范围
    onboardingData.idealWeightMin = parseFloat(minNormal);
    onboardingData.idealWeightMax = parseFloat(maxNormal);
}

/**
 * 保存目标体重
 */
function saveTargetWeight() {
    let weight = parseFloat(document.getElementById('targetWeightInput').value);
    if (!weight || weight < 20 || weight > 300) {
        showToast('请输入有效体重');
        return;
    }

    if (weightUnit === 'lb') {
        weight = weight * 0.453592;
    }

    onboardingData.targetWeight = Math.round(weight * 10) / 10;

    // 检查目标是否科学
    const heightM = onboardingData.height / 100;
    const targetBMI = weight / (heightM * heightM);

    const warningEl = document.getElementById('weightWarning');

    if (targetBMI < 17 || targetBMI > 30) {
        warningEl.classList.remove('hidden');
        warningEl.innerHTML = `
            <p>⚠️ 你设定的目标体重可能导致BMI为${targetBMI.toFixed(1)}，这可能不太健康。</p>
            <p>建议目标体重: ${onboardingData.idealWeightMin}kg - ${onboardingData.idealWeightMax}kg</p>
            <p>你可以继续使用自定义目标，但请关注健康。</p>
        `;
    } else {
        warningEl.classList.add('hidden');
    }

    // 计算并显示每周建议减重速率
    updateDurationRates();
    nextStep('duration');
}

/**
 * 更新时长选项的减重速率
 */
function updateDurationRates() {
    const weightDiff = Math.abs(onboardingData.currentWeight - onboardingData.targetWeight);
    const isWeightLoss = onboardingData.targetWeight < onboardingData.currentWeight;

    [4, 8, 12].forEach(weeks => {
        const rate = (weightDiff / weeks).toFixed(1);
        const rateEl = document.getElementById(`rate${weeks}`);
        if (rateEl) {
            rateEl.textContent = `${isWeightLoss ? '减' : '增'}${rate}kg/周`;
        }
    });
}

/**
 * 选择时长
 */
function selectDuration(element) {
    document.querySelectorAll('.duration-card').forEach(card => {
        card.classList.remove('selected');
    });
    element.classList.add('selected');
    onboardingData.duration = parseInt(element.dataset.weeks);

    // 显示预计结束日期
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + (onboardingData.duration * 7));
    document.getElementById('endDate').textContent = `预计结束: ${endDate.getFullYear()}年${endDate.getMonth() + 1}月${endDate.getDate()}日`;

    // 自动跳转
    setTimeout(() => {
        nextStep('environment');
    }, 500);
}

/**
 * 选择环境
 */
function selectEnvironment(element) {
    document.querySelectorAll('.env-card').forEach(card => {
        card.classList.remove('selected');
    });
    element.classList.add('selected');
    onboardingData.environment = element.dataset.env;

    // 跳转到对应详情页
    setTimeout(() => {
        if (onboardingData.environment === 'indoor') {
            nextStep('indoor-detail');
        } else {
            nextStep('outdoor-detail');
        }
    }, 300);
}

/**
 * 切换器材选择
 */
function toggleEquip(element) {
    element.classList.toggle('selected');
    const equip = element.dataset.equip;

    if (equip === 'none') {
        // 如果选择无器材，取消其他选择
        document.querySelectorAll('.equip-btn').forEach(btn => {
            if (btn.dataset.equip !== 'none') {
                btn.classList.remove('selected');
            }
        });
        onboardingData.indoorEquipment = ['none'];
    } else {
        // 取消无器材选择
        const noneBtn = document.querySelector('.equip-btn[data-equip="none"]');
        if (noneBtn) noneBtn.classList.remove('selected');

        // 更新器材列表
        onboardingData.indoorEquipment = [];
        document.querySelectorAll('.equip-btn.selected').forEach(btn => {
            if (btn.dataset.equip !== 'none') {
                onboardingData.indoorEquipment.push(btn.dataset.equip);
            }
        });
    }
}

/**
 * 选择空间大小
 */
function selectSpace(element) {
    document.querySelectorAll('.space-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    element.classList.add('selected');
    onboardingData.indoorSpace = element.dataset.space;
}

/**
 * 保存室内详情
 */
function saveIndoorDetail() {
    if (onboardingData.indoorEquipment.length === 0) {
        showToast('请选择可用器材');
        return;
    }
    if (!onboardingData.indoorSpace) {
        showToast('请选择运动空间大小');
        return;
    }
    nextStep('health');
}

/**
 * 选择周边环境
 */
function selectArea(element) {
    document.querySelectorAll('.env-detail-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    element.classList.add('selected');
    onboardingData.outdoorArea = element.dataset.area;
}

/**
 * 选择运动偏好
 */
function selectPreference(element) {
    document.querySelectorAll('.pref-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    element.classList.add('selected');
    onboardingData.outdoorPreference = element.dataset.pref;
}

/**
 * 选择体能水平
 */
function selectFitness(element) {
    document.querySelectorAll('.fitness-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    element.classList.add('selected');
    onboardingData.outdoorFitness = element.dataset.level;
}

/**
 * 保存室外详情
 */
function saveOutdoorDetail() {
    if (!onboardingData.outdoorArea) {
        showToast('请选择周边环境');
        return;
    }
    if (!onboardingData.outdoorPreference) {
        showToast('请选择运动偏好');
        return;
    }
    if (!onboardingData.outdoorFitness) {
        showToast('请选择体能水平');
        return;
    }
    nextStep('health');
}

/**
 * 切换健康状况选择
 */
function toggleHealth(element) {
    const health = element.dataset.health;

    if (health === 'none') {
        // 如果选择无特殊状况，取消其他选择
        document.querySelectorAll('.health-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        element.classList.add('selected');
        onboardingData.healthConditions = ['none'];
    } else {
        // 取消无特殊状况选择
        const noneBtn = document.querySelector('.health-btn[data-health="none"]');
        if (noneBtn) noneBtn.classList.remove('selected');

        element.classList.toggle('selected');

        // 更新健康状况列表
        onboardingData.healthConditions = [];
        document.querySelectorAll('.health-btn.selected').forEach(btn => {
            if (btn.dataset.health !== 'none') {
                onboardingData.healthConditions.push(btn.dataset.health);
            }
        });
    }
}

/**
 * 保存健康状况并生成计划
 */
function saveHealthAndGenerate() {
    nextStep('generating');
    generatePlan();
}

/**
 * 生成计划
 */
function generatePlan() {
    const progressBar = document.getElementById('generatingBar');
    let progress = 0;

    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);

            // 保存用户档案
            const profile = {
                ...onboardingData,
                onboardingComplete: true,
                createdAt: new Date().toISOString()
            };
            dataManager.saveUserProfile(profile);

            // 显示完成页
            setTimeout(() => {
                showPlanSummary();
                nextStep('complete');
            }, 500);
        }
        progressBar.style.width = `${progress}%`;
    }, 200);
}

/**
 * 显示计划摘要
 */
function showPlanSummary() {
    const plan = dataManager.calculatePlan();
    if (!plan) return;

    document.getElementById('summaryDuration').textContent = `${onboardingData.duration}周`;
    document.getElementById('summaryMode').textContent = onboardingData.environment === 'indoor' ? '室内训练' : '室外训练';
    document.getElementById('summaryFrequency').textContent = '每周5-6天';
    document.getElementById('summaryTarget').textContent = `${onboardingData.targetWeight}kg`;
}

/**
 * 开始旅程
 */
function startJourney() {
    document.getElementById('onboarding').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    initMainApp();
}

/**
 * 显示提示消息
 */
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.remove('hidden');

    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}
