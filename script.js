// ---------- ملف script.js الكامل مع جميع الميزات (بدون Firebase) ----------

// -------------------- الإعدادات والمتغيرات العامة --------------------
let grid = [];
let size = 4; // الحجم الافتراضي 4x4
let score = 0;
let highScore = localStorage.getItem('highScore') ? parseInt(localStorage.getItem('highScore')) : 0;
const SAVE_KEY = 'game2048_lastState';
const STATS_KEY = 'game2048_stats';
const LEADERBOARD_KEY = 'game2048_leaderboard';
const ACHIEVEMENTS_KEY = 'game2048_achievements';
const SETTINGS_KEY = 'game2048_settings';

// حالة اللعبة
let gameOver = false;
let winFlag = false;
let movesCount = 0;
let timerInterval = null;
let timerSeconds = 0;
let timerRunning = false;
let undoStack = [];

// أوضاع اللعبة
let challengeMode = false;
let language = 'ar';

// اسم اللاعب
let playerName = localStorage.getItem('playerName') || 'زائر';

// إحصائيات متقدمة
let stats = {
    totalScore: 0,
    maxTile: 0,
    winCount: 0,
    loseCount: 0,
    totalTime: 0,
    gamesPlayed: 0
};

// إنجازات
let achievements = [];

// قائمة أفضل النتائج (محلية)
let leaderboard = [];

// السمة الحالية
let currentTheme = localStorage.getItem('theme') || 'classic';

// -------------------- تحميل البيانات المحفوظة --------------------
function loadStats() {
    const saved = localStorage.getItem(STATS_KEY);
    if (saved) {
        try { stats = JSON.parse(saved); } catch (e) { console.warn('فشل تحميل الإحصائيات'); }
    }
}
function saveStats() { localStorage.setItem(STATS_KEY, JSON.stringify(stats)); }

function loadLeaderboard() {
    const saved = localStorage.getItem(LEADERBOARD_KEY);
    if (saved) {
        try { leaderboard = JSON.parse(saved); } catch (e) { console.warn('فشل تحميل المتصدرين'); }
    }
}
function saveLeaderboard() {
    leaderboard.sort((a,b) => b.score - a.score);
    if (leaderboard.length > 10) leaderboard = leaderboard.slice(0,10);
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard));
}

function loadAchievements() {
    const saved = localStorage.getItem(ACHIEVEMENTS_KEY);
    if (saved) {
        try { achievements = JSON.parse(saved); } catch (e) { console.warn('فشل تحميل الإنجازات'); }
    }
}
function saveAchievements() { localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(achievements)); }

function loadSettings() {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
        try {
            const s = JSON.parse(saved);
            challengeMode = s.challenge ?? false;
            language = s.lang ?? 'ar';
        } catch (e) { console.warn('فشل تحميل الإعدادات'); }
    }
}
function saveSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
        challenge: challengeMode,
        lang: language
    }));
}

// -------------------- الترجمة --------------------
const translations = {
    ar: {
        title: '٢٠٤٨',
        score: 'النتيجة',
        highScore: 'أفضل نتيجة',
        time: 'الوقت',
        moves: 'الحركات',
        newGame: 'لعبة جديدة',
        gameOver: 'انتهت اللعبة!',
        youWin: 'ألف مبروك! وصلت إلى 2048!',
        statsTitle: 'إحصائيات متقدمة',
        totalScore: 'مجموع النقاط',
        maxTile: 'أكبر رقم',
        winCount: 'عدد مرات الفوز',
        loseCount: 'عدد مرات الخسارة',
        avgTime: 'متوسط الوقت',
        leaderboard: 'أفضل 10 نتائج',
        achievements: 'إنجازاتك',
        share: 'شارك نتيجتك',
        challengeOn: 'وضع التحدي',
        challengeOff: 'وضع عادي',
        size: 'الحجم',
        exportSave: 'تصدير الحفظ',
        importSave: 'استيراد الحفظ',
        undo: 'تراجع',
        close: 'إغلاق',
        howToPlay: 'كيف تلعب',
        themeLabel: 'السمة',
        gamesPlayed: 'عدد الألعاب'
    },
    en: {
        title: '2048',
        score: 'Score',
        highScore: 'High Score',
        time: 'Time',
        moves: 'Moves',
        newGame: 'New Game',
        gameOver: 'Game Over!',
        youWin: 'Congratulations! You reached 2048!',
        statsTitle: 'Advanced Stats',
        totalScore: 'Total Score',
        maxTile: 'Max Tile',
        winCount: 'Wins',
        loseCount: 'Losses',
        avgTime: 'Avg Time',
        leaderboard: 'Top 10 Scores',
        achievements: 'Achievements',
        share: 'Share Score',
        challengeOn: 'Challenge Mode',
        challengeOff: 'Normal Mode',
        size: 'Size',
        exportSave: 'Export Save',
        importSave: 'Import Save',
        undo: 'Undo',
        close: 'Close',
        howToPlay: 'How to Play',
        themeLabel: 'Theme',
        gamesPlayed: 'Games Played'
    }
};

