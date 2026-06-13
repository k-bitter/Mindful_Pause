const affirmations = [
    "Breathe in, breathe out.",
    "You are doing enough.",
    "Peace is within you.",
    "Observe, don't judge.",
    "Stay present."
];

let timerInterval;

function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    if (id === 'calendar-view') renderCalendar();
}

function startTimer(seconds) {
    clearInterval(timerInterval);
    const circle = document.getElementById('progress-circle');
    const totalCircumference = 565;
    let timeLeft = seconds;

    timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('timer-display').innerText =
            Math.floor(timeLeft / 60) + ":" + (timeLeft % 60).toString().padStart(2, '0');
        circle.style.strokeDashoffset =
            totalCircumference - (timeLeft / seconds) * totalCircumference;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            let count = parseInt(localStorage.getItem('sessions') || 0) + 1;
            localStorage.setItem('sessions', count);
            document.getElementById('session-count').innerText = count;
        }
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
    document.getElementById('progress-circle').style.strokeDashoffset = 565;
}

function newAffirmation() {
    document.getElementById('affirmation').innerText =
        affirmations[Math.floor(Math.random() * affirmations.length)];
}

function saveMood(m) { alert("Mood saved: " + m); }

function clearData() {
    localStorage.clear();
    renderCalendar();
}

function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    grid.innerHTML = '';
    for (let i = 1; i <= 30; i++) {
        const div = document.createElement('div');
        div.className = 'day';
        div.innerText = i;
        grid.appendChild(div);
    }
}

document.getElementById('session-count').innerText = localStorage.getItem('sessions') || 0;
