// 工具函数库

var Utils = {
    // 格式化数字（添加千分位分隔符）
    formatNumber: function(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    },

    // 格式化日期
    formatDate: function(dateString) {
        var date = new Date(dateString);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },

    // 格式化相对时间
    formatRelativeTime: function(dateString) {
        var date = new Date(dateString);
        var now = new Date();
        var diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) {
            return '刚刚';
        } else if (diffInSeconds < 3600) {
            var minutes = Math.floor(diffInSeconds / 60);
            return minutes + '分钟前';
        } else if (diffInSeconds < 86400) {
            var hours = Math.floor(diffInSeconds / 3600);
            return hours + '小时前';
        } else if (diffInSeconds < 2592000) {
            var days = Math.floor(diffInSeconds / 86400);
            return days + '天前';
        } else {
            return this.formatDate(dateString);
        }
    },

    // 防抖函数
    debounce: function(func, wait) {
        var timeout;
        return function() {
            var context = this;
            var args = arguments;
            var later = function() {
                clearTimeout(timeout);
                func.apply(context, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // 节流函数
    throttle: function(func, limit) {
        var inThrottle;
        return function() {
            var args = arguments;
            var context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(function() { inThrottle = false; }, limit);
            }
        };
    },

    // 本地存储操作
    storage: {
        set: function(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (error) {
                console.error('存储失败:', error);
                return false;
            }
        },
        
        get: function(key, defaultValue) {
            if (defaultValue === undefined) defaultValue = null;
            try {
                var item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (error) {
                console.error('读取失败:', error);
                return defaultValue;
            }
        },
        
        remove: function(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (error) {
                console.error('删除失败:', error);
                return false;
            }
        }
    },

    // URL参数操作 - 修复安全错误
    url: {
        getParams: function() {
            try {
                return new URLSearchParams(window.location.search);
            } catch (error) {
                console.warn('无法访问URL参数:', error);
                return new URLSearchParams();
            }
        },
        
        setParam: function(key, value) {
            try {
                // 检查是否在安全上下文中
                if (window.location.protocol === 'about:' || window.location.origin === 'null') {
                    console.warn('在不安全的上下文中，无法更新URL参数');
                    return;
                }
                
                var urlParams = new URLSearchParams(window.location.search);
                urlParams.set(key, value);
                var newUrl = window.location.pathname + '?' + urlParams.toString();
                window.history.replaceState({}, '', newUrl);
            } catch (error) {
                console.warn('无法更新URL参数:', error);
                // 降级处理：使用hash
                window.location.hash = '#' + key + '=' + value;
            }
        },
        
        removeParam: function(key) {
            try {
                // 检查是否在安全上下文中
                if (window.location.protocol === 'about:' || window.location.origin === 'null') {
                    console.warn('在不安全的上下文中，无法更新URL参数');
                    return;
                }
                
                var urlParams = new URLSearchParams(window.location.search);
                urlParams.delete(key);
                var newUrl = window.location.pathname;
                if (urlParams.toString()) {
                    newUrl += '?' + urlParams.toString();
                }
                window.history.replaceState({}, '', newUrl);
            } catch (error) {
                console.warn('无法移除URL参数:', error);
                // 降级处理：清除hash
                if (window.location.hash) {
                    window.location.hash = '';
                }
            }
        }
    },

    // 颜色生成器（用于图表）
    generateColors: function(count) {
        var colors = [
            '#2ea44f', '#1f6feb', '#d4a72c', '#cf222e', '#8250df',
            '#0969da', '#bc4c00', '#7d4533', '#008641', '#a47551',
            '#6e40aa', '#00a4a6', '#b15c00', '#b93a86', '#57ab5a'
        ];
        
        if (count <= colors.length) {
            return colors.slice(0, count);
        }
        
        // 如果需要更多颜色，生成随机颜色
        var result = [];
        for (var i = 0; i < colors.length; i++) {
            result.push(colors[i]);
        }
        while (result.length < count) {
            result.push(this.randomColor());
        }
        return result;
    },

    randomColor: function() {
        return '#' + Math.floor(Math.random()*16777215).toString(16);
    },

    // 文本截断
    truncateText: function(text, maxLength) {
        if (maxLength === undefined) maxLength = 100;
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substr(0, maxLength) + '...';
    },

    // 复制到剪贴板
    copyToClipboard: function(text) {
        return new Promise(function(resolve) {
            try {
                navigator.clipboard.writeText(text).then(function() {
                    resolve(true);
                }).catch(function() {
                    // 降级方案
                    var textArea = document.createElement('textarea');
                    textArea.value = text;
                    document.body.appendChild(textArea);
                    textArea.select();
                    var successful = document.execCommand('copy');
                    document.body.removeChild(textArea);
                    resolve(successful);
                });
            } catch (error) {
                // 降级方案
                var textArea = document.createElement('textarea');
                textArea.value = text;
                document.body.appendChild(textArea);
                textArea.select();
                var successful = document.execCommand('copy');
                document.body.removeChild(textArea);
                resolve(successful);
            }
        });
    },

    // 检查网络状态
    isOnline: function() {
        return navigator.onLine;
    },

    // 延迟函数
    delay: function(ms) {
        return new Promise(function(resolve) { setTimeout(resolve, ms); });
    },

    // 深度合并对象
    deepMerge: function(target, source) {
        var result = {};
        for (var key in target) {
            result[key] = target[key];
        }
        for (var key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(result[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        return result;
    },

    // 数组去重
    uniqueArray: function(array, key) {
        if (key) {
            var seen = {};
            return array.filter(function(item) {
                var value = item[key];
                if (seen[value]) {
                    return false;
                }
                seen[value] = true;
                return true;
            });
        }
        var unique = [];
        for (var i = 0; i < array.length; i++) {
            if (unique.indexOf(array[i]) === -1) {
                unique.push(array[i]);
            }
        }
        return unique;
    },

    // 随机ID生成
    generateId: function() {
        return Math.random().toString(36).substr(2, 9);
    }
};

// 确保全局可用
window.Utils = Utils;
