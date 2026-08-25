/* Lightweight site scripts (no jQuery dependency). */
(function () {
  'use strict';

  // Off-canvas menu (replaces jQuery mmenu)
  var menu = document.getElementById('my-menu');
  var toggle = document.querySelector('.menu-button');
  var closeBtn = document.querySelector('.menu-close');
  var main = document.querySelector('main');
  var footer = document.querySelector('footer');
  var FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

  function openMenu() {
    document.body.classList.add('menu-open');
    // Remove page content from the tab order and accessibility tree
    // while the menu is open.
    if (main) main.inert = true;
    if (footer) footer.inert = true;
    if (toggle) {
      toggle.setAttribute('aria-expanded', 'true');
      toggle.style.display = 'none';
    }
    if (closeBtn) closeBtn.focus();
  }

  function closeMenu(returnFocus) {
    document.body.classList.remove('menu-open');
    if (main) main.inert = false;
    if (footer) footer.inert = false;
    if (toggle) {
      toggle.setAttribute('aria-expanded', 'false');
      toggle.style.display = '';
      if (returnFocus) toggle.focus();
    }
  }

  if (menu && toggle) {
    toggle.addEventListener('click', function () {
      if (document.body.classList.contains('menu-open')) {
        closeMenu(true);
      } else {
        openMenu();
      }
    });

    if (closeBtn) closeBtn.addEventListener('click', function () { closeMenu(true); });

    // Close when a menu link is chosen or Escape is pressed
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        closeMenu(true);
        return;
      }
      // Focus trap: keep Tab cycling within the open menu
      if (e.key !== 'Tab' || !document.body.classList.contains('menu-open')) return;
      var focusables = menu.querySelectorAll(FOCUSABLE);
      if (!focusables.length) return;
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }

  // Shrink long article titles so title + date fit on one line
  function fitTitles() {
    var items = document.querySelectorAll('.articles ul li');
    for (var i = 0; i < items.length; i++) {
      var li = items[i];
      var a = li.querySelector('a');
      var small = li.querySelector('small');
      if (!a || !small) continue;

      a.style.fontSize = '';
      var size = parseFloat(getComputedStyle(a).fontSize) || 20;
      var width = li.clientWidth || li.parentNode.clientWidth || 0;
      while (size > 12 && width > 0 && a.offsetWidth + small.offsetWidth >= width) {
        size -= 0.5;
        a.style.fontSize = size + 'px';
      }
    }
  }

  if (document.querySelector('.articles')) {
    fitTitles();
    window.addEventListener('resize', fitTitles);
  }

  // Theme toggle (light/dark)
  var themeToggle = document.querySelector('.theme-toggle');
  var storedTheme = null;
  try { storedTheme = localStorage.getItem('theme'); } catch (e) {}
  var mql = window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null;

  function effectiveTheme() {
    var attr = document.documentElement.getAttribute('data-theme');
    if (attr === 'light' || attr === 'dark') return attr;
    return (mql && mql.matches) ? 'light' : 'dark';
  }

  function updateToggle() {
    if (!themeToggle) return;
    var isLight = effectiveTheme() === 'light';
    themeToggle.textContent = isLight ? 'Switch to dark mode' : 'Switch to light mode';
    themeToggle.setAttribute('aria-pressed', String(isLight));
  }

  function applyTheme(theme) {
    if (theme === 'light' || theme === 'dark') {
      document.documentElement.setAttribute('data-theme', theme);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    updateToggle();
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var next = effectiveTheme() === 'light' ? 'dark' : 'light';
      try { localStorage.setItem('theme', next); } catch (e) {}
      applyTheme(next);
    });

    // Apply the stored choice, or fall back to the OS preference.
    applyTheme(storedTheme);

    // Keep the label in sync if the OS theme changes and no choice is stored.
    if (mql && mql.addEventListener) {
      mql.addEventListener('change', function () {
        var hasChoice = null;
        try { hasChoice = localStorage.getItem('theme'); } catch (e) {}
        if (hasChoice) return;
        applyTheme(null);
      });
    }
  }
})();