function t(key) {
    return translations[language][key] || key;
}

function applyLanguage() {
    const titleEl = document.getElementById('game-title');
    if (titleEl) titleEl.textContent = t('title');
}

// -------------------- تطبيق السمة --------------------
function applyTheme(theme) {
    document.body.classList.remove('theme-classic', 'theme-dark', 'theme-nature', 'theme-futuristic');
    document.body.classList.add(`theme-${theme}`);
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) themeSelect.value = theme;
    localStorage.setItem('theme', theme);
    currentTheme = theme;
}

// -------------------- اسم المستخدم --------------------
function savePlayerName() {
    const nameInput = document.getElementById('player-name');
    if (nameInput && nameInput.value.trim() !== '') {
        playerName = nameInput.value.trim();
        localStorage.setItem('playerName', playerName);
    }
}

function loadPlayerName() {
    const nameInput = document.getElementById('player-name');
    if (nameInput) nameInput.value = playerName;
}

// -------------------- تهيئة الشبكة --------------------
function initGrid() {
    grid = [];
    for (let r = 0; r < size; r++) {
        grid[r] = [];
        for (let c = 0; c < size; c++) {
            grid[r][c] = 0;
        }
    }
}

// -------------------- لون الخلية حسب الرقم --------------------
function getColorForValue(value) {
    if (value === 0) return '';
    const intensity = Math.min(Math.log2(value) / 12, 1);
    const hue = 40 - intensity * 25;
    const saturation = 60 + intensity * 30;
    const lightness = 65 - intensity * 20;
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

// -------------------- عرض الشبكة (مؤمن بالكامل) --------------------
function renderBoard(animateNew = [], animateMerge = []) {
    const boardElement = document.getElementById('board');
    if (!boardElement) return;

    animateNew = animateNew || [];
    animateMerge = animateMerge || [];

    boardElement.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    boardElement.innerHTML = '';

    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            const value = (grid[r] && grid[r][c] !== undefined) ? grid[r][c] : 0;
            if (value !== 0) {
                cell.textContent = value;
                const bgColor = getColorForValue(value);
                if (bgColor) cell.style.backgroundColor = bgColor;
                if (value > 512) cell.style.color = 'white';
            }

            if (Array.isArray(animateNew) && animateNew.some(pos => pos && pos.r === r && pos.c === c)) {
                cell.classList.add('new');
                setTimeout(() => cell.classList.remove('new'), 200);
            }
            if (Array.isArray(animateMerge) && animateMerge.some(pos => pos && pos.r === r && pos.c === c)) {
                cell.classList.add('merge');
                setTimeout(() => cell.classList.remove('merge'), 150);
            }

            boardElement.appendChild(cell);
        }
    }

    const scoreSpan = document.getElementById('score');
    if (scoreSpan) scoreSpan.textContent = score;
    const movesSpan = document.getElementById('moves');
    if (movesSpan) movesSpan.textContent = movesCount;

    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
    }
    const highScoreSpan = document.getElementById('high-score');
    if (highScoreSpan) highScoreSpan.textContent = highScore;
}

