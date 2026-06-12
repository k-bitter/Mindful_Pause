/* ═══════════════════════════════════════════
   AFFIRMATIONS
═══════════════════════════════════════════ */
const affirmations = [
    "Breathe in, breathe out.",
    "You are doing enough.",
    "Peace is within you.",
    "Observe, don't judge.",
    "Stay present.",
    "Rest is not surrender.",
    "You deserve this quiet.",
    "This moment is yours.",
    "I am grounded and calm.",
    "Each breath is a new beginning.",
    "I release what I cannot control.",
    "I am worthy of peace.",
    "Quiet the mind, open the heart.",
    "I trust the process.",
    "One moment at a time.",
    "Kindness starts with me.",
    "I am enough just as I am.",
    "Today is a gift.",
    "Slow down and notice.",
    "My breath is my anchor.",
    "I am choosing to be present."
];

/* ═══════════════════════════════════════════
   MOOD CONFIG
═══════════════════════════════════════════ */
const MOODS = {
    Joyful:   { icon: '✨', label: 'Joyful'   },
    Balanced: { icon: '☀️', label: 'Balanced' },
    Stressed: { icon: '🌩️', label: 'Stressed' },
    Tired:    { icon: '🌙', label: 'Tired'    }
};

/* ═══════════════════════════════════════════
   SETTINGS
═══════════════════════════════════════════ */
const DEFAULTS = {
    theme: 'auto', sound: false, vibration: false,
    reminder: false, reminderTime: '08:00'
};

function getSetting(key) {
    const raw = localStorage.getItem('setting-' + key);
    if (raw === null)      return DEFAULTS[key];
    if (raw === 'true')    return true;
    if (raw === 'false')   return false;
    return raw;
}

function saveSetting(key, value) {
    localStorage.setItem('setting-' + key, value);
}

function loadSettings() {
    ['sound', 'vibration', 'reminder'].forEach(k => {
        const el = document.getElementById('setting-' + k);
        if (el) el.checked = getSetting(k);
    });
    const rt = document.getElementById('reminder-time');
    if (rt) rt.value = getSetting('reminderTime');
    const rtr = document.getElementById('reminder-time-row');
    if (rtr) rtr.classList.toggle('hidden', !getSetting('reminder'));
    setThemeChip(getSetting('theme'));
}

/* ═══════════════════════════════════════════
   THEME
═══════════════════════════════════════════ */
let themeInterval = null;

function applyTheme() {
    const pref = getSetting('theme');
    if      (pref === 'day')     document.body.classList.remove('evening');
    else if (pref === 'evening') document.body.classList.add('evening');
    else {
        const h = new Date().getHours();
        document.body.classList.toggle('evening', h >= 18 || h < 7);
    }
}

function setTheme(value) {
    saveSetting('theme', value);
    setThemeChip(value);
    applyTheme();
    clearInterval(themeInterval);
    themeInterval = value === 'auto' ? setInterval(applyTheme, 60000) : null;
}

function setThemeChip(value) {
    ['day', 'auto', 'evening'].forEach(v => {
        const el = document.getElementById('theme-' + v + '-btn');
        if (el) el.classList.toggle('active', v === value);
    });
}

/* ═══════════════════════════════════════════
   SESSION STATE
═══════════════════════════════════════════ */
let selectedDuration = null;
let selectedAudio    = null;
let timerInterval    = null;
const CIRCUMFERENCE  = 597;

function pickDuration(value, btn) {
    document.querySelectorAll('#duration-options .option-chip').forEach(b => b.classList.remove('option-active'));
    btn.classList.add('option-active');

    if (value === 'custom') {
        document.getElementById('custom-duration-row').classList.remove('hidden');
        selectedDuration = null;
        return;
    }
    document.getElementById('custom-duration-row').classList.add('hidden');
    selectedDuration = value;
    document.getElementById('audio-section').classList.remove('hidden');
    checkCanStart();
}

function confirmCustomDuration() {
    const mins = parseInt(document.getElementById('custom-minutes').value);
    if (!mins || mins < 1) { showToast('Enter a number of minutes'); return; }
    selectedDuration = mins * 60;
    document.getElementById('custom-duration-row').classList.add('hidden');
    const customBtn = document.querySelector('[data-value="custom"]');
    if (customBtn) customBtn.innerText = mins + ' min';
    document.getElementById('audio-section').classList.remove('hidden');
    checkCanStart();
}

