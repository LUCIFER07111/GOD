(function() {
    // --- liquid blobs: subtle on all devices ---
    const goo = document.getElementById('goo');
    const isMobile = window.innerWidth < 700;

    // Even on desktop, we reduce count, size, and opacity
    const blobCount = isMobile ? 10 : 12; // fewer blobs overall

    for (let i = 0; i < blobCount; i++) {
        const b = document.createElement('div');
        b.className = 'blob';

        // Size ranges:
        // desktop: 80–300px (was 150–550)
        // mobile:  30–120px (same as before)
        let size;
        let opacity;
        if (isMobile) {
            size = 30 + Math.random() * 90;      // 30–120px
            opacity = 0.4;                        // even more transparent
        } else {
            size = 80 + Math.random() * 220;      // 80–300px (smaller)
            opacity = 0.5;                         // more transparent
        }

        b.style.width = size + 'px';
        b.style.height = size + 'px';
        b.style.left = Math.random() * 100 + '%';
        b.style.top = Math.random() * 100 + '%';
        b.style.opacity = opacity;

        const duration = 7 + Math.random() * 10;
        const delay = Math.random() * 4;
        b.style.animation = `liquidMove ${duration}s infinite alternate ease-in-out ${delay}s`;
        goo.appendChild(b);
    }

    // --- elements ---
    const clockMode = document.getElementById('clockMode');
    const timerMode = document.getElementById('timerMode');
    const modeToggle = document.getElementById('modeToggle');
    const clockEl = document.getElementById('clock');
    const dateEl = document.getElementById('date');
    const timerDisplay = document.getElementById('timerDisplay');
    const timerControls = document.getElementById('timerControls');
    const timerModeBtn = document.getElementById('timerModeBtn');
    const stopwatchModeBtn = document.getElementById('stopwatchModeBtn');

    // Music elements
    const fileInput = document.getElementById('fileInput');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const audioPlayer = document.getElementById('audioPlayer');
    let isPlaying = false;
    let audioUrl = null;

    // --- music controls ---
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
            }
            audioUrl = URL.createObjectURL(file);
            audioPlayer.src = audioUrl;
            audioPlayer.load();
            playPauseBtn.disabled = false;
            playPauseBtn.innerHTML = '<i class="fa-regular fa-circle-play"></i> play';
            isPlaying = false;
            playPauseBtn.classList.remove('playing');
        }
    });

    playPauseBtn.addEventListener('click', () => {
        if (!audioPlayer.src) return;
        if (isPlaying) {
            audioPlayer.pause();
            playPauseBtn.innerHTML = '<i class="fa-regular fa-circle-play"></i> play';
            playPauseBtn.classList.remove('playing');
        } else {
            audioPlayer.play().catch(err => {
                console.log('Playback failed:', err);
                alert('Could not play audio. Please try again.');
            });
            playPauseBtn.innerHTML = '<i class="fa-regular fa-circle-pause"></i> pause';
            playPauseBtn.classList.add('playing');
        }
        isPlaying = !isPlaying;
    });

    audioPlayer.addEventListener('ended', () => {
        isPlaying = false;
        playPauseBtn.innerHTML = '<i class="fa-regular fa-circle-play"></i> play';
        playPauseBtn.classList.remove('playing');
    });

    // --- clock update ---
    let currentTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    let is24Hour = true;

    function updateClockAndDate() {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: currentTimezone,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: !is24Hour,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            weekday: 'short'
        });
        const parts = formatter.formatToParts(now);
        let hour, minute, second, year, month, day, weekday;
        for (const p of parts) {
            if (p.type === 'hour') hour = p.value;
            else if (p.type === 'minute') minute = p.value;
            else if (p.type === 'second') second = p.value;
            else if (p.type === 'year') year = p.value;
            else if (p.type === 'month') month = p.value;
            else if (p.type === 'day') day = p.value;
            else if (p.type === 'weekday') weekday = p.value.toUpperCase();
        }
        if (!is24Hour && hour.length === 1) hour = '0' + hour;
        const seconds = parseInt(second);
        const colon = (seconds % 2 === 0) ? ':' : ' ';
        clockEl.innerText = hour + colon + minute;
        dateEl.innerText = `${year}.${month}.${day} ${weekday}`;
    }
    clockEl.addEventListener('click', () => { is24Hour = !is24Hour; updateClockAndDate(); });
    setInterval(updateClockAndDate, 1000);

    // --- mode toggle: clock <-> timer/stopwatch ---
    let timerInterval = null;
    let timerSeconds = 300;
    let stopwatchSeconds = 0;
    let timerRunning = false;
    let stopwatchRunning = false;
    let activeSubMode = 'timer';

    modeToggle.addEventListener('click', () => {
        if (clockMode.style.display !== 'none') {
            clockMode.style.display = 'none';
            timerMode.style.display = 'block';
        } else {
            clockMode.style.display = 'block';
            timerMode.style.display = 'none';
            if (timerRunning) { clearInterval(timerInterval); timerRunning = false; }
            if (stopwatchRunning) { clearInterval(timerInterval); stopwatchRunning = false; }
        }
    });

    // --- timer / stopwatch UI controls ---
    function renderTimerControls() {
        if (activeSubMode === 'timer') {
            timerControls.innerHTML = `
                <button class="timer-btn preset-btn" id="preset5"><i class="fa-regular fa-clock"></i> 5:00</button>
                <button class="timer-btn preset-btn" id="preset10">10:00</button>
                <button class="timer-btn" id="startPauseTimer"><i class="fa-regular fa-circle-play"></i> start</button>
                <button class="timer-btn" id="resetTimer"><i class="fa-regular fa-arrow-rotate-left"></i> reset</button>
            `;
            timerDisplay.innerText = formatTime(timerSeconds);
            attachTimerEvents();
        } else {
            timerControls.innerHTML = `
                <button class="timer-btn" id="startPauseStopwatch"><i class="fa-regular fa-circle-play"></i> start</button>
                <button class="timer-btn" id="resetStopwatch"><i class="fa-regular fa-arrow-rotate-left"></i> reset</button>
                <button class="timer-btn" id="lapStopwatch" disabled style="opacity:0.5;"><i class="fa-regular fa-flag"></i> lap</button>
            `;
            timerDisplay.innerText = formatTime(stopwatchSeconds);
            attachStopwatchEvents();
        }
    }

    function formatTime(secs) {
        const mins = Math.floor(secs / 60).toString().padStart(2, '0');
        const sec = (secs % 60).toString().padStart(2, '0');
        return `${mins}:${sec}`;
    }

    function attachTimerEvents() {
        document.getElementById('preset5').addEventListener('click', () => {
            timerSeconds = 300;
            timerDisplay.innerText = formatTime(timerSeconds);
        });
        document.getElementById('preset10').addEventListener('click', () => {
            timerSeconds = 600;
            timerDisplay.innerText = formatTime(timerSeconds);
        });
        const startBtn = document.getElementById('startPauseTimer');
        const resetBtn = document.getElementById('resetTimer');
        startBtn.addEventListener('click', () => {
            if (timerRunning) {
                clearInterval(timerInterval);
                timerRunning = false;
                startBtn.innerHTML = '<i class="fa-regular fa-circle-play"></i> start';
            } else {
                timerRunning = true;
                startBtn.innerHTML = '<i class="fa-regular fa-circle-pause"></i> pause';
                timerInterval = setInterval(() => {
                    if (timerSeconds > 0) {
                        timerSeconds--;
                        timerDisplay.innerText = formatTime(timerSeconds);
                    } else {
                        clearInterval(timerInterval);
                        timerRunning = false;
                        startBtn.innerHTML = '<i class="fa-regular fa-circle-play"></i> start';
                    }
                }, 1000);
            }
        });
        resetBtn.addEventListener('click', () => {
            if (timerRunning) {
                clearInterval(timerInterval);
                timerRunning = false;
            }
            timerSeconds = 300;
            timerDisplay.innerText = formatTime(timerSeconds);
            startBtn.innerHTML = '<i class="fa-regular fa-circle-play"></i> start';
        });
    }

    function attachStopwatchEvents() {
        const startBtn = document.getElementById('startPauseStopwatch');
        const resetBtn = document.getElementById('resetStopwatch');
        startBtn.addEventListener('click', () => {
            if (stopwatchRunning) {
                clearInterval(timerInterval);
                stopwatchRunning = false;
                startBtn.innerHTML = '<i class="fa-regular fa-circle-play"></i> start';
            } else {
                stopwatchRunning = true;
                startBtn.innerHTML = '<i class="fa-regular fa-circle-pause"></i> pause';
                timerInterval = setInterval(() => {
                    stopwatchSeconds++;
                    timerDisplay.innerText = formatTime(stopwatchSeconds);
                }, 1000);
            }
        });
        resetBtn.addEventListener('click', () => {
            if (stopwatchRunning) {
                clearInterval(timerInterval);
                stopwatchRunning = false;
            }
            stopwatchSeconds = 0;
            timerDisplay.innerText = formatTime(0);
            startBtn.innerHTML = '<i class="fa-regular fa-circle-play"></i> start';
        });
    }

    timerModeBtn.addEventListener('click', () => {
        if (activeSubMode === 'timer') return;
        activeSubMode = 'timer';
        timerModeBtn.classList.add('active');
        stopwatchModeBtn.classList.remove('active');
        if (stopwatchRunning) { clearInterval(timerInterval); stopwatchRunning = false; }
        renderTimerControls();
    });
    stopwatchModeBtn.addEventListener('click', () => {
        if (activeSubMode === 'stopwatch') return;
        activeSubMode = 'stopwatch';
        stopwatchModeBtn.classList.add('active');
        timerModeBtn.classList.remove('active');
        if (timerRunning) { clearInterval(timerInterval); timerRunning = false; }
        renderTimerControls();
    });

    renderTimerControls();
})();