// -------------------- إضافة رقم عشوائي --------------------
function addRandomTile(animate = true) {
    if (!grid) return null;
    const empty = [];
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (grid[r][c] === 0) empty.push({ r, c });
        }
    }
    if (empty.length === 0) return null;
    const { r, c } = empty[Math.floor(Math.random() * empty.length)];
    let value;
    if (challengeMode) {
        value = Math.random() < 0.8 ? 4 : 8;
    } else {
        value = Math.random() < 0.9 ? 2 : 4;
    }
    grid[r][c] = value;
    if (animate) {
        renderBoard([{r,c}], []);
    } else {
        renderBoard();
    }
    return { r, c };
}

// -------------------- دوال الحركة الأساسية --------------------
function moveLeft() {
    let moved = false;
    for (let r = 0; r < size; r++) {
        let row = grid[r].filter(val => val !== 0);
        for (let i = 0; i < row.length - 1; i++) {
            if (row[i] === row[i + 1]) {
                row[i] *= 2;
                score += row[i];
                row.splice(i + 1, 1);
                moved = true;
            }
        }
        while (row.length < size) row.push(0);
        if (JSON.stringify(grid[r]) !== JSON.stringify(row)) moved = true;
        grid[r] = row;
    }
    return moved;
}

function moveRight() {
    let moved = false;
    for (let r = 0; r < size; r++) {
        let row = grid[r].filter(val => val !== 0);
        for (let i = row.length - 1; i > 0; i--) {
            if (row[i] === row[i - 1]) {
                row[i] *= 2;
                score += row[i];
                row.splice(i - 1, 1);
                moved = true;
                i--;
            }
        }
        while (row.length < size) row.unshift(0);
        if (JSON.stringify(grid[r]) !== JSON.stringify(row)) moved = true;
        grid[r] = row;
    }
    return moved;
}

function moveUp() {
    let moved = false;
    for (let c = 0; c < size; c++) {
        let col = [];
        for (let r = 0; r < size; r++) {
            if (grid[r][c] !== 0) col.push(grid[r][c]);
        }
        for (let i = 0; i < col.length - 1; i++) {
            if (col[i] === col[i + 1]) {
                col[i] *= 2;
                score += col[i];
                col.splice(i + 1, 1);
                moved = true;
            }
        }
        while (col.length < size) col.push(0);
        for (let r = 0; r < size; r++) {
            if (grid[r][c] !== col[r]) moved = true;
            grid[r][c] = col[r];
        }
    }
    return moved;
}

function moveDown() {
    let moved = false;
    for (let c = 0; c < size; c++) {
        let col = [];
        for (let r = 0; r < size; r++) {
            if (grid[r][c] !== 0) col.push(grid[r][c]);
        }
        for (let i = col.length - 1; i > 0; i--) {
            if (col[i] === col[i - 1]) {
                col[i] *= 2;
                score += col[i];
                col.splice(i - 1, 1);
                moved = true;
                i--;
            }
        }
        while (col.length < size) col.unshift(0);
        for (let r = 0; r < size; r++) {
            if (grid[r][c] !== col[r]) moved = true;
            grid[r][c] = col[r];
        }
    }
    return moved;
}

// ---------- حفظ الحالة (للتراجع) ----------
function pushToUndo() {
    undoStack.push({
        grid: JSON.parse(JSON.stringify(grid)),
        score: score,
        moves: movesCount,
        timerSeconds: timerSeconds
    });
    if (undoStack.length > 5) undoStack.shift();
}

function undo() {
    if (undoStack.length === 0) return;
    const last = undoStack.pop();
    grid = last.grid;
    score = last.score;
    movesCount = last.moves;
    timerSeconds = last.timerSeconds;
    renderBoard();
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
    }
    const highScoreSpan = document.getElementById('high-score');
    if (highScoreSpan) highScoreSpan.textContent = highScore;
}

