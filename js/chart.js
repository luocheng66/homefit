/**
 * 图表模块 - 性能优化版
 * 使用离屏Canvas和缓存优化渲染
 */

// 图表缓存
const chartCache = new Map();

/**
 * 渲染体重图表（优化版）
 */
function renderWeightChart(days = 7) {
    const canvas = document.getElementById('weightChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const cacheKey = `weight_${days}_${dataManager.formatDate(new Date())}`;

    // 检查缓存
    if (chartCache.has(cacheKey)) {
        const cachedImage = chartCache.get(cacheKey);
        ctx.putImageData(cachedImage, 0, 0);
        return;
    }

    const records = dataManager.getRecentWeightRecords(days);

    if (records.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#B2BEC3';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('暂无数据', canvas.width / 2, canvas.height / 2);
        return;
    }

    // 准备数据
    const morningWeights = records.filter(r => r.morning).map(r => ({ date: r.date, value: r.morning }));
    const eveningWeights = records.filter(r => r.evening).map(r => ({ date: r.date, value: r.evening }));

    // 计算Y轴范围
    const allWeights = [...morningWeights, ...eveningWeights].map(d => d.value);
    const minWeight = Math.min(...allWeights) - 0.5;
    const maxWeight = Math.max(...allWeights) + 0.5;

    // 使用 requestAnimationFrame 批量渲染
    requestAnimationFrame(() => {
        // 清空画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const padding = { top: 20, right: 20, bottom: 40, left: 50 };
        const chartWidth = canvas.width - padding.left - padding.right;
        const chartHeight = canvas.height - padding.top - padding.bottom;

        // 批量绘制
        drawGrid(ctx, padding, chartWidth, chartHeight, minWeight, maxWeight);
        drawXLabels(ctx, records, padding, chartWidth);
        drawYLabels(ctx, minWeight, maxWeight, padding, chartHeight);

        if (morningWeights.length > 1) {
            drawLine(ctx, morningWeights, '#6C63FF', padding, chartWidth, chartHeight, minWeight, maxWeight, true);
        }

        if (eveningWeights.length > 1) {
            drawLine(ctx, eveningWeights, '#FF6584', padding, chartWidth, chartHeight, minWeight, maxWeight, false);
        }

        if (morningWeights.length >= 3) {
            drawTrendLine(ctx, morningWeights, '#00C9A7', padding, chartWidth, chartHeight, minWeight, maxWeight);
        }

        // 缓存渲染结果
        try {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            chartCache.set(cacheKey, imageData);

            // 限制缓存大小
            if (chartCache.size > 10) {
                const firstKey = chartCache.keys().next().value;
                chartCache.delete(firstKey);
            }
        } catch (e) {
            // 忽略缓存错误
        }
    });
}

/**
 * 清除图表缓存
 */
function clearChartCache() {
    chartCache.clear();
}

/**
 * 绘制网格
 */
function drawGrid(ctx, padding, chartWidth, chartHeight, minWeight, maxWeight) {
    ctx.strokeStyle = '#E8ECF1';
    ctx.lineWidth = 1;

    ctx.beginPath();
    const ySteps = 5;
    for (let i = 0; i <= ySteps; i++) {
        const y = padding.top + (chartHeight / ySteps) * i;
        ctx.moveTo(padding.left, y);
        ctx.lineTo(padding.left + chartWidth, y);
    }
    ctx.stroke();
}

/**
 * 绘制X轴标签
 */
function drawXLabels(ctx, records, padding, chartWidth) {
    ctx.fillStyle = '#636E72';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';

    const step = Math.max(1, Math.floor(records.length / 7));
    records.forEach((record, index) => {
        if (index % step === 0 || index === records.length - 1) {
            const x = padding.left + (index / (records.length - 1)) * chartWidth;
            const date = new Date(record.date);
            const label = `${date.getMonth() + 1}/${date.getDate()}`;
            ctx.fillText(label, x, padding.top + chartHeight + 20);
        }
    });
}

/**
 * 绘制Y轴标签
 */
function drawYLabels(ctx, minWeight, maxWeight, padding, chartHeight) {
    ctx.fillStyle = '#636E72';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';

    const ySteps = 5;
    for (let i = 0; i <= ySteps; i++) {
        const value = maxWeight - ((maxWeight - minWeight) / ySteps) * i;
        const y = padding.top + (chartHeight / ySteps) * i;
        ctx.fillText(value.toFixed(1), padding.left - 10, y + 4);
    }
}

/**
 * 绘制线条（优化版 - 使用单次路径绘制）
 */
function drawLine(ctx, data, color, padding, chartWidth, chartHeight, minWeight, maxWeight, isSolid) {
    if (data.length < 2) return;

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    if (!isSolid) {
        ctx.setLineDash([5, 5]);
    }

    // 计算所有点的位置
    const points = data.map((point, index) => ({
        x: padding.left + (index / (data.length - 1)) * chartWidth,
        y: padding.top + ((maxWeight - point.value) / (maxWeight - minWeight)) * chartHeight
    }));

    // 单次路径绘制曲线
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
        const cpX = (points[i - 1].x + points[i].x) / 2;
        ctx.bezierCurveTo(cpX, points[i - 1].y, cpX, points[i].y, points[i].x, points[i].y);
    }

    ctx.stroke();
    ctx.setLineDash([]);

    // 批量绘制数据点
    ctx.fillStyle = isSolid ? color : 'white';
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    points.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, isSolid ? 4 : 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    });
}