function pickAudio(value, btn) {
    selectedAudio = value;
    document.querySelectorAll('[data-audio]').forEach(b => b.classList.remove('option-active'));
    btn.classList.add('option-active');
    checkCanStart();
}

function checkCanStart() {
    const startBtn = document.getElementById('start-btn');
    if (selectedDuration !== null && selectedAudio !== null) startBtn.classList.remove('hidden');
}

function startSession() {
    stopIdlePulse();
    document.getElementById('session-setup').classList.add('hidden');
    document.getElementById('session-running').classList.remove('hidden');
    const labels = { none: '', rain: '🌧  Rain', windchimes: '🎐  Wind Chimes', breathing: '🌊  Waves' };
    const audioEl = document.getElementById('audio-indicator');
    if (audioEl) audioEl.innerText = labels[selectedAudio] || '';
    startTimer(selectedDuration, selectedAudio);
}

function resetSessionSetup() {
    document.getElementById('session-setup').classList.remove('hidden');
    document.getElementById('session-running').classList.add('hidden');
    document.getElementById('audio-section').classList.add('hidden');
    document.getElementById('start-btn').classList.add('hidden');
    document.getElementById('custom-duration-row').classList.add('hidden');
    document.querySelectorAll('.option-chip').forEach(b => b.classList.remove('option-active'));
    const customBtn = document.querySelector('[data-value="custom"]');
    if (customBtn) customBtn.innerText = 'Custom';
    const minsEl = document.getElementById('custom-minutes');
    if (minsEl) minsEl.value = '';
    selectedDuration = null;
    selectedAudio    = null;
    startIdlePulse();
}

/* ═══════════════════════════════════════════
   TIMER
═══════════════════════════════════════════ */
function startTimer(seconds, audioType) {
    clearInterval(timerInterval);
    const circle = document.getElementById('progress-circle');
    let timeLeft  = seconds;
    circle.style.strokeDashoffset = CIRCUMFERENCE;

    if (audioType && audioType !== 'none') startAmbient(audioType);

    timerInterval = setInterval(() => {
        timeLeft--;
        const mins = Math.floor(timeLeft / 60);
        const secs = (timeLeft % 60).toString().padStart(2, '0');
        document.getElementById('timer-display').innerText = mins + ':' + secs;
        circle.style.strokeDashoffset =
            CIRCUMFERENCE - ((seconds - timeLeft) / seconds) * CIRCUMFERENCE;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            stopAmbient();
            onSessionComplete(seconds, audioType);
        }
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
    stopAmbient();
    document.getElementById('progress-circle').style.strokeDashoffset = CIRCUMFERENCE;
    document.getElementById('timer-display').innerText = '00:00';
    resetSessionSetup();
}

function onSessionComplete(seconds, audioType) {
    const count = parseInt(localStorage.getItem('sessions') || '0') + 1;
    localStorage.setItem('sessions', count);
    document.getElementById('session-count').innerText = count;
    logSession(seconds, audioType);
    showSessionComplete(seconds, audioType);
    if (getSetting('sound')) playChime();
    resetSessionSetup();
}

function logSession(seconds, audioType) {
    const now = new Date();
    const log = JSON.parse(localStorage.getItem('session-log') || '[]');
    log.push({
        date:     now.toISOString().slice(0, 10),
        time:     now.toLocaleTimeString('default', { hour: '2-digit', minute: '2-digit' }),
        duration: seconds,
        audio:    audioType || 'none',
        ts:       Date.now()
    });
    localStorage.setItem('session-log', JSON.stringify(log));
}

/* ═══════════════════════════════════════════
   AUDIO — completion chime
═══════════════════════════════════════════ */
function playChime() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        [523.25, 659.25, 783.99].forEach((freq, i) => {
            const osc = ctx.createOscillator(), gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.type = 'sine'; osc.frequency.value = freq;
            const t = ctx.currentTime + i * 0.32;
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.18, t + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 1.1);
            osc.start(t); osc.stop(t + 1.2);
        });
    } catch(e) {}
}

