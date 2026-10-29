(() => {
  const installButtons = document.querySelectorAll('#installBtn, [data-download-app]');
  const backdrop = document.getElementById('downloadAppBackdrop');
  const dialog = backdrop?.querySelector('.download-app-modal');
  const closeButton = document.getElementById('downloadAppClose');
  const instructions = document.getElementById('downloadAppInstructions');

  let deferredInstallPrompt = null;
  let appInstalled = false;
  let previouslyFocusedElement = null;

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.error('Service worker registration failed:', error);
    });
  }

  const standaloneMediaQuery = window.matchMedia('(display-mode: standalone)');
  const isInstalled = () => appInstalled || standaloneMediaQuery.matches || navigator.standalone === true;
  const updateInstallButtonVisibility = () => {
    installButtons.forEach((button) => {
      button.hidden = isInstalled();
    });
  };

  updateInstallButtonVisibility();
  standaloneMediaQuery.addEventListener?.('change', updateInstallButtonVisibility);
  window.addEventListener('appinstalled', () => {
    appInstalled = true;
    deferredInstallPrompt = null;
    updateInstallButtonVisibility();
  });

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
  });

  if (!backdrop || !dialog || !closeButton || !instructions) {
    return;
  }

  const openInstructions = (message) => {
    previouslyFocusedElement = document.activeElement;
    instructions.textContent = message;
    backdrop.classList.add('is-open');
    backdrop.setAttribute('aria-hidden', 'false');
    backdrop.inert = false;
    document.body.style.overflow = 'hidden';
    closeButton.focus();
  };

  const closeInstructions = () => {
    if (!backdrop.classList.contains('is-open')) {
      return;
    }

    backdrop.classList.remove('is-open');
    backdrop.setAttribute('aria-hidden', 'true');
    backdrop.inert = true;
    document.body.style.overflow = '';
    previouslyFocusedElement?.focus();
  };

  const getDeviceInstructions = () => {
    const userAgent = navigator.userAgent;
    const isIOS = /iphone|ipad|ipod/i.test(userAgent)
      || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    if (isIOS) {
      return '1. Open this site in Safari. 2. Tap the Share button (square with an arrow). 3. Scroll down and tap Add to Home Screen, then Add.';
    }

    if (/android/i.test(userAgent)) {
      return 'Tap the ⋮ menu in your browser, then choose Install app or Add to Home screen.';
    }

    return 'Click the install icon at the right of the address bar (Chrome, Edge). In Safari on Mac: File → Add to Dock.';
  };

  installButtons.forEach((button) => {
    button.addEventListener('click', async (event) => {
      event.preventDefault();

      if (deferredInstallPrompt) {
        const installPrompt = deferredInstallPrompt;
        deferredInstallPrompt = null;

        try {
          await installPrompt.prompt();
          await installPrompt.userChoice;
        } catch (error) {
          console.error('The app install prompt could not be opened:', error);
        }

        return;
      }

      openInstructions(getDeviceInstructions());
    });
  });

  closeButton.addEventListener('click', closeInstructions);
  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop) {
      closeInstructions();
    }
  });

  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeInstructions();
      return;
    }

    if (event.key === 'Tab') {
      event.preventDefault();
      closeButton.focus();
    }
  });
})();
