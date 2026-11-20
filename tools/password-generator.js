// 字符集定义
const CHAR_SETS = {
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadSettings();
    setupEventListeners();
    loadHistory();
});

// 加载用户设置
function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('passwordGeneratorSettings') || '{}');

    // 恢复字符类型选择
    if (settings.lowercase !== undefined) document.getElementById('lowercase').checked = settings.lowercase;
    if (settings.uppercase !== undefined) document.getElementById('uppercase').checked = settings.uppercase;
    if (settings.numbers !== undefined) document.getElementById('numbers').checked = settings.numbers;
    if (settings.symbols !== undefined) document.getElementById('symbols').checked = settings.symbols;

    // 恢复排除字符
    if (settings.excludeChars) document.getElementById('excludeChars').value = settings.excludeChars;

    // 恢复密码长度
    if (settings.length) {
        document.getElementById('lengthSlider').value = settings.length;
        document.getElementById('lengthValue').textContent = settings.length;
    }

    // 恢复生成数量
    if (settings.count) document.getElementById('passwordCount').value = settings.count;

    // 恢复历史记录开关
    if (settings.saveHistory !== undefined) document.getElementById('saveHistory').checked = settings.saveHistory;
}

// 保存用户设置
function saveSettings() {
    const settings = {
        lowercase: document.getElementById('lowercase').checked,
        uppercase: document.getElementById('uppercase').checked,
        numbers: document.getElementById('numbers').checked,
        symbols: document.getElementById('symbols').checked,
        excludeChars: document.getElementById('excludeChars').value,
        length: parseInt(document.getElementById('lengthSlider').value),
        count: parseInt(document.getElementById('passwordCount').value),
        saveHistory: document.getElementById('saveHistory').checked
    };

    localStorage.setItem('passwordGeneratorSettings', JSON.stringify(settings));
}

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

// 事件监听
function setupEventListeners() {
    // 主题切换
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);

    // 长度滑块
    const lengthSlider = document.getElementById('lengthSlider');
    const lengthValue = document.getElementById('lengthValue');
    lengthSlider.addEventListener('input', (e) => {
        lengthValue.textContent = e.target.value;
    });

    // 数量控制
    document.getElementById('decreaseCount').addEventListener('click', () => {
        const input = document.getElementById('passwordCount');
        if (input.value > 1) input.value = parseInt(input.value) - 1;
    });

    document.getElementById('increaseCount').addEventListener('click', () => {
        const input = document.getElementById('passwordCount');
        if (input.value < 10) input.value = parseInt(input.value) + 1;
    });

    // 生成按钮
    document.getElementById('generateBtn').addEventListener('click', generatePasswords);

    // 清空历史
    document.getElementById('clearHistory').addEventListener('click', clearHistory);

    // 监听设置变化（自动保存）
    ['lowercase', 'uppercase', 'numbers', 'symbols', 'saveHistory'].forEach(id => {
        document.getElementById(id).addEventListener('change', saveSettings);
    });

    document.getElementById('excludeChars').addEventListener('input', saveSettings);

    // 悬浮球
    const floatingBtn = document.getElementById('floatingBtn');
    const menuItems = document.getElementById('floatingMenuItems');

    floatingBtn.addEventListener('click', () => {
        floatingBtn.classList.toggle('active');
        menuItems.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.floating-menu-container')) {
            floatingBtn.classList.remove('active');
            menuItems.classList.remove('active');
        }
    });

    // 返回顶部
    document.getElementById('scrollTopBtn').addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// 生成密码
