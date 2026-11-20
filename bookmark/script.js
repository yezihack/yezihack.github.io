// 全局变量
let bookmarksData = [];
let currentCategory = 'all';
let searchQuery = '';

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadBookmarks();
    setupEventListeners();
});

// 主题管理
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const icon = document.querySelector('.theme-icon');
    icon.textContent = theme === 'light' ? '🌙' : '☀️';
}

// 加载书签数据
async function loadBookmarks() {
    try {
        const response = await fetch('bookmarks.yaml');
        const yamlText = await response.text();
        const data = jsyaml.load(yamlText);
        bookmarksData = data.bookmarks || [];

        renderCategories();
        renderBookmarks();
    } catch (error) {
        console.error('加载书签失败:', error);
        showError('加载数据失败，请检查 bookmarks.yaml 文件');
    }
}

// 渲染分类
function renderCategories() {
    const categories = ['all', ...new Set(bookmarksData.map(b => b.category))];
    const categoryList = document.getElementById('categoryList');

    categoryList.innerHTML = categories.map(cat => `
        <button class="category-btn ${cat === 'all' ? 'active' : ''}"
                data-category="${cat}">
            ${cat === 'all' ? '全部' : cat}
        </button>
    `).join('');
}

// 渲染书签卡片
function renderBookmarks() {
    const container = document.getElementById('bookmarksContainer');
    const emptyState = document.getElementById('emptyState');

    let filtered = bookmarksData;

    // 分类过滤
    if (currentCategory !== 'all') {
        filtered = filtered.filter(b => b.category === currentCategory);
    }

    // 搜索过滤
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(b =>
            b.name.toLowerCase().includes(query) ||
            b.description.toLowerCase().includes(query) ||
            b.url.toLowerCase().includes(query)
        );
    }

    // 按评分排序（评分高的排在前面）
    filtered.sort((a, b) => {
        const ratingA = Number(a.rating) || 0;
        const ratingB = Number(b.rating) || 0;
        console.log(`比较: ${a.name}(${ratingA}) vs ${b.name}(${ratingB})`);
        return ratingB - ratingA;
    });
    console.log('排序后的书签:', filtered.map(b => `${b.name}(${b.rating})`));

    if (filtered.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    container.style.display = 'grid';
    emptyState.style.display = 'none';

    container.innerHTML = filtered.map(bookmark => createBookmarkCard(bookmark)).join('');
}

// 创建书签卡片
function createBookmarkCard(bookmark) {
    const iconHtml = getIconHtml(bookmark);

    // 获取显示的 URL 文本
    let domain;
    if (bookmark.url.startsWith('/')) {
        domain = '内部工具';
    } else {
        try {
            domain = new URL(bookmark.url).hostname;
        } catch (e) {
            domain = bookmark.url;
        }
    }

    // 内部链接不需要 target="_blank"
    const target = bookmark.url.startsWith('/') ? '' : 'target="_blank"';

    return `
        <a href="${bookmark.url}" ${target} class="bookmark-card">
            <div class="card-header">
                <div class="card-icon">
                    ${iconHtml}
                </div>
                <div class="card-title">${bookmark.name}</div>
            </div>
            <div class="card-description">${bookmark.description}</div>
            <div class="card-url">${domain}</div>
        </a>
    `;
}

// 获取网站图标
function getIconHtml(bookmark) {
    const firstLetter = bookmark.name.charAt(0).toUpperCase();

    // 检查是否是相对路径（内部链接）
    if (bookmark.url.startsWith('/')) {
        // 内部链接使用首字母
        return firstLetter;
    }

    try {
        const domain = new URL(bookmark.url).hostname;

        // 尝试多个图标源
        const iconSources = [
            `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
            `https://icons.duckduckgo.com/ip3/${domain}.ico`,
            `${bookmark.url}/favicon.ico`
        ];

        return `<img src="${iconSources[0]}"
                     alt="${bookmark.name}"
                     onerror="this.onerror=null; this.style.display='none'; this.parentElement.textContent='${firstLetter}';">`;
    } catch (e) {
        // URL 解析失败，使用首字母
        return firstLetter;
    }
}

// 事件监听
function setupEventListeners() {
    // 主题切换
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);

    // 搜索
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim();
        renderBookmarks();
    });

    // 分类切换
    document.getElementById('categoryList').addEventListener('click', (e) => {
        if (e.target.classList.contains('category-btn')) {
            document.querySelectorAll('.category-btn').forEach(btn =>
                btn.classList.remove('active')
            );
            e.target.classList.add('active');
            currentCategory = e.target.dataset.category;
            renderBookmarks();
        }
    });
}

// 错误提示
function showError(message) {
    const container = document.getElementById('bookmarksContainer');
    container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-secondary);">
            <p style="font-size: 1.2rem;">❌ ${message}</p>
        </div>
    `;
}
