/* Initialise Simple Jekyll Search from the data attributes on this script tag. */
(function () {
  'use strict';

  var script = document.currentScript;
  if (!script || !window.SimpleJekyllSearch) return;

  window.SimpleJekyllSearch.init({
    searchInput: document.getElementById('search-input'),
    resultsContainer: document.getElementById('results-container'),
    dataSource: script.getAttribute('data-search-json'),
    searchResultTemplate: '<li><a href="{url}" title="{desc}">{title}<\/a><\/li>',
    noResultsText: 'No results found',
    limit: 10,
    fuzzy: true
  });
})();
