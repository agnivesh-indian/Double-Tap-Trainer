document.addEventListener('DOMContentLoaded', () => {
    const circles = document.querySelectorAll('.circle');
    const feedbackEl = document.getElementById('feedback');
    let lastTap = 0;
    let lastTapTarget = null;
    let tooSlowTimeout = null;

    // --- Feedback Levels ---
    // [delay, message, frequency, vibration]
    const FEEDBACK_LEVELS = {
        VERY_FAST: { delay: 80, message: 'Very Fast!', frequency: 700, vibration: [20, 20] },
        FAST: { delay: 150, message: 'Fast!', frequency: 600, vibration: [50, 50] },
        PERFECT: { delay: 250, message: 'Perfect!', frequency: 523, vibration: [200] },
        SLOW: { delay: 400, message: 'Slow', frequency: 440, vibration: [100, 50, 100] },
        TOO_SLOW: { message: 'Too Slow', frequency: 350, vibration: [50, 50, 50, 50, 50] }
    };

    // Web Audio API setup
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    function playTone(frequency, duration) {
        if (!audioCtx) return;
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);

        gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + duration / 1000);
    }

    // --- Haptic and Audio Feedback ---
    function giveFeedback(level) {
        showFeedback(level.message);
        playTone(level.frequency, 200);
        if (navigator.vibrate) {
            navigator.vibrate(level.vibration);
        }
    }

    function showFeedback(message) {
        feedbackEl.textContent = message;
        feedbackEl.classList.add('show');
        setTimeout(() => {
            feedbackEl.classList.remove('show');
        }, 1500);
    }

    function handleTap(e) {
        e.preventDefault(); // Prevent zoom on double tap
        clearTimeout(tooSlowTimeout); // Clear any pending "Too Slow" feedback

        const currentTime = new Date().getTime();
        const tapDelay = currentTime - lastTap;
        const currentTarget = e.target;

        if (lastTapTarget === currentTarget && tapDelay > 0 && tapDelay < FEEDBACK_LEVELS.SLOW.delay) {
            // This is a valid double-tap, let's categorize it
            if (tapDelay < FEEDBACK_LEVELS.VERY_FAST.delay) {
                giveFeedback(FEEDBACK_LEVELS.VERY_FAST);
            } else if (tapDelay < FEEDBACK_LEVELS.FAST.delay) {
                giveFeedback(FEEDBACK_LEVELS.FAST);
            } else if (tapDelay < FEEDBACK_LEVELS.PERFECT.delay) {
                giveFeedback(FEEDBACK_LEVELS.PERFECT);
            } else {
                giveFeedback(FEEDBACK_LEVELS.SLOW);
            }
        } else {
            // This is a single tap, set a timer to check if it's "Too Slow"
            tooSlowTimeout = setTimeout(() => {
                giveFeedback(FEEDBACK_LEVELS.TOO_SLOW);
            }, FEEDBACK_LEVELS.SLOW.delay);
        }

        lastTap = currentTime;
        lastTapTarget = currentTarget;
    }

    circles.forEach(circle => {
        circle.addEventListener('touchend', handleTap);
        // Fallback for desktop clicks
        circle.addEventListener('click', handleTap);
    });

    // --- Mobile Viewport Height Fix ---
    const setViewportHeight = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    window.addEventListener('resize', setViewportHeight);
    window.addEventListener('orientationchange', setViewportHeight);
    setViewportHeight();
});
