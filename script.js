document.addEventListener('DOMContentLoaded', () => {
    const circles = document.querySelectorAll('.circle');
    const feedbackEl = document.getElementById('feedback');
    let lastTap = 0;
    let lastTapTarget = null;
    let tooSlowTimeout = null;
    let streak = 0;

    // --- Feedback Levels ---
    // Added isSuccess flag to differentiate feedback types.
    const FEEDBACK_LEVELS = {
        VERY_FAST: { delay: 80, message: 'Very Fast!', isSuccess: false },
        FAST:      { delay: 150, message: 'Fast!', isSuccess: true },
        PERFECT:   { delay: 250, message: 'Perfect!', isSuccess: true },
        SLOW:      { delay: 400, message: 'Slow', isSuccess: true },
        TOO_SLOW:  { message: 'Too Slow', isSuccess: false }
    };

    // --- Web Audio API Setup ---
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    function playNote(frequency, startTime, duration, type = 'sine') {
        if (!audioCtx) return;
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime + startTime);

        // A sharper, more "plucky" envelope for the coin sound
        gainNode.gain.setValueAtTime(0.6, audioCtx.currentTime + startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + startTime + duration * 1.5);

        oscillator.start(audioCtx.currentTime + startTime);
        oscillator.stop(audioCtx.currentTime + startTime + duration);
    }

    function playSound(isSuccess) {
        if (isSuccess) {
            // Play a high C and G together for a "coin" sound.
            playNote(1046.50, 0, 0.2); // C6
            playNote(1567.98, 0, 0.2); // G6
        } else {
            // Play a low, dissonant tone for failure
            playNote(130.81, 0, 0.15, 'sawtooth'); // C3
        }
    }

    function playYaySound() {
        // A cheerful, ascending melody for "yay!"
        playNote(523.25, 0, 0.1); // C5
        playNote(659.25, 0.1, 0.1); // E5
        playNote(783.99, 0.2, 0.1); // G5
        playNote(1046.50, 0.3, 0.2); // C6
    }

    // --- Haptic and Audio Feedback ---
    function giveFeedback(level) {
        showFeedback(level.message);
        playSound(level.isSuccess);

        if (level.isSuccess) {
            streak++;
            if (streak === 10) {
                showFeedback('10 in a row! Yay!');
                playYaySound();
                if (navigator.vibrate) {
                    // A happy vibration pattern
                    navigator.vibrate([100, 30, 100, 30, 100]);
                }
                streak = 0; // Reset after the celebration
            } else {
                if (navigator.vibrate) {
                    navigator.vibrate(150);
                }
            }
        } else {
            streak = 0;
            if (navigator.vibrate) {
                // Distinct vibration for failure (short buzz)
                navigator.vibrate([50, 50, 50]);
            }
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