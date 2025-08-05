// 主题切换功能
class ThemeManager {
    constructor() {
        this.themeToggle = document.getElementById('themeToggle');
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.init();
    }

    init() {
        // 设置初始主题
        this.applyTheme(this.currentTheme);
        
        // 绑定切换事件
        this.themeToggle.addEventListener('click', () => {
            this.toggleTheme();
        });

        // 监听系统主题变化
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                this.applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(this.currentTheme);
        localStorage.setItem('theme', this.currentTheme);
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        
        // 更新切换按钮图标
        const themeIcon = this.themeToggle.querySelector('.theme-icon');
        themeIcon.textContent = theme === 'light' ? '🌙' : '☀️';
        
        this.currentTheme = theme;
    }
}

// 移动端菜单管理
class MobileMenu {
    constructor() {
        this.menuBtn = document.getElementById('mobileMenuBtn');
        this.navMenu = document.querySelector('.nav-menu');
        this.isOpen = false;
        this.init();
    }

    init() {
        this.menuBtn.addEventListener('click', () => {
            this.toggleMenu();
        });

        // 点击导航链接后关闭菜单
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (this.isOpen) {
                    this.toggleMenu();
                }
            });
        });

        // 点击外部区域关闭菜单
        document.addEventListener('click', (e) => {
            if (!this.menuBtn.contains(e.target) && !this.navMenu.contains(e.target)) {
                if (this.isOpen) {
                    this.toggleMenu();
                }
            }
        });
    }

    toggleMenu() {
        this.isOpen = !this.isOpen;
        this.menuBtn.classList.toggle('active');
        this.navMenu.classList.toggle('mobile-open');
        
        // 动画效果
        const spans = this.menuBtn.querySelectorAll('span');
        if (this.isOpen) {
            spans[0].style.transform = 'rotate(-45deg) translate(-6px, 6px)';
            spans[1].style.opacity = '0';
            spans[2].style.transform = 'rotate(45deg) translate(-6px, -6px)';
        } else {
            spans[0].style.transform = 'rotate(0) translate(0, 0)';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'rotate(0) translate(0, 0)';
        }
    }
}

// 平滑滚动和导航高亮
class ScrollManager {
    constructor() {
        this.navbar = document.querySelector('.navbar');
        this.navLinks = document.querySelectorAll('.nav-link');
        this.sections = document.querySelectorAll('section[id]');
        this.init();
    }