/* ═══════════════════════════════════════════
   AMBIENT SOUND
═══════════════════════════════════════════ */
let ambientCtx       = null;
let ambientSource    = null;
let ambientLfo       = null;
let windchimeTimeout = null;

function startAmbient(type) {
    stopAmbient();
    try {
        ambientCtx = new (window.AudioContext || window.webkitAudioContext)();
        if      (type === 'rain')       startRain(ambientCtx);
        else if (type === 'windchimes') startWindchimes(ambientCtx);
        else if (type === 'breathing')  startBreathing(ambientCtx);
    } catch(e) {}
}

function stopAmbient() {
    clearTimeout(windchimeTimeout); windchimeTimeout = null;
    try { if (ambientSource) { ambientSource.stop(); ambientSource = null; } } catch(e) {}
    try { if (ambientLfo)    { ambientLfo.stop();    ambientLfo    = null; } } catch(e) {}
    try { if (ambientCtx)    { ambientCtx.close();   ambientCtx    = null; } } catch(e) {}
}

function startRain(ctx) {
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d   = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf; src.loop = true;
    const flt = ctx.createBiquadFilter();
    flt.type = 'bandpass'; flt.frequency.value = 1200; flt.Q.value = 0.5;
    const gain = ctx.createGain(); gain.gain.value = 0.07;
    src.connect(flt); flt.connect(gain); gain.connect(ctx.destination);
    src.start(); ambientSource = src;
}

function startWindchimes(ctx) {
    function schedule() {
        windchimeTimeout = setTimeout(() => {
            if (!ambientCtx) return;
            const freqs = [1047, 1175, 1319, 1480, 1568, 1760, 1976];
            const count = Math.random() > 0.55 ? 2 : 1;
            for (let n = 0; n < count; n++) {
                const osc = ctx.createOscillator(), gain = ctx.createGain();
                osc.connect(gain); gain.connect(ctx.destination);
                osc.type = 'sine';
                osc.frequency.value = freqs[Math.floor(Math.random() * freqs.length)];
                const t = ctx.currentTime + n * 0.16;
                gain.gain.setValueAtTime(0, t);
                gain.gain.linearRampToValueAtTime(0.13, t + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 2.8);
                osc.start(t); osc.stop(t + 3.0);
            }
            schedule();
        }, 1200 + Math.random() * 3500);
    }
    schedule();
}

function startBreathing(ctx) {
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d   = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src  = ctx.createBufferSource();
    src.buffer = buf; src.loop = true;
    const flt  = ctx.createBiquadFilter();
    flt.type   = 'lowpass'; flt.frequency.value = 600;
    const main = ctx.createGain(); main.gain.value = 0.04;
    const lfo  = ctx.createOscillator();
    lfo.type   = 'sine'; lfo.frequency.value = 1 / 8;
    const lfoG = ctx.createGain(); lfoG.gain.value = 0.04;
    src.connect(flt); flt.connect(main);
    lfo.connect(lfoG); lfoG.connect(main.gain);
    main.connect(ctx.destination);
    src.start(); lfo.start();
    ambientSource = src; ambientLfo = lfo;
}

/* ═══════════════════════════════════════════
   VIBRATION
═══════════════════════════════════════════ */
function triggerVibration() {
    if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
}

/* ═══════════════════════════════════════════
   DAILY REMINDER
═══════════════════════════════════════════ */
function toggleReminder(enabled) {
    saveSetting('reminder', enabled);
    document.getElementById('reminder-time-row').classList.toggle('hidden', !enabled);
    if (enabled) requestNotificationPermission();
}

function saveReminderTime(value) {
    saveSetting('reminderTime', value);
    showToast('Reminder set for ' + value);
    scheduleReminder(value);
}

function requestNotificationPermission() {
    if (!('Notification' in window)) { showToast('Notifications not supported'); return; }
    if (Notification.permission === 'granted') {
        showToast('Reminder enabled'); scheduleReminder(getSetting('reminderTime'));
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(p => {
            if (p === 'granted') { showToast('Reminder enabled'); scheduleReminder(getSetting('reminderTime')); }
            else { showToast('Permission denied'); saveSetting('reminder', false); document.getElementById('setting-reminder').checked = false; }
        });
    } else { showToast('Notifications blocked in browser'); }
}

