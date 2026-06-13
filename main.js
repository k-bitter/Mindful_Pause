/* ═══════════════════════════════════════════
   AFFIRMATION CATEGORIES
═══════════════════════════════════════════ */
const affirmationCategories = {
    general: [
        "Breathe in, breathe out.",
        "You are doing enough.",
        "Peace is within you.",
        "Observe, don't judge.",
        "Stay present.",
        "Kindness starts with me.",
        "I am enough just as I am.",
        "Today is a gift.",
        "Slow down and notice.",
        "My breath is my anchor.",
        "I am choosing to be present.",
        "I trust the process.",
        "One moment at a time.",
    ],
    morning: [
        "Each breath is a new beginning.",
        "Today I choose progress over perfection.",
        "My potential to grow is limitless today.",
        "I am ready for whatever today brings.",
        "Each morning is a fresh start and a chance to begin again.",
        "I am energised and open to what today holds.",
        "I meet this day with clarity and calm.",
        "I am grounded and calm.",
        "I am equipped to handle whatever comes my way.",
    ],
    evening: [
        "Rest is not surrender.",
        "You deserve this quiet.",
        "This moment is yours.",
        "I have done enough today, and that is enough.",
        "I release the need to control every outcome.",
        "My mind is quiet and ready to rest.",
        "I honour my efforts by allowing myself to unwind.",
        "Tomorrow is a new beginning; I let today go gently.",
        "I am proud of the care I gave today.",
        "Quiet the mind, open the heart.",
    ],
    stress: [
        "I release what I cannot control.",
        "This feeling is temporary; I will find my way through.",
        "I breathe deeply and return to this moment.",
        "I only need to take the next step, not see the whole path.",
        "My worth is not measured by how much I produce.",
        "I choose to respond with calm, not react with fear.",
        "I am steady and capable, even in uncertain moments.",
        "I am grounded and calm.",
        "I do not need to carry everything at once.",
    ],
    energy: [
        "I am worthy of peace.",
        "I have the endurance to sustain what matters to me.",
        "My motivation grows with every small action I take.",
        "I am fuelled by what truly matters to me.",
        "I have the focus to move through difficult moments.",
        "Every small step builds toward something meaningful.",
        "I am fully present in what I am creating.",
        "My commitment to myself carries me forward.",
        "I possess a quiet strength that grows each day.",
    ]
};

const affirmations = Object.values(affirmationCategories).flat();

/* ═══════════════════════════════════════════
   MOOD CONFIG
═══════════════════════════════════════════ */
const MOODS = {
    Joyful:    { icon: '✨', label: 'Joyful'    },
    Grateful:  { icon: '🌸', label: 'Grateful'  },
    Energised: { icon: '💫', label: 'Energised' },
    Balanced:  { icon: '☀️', label: 'Balanced'  },
    Calm:      { icon: '🌿', label: 'Calm'      },
    Tired:     { icon: '🌙', label: 'Tired'     },
    Anxious:   { icon: '😰', label: 'Anxious'   },
    Stressed:  { icon: '🌩️', label: 'Stressed'  },
};

/* ═══════════════════════════════════════════
   SETTINGS
═══════════════════════════════════════════ */
const DEFAULTS = { theme:'auto', sound:false, vibration:false, reminder:false, reminderTime:'08:00' };

function getSetting(key) {
    const raw = localStorage.getItem('setting-' + key);
    if (raw === null)    return DEFAULTS[key];
    if (raw === 'true')  return true;
    if (raw === 'false') return false;
    return raw;
}
function saveSetting(key, value) { localStorage.setItem('setting-' + key, value); }

function loadSettings() {
    ['sound','vibration','reminder'].forEach(k => {
        const el = document.getElementById('setting-' + k);
        if (el) el.checked = getSetting(k);
    });
    const rt  = document.getElementById('reminder-time');
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
    else { const h = new Date().getHours(); document.body.classList.toggle('evening', h >= 18 || h < 7); }
}
function setTheme(value) {
    saveSetting('theme', value); setThemeChip(value); applyTheme();
    clearInterval(themeInterval);
    themeInterval = value === 'auto' ? setInterval(applyTheme, 60000) : null;
}
function setThemeChip(value) {
    ['day','auto','evening'].forEach(v => {
        const el = document.getElementById('theme-' + v + '-btn');
        if (el) el.classList.toggle('active', v === value);
    });
}

/* ═══════════════════════════════════════════
   AFFIRMATIONS — category & filter
═══════════════════════════════════════════ */
let currentCategory    = 'all';
let favourites         = JSON.parse(localStorage.getItem('affirm-favs') || '[]');
let lastAffirmText     = '';
let autoAdvanceTimer   = null;
let autoAdvanceActive  = false;

function saveFavourites() { localStorage.setItem('affirm-favs', JSON.stringify(favourites)); }

function getPool() {
    if (currentCategory === 'saved') return favourites.length ? favourites : affirmations;
    if (currentCategory === 'all')   return affirmations;
    return affirmationCategories[currentCategory] || affirmations;
}

function setCategory(cat, btn) {
    currentCategory = cat;
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    if (cat === 'saved' && favourites.length === 0) {
        showToast('No saved affirmations yet'); currentCategory = 'all';
        document.querySelector('[data-cat="all"]').classList.add('active');
        return;
    }
    newAffirmation();
}

