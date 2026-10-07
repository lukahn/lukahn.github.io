/* Lightweight site scripts (no jQuery dependency). */
(function () {
  'use strict';

  // Off-canvas menu (replaces jQuery mmenu)
  var menu = document.getElementById('my-menu');
  var toggle = document.querySelector('.menu-button');
  var closeBtn = document.querySelector('.menu-close');
  var main = document.querySelector('main');
  var footer = document.querySelector('footer');
  var FOCUSABLE = 'a[href], button:not([disabled]), summary, input, select, textarea, [tabindex]:not([tabindex="-1"])';

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
})();