function scheduleReminder(timeStr) {
    if (!getSetting('reminder')) return;
    const [h, m] = timeStr.split(':').map(Number);
    const now = new Date(), next = new Date();
    next.setHours(h, m, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    setTimeout(() => {
        if (getSetting('reminder') && Notification.permission === 'granted')
            new Notification('Mindful Pause', { body: 'Time for your daily session ✦' });
        scheduleReminder(timeStr);
    }, next - now);
}

/* ═══════════════════════════════════════════
   NAVIGATION
═══════════════════════════════════════════ */
function showPage(id, btn) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    if (id === 'calendar-view') renderCalendar();
    if (id === 'sessions-view') startIdlePulse();
    else stopIdlePulse();
}

/* ═══════════════════════════════════════════
   AFFIRMATIONS — card flip
═══════════════════════════════════════════ */
let lastAffirmationIndex = -1;

function newAffirmation() {
    const pool = affirmMode === 'favs' && favourites.length > 0 ? favourites : affirmations;
    let index;
    do {
        index = Math.floor(Math.random() * pool.length);
    } while (pool.length > 1 && pool[index] === (document.getElementById('affirmation').innerText));

    const card = document.getElementById('affirmation-card');
    card.classList.add('flipping');
    setTimeout(() => {
        document.getElementById('affirmation').innerText = pool[index];
        updateBookmarkBtn(pool[index]);
    }, 300);
    setTimeout(() => card.classList.remove('flipping'), 620);
}

/* ═══════════════════════════════════════════
   TOAST
═══════════════════════════════════════════ */
function showToast(message) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = 'toast'; toast.innerText = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('toast-visible')));
    setTimeout(() => { toast.classList.remove('toast-visible'); setTimeout(() => toast.remove(), 300); }, 2400);
}

/* ═══════════════════════════════════════════
   MOOD & CALENDAR
═══════════════════════════════════════════ */
let selectedDate = new Date().toISOString().slice(0, 10);
let lastTapDate  = null;
let lastTapTime  = 0;

function getMoodsForDate(dateKey) {
    try { return JSON.parse(localStorage.getItem('mood-' + dateKey) || '[]'); } catch { return []; }
}

function saveMoodsForDate(dateKey, moods) {
    localStorage.setItem('mood-' + dateKey, JSON.stringify(moods));
}

function selectDate(dateKey) {
    selectedDate = dateKey;
    updateMoodButtons(dateKey);
    renderCalendar();
    const today = new Date().toISOString().slice(0, 10);
    const hint  = document.getElementById('mood-hint');
    if (!hint) return;
    if (dateKey === today) {
        hint.innerText = 'Tap to toggle — select all that apply today';
        hint.classList.remove('editing-past');
    } else {
        const d = new Date(dateKey + 'T12:00:00');
        hint.innerText = 'Editing ' + d.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' });
        hint.classList.add('editing-past');
    }
}

function toggleMood(mood) {
    moodHaptic();
    let moods = getMoodsForDate(selectedDate);
    if (moods.includes(mood)) {
        moods = moods.filter(m => m !== mood);
        showToast(MOODS[mood].icon + '  ' + mood + ' removed');
    } else {
        moods.push(mood);
        showToast(MOODS[mood].icon + '  ' + mood + ' saved');
    }
    saveMoodsForDate(selectedDate, moods);
    updateMoodButtons(selectedDate);
    renderCalendar();
}

function updateMoodButtons(dateKey) {
    const moods = getMoodsForDate(dateKey);
    document.querySelectorAll('.mood-btn').forEach(btn => {
        btn.classList.toggle('mood-active', moods.includes(btn.dataset.mood));
    });
}

let clearPending     = false;
let clearPendingTimer = null;

function confirmClearData() {
    if (clearPending) {
        clearPending = false;
        clearTimeout(clearPendingTimer);
        clearData();
        return;
    }
    clearPending = true;
    showToast('Tap Clear again to confirm');
    clearPendingTimer = setTimeout(() => { clearPending = false; }, 3000);
}