function newAffirmation() {
    const pool = getPool();
    let text;
    let tries = 0;
    do { text = pool[Math.floor(Math.random() * pool.length)]; tries++; }
    while (text === lastAffirmText && pool.length > 1 && tries < 10);
    lastAffirmText = text;

    const card = document.getElementById('affirmation-card');
    card.classList.add('flipping');
    setTimeout(() => {
        setAffirmText(text);
    }, 300);
    setTimeout(() => card.classList.remove('flipping'), 620);
}

function setAffirmText(text) {
    const el = document.getElementById('affirmation');
    if (!el) return;
    el.innerText = text;
    // Dynamic sizing
    const len = text.length;
    el.style.fontSize = len < 25 ? '1.9rem' : len < 45 ? '1.6rem' : len < 70 ? '1.35rem' : '1.15rem';
    updateBookmarkBtn(text);
}

/* ═══════════════════════════════════════════
   AFFIRMATIONS — today's featured
═══════════════════════════════════════════ */
function setTodaysAffirmation() {
    const dayIndex = Math.floor(Date.now() / 86400000);
    const pool     = affirmationCategories.general;
    const text     = pool[dayIndex % pool.length];
    const el       = document.getElementById('today-affirmation');
    if (el) el.innerText = text;
}

/* ═══════════════════════════════════════════
   AFFIRMATIONS — bookmark
═══════════════════════════════════════════ */
function toggleFavourite() {
    const text = document.getElementById('affirmation').innerText;
    const btn  = document.getElementById('bookmark-btn');
    if (favourites.includes(text)) {
        favourites = favourites.filter(f => f !== text);
        btn.innerText = '☆'; btn.classList.remove('saved');
        showToast('Removed from saved');
    } else {
        favourites.push(text);
        btn.innerText = '★'; btn.classList.add('saved');
        showToast('Saved ★');
    }
    saveFavourites();
}
function updateBookmarkBtn(text) {
    const btn = document.getElementById('bookmark-btn');
    if (!btn) return;
    const saved = favourites.includes(text);
    btn.innerText = saved ? '★' : '☆';
    btn.classList.toggle('saved', saved);
}

/* ═══════════════════════════════════════════
   AFFIRMATIONS — auto-advance
═══════════════════════════════════════════ */
function toggleAutoAdvance() {
    autoAdvanceActive = !autoAdvanceActive;
    const btn  = document.getElementById('auto-btn');
    const icon = document.getElementById('auto-icon');
    if (autoAdvanceActive) {
        btn.classList.add('active');
        icon.innerText = '⏸';
        autoAdvanceTimer = setInterval(newAffirmation, 30000);
        showToast('Auto-advance on · 30s');
    } else {
        btn.classList.remove('active');
        icon.innerText = '▷';
        clearInterval(autoAdvanceTimer);
        showToast('Auto-advance off');
    }
}

/* ═══════════════════════════════════════════
   AFFIRMATIONS — share
═══════════════════════════════════════════ */
function shareAffirmation() {
    const text     = document.getElementById('affirmation').innerText;
    const isEvening = document.body.classList.contains('evening');
    const canvas   = document.createElement('canvas');
    canvas.width   = 1080; canvas.height = 1080;
    const ctx      = canvas.getContext('2d');

    // Background
    ctx.fillStyle  = isEvening ? '#180C0C' : '#F5E6E0';
    ctx.fillRect(0, 0, 1080, 1080);

    // Accent bar top
    ctx.fillStyle  = isEvening ? '#C4433A' : '#B85C6E';
    ctx.fillRect(0, 0, 1080, 8);

    // Quote mark
    ctx.font       = 'italic 300 160px Georgia, serif';
    ctx.fillStyle  = isEvening ? 'rgba(196,67,58,0.25)' : 'rgba(184,92,110,0.2)';
    ctx.textAlign  = 'center';
    ctx.fillText('"', 540, 380);

    // Affirmation text
    ctx.fillStyle  = isEvening ? '#F5E0D8' : '#2A1418';
    const fontSize = text.length < 40 ? 72 : text.length < 70 ? 58 : 46;
    ctx.font       = `italic 300 ${fontSize}px Georgia, serif`;
    wrapCanvasText(ctx, text, 540, 480, 860, fontSize * 1.4);

    // Branding
    ctx.font       = '300 28px Georgia, serif';
    ctx.fillStyle  = isEvening ? '#C4433A' : '#B85C6E';
    ctx.fillText('Mindful Pause · by Liana', 540, 980);

    canvas.toBlob(blob => {
        if (navigator.share && blob) {
            const file = new File([blob], 'affirmation.png', { type: 'image/png' });
            navigator.share({ title: 'Mindful Pause', files: [file] })
                .catch(() => downloadCanvas(canvas));
        } else {
            downloadCanvas(canvas);
        }
    }, 'image/png');
}

function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let cy   = y;
    words.forEach((word, i) => {
        const test = line + word + ' ';
        if (ctx.measureText(test).width > maxWidth && i > 0) {
            ctx.fillText(line.trim(), x, cy);
            line = word + ' '; cy += lineHeight;
        } else { line = test; }
    });
    ctx.fillText(line.trim(), x, cy);
}

function downloadCanvas(canvas) {
    const a   = document.createElement('a');
    a.href    = canvas.toDataURL('image/png');
    a.download = 'affirmation.png';
    a.click();
}

