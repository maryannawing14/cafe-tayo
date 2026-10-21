document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('cafe-ad');
  if (!overlay) return;

  const countdown = document.getElementById('ad-countdown');
  const progress = document.getElementById('ad-progress');
  const skipButton = document.getElementById('ad-skip');

  let remaining = 30;
  let timer = null;

  const hideAd = () => {
    overlay.classList.add('ad-closing');
    setTimeout(() => {
      overlay.hidden = true;
    }, 450);
  };

  const tick = () => {
    remaining -= 1;
    const percent = (remaining / 30) * 100;

    if (progress) {
      progress.style.width = `${percent}%`;
    }

    if (countdown) {
      countdown.textContent = remaining > 0 ? `Your homepage opens in ${remaining}s` : 'Your homepage is opening...';
    }

    if (remaining <= 0) {
      clearInterval(timer);
      hideAd();
      return;
    }

    if (remaining <= 5) {
      skipButton.disabled = false;
      skipButton.textContent = 'Skip ad';
    }
  };

  skipButton.disabled = true;
  skipButton.textContent = 'Skip ad in 5s';
  timer = setInterval(tick, 1000);

  skipButton.addEventListener('click', () => {
    clearInterval(timer);
    hideAd();
  });

  setTimeout(() => {
    skipButton.disabled = false;
    skipButton.textContent = 'Skip ad';
  }, 5000);

  setTimeout(() => {
    hideAd();
  }, 30000);
});