function generatePasswords() {
    const length = parseInt(document.getElementById('lengthSlider').value);
    const count = parseInt(document.getElementById('passwordCount').value);
    const excludeChars = document.getElementById('excludeChars').value;

    // 获取选中的字符类型
    const charTypes = [];
    if (document.getElementById('lowercase').checked) charTypes.push('lowercase');
    if (document.getElementById('uppercase').checked) charTypes.push('uppercase');
    if (document.getElementById('numbers').checked) charTypes.push('numbers');
    if (document.getElementById('symbols').checked) charTypes.push('symbols');

    if (charTypes.length === 0) {
        alert('请至少选择一种字符类型！');
        return;
    }

    // 构建字符集
    let charset = '';
    charTypes.forEach(type => {
        charset += CHAR_SETS[type];
    });

    // 排除指定字符
    if (excludeChars) {
        charset = charset.split('').filter(char => !excludeChars.includes(char)).join('');
    }

    if (charset.length === 0) {
        alert('可用字符集为空，请调整设置！');
        return;
    }

    // 生成多个密码
    const passwords = [];
    for (let i = 0; i < count; i++) {
        passwords.push(generatePassword(charset, length, charTypes));
    }

    // 显示结果
    displayPasswords(passwords);

    // 保存历史
    if (document.getElementById('saveHistory').checked) {
        saveToHistory(passwords);
    }

    // 保存用户设置
    saveSettings();
}

// 生成单个密码
function generatePassword(charset, length, charTypes) {
    let password = '';

    // 确保每种类型至少有一个字符
    charTypes.forEach(type => {
        const chars = CHAR_SETS[type];
        password += chars[Math.floor(Math.random() * chars.length)];
    });

    // 填充剩余长度
    for (let i = password.length; i < length; i++) {
        password += charset[Math.floor(Math.random() * charset.length)];
    }

    // 打乱顺序
    return password.split('').sort(() => Math.random() - 0.5).join('');
}

// 显示密码
function displayPasswords(passwords) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';

    passwords.forEach((password, index) => {
        const strength = calculateStrength(password);
        const item = document.createElement('div');
        item.className = 'password-item';

        // 创建密码文本元素
        const passwordText = document.createElement('div');
        passwordText.className = 'password-text';
        passwordText.textContent = password;

        // 创建信息容器
        const infoContainer = document.createElement('div');
        infoContainer.className = 'password-info';

        // 创建强度标签
        const strengthSpan = document.createElement('span');
        strengthSpan.className = `password-strength strength-${strength.level}`;
        strengthSpan.textContent = strength.text;

        // 创建破解时间提示
        const crackTimeDiv = document.createElement('div');
        crackTimeDiv.className = 'crack-time';
        crackTimeDiv.innerHTML = `<span class="crack-time-label">破解耗时：</span><span class="crack-time-value">${strength.crackTime}</span>`;

        // 创建复制按钮
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.textContent = '复制';
        copyBtn.addEventListener('click', function() {
            copyPassword(password, this);
        });

        // 组装元素
        item.appendChild(passwordText);
        infoContainer.appendChild(strengthSpan);
        infoContainer.appendChild(crackTimeDiv);
        item.appendChild(infoContainer);
        item.appendChild(copyBtn);
        resultsDiv.appendChild(item);
    });
}

// 计算密码强度和破解时间
function calculateStrength(password) {
    let score = 0;
    let charsetSize = 0;

    // 计算字符集大小
    if (/[a-z]/.test(password)) {
        charsetSize += 26;
        score += 1;
    }
    if (/[A-Z]/.test(password)) {
        charsetSize += 26;
        score += 1;
    }
    if (/[0-9]/.test(password)) {
        charsetSize += 10;
        score += 1;
    }
    if (/[^a-zA-Z0-9]/.test(password)) {
        charsetSize += 32; // 常见特殊字符
        score += 1;
    }

    // 长度评分
    if (password.length >= 12) score += 2;
    else if (password.length >= 8) score += 1;

    // 计算可能的组合数
    const combinations = Math.pow(charsetSize, password.length);

    // 假设破解速度：每秒 10 亿次尝试（现代 GPU）
    const attemptsPerSecond = 1e9;

    // 平均破解时间（秒）= 组合数 / 2 / 尝试速度
    const secondsToCrack = combinations / 2 / attemptsPerSecond;

    // 格式化破解时间
    const crackTime = formatCrackTime(secondsToCrack);

    // 确定强度等级
    let level, text;
    if (score >= 5 && password.length >= 12) {
        level = 'strong';
        text = '强';
    } else if (score >= 3 && password.length >= 8) {
        level = 'medium';
        text = '中';
    } else {
        level = 'weak';
        text = '弱';
    }

    return {
        level,
        text,
        crackTime,
        combinations
    };
}