// ---------- التحقق من نهاية اللعبة ----------
function isGameOver() {
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (grid[r][c] === 0) return false;
        }
    }
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size-1; c++) {
            if (grid[r][c] === grid[r][c+1]) return false;
        }
    }
    for (let c = 0; c < size; c++) {
        for (let r = 0; r < size-1; r++) {
            if (grid[r][c] === grid[r+1][c]) return false;
        }
    }
    return true;
}

// ---------- التحقق من الفوز ----------
function checkWin() {
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (grid[r][c] === 2048) return true;
        }
    }
    return false;
}

// ---------- تحديث الإنجازات ----------
function updateAchievements() {
    let newAchievement = false;
    if (!achievements.includes('first_win') && checkWin()) {
        achievements.push('first_win');
        newAchievement = true;
        alert('🏆 إنجاز جديد: أول فوز!');
    }
    if (!achievements.includes('first_1024') && grid.some(row => row && row.includes(1024))) {
        achievements.push('first_1024');
        newAchievement = true;
        alert('🏆 إنجاز جديد: وصلت إلى 1024!');
    }
    if (!achievements.includes('first_4096') && grid.some(row => row && row.includes(4096))) {
        achievements.push('first_4096');
        newAchievement = true;
        alert('🏆 إنجاز جديد: وصلت إلى 4096!');
    }
    if (newAchievement) saveAchievements();
}

// ---------- إضافة إلى المتصدرين (مع اسم اللاعب) ----------
function addToLeaderboard() {
    leaderboard.push({ 
        name: playerName,
        score: score, 
        time: timerSeconds, 
        moves: movesCount,
        date: new Date().toLocaleDateString()
    });
    saveLeaderboard();
}

// ---------- تنفيذ الحركة حسب الاتجاه ----------
function performMove(direction) {
    if (gameOver) return;

    pushToUndo();

    let moved = false;
    switch (direction) {
        case 'left': moved = moveLeft(); break;
        case 'right': moved = moveRight(); break;
        case 'up': moved = moveUp(); break;
        case 'down': moved = moveDown(); break;
        default: return;
    }

    if (moved) {
        movesCount++;
        const newTilePos = addRandomTile(false);
        updateAchievements();

        renderBoard(newTilePos ? [newTilePos] : [], []);

        if (checkWin() && !winFlag) {
            winFlag = true;
            stats.winCount++;
            saveStats();
            alert(t('youWin'));
        }

        if (isGameOver()) {
            gameOver = true;
            stats.loseCount++;
            stats.totalTime += timerSeconds;
            stats.gamesPlayed++;
            // تحديث أكبر رقم
            let max = 0;
            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    if (grid[r][c] > max) max = grid[r][c];
                }
            }
            if (max > stats.maxTile) stats.maxTile = max;
            saveStats();
            addToLeaderboard();
            stopTimer();
            showInterstitialAd();
            alert(t('gameOver'));
        }

        saveGameState();
    } else {
        undoStack.pop(); // إلغاء الحفظ إذا لم تتحرك
    }
}

// ---------- دوال المؤقت ----------
function startTimer() {
    if (timerRunning) return;
    timerRunning = true;
    timerInterval = setInterval(() => {
        timerSeconds++;
        updateTimerDisplay();
    }, 1000);
}
function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    timerRunning = false;
}
function resetTimer() {
    stopTimer();
    timerSeconds = 0;
    updateTimerDisplay();
}
function updateTimerDisplay() {
    const timerSpan = document.getElementById('timer');
    if (!timerSpan) return;
    const minutes = Math.floor(timerSeconds / 60);
    const seconds = timerSeconds % 60;
    timerSpan.textContent = `${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`;
}

// ---------- حفظ واستعادة حالة اللعبة ----------
function saveGameState() {
    const state = { grid, score, size, movesCount, timerSeconds, gameOver, winFlag };
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}
function loadGameState() {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
        try {
            const state = JSON.parse(saved);
            grid = state.grid;
            score = state.score;
            size = state.size || 4;
            movesCount = state.movesCount || 0;
            timerSeconds = state.timerSeconds || 0;
            gameOver = state.gameOver || false;
            winFlag = state.winFlag || false;
            const sizeSelect = document.getElementById('size-select');
            if (sizeSelect) sizeSelect.textContent = `${size}x${size}`;
            renderBoard();
            updateTimerDisplay();
            return true;
        } catch (e) { console.warn('فشل تحميل حالة اللعبة'); }
    }
    return false;
}
function clearSavedGame() { localStorage.removeItem(SAVE_KEY); }

