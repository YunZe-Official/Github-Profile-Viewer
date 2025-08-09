// 主应用程序

function GitHubProfileViewer() {
    this.searchForm = document.getElementById('searchForm');
    this.usernameInput = document.getElementById('username');
    this.clearSearchButton = document.getElementById('clearSearch');
    this.searchButton = document.querySelector('.search-button');
    this.loadingElement = document.getElementById('loading');
    this.errorElement = document.getElementById('error');
    this.profileElement = document.getElementById('profile');
    this.errorMessageElement = document.getElementById('errorMessage');
    this.errorTitleElement = document.getElementById('errorTitle');
    this.retryButton = document.getElementById('retryButton');
    this.suggestionsElement = document.getElementById('suggestions');
    this.searchHistoryElement = document.getElementById('searchHistory');
    this.historyListElement = document.getElementById('historyList');
    this.clearHistoryButton = document.getElementById('clearHistory');
    this.shareButton = document.getElementById('shareButton');
    this.exportButton = document.getElementById('exportButton');
    this.scrollTopButton = document.getElementById('scrollTop');
    this.themeToggle = document.getElementById('themeToggle');
    this.toastElement = document.getElementById('toast');
    this.toastMessageElement = document.getElementById('toastMessage');
    
    // 图表管理器
    this.chartManager = new ChartManager();
    
    // 状态管理
    this.currentUsername = '';
    this.isLoading = false;
    this.searchHistory = Utils.storage.get('searchHistory', []);
    this.popularUsers = [
        'torvalds', 'octocat', 'gaearon', 'addyosmani', 'sindresorhus',
        'yyx990803', 'egoist', 'developit', 'Rich-Harris', 'substack'
    ];
    
    this.init();
}

GitHubProfileViewer.prototype.init = function() {
    // 初始化主题
    this.initTheme();
    
    // 初始化事件监听器
    this.initEventListeners();
    
    // 初始化图表
    var self = this;
    this.chartManager.initCharts().then(function() {
        // 加载搜索历史
        self.loadSearchHistory();
        
        // 检查URL参数
        self.checkUrlParams();
        
        // 显示搜索历史
        self.showSearchHistory();
    });
};

GitHubProfileViewer.prototype.initEventListeners = function() {
    var self = this;
    
    // 搜索表单
    this.searchForm.addEventListener('submit', function(e) {
        e.preventDefault();
        self.handleSearch();
    });

    // 搜索输入
    this.usernameInput.addEventListener('input', Utils.debounce(function() {
        self.handleInput();
    }, 300));

    this.usernameInput.addEventListener('focus', function() {
        self.showSearchHistory();
    });

    this.usernameInput.addEventListener('keydown', function(e) {
        self.handleKeydown(e);
    });

    // 清空搜索
    this.clearSearchButton.addEventListener('click', function() {
        self.clearSearch();
    });

    // 重试按钮
    this.retryButton.addEventListener('click', function() {
        if (self.currentUsername) {
            self.searchUser(self.currentUsername);
        }
    });

    // 清空历史记录
    this.clearHistoryButton.addEventListener('click', function() {
        self.clearSearchHistory();
    });

    // 分享按钮
    this.shareButton.addEventListener('click', function() {
        self.shareProfile();
    });

    // 导出按钮
    this.exportButton.addEventListener('click', function() {
        self.exportProfile();
    });

    // 返回顶部
    this.scrollTopButton.addEventListener('click', function() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // 主题切换
    this.themeToggle.addEventListener('click', function() {
        self.toggleTheme();
    });

    // 点击外部关闭建议和历史
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.search-section')) {
            self.hideSuggestions();
            self.hideSearchHistory();
        }
    });

    // 滚动事件
    window.addEventListener('scroll', Utils.throttle(function() {
        self.handleScroll();
    }, 100));

    // 网络状态
    window.addEventListener('online', function() {
        self.showToast('网络已连接', 'success');
    });

    window.addEventListener('offline', function() {
        self.showToast('网络已断开', 'warning');
    });
};

GitHubProfileViewer.prototype.initTheme = function() {
    var savedTheme = Utils.storage.get('theme');
    var systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    var theme = savedTheme || systemTheme;
    
    this.setTheme(theme);
    
    // 监听系统主题变化
    var self = this;
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
        if (!Utils.storage.get('theme')) {
            self.setTheme(e.matches ? 'dark' : 'light');
        }
    });
};

