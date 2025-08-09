// 图表功能模块

function ChartManager() {
    this.languageChart = null;
    this.activityChart = null;
    this.chartsInitialized = false;
}

// 初始化图表
ChartManager.prototype.initCharts = function() {
    var self = this;
    return new Promise(function(resolve, reject) {
        if (self.chartsInitialized) {
            resolve();
            return;
        }
        
        // 等待Chart.js加载完成
        self.loadChartJS().then(function() {
            // 设置全局图表配置
            self.setGlobalChartConfig();
            self.chartsInitialized = true;
            resolve();
        }).catch(reject);
    });
};

// 动态加载Chart.js
ChartManager.prototype.loadChartJS = function() {
    return new Promise(function(resolve, reject) {
        if (typeof Chart !== 'undefined') {
            resolve();
            return;
        }

        var script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
};

// 设置全局图表配置
ChartManager.prototype.setGlobalChartConfig = function() {
    try {
        if (Chart && Chart.defaults) {
            Chart.defaults.font.family = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
            Chart.defaults.font.size = 12;
            var textColor = document.documentElement.style.getPropertyValue('--text-secondary') || '#586069';
            Chart.defaults.color = textColor;
            
            // 响应式配置
            Chart.defaults.responsive = true;
            Chart.defaults.maintainAspectRatio = false;
        }
    } catch (error) {
        console.warn('无法设置Chart.js全局配置:', error);
    }
};

// 更新主题配置
ChartManager.prototype.updateTheme = function() {
    try {
        if (Chart && Chart.defaults) {
            var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            var textColor = isDark ? '#e6edf3' : '#24292e';
            var gridColor = isDark ? '#30363d' : '#e1e4e8';
            
            Chart.defaults.color = textColor;
            Chart.defaults.borderColor = gridColor;
        }
    } catch (error) {
        console.warn('无法更新Chart.js主题:', error);
    }
};

// 创建语言分布饼图
ChartManager.prototype.createLanguageChart = function(languages) {
    var ctx = document.getElementById('languageChart');
    if (!ctx) return;

    // 销毁现有图表
    if (this.languageChart) {
        try {
            this.languageChart.destroy();
        } catch (error) {
            console.warn('销毁语言图表时出错:', error);
        }
    }

    // 准备数据
    var languageEntries = [];
    for (var key in languages) {
        languageEntries.push([key, languages[key]]);
    }
    languageEntries.sort(function(a, b) {
        return b[1] - a[1];
    });
    var sortedLanguages = languageEntries.slice(0, 8); // 只显示前8种语言

    if (sortedLanguages.length === 0) {
        this.showChartPlaceholder('languageChart');
        return;
    }

    this.hideChartPlaceholder('languageChart');

    var labels = [];
    var data = [];
    for (var i = 0; i < sortedLanguages.length; i++) {
        labels.push(sortedLanguages[i][0]);
        data.push(sortedLanguages[i][1]);
    }
    var colors = Utils.generateColors(labels.length);

    try {
        // 创建图表
        this.languageChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderColor: 'transparent',
                    borderWidth: 2,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                var total = 0;
                                for (var i = 0; i < context.dataset.data.length; i++) {
                                    total += context.dataset.data[i];
                                }
                                var percentage = ((context.raw / total) * 100).toFixed(1);
                                return context.label + ': ' + context.raw + ' 个仓库 (' + percentage + '%)';
                            }
                        }
                    }
                },
                animation: {
                    animateRotate: true,
                    animateScale: true
                },
                cutout: '60%'
            }
        });
    } catch (error) {
        console.error('创建语言图表时出错:', error);
        this.showChartPlaceholder('languageChart');
    }
};

// 创建活动趋势图
ChartManager.prototype.createActivityChart = function(events) {
    var ctx = document.getElementById('activityChart');
    if (!ctx) return;

    // 销毁现有图表
    if (this.activityChart) {
        try {
            this.activityChart.destroy();
        } catch (error) {
            console.warn('销毁活动图表时出错:', error);
        }
    }

    // 处理事件数据
    var activityData = this.processActivityData(events);
    
    if (activityData.labels.length === 0) {
        this.showChartPlaceholder('activityChart');
        return;
    }

    this.hideChartPlaceholder('activityChart');

    try {
        // 创建图表
        this.activityChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: activityData.labels,
                datasets: [{
                    label: '活动次数',
                    data: activityData.data,
                    borderColor: '#2ea44f',
                    backgroundColor: 'rgba(46, 164, 79, 0.1)',
                    borderWidth: 3,
                    pointRadius: 4,
                    pointBackgroundColor: '#2ea44f',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: 'rgba(0, 0, 0, 0.1)',
                        borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    } catch (error) {
        console.error('创建活动图表时出错:', error);
        this.showChartPlaceholder('activityChart');
    }
};

// 处理活动数据
ChartManager.prototype.processActivityData = function(events) {
    if (!events || events.length === 0) {
        return { labels: [], data: [] };
    }

    // 按日期分组
    var dateGroups = {};
    for (var i = 0; i < events.length; i++) {
        var event = events[i];
        var date = new Date(event.created_at).toLocaleDateString('zh-CN');
        dateGroups[date] = (dateGroups[date] || 0) + 1;
    }

    // 转换为数组并排序
    var entries = [];
    for (var key in dateGroups) {
        entries.push([key, dateGroups[key]]);
    }
    entries.sort(function(a, b) {
        return new Date(a[0]) - new Date(b[0]);
    });
    var sortedEntries = entries.slice(-30); // 只保留最近30天

    var labels = [];
    var data = [];
    for (var i = 0; i < sortedEntries.length; i++) {
        labels.push(sortedEntries[i][0]);
        data.push(sortedEntries[i][1]);
    }

    return {
        labels: labels,
        data: data
    };
};

// 显示图表占位符
ChartManager.prototype.showChartPlaceholder = function(chartId) {
    var canvas = document.getElementById(chartId);
    if (canvas && canvas.parentElement) {
        var placeholder = canvas.parentElement.querySelector('.chart-placeholder');
        if (placeholder) {
            placeholder.classList.remove('hidden');
        }
        canvas.classList.add('hidden');
    }
};

// 隐藏图表占位符
ChartManager.prototype.hideChartPlaceholder = function(chartId) {
    var canvas = document.getElementById(chartId);
    if (canvas && canvas.parentElement) {
        var placeholder = canvas.parentElement.querySelector('.chart-placeholder');
        if (placeholder) {
            placeholder.classList.add('hidden');
        }
        canvas.classList.remove('hidden');
    }
};

// 更新所有图表
ChartManager.prototype.updateCharts = function(userData) {
    // 这里可以添加更多图表类型
    // 例如：仓库星标趋势、贡献日历等
};

// 销毁所有图表
ChartManager.prototype.destroyCharts = function() {
    if (this.languageChart) {
        try {
            this.languageChart.destroy();
            this.languageChart = null;
        } catch (error) {
            console.warn('销毁语言图表时出错:', error);
        }
    }
    if (this.activityChart) {
        try {
            this.activityChart.destroy();
            this.activityChart = null;
        } catch (error) {
            console.warn('销毁活动图表时出错:', error);
        }
    }
};

// 导出图表管理器
window.ChartManager = ChartManager;
