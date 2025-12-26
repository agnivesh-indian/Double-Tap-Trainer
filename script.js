document.addEventListener('DOMContentLoaded', () => {
    const circles = document.querySelectorAll('.circle');
    const feedbackEl = document.getElementById('feedback');
    let lastTap = 0;
    let lastTapTarget = null;

    const DOUBLE_TAP_MIN_DELAY = 100; // ms
    const DOUBLE_TAP_MAX_DELAY = 400; // ms

    // Web Audio API setup
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    function playTone(frequency, duration) {
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

    function showFeedback(message) {
        feedbackEl.textContent = message;
        feedbackEl.classList.add('show');
        setTimeout(() => {
            feedbackEl.classList.remove('show');
        }, 1500);
    }

    function handleTap(e) {
        e.preventDefault(); // Prevent zoom on double tap
        const currentTime = new Date().getTime();
        const tapDelay = currentTime - lastTap;
        const currentTarget = e.target;

        if (lastTapTarget === currentTarget && tapDelay > DOUBLE_TAP_MIN_DELAY && tapDelay < DOUBLE_TAP_MAX_DELAY) {
            // Successful double-tap
            showFeedback('Good!');
            playTone(523.25, 200); // C5 note
            if (navigator.vibrate) {
                navigator.vibrate(200);
            }
        } else if (lastTapTarget === currentTarget && tapDelay <= DOUBLE_TAP_MIN_DELAY) {
            // Too fast
            showFeedback('Too Fast!');
            playTone(349.23, 150); // F4 note
             if (navigator.vibrate) {
                navigator.vibrate([50, 50, 50]);
            }
        } else {
            // This is the first tap or too slow, just record it.
        }
        
        lastTap = currentTime;
        lastTapTarget = currentTarget;

    }

    circles.forEach(circle => {
        circle.addEventListener('touchend', handleTap);
        circle.addEventListener('click', (e) => {
            // This is mainly for desktop users, touchend is primary for mobile
            // We can simulate the tap behavior on click as well.
            handleTap(e);
        });
    });
});