GitHubProfileViewer.prototype.setTheme = function(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    Utils.storage.set('theme', theme);
    
    // 更新主题切换按钮图标
    var icon = this.themeToggle.querySelector('i');
    if (icon) {
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
    
    // 更新图表主题
    this.chartManager.updateTheme();
    
    // 重新渲染现有图表
    if (this.currentUsername) {
        // 这里可以重新加载图表数据
    }
};

GitHubProfileViewer.prototype.toggleTheme = function() {
    var currentTheme = document.documentElement.getAttribute('data-theme');
    var newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
    this.showToast('已切换到' + (newTheme === 'dark' ? '暗色' : '亮色') + '主题', 'success');
};

GitHubProfileViewer.prototype.handleSearch = function() {
    var username = this.usernameInput.value.trim();
    if (!username) {
        this.showToast('请输入用户名', 'warning');
        return;
    }

    // 添加到搜索历史
    this.addToSearchHistory(username);
    
    // 执行搜索
    this.searchUser(username);
    
    // 安全地更新URL
    try {
        Utils.url.setParam('username', username);
    } catch (error) {
        console.warn('无法更新URL参数:', error);
    }
};

GitHubProfileViewer.prototype.handleInput = function() {
    var query = this.usernameInput.value.trim();
    
    // 显示/隐藏清空按钮
    if (query) {
        this.clearSearchButton.classList.remove('hidden');
    } else {
        this.clearSearchButton.classList.add('hidden');
    }
    
    if (query.length >= 2) {
        this.showSuggestions(query);
    } else {
        this.hideSuggestions();
    }
};

GitHubProfileViewer.prototype.handleKeydown = function(e) {
    // Escape键清空
    if (e.key === 'Escape') {
        this.clearSearch();
        this.usernameInput.blur();
    }
    
    // Enter键搜索
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSearch();
    }
    
    // 方向键导航建议
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        this.navigateSuggestions(e.key);
    }
};

GitHubProfileViewer.prototype.showSuggestions = function(query) {
    var self = this;
    try {
        // 模拟API调用（实际项目中应该调用GitHub API）
        var suggestions = [];
        for (var i = 0; i < this.popularUsers.length; i++) {
            var user = this.popularUsers[i];
            if (user.toLowerCase().indexOf(query.toLowerCase()) !== -1) {
                suggestions.push(user);
            }
            if (suggestions.length >= 5) break;
        }

        if (suggestions.length > 0) {
            self.renderSuggestions(suggestions);
            self.suggestionsElement.classList.remove('hidden');
        } else {
            self.hideSuggestions();
        }
    } catch (error) {
        console.error('获取建议失败:', error);
        self.hideSuggestions();
    }
};

GitHubProfileViewer.prototype.renderSuggestions = function(suggestions) {
    var self = this;
    var html = '';
    for (var i = 0; i < suggestions.length; i++) {
        var user = suggestions[i];
        html += '<div class="suggestion-item" data-username="' + user + '">' +
            '<div class="suggestion-info">' +
            '<div class="suggestion-name">' + user + '</div>' +
            '<div class="suggestion-login">@' + user + '</div>' +
            '</div>' +
            '</div>';
    }
    this.suggestionsElement.innerHTML = html;

    // 添加点击事件
    var items = this.suggestionsElement.querySelectorAll('.suggestion-item');
    for (var i = 0; i < items.length; i++) {
        items[i].addEventListener('click', function() {
            var username = this.dataset.username;
            self.usernameInput.value = username;
            self.handleSearch();
            self.hideSuggestions();
        });
    }
};

GitHubProfileViewer.prototype.hideSuggestions = function() {
    this.suggestionsElement.classList.add('hidden');
};

GitHubProfileViewer.prototype.navigateSuggestions = function(direction) {
    var items = this.suggestionsElement.querySelectorAll('.suggestion-item');
    if (items.length === 0) return;

    var currentIndex = -1;
    for (var i = 0; i < items.length; i++) {
        if (items[i].classList.contains('selected')) {
            currentIndex = i;
            break;
        }
    }

    if (direction === 'ArrowDown') {
        currentIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
    } else {
        currentIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
    }

    // 移除所有选中状态
    for (var i = 0; i < items.length; i++) {
        items[i].classList.remove('selected');
    }
    
    // 添加选中状态
    var selectedItem = items[currentIndex];
    if (selectedItem) {
        selectedItem.classList.add('selected');
        
        // 滚动到选中项
        selectedItem.scrollIntoView({ block: 'nearest' });
    }
};

GitHubProfileViewer.prototype.showSearchHistory = function() {
    if (this.searchHistory.length > 0) {
        this.renderSearchHistory();
        this.searchHistoryElement.classList.remove('hidden');
    }
};

GitHubProfileViewer.prototype.hideSearchHistory = function() {
    this.searchHistoryElement.classList.add('hidden');
};