/* ═══════════════════════════════════════════
   AFFIRMATION CARD — swipe
═══════════════════════════════════════════ */
function initAffirmSwipe() {
    const card = document.getElementById('affirmation-card');
    if (!card || card._swipeInit) return;
    card._swipeInit = true;
    let startX = 0, startY = 0, dragging = false;
    card.addEventListener('touchstart', e => { startX = e.touches[0].clientX; startY = e.touches[0].clientY; dragging = true; }, { passive: true });
    card.addEventListener('touchmove',  e => {
        if (!dragging) return;
        const dx = e.touches[0].clientX - startX;
        const dy = Math.abs(e.touches[0].clientY - startY);
        if (dy > Math.abs(dx)) { dragging = false; return; }
        card.style.transition = 'none';
        card.style.transform  = 'translateX(' + dx * 0.3 + 'px) rotate(' + dx * 0.02 + 'deg)';
    }, { passive: true });
    card.addEventListener('touchend', e => {
        if (!dragging) return; dragging = false;
        const dx = e.changedTouches[0].clientX - startX;
        card.style.transition = 'transform 0.3s ease';
        card.style.transform  = '';
        if (Math.abs(dx) > 50) newAffirmation();
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
    if (value === 'custom') { document.getElementById('custom-duration-row').classList.remove('hidden'); selectedDuration = null; return; }
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
    const btn = document.querySelector('[data-value="custom"]');
    if (btn) btn.innerText = mins + ' min';
    document.getElementById('audio-section').classList.remove('hidden');
    checkCanStart();
}
function pickAudio(value, btn) {
    selectedAudio = value;
    document.querySelectorAll('[data-audio]').forEach(b => b.classList.remove('option-active'));
    btn.classList.add('option-active');
    const hint = document.getElementById('headphones-hint');
    if (hint) hint.classList.toggle('hidden', value !== 'audio8d');
    checkCanStart();
}
function checkCanStart() {
    if (selectedDuration !== null && selectedAudio !== null)
        document.getElementById('start-btn').classList.remove('hidden');
}
function startSession() {
    stopIdlePulse();
    document.getElementById('session-setup').classList.add('hidden');
    document.getElementById('session-running').classList.remove('hidden');
    const labels = { none:'', rain:'🌧 Rain', windchimes:'🎐 Chimes', waves:'🌊 Waves',
        bowl:'🎵 Bowl', forest:'🌲 Forest', brownnoise:'🌫 Brown Noise',
        ocean:'🐚 Ocean', thunder:'⛈ Thunder', gentlewind:'🍃 Gentle Wind', audio8d:'🎧 8D Audio' };
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
    const cb = document.querySelector('[data-value="custom"]');
    if (cb) cb.innerText = 'Custom';
    const mi = document.getElementById('custom-minutes');
    if (mi) mi.value = '';
    selectedDuration = null; selectedAudio = null;
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
    startTimerGlow();
    timerInterval = setInterval(() => {
        timeLeft--;
        const mins = Math.floor(timeLeft / 60);
        const secs = (timeLeft % 60).toString().padStart(2, '0');
        document.getElementById('timer-display').innerText = mins + ':' + secs;
        circle.style.strokeDashoffset = CIRCUMFERENCE - ((seconds - timeLeft) / seconds) * CIRCUMFERENCE;
        if (timeLeft <= 0) { clearInterval(timerInterval); stopAmbient(); onSessionComplete(seconds, audioType); }
    }, 1000);
}
function stopTimer() {
    clearInterval(timerInterval); stopAmbient(); stopTimerGlow();
    document.getElementById('progress-circle').style.strokeDashoffset = CIRCUMFERENCE;
    document.getElementById('timer-display').innerText = '00:00';
    resetSessionSetup();
}
function onSessionComplete(seconds, audioType) {
    const count = parseInt(localStorage.getItem('sessions') || '0') + 1;
    localStorage.setItem('sessions', count);
    document.getElementById('session-count').innerText = count;
    logSession(seconds, audioType); stopTimerGlow(); playCompletePulse();
    showSessionComplete(seconds, audioType);
    if (getSetting('sound'))     playChime();
    if (getSetting('vibration')) triggerVibration();
    resetSessionSetup();
}
function logSession(seconds, audioType) {
    const now = new Date();
    const log = JSON.parse(localStorage.getItem('session-log') || '[]');
    log.push({ date: now.toISOString().slice(0,10), time: now.toLocaleTimeString('default',{hour:'2-digit',minute:'2-digit'}), duration: seconds, audio: audioType || 'none', ts: Date.now() });
    localStorage.setItem('session-log', JSON.stringify(log));
}

/* ═══════════════════════════════════════════
   SESSION COMPLETE OVERLAY
═══════════════════════════════════════════ */
function showSessionComplete(seconds, audioType) {
    const overlay = document.getElementById('session-complete-overlay');
    const detail  = document.getElementById('complete-detail');
    const ring    = document.querySelector('.complete-ring-fill');
    const mins    = Math.floor(seconds / 60);
    const aLabels = { none:'No audio', rain:'🌧 Rain', windchimes:'🎐 Chimes', waves:'🌊 Waves',
        bowl:'🎵 Bowl', forest:'🌲 Forest', brownnoise:'🌫 Brown Noise',
        ocean:'🐚 Ocean', thunder:'⛈ Thunder', gentlewind:'🍃 Gentle Wind', audio8d:'🎧 8D Audio' };
    detail.innerText = mins + ' min session · ' + (aLabels[audioType] || '');
    overlay.classList.remove('hidden');
    requestAnimationFrame(() => { overlay.classList.add('visible'); ring.classList.add('animate'); });
    const dismiss = () => { overlay.classList.remove('visible'); setTimeout(() => { overlay.classList.add('hidden'); ring.classList.remove('animate'); }, 400); };
    setTimeout(dismiss, 3000);
    overlay.onclick = dismiss;
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
            gain.gain.setValueAtTime(0, t); gain.gain.linearRampToValueAtTime(0.18, t + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 1.1);
            osc.start(t); osc.stop(t + 1.2);
        });
    } catch(e) {}
}

