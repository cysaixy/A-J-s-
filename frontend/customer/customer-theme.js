const THEME_STORAGE_KEY = 'ajsFoodflixTheme';
const root = document.documentElement;

function storedTheme() {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return saved === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

function applyTheme(theme) {
  root.dataset.ajsTheme = theme;
  root.style.colorScheme = theme;
  const toggle = document.getElementById('themeToggle');
  if (!toggle) return;

  const isLight = theme === 'light';
  toggle.setAttribute('aria-pressed', String(isLight));
  toggle.setAttribute('aria-label', `Switch to ${isLight ? 'dark' : 'light'} theme`);
  toggle.title = `Switch to ${isLight ? 'dark' : 'light'} theme`;
}

applyTheme(storedTheme());

function bindThemeToggle() {
  const toggle = document.getElementById('themeToggle');
  if (!toggle) return;

  toggle.addEventListener('click', () => {
    const theme = root.dataset.ajsTheme === 'light' ? 'dark' : 'light';
    applyTheme(theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Theme selection still applies for this page when storage is unavailable.
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bindThemeToggle, { once: true });
} else {
  bindThemeToggle();
}