function clearData() {
    localStorage.clear();
    document.getElementById('session-count').innerText = 0;
    selectedDate = new Date().toISOString().slice(0, 10);
    updateMoodButtons(selectedDate);
    renderCalendar();
    loadSettings();
    showToast('Data cleared');
}

function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    grid.innerHTML = '';
    const now        = new Date();
    const todayFull  = now.toISOString().slice(0, 10);
    const year       = calendarYear;
    const month      = calendarMonth;
    const isThisMonth = (year === now.getFullYear() && month === now.getMonth());
    const today       = isThisMonth ? now.getDate() : -1;

    const label = document.getElementById('calendar-label');
    const ref = new Date(year, month, 1);
    if (label) label.innerText = ref.toLocaleString('default', { month: 'long', year: 'numeric' });

    updateStreakBanner();
    updateMonthlySummary();

    ['S','M','T','W','T','F','S'].forEach(d => {
        const h = document.createElement('div'); h.className = 'day-header'; h.innerText = d; grid.appendChild(h);
    });

    const firstDow = new Date(year, month, 1).getDay();
    for (let i = 0; i < firstDow; i++) {
        const b = document.createElement('div'); b.className = 'day day-blank'; grid.appendChild(b);
    }

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
        const cell    = document.createElement('div');
        const dateKey = year + '-' + String(month + 1).padStart(2,'0') + '-' + String(d).padStart(2,'0');
        const moods   = getMoodsForDate(dateKey);

        let cls = 'day';
        if (d === today) cls += ' day-today';
        if (dateKey === selectedDate && dateKey !== todayFull) cls += ' day-selected';

        cell.className = cls; cell.style.cursor = 'pointer';
        cell.innerHTML = '<span class="day-num">' + d + '</span>' +
            (moods.length ? '<span class="day-moods">' +
                moods.map(m => '<span class="mood-dot">' + MOODS[m].icon + '</span>').join('') + '</span>' : '');

        cell.addEventListener('click', () => {
            const now = Date.now();
            if (lastTapDate === dateKey && now - lastTapTime < 400) {
                lastTapDate = null;
                showDayDetail(dateKey);
            } else {
                lastTapDate = dateKey; lastTapTime = now;
                selectDate(dateKey);
            }
        });
        attachLongPress(cell, dateKey);

        grid.appendChild(cell);
    }
}

/* ═══════════════════════════════════════════
   DAY DETAIL SHEET
═══════════════════════════════════════════ */
function showDayDetail(dateKey) {
    const overlay = document.getElementById('day-detail-overlay');
    const d       = new Date(dateKey + 'T12:00:00');
    document.getElementById('sheet-date').innerText =
        d.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

    // Moods
    const moods   = getMoodsForDate(dateKey);
    const moodsEl = document.getElementById('sheet-moods');
    moodsEl.innerHTML = '<p class="sheet-section-label">Mood</p>' +
        (moods.length
            ? '<div class="sheet-mood-chips">' +
                moods.map(m => '<span class="sheet-mood-chip">' + MOODS[m].icon + ' ' + MOODS[m].label + '</span>').join('') +
              '</div>'
            : '<p class="sheet-empty">No mood logged</p>');

    // Sessions
    const allSessions = JSON.parse(localStorage.getItem('session-log') || '[]');
    const daySessions = allSessions.filter(s => s.date === dateKey);
    const sessEl      = document.getElementById('sheet-sessions');
    const aLabels     = { none: '—', rain: '🌧 Rain', windchimes: '🎐 Chimes', breathing: '🌊 Waves' };

    sessEl.innerHTML = '<p class="sheet-section-label">Sessions</p>' +
        (daySessions.length
            ? daySessions.map(s => {
                const mins = Math.floor(s.duration / 60);
                const secs = s.duration % 60;
                const dur  = secs > 0 ? mins + 'm ' + secs + 's' : mins + ' min';
                return '<div class="sheet-session-row">' +
                    '<span class="sheet-session-time">' + s.time + '</span>' +
                    '<span class="sheet-session-dur">'  + dur    + '</span>' +
                    '<span class="sheet-session-audio">' + (aLabels[s.audio] || '—') + '</span>' +
                    '</div>';
              }).join('')
            : '<p class="sheet-empty">No sessions logged</p>');

    overlay.style.display = 'flex';
    requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('sheet-visible')));
}

