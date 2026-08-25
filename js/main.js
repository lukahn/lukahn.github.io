/* Lightweight site scripts (no jQuery dependency). */
(function () {
  'use strict';

  // Off-canvas menu (replaces jQuery mmenu)
  var menu = document.getElementById('my-menu');
  var toggle = document.querySelector('.menu-button');
  var closeBtn = document.querySelector('.menu-close');

  function openMenu() {
    document.body.classList.add('menu-open');
    if (toggle) {
      toggle.setAttribute('aria-expanded', 'true');
      toggle.style.display = 'none';
    }
    if (closeBtn) closeBtn.focus();
  }

  function closeMenu(returnFocus) {
    document.body.classList.remove('menu-open');
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
      if (e.key === 'Escape') closeMenu(true);
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
