# 7th Rhythm Studio 官网

这是 7th Rhythm Studio 的官方网站源代码。

## 文件结构

```
website/
├── index.html          # 主页面
├── css/
│   └── style.css      # 主样式文件
├── js/
│   └── script.js      # JavaScript 功能
├── icon.png           # 项目图标
└── README.md          # 说明文档
```

## 功能特性

### ✨ 已实现功能
- 🌓 **深色/浅色主题切换** - 自动保存用户偏好
- 📱 **响应式设计** - 完美适配桌面和移动设备
- 🎨 **现代化UI** - 流畅的动画和交互效果
- 🚀 **性能优化** - 懒加载和预加载优化
- 📍 **平滑滚动** - 导航高亮和平滑滚动效果

### 🔧 定制说明

#### 1. 添加软件截图
在 `index.html` 的截图区域，将占位符替换为实际图片：

```html
<!-- 将这个占位符 -->
<div class="screenshot-placeholder">
    <div class="placeholder-content">
        <div class="placeholder-icon">📱</div>
        <p>主界面截图</p>
        <small>展示软件主要功能界面</small>
    </div>
</div>

<!-- 替换为实际截图 -->
<div class="screenshot-item">
    <img src="screenshots/main-interface.png" alt="主界面截图" class="screenshot-img">
</div>
```

**建议截图规格：**
- 分辨率: 1200x800px 或更高
- 格式: PNG 或 JPG
- 文件大小: 小于 500KB

#### 2. 更新下载链接
在 `index.html` 的下载区域，更新下载按钮的链接：

```html
<!-- Windows 版本 -->
<a href="https://github.com/yourusername/7th-rhythm-studio/releases/download/v1.0.0/7th-rhythm-studio-win.exe" 
   class="btn btn-download">
    下载 Windows 版本
</a>

<!-- macOS 版本 -->
<a href="https://github.com/yourusername/7th-rhythm-studio/releases/download/v1.0.0/7th-rhythm-studio-mac.dmg" 
   class="btn btn-download">
    下载 macOS 版本
</a>
```

#### 3. 更新版本信息
在下载区域更新版本号和文件大小：

```html
<div class="version-info">
    <span class="version">v1.0.0</span>    <!-- 更新版本号 -->
    <span class="size">~50MB</span>        <!-- 更新文件大小 -->
</div>
```

#### 4. 自定义链接
更新页脚和其他区域的链接：

```html
<!-- GitHub 链接 -->
<li><a href="https://github.com/yourusername/7th-rhythm-studio">GitHub</a></li>

<!-- Discord 链接 -->
<li><a href="https://discord.gg/your-invite-code">Discord</a></li>

<!-- QQ群链接 -->
<li><a href="https://qm.qq.com/your-group-link">QQ群</a></li>
```

## 部署说明

### 静态网站托管
可以部署到以下平台：
- **GitHub Pages** - 免费，适合开源项目
- **Netlify** - 免费额度，自动部署
- **Vercel** - 免费额度，性能优秀
- **Cloudflare Pages** - 免费，全球CDN

### 部署步骤（以GitHub Pages为例）

1. 将 `website` 文件夹内容推送到 GitHub 仓库
2. 在仓库设置中启用 GitHub Pages
3. 选择分支和文件夹
4. 网站将在 `https://yourusername.github.io/repository-name` 可访问

### 自定义域名
如果有自定义域名，在 `website` 文件夹中添加 `CNAME` 文件：

```
yourdomain.com
```

## 主题定制

### 颜色方案
在 `css/style.css` 中修改 CSS 变量来自定义颜色：

```css
:root {
    --accent-primary: #3b82f6;      /* 主要强调色 */
    --accent-secondary: #8b5cf6;    /* 次要强调色 */
    --success-color: #10b981;       /* 成功色（下载按钮）*/
    /* ... 其他颜色变量 */
}
```

### 字体
在 `index.html` 的 `<head>` 中更改字体链接：

```html
<link href="https://fonts.googleapis.com/css2?family=YourFont:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

然后在 CSS 中更新字体族：

```css
body {
    font-family: 'YourFont', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
```

## 性能优化建议

1. **图片优化**
   - 使用 WebP 格式（现代浏览器支持）
   - 压缩图片文件大小
   - 为不同设备提供不同尺寸的图片

2. **CDN 加速**
   - 使用 CDN 托管静态资源
   - 启用 gzip 压缩

3. **缓存策略**
   - 设置适当的缓存头
   - 使用版本号管理资源更新

## 浏览器兼容性

- ✅ Chrome 60+
- ✅ Firefox 60+
- ✅ Safari 12+
- ✅ Edge 79+
- ⚠️ IE 不支持（推荐升级到现代浏览器）

## 技术栈

- **HTML5** - 现代化的语义标记
- **CSS3** - 使用 CSS Grid、Flexbox、CSS 变量
- **Vanilla JavaScript** - 无外部依赖，轻量级
- **Inter 字体** - Google Fonts 提供的现代字体

---

需要帮助？查看源代码中的注释或联系开发团队！