/* Theme (light/dark) — loaded synchronously in <head>, before the stylesheet,
   so the stored choice is applied to the first paint instead of flipping after
   it. The toggle button does not exist yet at this point, so it is wired up on
   DOMContentLoaded. */
(function () {
  'use strict';

  function storedChoice() {
    try { return localStorage.getItem('theme'); } catch (e) { return null; }
  }

  function apply(theme) {
    if (theme === 'light' || theme === 'dark') {
      document.documentElement.setAttribute('data-theme', theme);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }

  // Apply before first paint. Absent attribute means "follow the OS".
  apply(storedChoice());

  var mql = window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null;

  function effectiveTheme() {
    var attr = document.documentElement.getAttribute('data-theme');
    if (attr === 'light' || attr === 'dark') return attr;
    return (mql && mql.matches) ? 'light' : 'dark';
  }

  function updateToggle() {
    var toggle = document.querySelector('.theme-toggle');
    if (!toggle) return;
    var isLight = effectiveTheme() === 'light';
    toggle.textContent = isLight ? 'Switch to dark mode' : 'Switch to light mode';
    toggle.setAttribute('aria-pressed', String(isLight));
  }

  function init() {
    updateToggle();
    var toggle = document.querySelector('.theme-toggle');
    if (!toggle) return;
    toggle.addEventListener('click', function () {
      var next = effectiveTheme() === 'light' ? 'dark' : 'light';
      try { localStorage.setItem('theme', next); } catch (e) {}
      apply(next);
      updateToggle();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Follow the OS preference only while no explicit choice is stored.
  if (mql && mql.addEventListener) {
    mql.addEventListener('change', function () {
      if (storedChoice()) return;
      apply(null);
      updateToggle();
    });
  }
})();