function closeDayDetail() {
    const overlay = document.getElementById('day-detail-overlay');
    overlay.classList.remove('sheet-visible');
    setTimeout(() => { overlay.style.display = 'none'; }, 300);
}

/* ═══════════════════════════════════════════
   INIT
═══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    applyTheme();
    if (getSetting('theme') === 'auto') themeInterval = setInterval(applyTheme, 60000);
    if (getSetting('reminder') && Notification.permission === 'granted') scheduleReminder(getSetting('reminderTime'));
    updateMoodButtons(selectedDate);
    // Only pulse if sessions page is the active one
    if (!document.getElementById('sessions-view').classList.contains('hidden')) {
        startIdlePulse();
    }
    initSplash();
    initAffirmSwipe();
    updateBookmarkBtn(document.getElementById('affirmation').innerText);
});

document.getElementById('session-count').innerText = localStorage.getItem('sessions') || 0;

/* ═══════════════════════════════════════════
   CONTACT DRAWER
═══════════════════════════════════════════ */
function openContact() {
    const overlay = document.getElementById('contact-overlay');
    overlay.style.display = 'block';
    requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('drawer-visible')));
    initDrawerSwipe();
}

function closeContact() {
    const overlay = document.getElementById('contact-overlay');
    overlay.classList.remove('drawer-visible');
    setTimeout(() => { overlay.style.display = 'none'; }, 320);
}

function initDrawerSwipe() {
    const drawer  = document.querySelector('.contact-drawer');
    if (!drawer || drawer._swipeInit) return;
    drawer._swipeInit = true;

    let startX = 0, currentX = 0, dragging = false;

    drawer.addEventListener('touchstart', e => {
        startX   = e.touches[0].clientX;
        currentX = startX;
        dragging = true;
        drawer.style.transition = 'none';
    }, { passive: true });

    drawer.addEventListener('touchmove', e => {
        if (!dragging) return;
        currentX = e.touches[0].clientX;
        const dx = Math.min(0, currentX - startX);
        drawer.style.transform = 'translateX(' + dx + 'px)';
    }, { passive: true });

    drawer.addEventListener('touchend', () => {
        if (!dragging) return;
        dragging = false;
        const dx = currentX - startX;

        if (dx < -60) {
            // Swiped far enough — animate out then clean up everything
            drawer.style.transition = 'transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)';
            drawer.style.transform  = 'translateX(-100%)';
            const overlay = document.getElementById('contact-overlay');
            overlay.classList.remove('drawer-visible');
            setTimeout(() => {
                overlay.style.display  = 'none';
                drawer.style.transform = '';
                drawer.style.transition = '';
            }, 320);
        } else {
            // Snap back
            drawer.style.transition = 'transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)';
            drawer.style.transform  = '';
            setTimeout(() => { drawer.style.transition = ''; }, 300);
        }
    });
}

/* ═══════════════════════════════════════════
   IDLE PULSE RING
═══════════════════════════════════════════ */
function startIdlePulse() {
    const ring = document.getElementById('idle-pulse-ring');
    if (ring) ring.classList.add('pulsing');
}

function stopIdlePulse() {
    const ring = document.getElementById('idle-pulse-ring');
    if (ring) ring.classList.remove('pulsing');
}

/* ═══════════════════════════════════════════
   MOOD BUTTON BOUNCE
═══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.mood-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.remove('bouncing');
            void btn.offsetWidth; // reflow to restart animation
            btn.classList.add('bouncing');
            btn.addEventListener('animationend', () => btn.classList.remove('bouncing'), { once: true });
        });
    });
});

/* ═══════════════════════════════════════════
   MONTH NAVIGATION
═══════════════════════════════════════════ */
let calendarYear  = new Date().getFullYear();
let calendarMonth = new Date().getMonth();

function changeMonth(dir) {
    calendarMonth += dir;
    if (calendarMonth > 11) { calendarMonth = 0;  calendarYear++; }
    if (calendarMonth < 0)  { calendarMonth = 11; calendarYear--; }
    renderCalendar();
}