/**
 * 绘制趋势线
 */
function drawTrendLine(ctx, data, color, padding, chartWidth, chartHeight, minWeight, maxWeight) {
    if (data.length < 3) return;

    const windowSize = Math.min(7, data.length);
    const trendData = [];

    for (let i = windowSize - 1; i < data.length; i++) {
        let sum = 0;
        for (let j = i - windowSize + 1; j <= i; j++) {
            sum += data[j].value;
        }
        trendData.push({
            date: data[i].date,
            value: sum / windowSize,
            originalIndex: i
        });
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.globalAlpha = 0.7;

    ctx.beginPath();

    trendData.forEach((point, index) => {
        const x = padding.left + (point.originalIndex / (data.length - 1)) * chartWidth;
        const y = padding.top + ((maxWeight - point.value) / (maxWeight - minWeight)) * chartHeight;

        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });

    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
}

/**
 * 渲染详细体重图表
 */
function renderWeightDetailChart(days = 30) {
    const canvas = document.getElementById('weightDetailChart');
    if (!canvas) return;

    // 使用相同的渲染逻辑
    renderWeightChart(days);
}

/**
 * 渲染周报图表
 */
function renderReportChart() {
    const canvas = document.getElementById('reportChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const records = dataManager.getRecentWeightRecords(7);

    if (records.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#B2BEC3';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('暂无数据', canvas.width / 2, canvas.height / 2);
        return;
    }

    const weights = records.filter(r => r.morning).map(r => r.morning);

    if (weights.length === 0) return;

    const minWeight = Math.min(...weights) - 0.5;
    const maxWeight = Math.max(...weights) + 0.5;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const chartWidth = canvas.width - padding.left - padding.right;
    const chartHeight = canvas.height - padding.top - padding.bottom;

    drawGrid(ctx, padding, chartWidth, chartHeight, minWeight, maxWeight);

    ctx.fillStyle = '#636E72';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';

    const dayNames = ['一', '二', '三', '四', '五', '六', '日'];
    records.forEach((record, index) => {
        const x = padding.left + (index / (records.length - 1)) * chartWidth;
        const date = new Date(record.date);
        ctx.fillText(dayNames[date.getDay()], x, padding.top + chartHeight + 20);
    });

    drawYLabels(ctx, minWeight, maxWeight, padding, chartHeight);

    const weightData = records.map(r => ({ date: r.date, value: r.morning || 0 }));
    drawLine(ctx, weightData, '#6C63FF', padding, chartWidth, chartHeight, minWeight, maxWeight, true);
}