// 格式化破解时间
function formatCrackTime(seconds) {
    if (seconds < 1) {
        return `${Math.round(seconds * 1000)} 毫秒`;
    } else if (seconds < 60) {
        return `${Math.round(seconds)} 秒`;
    } else if (seconds < 3600) {
        return `${Math.round(seconds / 60)} 分钟`;
    } else if (seconds < 86400) {
        return `${Math.round(seconds / 3600)} 小时`;
    } else if (seconds < 2592000) { // 30天
        return `${Math.round(seconds / 86400)} 天`;
    } else if (seconds < 31536000) { // 1年
        return `${Math.round(seconds / 2592000)} 个月`;
    } else {
        // 转换为年
        const years = seconds / 31536000;

        if (years < 1000) {
            // 小于1000年，直接显示年数
            return `${Math.round(years).toLocaleString()} 年`;
        } else if (years < 1000000) {
            // 1千到100万年，显示千年
            return `${(years / 1000).toFixed(1)} 千年`;
        } else if (years < 1000000000) {
            // 100万到10亿年，显示百万年
            return `${(years / 1000000).toFixed(1)} 百万年`;
        } else if (years < 1000000000000) {
            // 10亿到1万亿年，显示十亿年
            return `${(years / 1000000000).toFixed(1)} 十亿年`;
        } else if (years < 1000000000000000) {
            // 1万亿到1千万亿年，显示万亿年
            return `${(years / 1000000000000).toFixed(1)} 万亿年`;
        } else {
            // 超过1千万亿年，显示千万亿年
            const value = years / 1000000000000000;
            if (value < 1000) {
                return `${value.toFixed(1)} 千万亿年`;
            } else {
                // 超级大的数字，显示为宇宙年龄的倍数
                const universeAge = 13.8e9; // 宇宙年龄约138亿年
                const times = years / universeAge;
                if (times < 1000) {
                    return `${times.toFixed(0)} 个宇宙年龄`;
                } else if (times < 1000000) {
                    return `${(times / 1000).toFixed(0)} 千个宇宙年龄`;
                } else if (times < 1000000000) {
                    return `${(times / 1000000).toFixed(0)} 百万个宇宙年龄`;
                } else {
                    return `${(times / 1000000000).toFixed(0)} 十亿个宇宙年龄`;
                }
            }
        }
    }
}

// 复制密码
function copyPassword(password, button) {
    navigator.clipboard.writeText(password).then(() => {
        const originalText = button.textContent;
        button.textContent = '已复制';
        button.classList.add('copied');

        setTimeout(() => {
            button.textContent = originalText;
            button.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        alert('复制失败，请手动复制');
    });
}

// 保存到历史
function saveToHistory(passwords) {
    let history = JSON.parse(localStorage.getItem('passwordHistory') || '[]');

    passwords.forEach(password => {
        history.unshift({
            password: password,
            timestamp: new Date().toLocaleString('zh-CN')
        });
    });

    // 只保留最近50条
    history = history.slice(0, 50);
    localStorage.setItem('passwordHistory', JSON.stringify(history));

    loadHistory();
}

// 加载历史
function loadHistory() {
    const history = JSON.parse(localStorage.getItem('passwordHistory') || '[]');
    const historyList = document.getElementById('historyList');

    if (history.length === 0) {
        historyList.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 20px;">暂无历史记录</div>';
        return;
    }

    historyList.innerHTML = '';
    history.forEach(item => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.textContent = `${item.password} (${item.timestamp})`;
        div.onclick = () => copyPassword(item.password, div);
        historyList.appendChild(div);
    });
}

// 清空历史
function clearHistory() {
    if (confirm('确定要清空所有历史记录吗？')) {
        localStorage.removeItem('passwordHistory');
        loadHistory();
    }
}