// ---------- بدء لعبة جديدة ----------
function newGame() {
    // تحديث الإحصائيات باللعبة السابقة
    stats.totalScore += score;
    let max = 0;
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (grid[r] && grid[r][c] > max) max = grid[r][c];
        }
    }
    if (max > stats.maxTile) stats.maxTile = max;
    stats.gamesPlayed++;
    saveStats();

    initGrid();
    score = 0;
    movesCount = 0;
    gameOver = false;
    winFlag = false;
    undoStack = [];
    resetTimer();
    startTimer();
    addRandomTile(false);
    addRandomTile(false);
    renderBoard();
    clearSavedGame();
}

// ---------- تغيير حجم الشبكة ----------
function changeSize(newSize) {
    size = newSize;
    const sizeSelect = document.getElementById('size-select');
    if (sizeSelect) sizeSelect.textContent = `${size}x${size}`;
    newGame();
}

// ---------- تصدير واستيراد الحفظ ----------
function exportSave() {
    const state = { grid, score, size, movesCount, timerSeconds, gameOver, winFlag, highScore, stats, leaderboard, achievements, challengeMode, language, playerName };
    const str = JSON.stringify(state);
    prompt(t('exportSave'), btoa(encodeURIComponent(str)));
}
function importSave() {
    const encoded = prompt(t('importSave'));
    if (!encoded) return;
    try {
        const str = decodeURIComponent(atob(encoded));
        const state = JSON.parse(str);
        grid = state.grid;
        score = state.score;
        size = state.size || 4;
        movesCount = state.movesCount || 0;
        timerSeconds = state.timerSeconds || 0;
        gameOver = state.gameOver || false;
        winFlag = state.winFlag || false;
        highScore = state.highScore || highScore;
        stats = state.stats || stats;
        leaderboard = state.leaderboard || leaderboard;
        achievements = state.achievements || achievements;
        challengeMode = state.challengeMode || challengeMode;
        language = state.language || language;
        playerName = state.playerName || playerName;

        const sizeSelect = document.getElementById('size-select');
        if (sizeSelect) sizeSelect.textContent = `${size}x${size}`;
        const challengeToggle = document.getElementById('challenge-toggle');
        if (challengeToggle) challengeToggle.textContent = challengeMode ? '⚡' : '🌱';
        const nameInput = document.getElementById('player-name');
        if (nameInput) nameInput.value = playerName;
        renderBoard();
        updateTimerDisplay();
        localStorage.setItem('highScore', highScore);
        saveStats();
        saveLeaderboard();
        saveAchievements();
        saveSettings();
        alert('تم استيراد الحفظ بنجاح');
    } catch (e) { 
        alert('فشل الاستيراد: البيانات غير صالحة'); 
        console.error(e);
    }
}

// ---------- إعلان بيني ----------
function showInterstitialAd() {
    if (document.getElementById('interstitial-ad')) return;
    const adOverlay = document.createElement('div');
    adOverlay.id = 'interstitial-ad';
    adOverlay.style.cssText = `position: fixed; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center; z-index: 10000;`;
    adOverlay.innerHTML = `<div style="background: white; padding: 30px; border-radius: 10px; text-align: center; max-width: 300px;"><h3 style="margin-top:0; color:#333;">إعلان</h3><p style="margin-bottom:20px; color:#666;">هنا يمكن وضع إعلان حقيقي من AdSense.</p><button id="close-ad" style="background:#8f7a66; color:white; border:none; padding:10px 20px; border-radius:5px; cursor:pointer;">إغلاق</button></div>`;
    document.body.appendChild(adOverlay);
    document.getElementById('close-ad').addEventListener('click', () => document.body.removeChild(adOverlay));
}