GitHubProfileViewer.prototype.renderSearchHistory = function() {
    var self = this;
    var html = '';
    for (var i = 0; i < this.searchHistory.length; i++) {
        var user = this.searchHistory[i];
        html += '<div class="history-item" data-username="' + user + '">' +
            user +
            '</div>';
    }
    this.historyListElement.innerHTML = html;

    // 添加点击事件
    var items = this.historyListElement.querySelectorAll('.history-item');
    for (var i = 0; i < items.length; i++) {
        items[i].addEventListener('click', function() {
            var username = this.dataset.username;
            self.usernameInput.value = username;
            self.handleSearch();
        });
    }
};

GitHubProfileViewer.prototype.addToSearchHistory = function(username) {
    // 移除已存在的
    var newHistory = [];
    for (var i = 0; i < this.searchHistory.length; i++) {
        if (this.searchHistory[i] !== username) {
            newHistory.push(this.searchHistory[i]);
        }
    }
    this.searchHistory = newHistory;
    
    // 添加到开头
    this.searchHistory.unshift(username);
    
    // 限制数量
    if (this.searchHistory.length > 10) {
        this.searchHistory = this.searchHistory.slice(0, 10);
    }
    
    // 保存到本地存储
    Utils.storage.set('searchHistory', this.searchHistory);
    
    // 更新显示
    this.renderSearchHistory();
};

GitHubProfileViewer.prototype.clearSearchHistory = function() {
    this.searchHistory = [];
    Utils.storage.remove('searchHistory');
    this.hideSearchHistory();
    this.showToast('搜索历史已清空', 'success');
};

GitHubProfileViewer.prototype.loadSearchHistory = function() {
    this.searchHistory = Utils.storage.get('searchHistory', []);
};

GitHubProfileViewer.prototype.searchUser = function(username) {
    if (this.isLoading) return;
    
    var self = this;
    this.isLoading = true;
    this.currentUsername = username;
    
    this.showLoading();
    this.hideError();
    this.hideProfile();

    // 检查网络状态
    if (!Utils.isOnline()) {
        this.showError('网络连接已断开，请检查网络设置', '网络错误');
        this.isLoading = false;
        this.hideLoading();
        return;
    }

    // 获取用户基本信息
    fetch('https://api.github.com/users/' + encodeURIComponent(username), {
        headers: {
            'Accept': 'application/vnd.github.v3+json'
        }
    }).then(function(userResponse) {
        if (!userResponse.ok) {
            self.handleApiError(userResponse.status, username);
            self.isLoading = false;
            self.hideLoading();
            return;
        }
        return userResponse.json();
    }).then(function(userData) {
        if (!userData) return;
        
        // 获取用户仓库（用于语言分析）
        return fetch('https://api.github.com/users/' + encodeURIComponent(username) + '/repos?per_page=50&sort=updated', {
            headers: {
                'Accept': 'application/vnd.github.v3+json'
            }
        }).then(function(reposResponse) {
            if (reposResponse.ok) {
                return reposResponse.json();
            }
            return [];
        }).then(function(reposData) {
            // 获取用户事件（用于活动分析）
            return fetch('https://api.github.com/users/' + encodeURIComponent(username) + '/events/public?per_page=50', {
                headers: {
                    'Accept': 'application/vnd.github.v3+json'
                }
            }).then(function(eventsResponse) {
                if (eventsResponse.ok) {
                    return eventsResponse.json();
                }
                return [];
            }).then(function(eventsData) {
                // 显示用户信息
                self.displayProfile(userData, reposData, eventsData);
                self.isLoading = false;
                self.hideLoading();
            });
        });
    }).catch(function(error) {
        console.error('搜索用户失败:', error);
        self.showError('网络请求失败，请稍后重试', '网络错误');
        self.isLoading = false;
        self.hideLoading();
    });
};

GitHubProfileViewer.prototype.handleApiError = function(status, username) {
    var title, message;
    
    switch (status) {
        case 404:
            title = '用户不存在';
            message = '找不到用户 "' + username + '"，请检查用户名是否正确';
            break;
        case 403:
            title = '请求限制';
            message = 'API请求过于频繁，请稍后再试';
            break;
        case 401:
            title = '认证失败';
            message = '访问被拒绝，请检查API令牌';
            break;
        default:
            title = '请求失败';
            message = 'HTTP ' + status + ': ' + (status === 500 ? '服务器内部错误' : '请求失败');
    }
    
    this.showError(message, title);
};