/* ═══════════════════════════════════════════
   AMBIENT SOUND ENGINE
═══════════════════════════════════════════ */
let ambientCtx       = null;
let ambientSource    = null;
let ambientLfo       = null;
let windchimeTimeout = null;
let forestTimeout    = null;
let fireplaceTimeout = null;
let bowlTimeout      = null;

function startAmbient(type) {
    stopAmbient();
    try {
        ambientCtx = new (window.AudioContext || window.webkitAudioContext)();
        const fns  = { rain: startRain, windchimes: startWindchimes, waves: startWaves,
                       bowl: startBowl, forest: startForest, brownnoise: startBrownNoise,
                       ocean: startOcean, thunder: startThunder, gentlewind: startGentleWind, audio8d: start8D };
        if (fns[type]) fns[type](ambientCtx);
    } catch(e) {}
}
function stopAmbient() {
    [windchimeTimeout, forestTimeout, fireplaceTimeout, bowlTimeout].forEach(t => clearTimeout(t));
    windchimeTimeout = forestTimeout = fireplaceTimeout = bowlTimeout = null;
    try { if (ambientSource) { ambientSource.stop(); ambientSource = null; } } catch(e) {}
    try { if (ambientLfo)    { ambientLfo.stop();    ambientLfo    = null; } } catch(e) {}
    try { if (ambientCtx)    { ambientCtx.close();   ambientCtx    = null; } } catch(e) {}
}

/* Helper: noise buffer */
function makeNoise(ctx, seconds) {
    const buf  = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src  = ctx.createBufferSource();
    src.buffer = buf; src.loop = true; return src;
}

/* Rain */
function startRain(ctx) {
    const src = makeNoise(ctx, 2);
    const flt = ctx.createBiquadFilter(); flt.type = 'bandpass'; flt.frequency.value = 1200; flt.Q.value = 0.5;
    const gain = ctx.createGain(); gain.gain.value = 0.07;
    src.connect(flt); flt.connect(gain); gain.connect(ctx.destination);
    src.start(); ambientSource = src;
}