    init() {
        // 滚动事件监听
        window.addEventListener('scroll', () => {
            this.handleScroll();
            this.updateActiveNav();
        });

        // 平滑滚动到锚点
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href');
                const targetSection = document.querySelector(targetId);
                
                if (targetSection) {
                    const offsetTop = targetSection.offsetTop - 80;
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    handleScroll() {
        const scrollY = window.scrollY;
        
        // 导航栏背景模糊效果
        if (scrollY > 50) {
            this.navbar.classList.add('scrolled');
        } else {
            this.navbar.classList.remove('scrolled');
        }
    }

    updateActiveNav() {
        const scrollY = window.scrollY + 100;

        this.sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');

            if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                this.navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }
}

// 动画效果管理
class AnimationManager {
    constructor() {
        this.observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        this.init();
    }

    init() {
        // 创建 Intersection Observer
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, this.observerOptions);

        // 观察需要动画的元素
        const animateElements = document.querySelectorAll('.feature-card, .download-card, .screenshot-item');
        animateElements.forEach(el => {
            this.observer.observe(el);
        });

        // 添加动画样式
        this.addAnimationStyles();
    }

    addAnimationStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .feature-card,
            .download-card,
            .screenshot-item {
                opacity: 0;
                transform: translateY(30px);
                transition: all 0.6s ease;
            }
            
            .feature-card.animate-in,
            .download-card.animate-in,
            .screenshot-item.animate-in {
                opacity: 1;
                transform: translateY(0);
            }

            .nav-link.active {
                color: var(--accent-primary);
                position: relative;
            }

            .nav-link.active::after {
                content: '';
                position: absolute;
                bottom: -5px;
                left: 0;
                right: 0;
                height: 2px;
                background: var(--accent-primary);
                border-radius: 1px;
            }

            .navbar.scrolled {
                backdrop-filter: blur(20px);
                background: rgba(var(--bg-rgb), 0.95);
                box-shadow: 0 4px 20px var(--shadow-light);
            }

            @media (max-width: 768px) {
                .nav-menu {
                    position: fixed;
                    top: 70px;
                    left: 0;
                    right: 0;
                    background: var(--bg-primary);
                    border-top: 1px solid var(--border-color);
                    flex-direction: column;
                    gap: 0;
                    padding: 1rem 0;
                    transform: translateY(-100%);
                    opacity: 0;
                    transition: all 0.3s ease;
                    box-shadow: 0 8px 30px var(--shadow-medium);
                }

                .nav-menu.mobile-open {
                    transform: translateY(0);
                    opacity: 1;
                }

                .nav-link {
                    padding: 0.75rem 1rem;
                    width: 100%;
                    text-align: center;
                    border-bottom: 1px solid var(--border-color);
                }

                .nav-link:last-child {
                    border-bottom: none;
                }

                .theme-toggle {
                    margin-top: 1rem;
                }
            }
        `;
        document.head.appendChild(style);
    }
}



// 性能优化
class PerformanceOptimizer {
    constructor() {
        this.init();
    }

    init() {
        // 懒加载图片
        this.setupLazyLoading();
        
        // 预加载关键资源
        this.preloadResources();
    }

    setupLazyLoading() {
        const images = document.querySelectorAll('img[data-src]');
        
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        imageObserver.unobserve(img);
                    }
                });
            });

            images.forEach(img => imageObserver.observe(img));
        }
    }

    preloadResources() {
        // 预加载关键字体
        const fontLink = document.createElement('link');
        fontLink.rel = 'preload';
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap';
        fontLink.as = 'style';
        document.head.appendChild(fontLink);
    }
}

// API管理器
class APIManager {
    constructor() {
        this.updateAPI = 'https://7th.rhythmdoctor.top/api/check_update.php';
        this.changelogAPI = 'https://7th.rhythmdoctor.top/api/get_updatelog.php';
        this.init();
    }

    init() {
        this.fetchVersionInfo();
        this.fetchChangelog();
    }

    async fetchVersionInfo() {
        try {
            const response = await fetch(this.updateAPI);
            const data = await response.json();
            
            if (data.success && data.data) {
                this.updateDownloadInfo(data.data);
            } else {
                this.showDownloadError('获取版本信息失败');
            }
        } catch (error) {
            console.error('获取版本信息出错:', error);
            this.showDownloadError('网络连接失败');
        }
    }

    updateDownloadInfo(data) {
        const { version, update } = data;
        
        // 更新版本号
        const windowsVersion = document.getElementById('windows-version');
        const macosVersion = document.getElementById('macos-version');
        
        if (windowsVersion) windowsVersion.textContent = `v${version}`;
        if (macosVersion) macosVersion.textContent = `v${version}`;

        // 更新下载链接
        const windowsDownload = document.getElementById('windows-download');
        const macosDownload = document.getElementById('macos-download');

        if (windowsDownload && update.windows) {
            windowsDownload.href = update.windows;
            windowsDownload.classList.remove('disabled');
        }

        if (macosDownload && update.macos) {
            macosDownload.href = update.macos;
            macosDownload.classList.remove('disabled');
        }
    }

    showDownloadError(message) {
        const windowsVersion = document.getElementById('windows-version');
        const macosVersion = document.getElementById('macos-version');
        
        if (windowsVersion) windowsVersion.textContent = '获取失败';
        if (macosVersion) macosVersion.textContent = '获取失败';

        // 显示错误提示
        const downloadCards = document.querySelector('.download-cards');
        if (downloadCards) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'download-error';
            errorDiv.innerHTML = `
                <div class="error-icon">⚠️</div>
                <p>${message}</p>
                <button onclick="window.location.reload()" class="btn btn-secondary">重新加载</button>
            `;
            downloadCards.appendChild(errorDiv);
        }
    }

    async fetchChangelog() {
        try {
            const response = await fetch(this.changelogAPI);
            const data = await response.json();
            
            if (data.success && data.data && data.data.updates) {
                this.updateChangelog(data.data.updates);
            } else {
                this.showChangelogError('获取更新日志失败');
            }
        } catch (error) {
            console.error('获取更新日志出错:', error);
            this.showChangelogError('网络连接失败');
        }
    }

    updateChangelog(updates) {
        const container = document.getElementById('changelog-container');
        
        if (!container) return;

        const changelogList = document.createElement('div');
        changelogList.className = 'changelog-list';

        updates.forEach(update => {
            const item = document.createElement('div');
            item.className = 'changelog-item';
            item.innerHTML = `
                <h3 class="changelog-title">${this.escapeHtml(update.title)}</h3>
                <div class="changelog-content">${this.escapeHtml(update.content)}</div>
            `;
            changelogList.appendChild(item);
        });

        container.innerHTML = '';
        container.appendChild(changelogList);
    }

    showChangelogError(message) {
        const container = document.getElementById('changelog-container');
        
        if (!container) return;

        container.innerHTML = `
            <div class="changelog-error">
                <div class="error-icon">⚠️</div>
                <h3>加载失败</h3>
                <p>${message}</p>
                <button onclick="window.location.reload()" class="btn btn-secondary">重新加载</button>
            </div>
        `;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 更新后的下载管理器
class DownloadManager {
    constructor() {
        this.downloadButtons = document.querySelectorAll('.btn-download');
        this.init();
    }

    init() {
        this.downloadButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const href = button.getAttribute('href');
                
                // 如果链接为空或为#，阻止下载
                if (!href || href === '#') {
                    e.preventDefault();
                    this.showDownloadMessage('下载链接正在加载中，请稍后重试');
                    return;
                }

                // 显示下载开始提示
                this.showDownloadStarted(button);
            });
        });
    }

    showDownloadStarted(button) {
        const downloadText = button.querySelector('.download-text');
        const loadingSpinner = button.querySelector('.loading-spinner');
        
        if (downloadText && loadingSpinner) {
            downloadText.style.display = 'none';
            loadingSpinner.style.display = 'inline';
            
            // 3秒后恢复按钮状态
            setTimeout(() => {
                downloadText.style.display = 'inline';
                loadingSpinner.style.display = 'none';
            }, 3000);
        }

        const platform = button.getAttribute('data-platform');
        const message = `开始下载 ${platform === 'windows' ? 'Windows' : 'macOS'} 版本`;
        this.showDownloadMessage(message);
    }

    showDownloadMessage(message) {
        // 创建临时提示
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: var(--accent-primary);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 8px 30px var(--shadow-medium);
            z-index: 9999;
            animation: slideIn 0.3s ease;
        `;
        toast.textContent = message;

        document.body.appendChild(toast);

        // 3秒后移除提示
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 3000);

        // 添加动画样式
        if (!document.getElementById('toast-animations')) {
            const style = document.createElement('style');
            style.id = 'toast-animations';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// 初始化所有功能
document.addEventListener('DOMContentLoaded', () => {
    new ThemeManager();
    new MobileMenu();
    new ScrollManager();
    new AnimationManager();
    new DownloadManager();
    new PerformanceOptimizer();
    new APIManager();

    // 页面加载完成后显示内容
    document.body.style.opacity = '1';
});

// 页面加载时隐藏内容，避免闪烁
document.body.style.opacity = '0';
document.body.style.transition = 'opacity 0.3s ease';