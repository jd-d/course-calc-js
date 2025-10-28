(function applyStoredTheme() {
  const THEME_STORAGE_KEY = 'course-pricing-theme';
  const prefersDark = typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : true;
  let theme = 'dark';
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      theme = stored;
    } else {
      theme = prefersDark ? 'dark' : 'light';
    }
  } catch (error) {
    theme = prefersDark ? 'dark' : 'light';
  }
  document.body.dataset.theme = theme;
  document.dispatchEvent(new CustomEvent('themechange', { detail: theme }));
})();