/* Wind chimes — spatially panned */
function startWindchimes(ctx) {
    // Slowly rotating panner — chimes drift left to right
    const panner = ctx.createStereoPanner();
    panner.connect(ctx.destination);
    const lfo  = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 1/16;
    const lfoG = ctx.createGain(); lfoG.gain.value = 0.9;
    lfo.connect(lfoG); lfoG.connect(panner.pan);
    lfo.start(); ambientLfo = lfo;

    function schedule() {
        windchimeTimeout = setTimeout(() => {
            if (!ambientCtx) return;
            const freqs = [1047,1175,1319,1480,1568,1760,1976];
            const count = Math.random() > 0.55 ? 2 : 1;
            for (let n = 0; n < count; n++) {
                const osc = ctx.createOscillator(), gain = ctx.createGain();
                osc.connect(gain); gain.connect(panner);
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

/* Waves */
function startWaves(ctx) {
    const src = makeNoise(ctx, 2);
    const flt = ctx.createBiquadFilter(); flt.type = 'lowpass'; flt.frequency.value = 600;
    const main = ctx.createGain(); main.gain.value = 0.04;
    const lfo  = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 1/8;
    const lfoG = ctx.createGain(); lfoG.gain.value = 0.04;
    src.connect(flt); flt.connect(main); lfo.connect(lfoG); lfoG.connect(main.gain);
    main.connect(ctx.destination); src.start(); lfo.start();
    ambientSource = src; ambientLfo = lfo;
}

/* Tibetan Bowl — spatially rotating */
function startBowl(ctx) {
    const panner = ctx.createStereoPanner();
    const gain   = ctx.createGain();
    panner.connect(gain); gain.connect(ctx.destination);
    gain.gain.value = 0.2;
    // Slow rotation LFO — one cycle every ~12s, feels like the bowl is moving around you
    const lfo  = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 1/12;
    const lfoG = ctx.createGain(); lfoG.gain.value = 0.8;
    lfo.connect(lfoG); lfoG.connect(panner.pan);
    lfo.start(); ambientLfo = lfo;

    function strike() {
        if (!ambientCtx) return;
        const freqs = [196, 220, 261.6, 293.7];
        const freq  = freqs[Math.floor(Math.random() * freqs.length)];
        const osc   = ctx.createOscillator();
        osc.connect(panner);
        osc.type = 'sine'; osc.frequency.value = freq;
        const t = ctx.currentTime;
        const g = ctx.createGain();
        osc.connect(g); g.connect(panner);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.25, t + 0.04);
        g.gain.exponentialRampToValueAtTime(0.001, t + 5.5);
        osc.start(t); osc.stop(t + 5.7);
        // Add subtle harmonic
        const osc2 = ctx.createOscillator(), g2 = ctx.createGain();
        osc2.connect(g2); g2.connect(panner);
        osc2.type = 'sine'; osc2.frequency.value = freq * 2.76;
        g2.gain.setValueAtTime(0, t);
        g2.gain.linearRampToValueAtTime(0.07, t + 0.04);
        g2.gain.exponentialRampToValueAtTime(0.001, t + 3.5);
        osc2.start(t); osc2.stop(t + 3.7);
        bowlTimeout = setTimeout(strike, 7000 + Math.random() * 4000);
    }
    strike();
}

/* Forest */
function startForest(ctx) {
    // Background wind
    const src = makeNoise(ctx, 2);
    const flt = ctx.createBiquadFilter(); flt.type = 'bandpass'; flt.frequency.value = 800; flt.Q.value = 1;
    const gain = ctx.createGain(); gain.gain.value = 0.03;
    src.connect(flt); flt.connect(gain); gain.connect(ctx.destination);
    src.start(); ambientSource = src;
    // Bird chirps
    function chirp() {
        if (!ambientCtx) return;
        const chirpFreqs = [2400, 2800, 3200, 3600];
        const freq = chirpFreqs[Math.floor(Math.random() * chirpFreqs.length)];
        const osc  = ctx.createOscillator(), g = ctx.createGain();
        osc.connect(g); g.connect(ctx.destination);
        osc.type = 'sine'; osc.frequency.setValueAtTime(freq, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.3, ctx.currentTime + 0.08);
        const t = ctx.currentTime;
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.06, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.start(t); osc.stop(t + 0.35);
        forestTimeout = setTimeout(chirp, 1500 + Math.random() * 4000);
    }
    chirp();
}

/* Brown Noise */
function startBrownNoise(ctx) {
    // Brown noise = integrate white noise
    const bufLen = ctx.sampleRate * 2;
    const buf    = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data   = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < bufLen; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (last + 0.02 * white) / 1.02;
        last    = data[i];
        data[i] *= 3.5;
    }
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const gain = ctx.createGain(); gain.gain.value = 0.4;
    src.connect(gain); gain.connect(ctx.destination);
    src.start(); ambientSource = src;
}

/* Deep Ocean */
function startOcean(ctx) {
    const src = makeNoise(ctx, 4);
    const flt = ctx.createBiquadFilter(); flt.type = 'lowpass'; flt.frequency.value = 350;
    const main = ctx.createGain(); main.gain.value = 0.05;
    // Slower LFO for deep wave rhythm
    const lfo  = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 1/14;
    const lfoG = ctx.createGain(); lfoG.gain.value = 0.05;
    src.connect(flt); flt.connect(main); lfo.connect(lfoG); lfoG.connect(main.gain);
    main.connect(ctx.destination); src.start(); lfo.start();
    ambientSource = src; ambientLfo = lfo;
}

/* Thunder */
function startThunder(ctx) {
    // Deep rolling rumble base
    const src = makeNoise(ctx, 4);
    const flt = ctx.createBiquadFilter(); flt.type = 'lowpass'; flt.frequency.value = 180;
    const main = ctx.createGain(); main.gain.value = 0.0;
    src.connect(flt); flt.connect(main); main.connect(ctx.destination);
    src.start(); ambientSource = src;
    // Slow LFO for rolling thunder swell
    const lfo  = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 1/12;
    const lfoG = ctx.createGain(); lfoG.gain.value = 0.12;
    lfo.connect(lfoG); lfoG.connect(main.gain);
    main.gain.setValueAtTime(0.08, ctx.currentTime);
    lfo.start(); ambientLfo = lfo;
    // Distant rain layer
    const rain = makeNoise(ctx, 2);
    const rflt = ctx.createBiquadFilter(); rflt.type = 'bandpass'; rflt.frequency.value = 1000; rflt.Q.value = 0.4;
    const rgain = ctx.createGain(); rgain.gain.value = 0.04;
    rain.connect(rflt); rflt.connect(rgain); rgain.connect(ctx.destination);
    rain.start();
}

/* Gentle Wind */
function startGentleWind(ctx) {
    const src = makeNoise(ctx, 3);
    const flt = ctx.createBiquadFilter(); flt.type = 'bandpass'; flt.frequency.value = 600; flt.Q.value = 0.3;
    const main = ctx.createGain(); main.gain.value = 0.05;
    // Very slow LFO — wind gusting gently
    const lfo  = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 1/18;
    const lfoG = ctx.createGain(); lfoG.gain.value = 0.04;
    // Second LFO for subtle pitch movement
    const lfo2  = ctx.createOscillator(); lfo2.type = 'sine'; lfo2.frequency.value = 1/7;
    const lfo2G = ctx.createGain(); lfo2G.gain.value = 80;
    lfo2.connect(lfo2G); lfo2G.connect(flt.frequency);
    src.connect(flt); flt.connect(main);
    lfo.connect(lfoG); lfoG.connect(main.gain);
    main.connect(ctx.destination);
    src.start(); lfo.start(); lfo2.start();
    ambientSource = src; ambientLfo = lfo;
}

/* 8D Audio — rotating spatial tone */
function start8D(ctx) {
    const osc   = ctx.createOscillator();
    const panner = ctx.createStereoPanner();
    const gain  = ctx.createGain();
    osc.connect(panner); panner.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine'; osc.frequency.value = 396;
    gain.gain.value = 0.1;
    // LFO to rotate pan -1 to +1
    const lfo  = ctx.createOscillator();
    lfo.type   = 'sine'; lfo.frequency.value = 0.12; // one rotation ~8s
    const lfoG = ctx.createGain(); lfoG.gain.value = 1;
    lfo.connect(lfoG); lfoG.connect(panner.pan);
    osc.start(); lfo.start();
    ambientSource = osc; ambientLfo = lfo;
}

/* ═══════════════════════════════════════════
   VIBRATION
═══════════════════════════════════════════ */
function triggerVibration() { if ('vibrate' in navigator) navigator.vibrate([200,100,200]); }
function moodHaptic()       { if ('vibrate' in navigator) navigator.vibrate(18); }

/* ═══════════════════════════════════════════
   DAILY REMINDER
═══════════════════════════════════════════ */
function toggleReminder(enabled) {
    saveSetting('reminder', enabled);
    document.getElementById('reminder-time-row').classList.toggle('hidden', !enabled);
    if (enabled) requestNotificationPermission();
}
function saveReminderTime(value) { saveSetting('reminderTime', value); showToast('Reminder set for ' + value); scheduleReminder(value); }
function requestNotificationPermission() {
    if (!('Notification' in window)) { showToast('Notifications not supported'); return; }
    if (Notification.permission === 'granted') { showToast('Reminder enabled'); scheduleReminder(getSetting('reminderTime')); }
    else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(p => {
            if (p === 'granted') { showToast('Reminder enabled'); scheduleReminder(getSetting('reminderTime')); }
            else { showToast('Permission denied'); saveSetting('reminder', false); document.getElementById('setting-reminder').checked = false; }
        });
    } else { showToast('Notifications blocked in browser'); }
}
function scheduleReminder(timeStr) {
    if (!getSetting('reminder')) return;
    const [h,m] = timeStr.split(':').map(Number);
    const now = new Date(), next = new Date();
    next.setHours(h,m,0,0);
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
    if (id === 'sessions-view') startIdlePulse(); else stopIdlePulse();
    triggerPageEnter(id);
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
let calendarYear  = new Date().getFullYear();
let calendarMonth = new Date().getMonth();

function getMoodsForDate(dateKey) { try { return JSON.parse(localStorage.getItem('mood-' + dateKey) || '[]'); } catch { return []; } }
function saveMoodsForDate(dateKey, moods) { localStorage.setItem('mood-' + dateKey, JSON.stringify(moods)); }

function selectDate(dateKey) {
    selectedDate = dateKey;
    updateMoodButtons(dateKey); renderCalendar();
    const today = new Date().toISOString().slice(0, 10);
    const hint  = document.getElementById('mood-hint');
    if (!hint) return;
    if (dateKey === today) { hint.innerText = 'Tap to toggle — select all that apply today'; hint.classList.remove('editing-past'); }
    else {
        const d = new Date(dateKey + 'T12:00:00');
        hint.innerText = 'Editing ' + d.toLocaleDateString('default',{weekday:'long',month:'long',day:'numeric'});
        hint.classList.add('editing-past');
    }
}
function toggleMood(mood) {
    moodHaptic();
    let moods = getMoodsForDate(selectedDate);
    if (moods.includes(mood)) { moods = moods.filter(m => m !== mood); showToast(MOODS[mood].icon + '  ' + mood + ' removed'); }
    else { moods.push(mood); showToast(MOODS[mood].icon + '  ' + mood + ' saved'); }
    saveMoodsForDate(selectedDate, moods); updateMoodButtons(selectedDate); renderCalendar();
}
function updateMoodButtons(dateKey) {
    const moods = getMoodsForDate(dateKey);
    document.querySelectorAll('.mood-btn').forEach(btn => btn.classList.toggle('mood-active', moods.includes(btn.dataset.mood)));
}

function changeMonth(dir) {
    calendarMonth += dir;
    if (calendarMonth > 11) { calendarMonth = 0; calendarYear++; }
    if (calendarMonth < 0)  { calendarMonth = 11; calendarYear--; }
    renderCalendar();
}

function calculateStreak() {
    let streak = 0, check = new Date();
    while (true) {
        const key = check.getFullYear() + '-' + String(check.getMonth()+1).padStart(2,'0') + '-' + String(check.getDate()).padStart(2,'0');
        const sessions = JSON.parse(localStorage.getItem('session-log') || '[]');
        if (!sessions.some(s => s.date === key)) break;
        streak++; check.setDate(check.getDate() - 1);
    }
    return streak;
}
function updateStreakBanner() {
    const banner = document.getElementById('streak-banner');
    if (!banner) return;
    const streak = calculateStreak();
    if (streak >= 2)    { banner.innerHTML = '<span class="streak-num">' + streak + '</span> day streak 🔥'; banner.classList.remove('hidden'); }
    else if (streak===1){ banner.innerHTML = 'First session today ✦ Keep it going!'; banner.classList.remove('hidden'); }
    else                  banner.classList.add('hidden');
}
function updateMonthlySummary() {
    const banner = document.getElementById('monthly-summary');
    if (!banner) return;
    const year = calendarYear, month = calendarMonth;
    const prefix = year + '-' + String(month+1).padStart(2,'0') + '-';
    const daysInMonth = new Date(year, month+1, 0).getDate();
    const allSessions = JSON.parse(localStorage.getItem('session-log') || '[]');
    const monthSessions = allSessions.filter(s => s.date.startsWith(prefix));
    let moodDays = 0;
    for (let d = 1; d <= daysInMonth; d++) { if (getMoodsForDate(prefix + String(d).padStart(2,'0')).length > 0) moodDays++; }
    if (monthSessions.length === 0 && moodDays === 0) { banner.classList.add('hidden'); return; }
    const totalMins = monthSessions.reduce((s,x) => s + Math.floor(x.duration/60), 0);
    banner.classList.remove('hidden');
    banner.innerHTML = '<div class="monthly-stat"><span class="monthly-stat-num">' + monthSessions.length + '</span><span class="monthly-stat-label">Sessions</span></div>' +
        '<div class="monthly-divider"></div><div class="monthly-stat"><span class="monthly-stat-num">' + totalMins + '</span><span class="monthly-stat-label">Minutes</span></div>' +
        '<div class="monthly-divider"></div><div class="monthly-stat"><span class="monthly-stat-num">' + moodDays + '</span><span class="monthly-stat-label">Days logged</span></div>';
}
function updateEmptyState(year, month) {
    const prefix = year + '-' + String(month+1).padStart(2,'0') + '-';
    const daysInMonth = new Date(year, month+1, 0).getDate();
    const sessions = JSON.parse(localStorage.getItem('session-log') || '[]');
    const hasSessions = sessions.some(s => s.date.startsWith(prefix));
    let hasMoods = false;
    for (let d = 1; d <= daysInMonth; d++) { if (getMoodsForDate(prefix + String(d).padStart(2,'0')).length > 0) { hasMoods = true; break; } }
    const isEmpty = !hasSessions && !hasMoods;
    const grid    = document.getElementById('calendar-grid');
    const emptyEl = document.getElementById('calendar-empty');
    if (grid)    grid.classList.toggle('hidden', isEmpty);
    if (emptyEl) emptyEl.classList.toggle('hidden', !isEmpty);
}

let longPressTimer = null;
function attachLongPress(cell, dateKey) {
    cell.addEventListener('touchstart', () => { longPressTimer = setTimeout(() => { if ('vibrate' in navigator) navigator.vibrate(40); showDayDetail(dateKey); }, 500); }, { passive: true });
    cell.addEventListener('touchend',  () => clearTimeout(longPressTimer));
    cell.addEventListener('touchmove', () => clearTimeout(longPressTimer), { passive: true });
}

function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    grid.innerHTML = '';
    const now = new Date(), todayFull = now.toISOString().slice(0,10);
    const year = calendarYear, month = calendarMonth;
    const isThisMonth = (year === now.getFullYear() && month === now.getMonth());
    const today = isThisMonth ? now.getDate() : -1;
    const label = document.getElementById('calendar-label');
    if (label) label.innerText = new Date(year, month, 1).toLocaleString('default',{month:'long',year:'numeric'});
    updateStreakBanner(); updateMonthlySummary(); updateEmptyState(year, month);
    ['S','M','T','W','T','F','S'].forEach(d => { const h = document.createElement('div'); h.className='day-header'; h.innerText=d; grid.appendChild(h); });
    const firstDow = new Date(year, month, 1).getDay();
    for (let i = 0; i < firstDow; i++) { const b = document.createElement('div'); b.className='day day-blank'; grid.appendChild(b); }
    const daysInMonth = new Date(year, month+1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
        const cell = document.createElement('div');
        const dateKey = year + '-' + String(month+1).padStart(2,'0') + '-' + String(d).padStart(2,'0');
        const moods   = getMoodsForDate(dateKey);
        let cls = 'day';
        if (d === today)                                      cls += ' day-today';
        if (dateKey === selectedDate && dateKey !== todayFull) cls += ' day-selected';
        cell.className = cls; cell.style.cursor = 'pointer';
        cell.innerHTML = '<span class="day-num">' + d + '</span>' +
            (moods.length ? '<span class="day-moods">' + moods.map(m => '<span class="mood-dot">' + (MOODS[m]?.icon||'') + '</span>').join('') + '</span>' : '');
        cell.addEventListener('click', () => {
            const now = Date.now();
            if (lastTapDate === dateKey && now - lastTapTime < 400) { lastTapDate = null; showDayDetail(dateKey); }
            else { lastTapDate = dateKey; lastTapTime = now; selectDate(dateKey); }
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
    const d = new Date(dateKey + 'T12:00:00');
    document.getElementById('sheet-date').innerText = d.toLocaleDateString('default',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
    const moods   = getMoodsForDate(dateKey);
    const moodsEl = document.getElementById('sheet-moods');
    moodsEl.innerHTML = '<p class="sheet-section-label">Mood</p>' +
        (moods.length ? '<div class="sheet-mood-chips">' + moods.map(m => '<span class="sheet-mood-chip">' + (MOODS[m]?.icon||'') + ' ' + (MOODS[m]?.label||m) + '</span>').join('') + '</div>'
                      : '<p class="sheet-empty">No mood logged</p>');
    const allSessions = JSON.parse(localStorage.getItem('session-log') || '[]');
    const daySessions = allSessions.filter(s => s.date === dateKey);
    const sessEl      = document.getElementById('sheet-sessions');
    const aLabels = { none:'—', rain:'🌧 Rain', windchimes:'🎐 Chimes', waves:'🌊 Waves',
        bowl:'🎵 Bowl', forest:'🌲 Forest', brownnoise:'🌫 Brown Noise',
        ocean:'🐚 Ocean', hz432:'🎶 432hz', fireplace:'🔥 Fireplace', audio8d:'🎧 8D' };
    sessEl.innerHTML = '<p class="sheet-section-label">Sessions</p>' +
        (daySessions.length ? daySessions.map(s => {
            const mins = Math.floor(s.duration/60), secs = s.duration%60;
            return '<div class="sheet-session-row"><span class="sheet-session-time">' + s.time + '</span><span class="sheet-session-dur">' + (secs>0?mins+'m '+secs+'s':mins+' min') + '</span><span class="sheet-session-audio">' + (aLabels[s.audio]||'—') + '</span></div>';
        }).join('') : '<p class="sheet-empty">No sessions logged</p>');
    overlay.style.display = 'flex';
    requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('sheet-visible')));
}
function closeDayDetail() {
    const overlay = document.getElementById('day-detail-overlay');
    overlay.classList.remove('sheet-visible');
    setTimeout(() => { overlay.style.display = 'none'; }, 300);
}

/* ═══════════════════════════════════════════
   CLEAR DATA
═══════════════════════════════════════════ */
let clearPending      = false;
let clearPendingTimer = null;
function confirmClearData() {
    if (clearPending) { clearPending = false; clearTimeout(clearPendingTimer); clearData(); return; }
    clearPending = true;
    showToast('Tap Clear again to confirm');
    clearPendingTimer = setTimeout(() => { clearPending = false; }, 3000);
}
function clearData() {
    localStorage.clear(); document.getElementById('session-count').innerText = 0;
    selectedDate = new Date().toISOString().slice(0,10);
    updateMoodButtons(selectedDate); renderCalendar(); loadSettings(); showToast('Data cleared');
}

/* ═══════════════════════════════════════════
   POLISH — idle pulse, glow, page fade
═══════════════════════════════════════════ */
function startIdlePulse() { document.getElementById('idle-pulse-ring')?.classList.add('pulsing'); }
function stopIdlePulse()  { document.getElementById('idle-pulse-ring')?.classList.remove('pulsing'); }
function startTimerGlow() { document.getElementById('progress-circle')?.classList.add('glowing'); }
function stopTimerGlow()  { document.getElementById('progress-circle')?.classList.remove('glowing'); }
function playCompletePulse() {
    const circle = document.getElementById('progress-circle');
    if (!circle) return;
    circle.classList.add('complete-pulse');
    circle.addEventListener('animationend', () => circle.classList.remove('complete-pulse'), { once:true });
}
function triggerPageEnter(id) {
    const page = document.getElementById(id);
    if (!page) return;
    page.classList.remove('page-enter'); void page.offsetWidth;
    page.classList.add('page-enter');
    page.addEventListener('animationend', () => page.classList.remove('page-enter'), { once:true });
}

/* ═══════════════════════════════════════════
   GREETING
═══════════════════════════════════════════ */
function updateGreeting() {
    const el = document.getElementById('affirm-greeting');
    if (!el) return;
    const h = new Date().getHours();
    el.innerText = h >= 5 && h < 12 ? 'good morning' : h >= 12 && h < 17 ? 'good afternoon' : h >= 17 && h < 21 ? 'good evening' : 'rest & reflect';
}

/* ═══════════════════════════════════════════
   SPLASH
═══════════════════════════════════════════ */
function initSplash() {
    const splash = document.getElementById('splash');
    if (!splash) return;
    setTimeout(() => {
        splash.classList.add('fade-out');
        const card = document.getElementById('affirmation-card');
        if (card) { card.classList.remove('affirm-enter'); void card.offsetWidth; card.classList.add('affirm-enter'); }
        setTimeout(() => splash.classList.add('gone'), 950);
    }, 2400);
}

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
    const drawer = document.querySelector('.contact-drawer');
    if (!drawer || drawer._swipeInit) return;
    drawer._swipeInit = true;
    let startX = 0, currentX = 0, dragging = false;
    drawer.addEventListener('touchstart', e => { startX = currentX = e.touches[0].clientX; dragging = true; drawer.style.transition = 'none'; }, { passive:true });
    drawer.addEventListener('touchmove',  e => { if (!dragging) return; currentX = e.touches[0].clientX; drawer.style.transform = 'translateX(' + Math.max(0, currentX - startX) + 'px)'; }, { passive:true });
    drawer.addEventListener('touchend',   () => {
        if (!dragging) return; dragging = false;
        const dx = currentX - startX;
        if (dx > 60) {
            drawer.style.transition = 'transform 0.28s cubic-bezier(0.4,0,0.2,1)';
            drawer.style.transform  = 'translateX(100%)';
            const overlay = document.getElementById('contact-overlay');
            overlay.classList.remove('drawer-visible');
            setTimeout(() => { overlay.style.display='none'; drawer.style.transform=''; drawer.style.transition=''; }, 320);
        } else {
            drawer.style.transition = 'transform 0.28s cubic-bezier(0.4,0,0.2,1)';
            drawer.style.transform  = '';
            setTimeout(() => { drawer.style.transition = ''; }, 300);
        }
    });
}

/* ═══════════════════════════════════════════
   INIT
═══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    loadSettings(); applyTheme();
    if (getSetting('theme') === 'auto') themeInterval = setInterval(applyTheme, 60000);
    if (getSetting('reminder') && Notification.permission === 'granted') scheduleReminder(getSetting('reminderTime'));
    updateMoodButtons(selectedDate);
    setTodaysAffirmation();
    updateGreeting(); setInterval(updateGreeting, 60000);
    initSplash(); initAffirmSwipe();
    updateBookmarkBtn(document.getElementById('affirmation').innerText);
    // Mood button bounce
    document.querySelectorAll('.mood-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.remove('bouncing'); void btn.offsetWidth;
            btn.classList.add('bouncing');
            btn.addEventListener('animationend', () => btn.classList.remove('bouncing'), { once:true });
        });
    });
});
document.getElementById('session-count').innerText = localStorage.getItem('sessions') || 0;