GitHubProfileViewer.prototype.displayProfile = function(userData, reposData, eventsData) {
    // 基本信息
    document.getElementById('avatar').src = userData.avatar_url;
    document.getElementById('avatar').alt = (userData.name || userData.login) + '的头像';
    document.getElementById('name').textContent = userData.name || '未设置姓名';
    document.getElementById('login').textContent = '@' + userData.login;
    document.getElementById('bio').textContent = userData.bio || '暂无简介';
    
    // GitHub链接
    var githubLink = document.getElementById('github-link');
    githubLink.href = userData.html_url;
    
    // 统计信息
    document.getElementById('followers').textContent = Utils.formatNumber(userData.followers);
    document.getElementById('following').textContent = Utils.formatNumber(userData.following);
    document.getElementById('public_repos').textContent = Utils.formatNumber(userData.public_repos);
    document.getElementById('public_gists').textContent = Utils.formatNumber(userData.public_gists);
    
    // 详细信息
    document.getElementById('company').textContent = userData.company || '未设置';
    document.getElementById('location').textContent = userData.location || '未设置';
    
    var blogElement = document.getElementById('blog');
    if (userData.blog) {
        var blogUrl = userData.blog.indexOf('http') === 0 ? userData.blog : 'https://' + userData.blog;
        blogElement.href = blogUrl;
        blogElement.textContent = userData.blog;
        blogElement.classList.remove('link');
    } else {
        blogElement.href = '#';
        blogElement.textContent = '未设置';
        blogElement.classList.add('link');
    }
    
    // 格式化创建时间
    document.getElementById('created_at').textContent = Utils.formatDate(userData.created_at);

    // 显示用户信息
    this.showProfile();

    // 处理图表数据
    this.processChartData(reposData, eventsData);

    // 显示仓库信息
    this.displayRepositories(reposData);

    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // 显示成功提示
    this.showToast('成功加载用户 ' + userData.login + ' 的信息', 'success');
};

GitHubProfileViewer.prototype.processChartData = function(reposData, eventsData) {
    // 处理语言分布数据
    var languageStats = this.calculateLanguageStats(reposData);
    this.chartManager.createLanguageChart(languageStats);

    // 处理活动数据
    this.chartManager.createActivityChart(eventsData);
};

GitHubProfileViewer.prototype.calculateLanguageStats = function(repos) {
    var languageStats = {};
    
    for (var i = 0; i < repos.length; i++) {
        var repo = repos[i];
        if (repo.language) {
            languageStats[repo.language] = (languageStats[repo.language] || 0) + 1;
        }
    }

    return languageStats;
};

GitHubProfileViewer.prototype.displayRepositories = function(repos) {
    var reposContainer = document.getElementById('repositories');
    
    if (!repos || repos.length === 0) {
        reposContainer.innerHTML = '<div class="loading-placeholder">' +
            '<i class="fas fa-book"></i>' +
            '<p>该用户暂无公开仓库</p>' +
            '</div>';
        return;
    }

    // 按更新时间排序，取前6个
    var sortedRepos = repos.slice().sort(function(a, b) {
        return new Date(b.updated_at) - new Date(a.updated_at);
    }).slice(0, 6);

    var html = '';
    for (var i = 0; i < sortedRepos.length; i++) {
        var repo = sortedRepos[i];
        html += '<div class="repo-card slide-in">' +
            '<div class="repo-header">' +
            '<i class="fas fa-book repo-icon"></i>' +
            '<div class="repo-info">' +
            '<a href="' + repo.html_url + '" target="_blank" class="repo-name">' +
            repo.name +
            '</a>' +
            '<p class="repo-description">' +
            Utils.truncateText(repo.description || '暂无描述', 100) +
            '</p>' +
            '</div>' +
            '</div>' +
            '<div class="repo-stats">' +
            '<div class="repo-stat">' +
            '<i class="fas fa-star"></i>' +
            Utils.formatNumber(repo.stargazers_count) +
            '</div>' +
            '<div class="repo-stat">' +
            '<i class="fas fa-code-branch"></i>' +
            Utils.formatNumber(repo.forks_count) +
            '</div>';
        
        if (repo.language) {
            html += '<div class="repo-stat">' +
                '<span class="repo-language" style="background-color: ' + this.getLanguageColor(repo.language) + '"></span>' +
                repo.language +
                '</div>';
        }
        
        html += '<div class="repo-stat repo-updated">' +
            '更新于 ' + Utils.formatRelativeTime(repo.updated_at) +
            '</div>' +
            '</div>' +
            '</div>';
    }
    
    reposContainer.innerHTML = html;
};