// ---------- إعداد النوافذ المنبثقة ----------
function setupModals() {
    // إحصائيات
    const statsModal = document.getElementById('stats-modal');
    const statsBtn = document.getElementById('stats-btn');
    if (statsModal && statsBtn) {
        const closeStats = statsModal.querySelector('.close');
        statsBtn.onclick = () => {
            document.getElementById('total-score').textContent = stats.totalScore;
            document.getElementById('max-tile').textContent = stats.maxTile;
            document.getElementById('win-count').textContent = stats.winCount;
            document.getElementById('lose-count').textContent = stats.loseCount;
            document.getElementById('games-played').textContent = stats.gamesPlayed;
            const avg = stats.gamesPlayed > 0 ? Math.round(stats.totalTime / stats.gamesPlayed) : 0;
            document.getElementById('avg-time').textContent = `${Math.floor(avg/60)}:${(avg%60).toString().padStart(2,'0')}`;
            statsModal.style.display = 'block';
        };
        if (closeStats) closeStats.onclick = () => statsModal.style.display = 'none';
    }

    // المتصدرين (مع اسم اللاعب)
    const leaderboardModal = document.getElementById('leaderboard-modal');
    const leaderboardBtn = document.getElementById('leaderboard-btn');
    if (leaderboardModal && leaderboardBtn) {
        const closeLeader = leaderboardModal.querySelector('.close');
        leaderboardBtn.onclick = () => {
            const list = document.getElementById('leaderboard-list');
            if (!list) return;
            list.innerHTML = '';
            if (leaderboard.length === 0) {
                list.innerHTML = '<li>لا توجد نتائج بعد</li>';
            } else {
                leaderboard.forEach((entry, idx) => {
                    const li = document.createElement('li');
                    const minutes = Math.floor(entry.time / 60);
                    const seconds = entry.time % 60;
                    li.textContent = `${idx+1}. ${entry.name || 'زائر'} - ${entry.score} نقطة (${entry.moves} حركات) - ${minutes}:${seconds.toString().padStart(2,'0')}`;
                    if (entry.date) li.textContent += ` - ${entry.date}`;
                    list.appendChild(li);
                });
            }
            leaderboardModal.style.display = 'block';
        };
        if (closeLeader) closeLeader.onclick = () => leaderboardModal.style.display = 'none';
    }

    // كيف تلعب
    const howtoModal = document.getElementById('howto-modal');
    const howtoBtn = document.getElementById('howto-btn');
    if (howtoModal && howtoBtn) {
        const closeHowto = howtoModal.querySelector('.close');
        howtoBtn.onclick = () => howtoModal.style.display = 'block';
        if (closeHowto) closeHowto.onclick = () => howtoModal.style.display = 'none';
    }

    // إغلاق عند النقر خارج النافذة
    window.onclick = (e) => {
        if (statsModal && e.target === statsModal) statsModal.style.display = 'none';
        if (leaderboardModal && e.target === leaderboardModal) leaderboardModal.style.display = 'none';
        if (howtoModal && e.target === howtoModal) howtoModal.style.display = 'none';
    };
}

// ---------- مشاركة النتيجة ----------
function shareScore() {
    const text = `لقد وصلت إلى ${score} نقطة في ${movesCount} حركات خلال ${Math.floor(timerSeconds/60)}:${(timerSeconds%60).toString().padStart(2,'0')} دقيقة في لعبة 2048!`;
    if (navigator.share) {
        navigator.share({ title: 'نتيجتي في 2048', text: text });
    } else {
        navigator.clipboard.writeText(text).then(() => alert('تم نسخ النتيجة إلى الحافظة'));
    }
}

