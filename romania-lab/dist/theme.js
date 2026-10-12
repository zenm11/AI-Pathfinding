(() => {
  const key = 'romania-search-theme';
  let theme = 'daylight';
  try {
    if (localStorage.getItem(key) === 'midnight') {
      theme = 'midnight';
    }
  } catch {}

  function applyTheme() {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]').content =
      theme === 'midnight' ? '#0b1220' : '#f6f8f4';
    const button = document.getElementById('theme-toggle');
    if (button) {
      button.setAttribute('aria-pressed', String(theme === 'midnight'));
      button.title = `Switch to ${theme === 'midnight' ? 'daylight' : 'midnight'} theme`;
    }
  }

  applyTheme();
  document.addEventListener('DOMContentLoaded', () => {
    applyTheme();
    document.getElementById('theme-toggle').addEventListener('click', () => {
      theme = theme === 'midnight' ? 'daylight' : 'midnight';
      applyTheme();
      try {
        localStorage.setItem(key, theme);
      } catch {}
    });
  });
})();