/* ═══════════════════════════════════════════
   STREAK CALCULATOR
═══════════════════════════════════════════ */
function calculateStreak() {
    const today = new Date();
    let streak  = 0;
    let check   = new Date(today);

    while (true) {
        const key     = check.getFullYear() + '-' +
                        String(check.getMonth() + 1).padStart(2,'0') + '-' +
                        String(check.getDate()).padStart(2,'0');
        const sessions = JSON.parse(localStorage.getItem('session-log') || '[]');
        const hasSession = sessions.some(s => s.date === key);
        if (!hasSession) break;
        streak++;
        check.setDate(check.getDate() - 1);
    }
    return streak;
}

function updateStreakBanner() {
    const banner = document.getElementById('streak-banner');
    if (!banner) return;
    const streak = calculateStreak();
    if (streak >= 2) {
        banner.innerHTML = '<span class="streak-num">' + streak + '</span> day streak 🔥';
        banner.classList.remove('hidden');
    } else if (streak === 1) {
        banner.innerHTML = 'First session today ✦ Keep it going!';
        banner.classList.remove('hidden');
    } else {
        banner.classList.add('hidden');
    }
}

/* ═══════════════════════════════════════════
   SPLASH SCREEN
═══════════════════════════════════════════ */
function initSplash() {
    const splash = document.getElementById('splash');
    if (!splash) return;
    setTimeout(() => {
        splash.classList.add('fade-out');
        // Trigger entrance animation on affirmation card
        const card = document.getElementById('affirmation-card');
        if (card) {
            card.classList.remove('affirm-enter');
            void card.offsetWidth;
            card.classList.add('affirm-enter');
        }
        setTimeout(() => splash.classList.add('gone'), 650);
    }, 1800);
}

/* ═══════════════════════════════════════════
   AFFIRMATION FAVOURITES
═══════════════════════════════════════════ */
let favourites      = JSON.parse(localStorage.getItem('affirm-favs') || '[]');
let affirmMode      = 'all'; // 'all' | 'favs'

function saveFavourites() {
    localStorage.setItem('affirm-favs', JSON.stringify(favourites));
}

function toggleFavourite() {
    const text = document.getElementById('affirmation').innerText;
    const btn  = document.getElementById('bookmark-btn');
    if (favourites.includes(text)) {
        favourites = favourites.filter(f => f !== text);
        btn.innerText = '☆';
        btn.classList.remove('saved');
        showToast('Removed from saved');
    } else {
        favourites.push(text);
        btn.innerText = '★';
        btn.classList.add('saved');
        showToast('Saved ★');
    }
    saveFavourites();
}

function setAffirmFilter(mode, btn) {
    affirmMode = mode;
    document.querySelectorAll('.affirm-filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    if (mode === 'favs' && favourites.length === 0) {
        showToast('No saved affirmations yet');
        affirmMode = 'all';
        document.getElementById('filter-all').classList.add('active');
        btn.classList.remove('active');
    }
}

function updateBookmarkBtn(text) {
    const btn = document.getElementById('bookmark-btn');
    if (!btn) return;
    if (favourites.includes(text)) {
        btn.innerText = '★'; btn.classList.add('saved');
    } else {
        btn.innerText = '☆'; btn.classList.remove('saved');
    }
}

/* ═══════════════════════════════════════════
   AFFIRMATION CARD — swipe gesture
═══════════════════════════════════════════ */
function initAffirmSwipe() {
    const card = document.getElementById('affirmation-card');
    if (!card || card._swipeInit) return;
    card._swipeInit = true;

    let startX = 0, startY = 0, dragging = false;

    card.addEventListener('touchstart', e => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        dragging = true;
    }, { passive: true });

    card.addEventListener('touchmove', e => {
        if (!dragging) return;
        const dx = e.touches[0].clientX - startX;
        const dy = Math.abs(e.touches[0].clientY - startY);
        if (dy > Math.abs(dx)) { dragging = false; return; } // vertical scroll — ignore
        card.style.transition = 'none';
        card.style.transform  = 'translateX(' + dx * 0.3 + 'px) rotate(' + dx * 0.02 + 'deg)';
    }, { passive: true });

    card.addEventListener('touchend', e => {
        if (!dragging) return;
        dragging = false;
        const dx = e.changedTouches[0].clientX - startX;
        card.style.transition = 'transform 0.3s ease';
        card.style.transform  = '';
        if (Math.abs(dx) > 50) newAffirmation();
    });
}