GitHubProfileViewer.prototype.getLanguageColor = function(language) {
    var colors = {
        'JavaScript': '#f1e05a',
        'Python': '#3572A5',
        'Java': '#b07219',
        'TypeScript': '#2b7489',
        'C++': '#f34b7d',
        'C#': '#178600',
        'PHP': '#4F5D95',
        'Ruby': '#701516',
        'Go': '#00ADD8',
        'Swift': '#ffac45',
        'Kotlin': '#F18E33',
        'Rust': '#dea584',
        'Dart': '#00B4AB',
        'Vue': '#41b883',
        'React': '#61dafb'
    };
    return colors[language] || '#ccc';
};

GitHubProfileViewer.prototype.shareProfile = function() {
    if (!this.currentUsername) return;

    var profileUrl = window.location.origin + window.location.pathname + '?username=' + this.currentUsername;
    
    var self = this;
    Utils.copyToClipboard(profileUrl).then(function(success) {
        if (success) {
            self.showToast('链接已复制到剪贴板', 'success');
        } else {
            self.showToast('复制失败，请手动复制链接', 'error');
        }
    });
};

GitHubProfileViewer.prototype.exportProfile = function() {
    if (!this.currentUsername) return;

    // 这里可以导出更多用户数据
    var exportData = {
        username: this.currentUsername,
        exportedAt: new Date().toISOString(),
        url: window.location.origin + window.location.pathname + '?username=' + this.currentUsername
    };

    var dataStr = JSON.stringify(exportData, null, 2);
    var dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    var link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = 'github-profile-' + this.currentUsername + '.json';
    link.click();
    
    this.showToast('数据导出成功', 'success');
};

GitHubProfileViewer.prototype.checkUrlParams = function() {
    var urlParams = Utils.url.getParams();
    var username = urlParams.get('username');
    if (username) {
        this.usernameInput.value = username;
        this.searchUser(username);
    }
};

GitHubProfileViewer.prototype.handleScroll = function() {
    var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    this.scrollTopButton.style.opacity = scrollTop > 300 ? '1' : '0';
};

GitHubProfileViewer.prototype.showLoading = function() {
    this.loadingElement.classList.remove('hidden');
    this.loadingElement.classList.add('fade-in');
};

GitHubProfileViewer.prototype.hideLoading = function() {
    this.loadingElement.classList.add('hidden');
    this.loadingElement.classList.remove('fade-in');
};

GitHubProfileViewer.prototype.showError = function(message, title) {
    if (title === undefined) title = '出错了';
    this.errorTitleElement.textContent = title;
    this.errorMessageElement.textContent = message;
    this.errorElement.classList.remove('hidden');
    this.errorElement.classList.add('fade-in');
};

GitHubProfileViewer.prototype.hideError = function() {
    this.errorElement.classList.add('hidden');
    this.errorElement.classList.remove('fade-in');
};

GitHubProfileViewer.prototype.showProfile = function() {
    this.profileElement.classList.remove('hidden');
    this.profileElement.classList.add('fade-in');
};

GitHubProfileViewer.prototype.hideProfile = function() {
    this.profileElement.classList.add('hidden');
    this.profileElement.classList.remove('fade-in');
};

GitHubProfileViewer.prototype.clearSearch = function() {
    this.usernameInput.value = '';
    this.clearSearchButton.classList.add('hidden');
    this.hideSuggestions();
    this.hideError();
    this.hideProfile();
    this.currentUsername = '';
    
    // 安全地移除URL参数
    try {
        Utils.url.removeParam('username');
    } catch (error) {
        console.warn('无法移除URL参数:', error);
    }
    
    this.usernameInput.focus();
};

GitHubProfileViewer.prototype.showToast = function(message, type) {
    if (type === undefined) type = 'info';
    this.toastMessageElement.textContent = message;
    this.toastElement.className = 'toast show ' + type;
    
    // 更新图标
    var icon = this.toastElement.querySelector('i');
    if (icon) {
        switch (type) {
            case 'success':
                icon.className = 'fas fa-check-circle';
                break;
            case 'error':
                icon.className = 'fas fa-exclamation-circle';
                break;
            case 'warning':
                icon.className = 'fas fa-exclamation-triangle';
                break;
            default:
                icon.className = 'fas fa-info-circle';
        }
    }
    
    // 3秒后自动隐藏
    var self = this;
    setTimeout(function() {
        self.toastElement.classList.remove('show');
    }, 3000);
};

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', function() {
    window.app = new GitHubProfileViewer();
});

// 页面可见性API
document.addEventListener('visibilitychange', function() {
    if (!document.hidden && window.app && window.app.currentUsername) {
        // 页面重新可见时可以刷新数据
        // window.app.searchUser(window.app.currentUsername);
    }
});