// ---------- السحب بالماوس واللمس (مع تحسين اللمس المتعدد) ----------
function setupDragAndTouch() {
    const board = document.getElementById('board');
    if (!board) return;
    let startX = 0, startY = 0, isDragging = false;
    let lastX = 0, lastY = 0;

    board.addEventListener('mousedown', (e) => {
        e.preventDefault();
        startX = e.clientX;
        startY = e.clientY;
        lastX = startX;
        lastY = startY;
        isDragging = true;
    });
    board.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        lastX = e.clientX;
        lastY = e.clientY;
    });
    board.addEventListener('mouseup', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const dx = lastX - startX;
        const dy = lastY - startY;
        if (Math.abs(dx) > Math.abs(dy)) {
            if (dx > 30) performMove('right');
            else if (dx < -30) performMove('left');
        } else {
            if (dy > 30) performMove('down');
            else if (dy < -30) performMove('up');
        }
        isDragging = false;
    });
    board.addEventListener('mouseleave', () => { isDragging = false; });

    // اللمس (مع تحسين multi-touch)
    board.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (e.touches.length > 1) return; // تجاهل اللمس المتعدد
        const touch = e.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
        lastX = startX;
        lastY = startY;
        isDragging = true;
    });

    board.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        if (e.touches.length > 1) {
            isDragging = false; // إلغاء السحب إذا ظهرت لمسة ثانية
            return;
        }
        const touch = e.touches[0];
        lastX = touch.clientX;
        lastY = touch.clientY;
    });

    board.addEventListener('touchend', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const dx = lastX - startX;
        const dy = lastY - startY;
        if (Math.abs(dx) > Math.abs(dy)) {
            if (dx > 30) performMove('right');
            else if (dx < -30) performMove('left');
        } else {
            if (dy > 30) performMove('down');
            else if (dy < -30) performMove('up');
        }
        isDragging = false;
    });
    board.addEventListener('touchcancel', () => { isDragging = false; });
}

// ---------- ربط الأحداث والتهيئة ----------
document.addEventListener('DOMContentLoaded', () => {
    // تحميل البيانات
    loadStats();
    loadLeaderboard();
    loadAchievements();
    loadSettings();

    // تطبيق السمة
    const savedTheme = localStorage.getItem('theme');
    applyTheme(savedTheme || 'classic');

    applyLanguage();
    loadPlayerName(); // تحميل اسم اللاعب

    // استعادة آخر لعبة أو بدء جديدة
    if (!loadGameState()) {
        newGame();
    } else {
        startTimer();
        renderBoard();
        if (gameOver) stopTimer();
    }

    // أزرار شريط الأدوات
    document.getElementById('undo-btn')?.addEventListener('click', undo);
    document.getElementById('share-btn')?.addEventListener('click', shareScore);
    document.getElementById('save-name-btn')?.addEventListener('click', savePlayerName);
    
    const challengeToggle = document.getElementById('challenge-toggle');
    if (challengeToggle) {
        challengeToggle.textContent = challengeMode ? '⚡' : '🌱';
        challengeToggle.addEventListener('click', () => {
            challengeMode = !challengeMode;
            challengeToggle.textContent = challengeMode ? '⚡' : '🌱';
            saveSettings();
        });
    }

    const sizeSelect = document.getElementById('size-select');
    if (sizeSelect) {
        sizeSelect.textContent = `${size}x${size}`;
        sizeSelect.addEventListener('click', () => {
            if (size === 4) changeSize(5);
            else if (size === 5) changeSize(6);
            else changeSize(4);
        });
    }

    document.getElementById('export-btn')?.addEventListener('click', exportSave);
    document.getElementById('import-btn')?.addEventListener('click', importSave);
    document.getElementById('new-game')?.addEventListener('click', newGame);

    // قائمة السمات
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
        themeSelect.value = currentTheme;
        themeSelect.addEventListener('change', (e) => applyTheme(e.target.value));
    }

    // أزرار التحكم
    document.querySelectorAll('.control-btn').forEach(btn => {
        btn.addEventListener('click', () => performMove(btn.dataset.direction));
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            performMove(btn.dataset.direction);
        });
    });

    // لوحة المفاتيح
    document.addEventListener('keydown', (e) => {
        if (e.key.startsWith('Arrow')) e.preventDefault();
        switch (e.key) {
            case 'ArrowLeft': performMove('left'); break;
            case 'ArrowRight': performMove('right'); break;
            case 'ArrowUp': performMove('up'); break;
            case 'ArrowDown': performMove('down'); break;
        }
    });

    setupDragAndTouch();
    setupModals();
});