/* ═══════════════════════════════════════════
   SESSION COMPLETE OVERLAY
═══════════════════════════════════════════ */
function showSessionComplete(seconds, audioType) {
    const overlay  = document.getElementById('session-complete-overlay');
    const detail   = document.getElementById('complete-detail');
    const ring     = document.querySelector('.complete-ring-fill');
    const mins     = Math.floor(seconds / 60);
    const aLabels  = { none: 'No audio', rain: '🌧 Rain', windchimes: '🎐 Chimes', breathing: '🌊 Waves' };

    detail.innerText = mins + ' min session · ' + (aLabels[audioType] || '');

    overlay.classList.remove('hidden');
    requestAnimationFrame(() => {
        overlay.classList.add('visible');
        ring.classList.add('animate');
    });

    // Haptic on complete
    if (getSetting('vibration')) triggerVibration();

    // Auto-dismiss after 3s
    setTimeout(() => {
        overlay.classList.remove('visible');
        setTimeout(() => {
            overlay.classList.add('hidden');
            ring.classList.remove('animate');
        }, 400);
    }, 3000);

    // Tap to dismiss early
    overlay.onclick = () => {
        overlay.classList.remove('visible');
        setTimeout(() => {
            overlay.classList.add('hidden');
            ring.classList.remove('animate');
        }, 400);
    };
}

/* ═══════════════════════════════════════════
   MONTHLY SUMMARY
═══════════════════════════════════════════ */
function updateMonthlySummary() {
    const banner   = document.getElementById('monthly-summary');
    if (!banner) return;

    const year     = calendarYear;
    const month    = calendarMonth;
    const prefix   = year + '-' + String(month + 1).padStart(2, '0') + '-';
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Count sessions this month
    const allSessions = JSON.parse(localStorage.getItem('session-log') || '[]');
    const monthSessions = allSessions.filter(s => s.date.startsWith(prefix));

    // Count days with mood logged
    let moodDays = 0;
    for (let d = 1; d <= daysInMonth; d++) {
        const key = prefix + String(d).padStart(2, '0');
        if (getMoodsForDate(key).length > 0) moodDays++;
    }

    if (monthSessions.length === 0 && moodDays === 0) {
        banner.classList.add('hidden');
        return;
    }

    const totalMins = monthSessions.reduce((sum, s) => sum + Math.floor(s.duration / 60), 0);

    banner.classList.remove('hidden');
    banner.innerHTML =
        '<div class="monthly-stat"><span class="monthly-stat-num">' + monthSessions.length + '</span><span class="monthly-stat-label">Sessions</span></div>' +
        '<div class="monthly-divider"></div>' +
        '<div class="monthly-stat"><span class="monthly-stat-num">' + totalMins + '</span><span class="monthly-stat-label">Minutes</span></div>' +
        '<div class="monthly-divider"></div>' +
        '<div class="monthly-stat"><span class="monthly-stat-num">' + moodDays + '</span><span class="monthly-stat-label">Days logged</span></div>';
}

/* ═══════════════════════════════════════════
   LONG PRESS ON CALENDAR DAY
═══════════════════════════════════════════ */
let longPressTimer = null;

function attachLongPress(cell, dateKey) {
    cell.addEventListener('touchstart', () => {
        longPressTimer = setTimeout(() => {
            if ('vibrate' in navigator) navigator.vibrate(40);
            showDayDetail(dateKey);
        }, 500);
    }, { passive: true });

    cell.addEventListener('touchend',   () => clearTimeout(longPressTimer));
    cell.addEventListener('touchmove',  () => clearTimeout(longPressTimer), { passive: true });
}

/* ═══════════════════════════════════════════
   MOOD HAPTIC
═══════════════════════════════════════════ */
function moodHaptic() {
    if ('vibrate' in navigator) navigator.vibrate(18);
}
