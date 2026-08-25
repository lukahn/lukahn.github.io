# Lukahn

Website for [lukahn.com](https://lukahn.com) — the personal blog of Luke Wakefield, covering security engineering write-ups, handy command references, and other technical notes.

## Theme

Based on the [Carte Noire](https://github.com/jacobtomlinson/carte-noire) Jekyll theme by Jacob Tomlinson (demo at <https://carte-noire.jacobtomlinson.co.uk/>), with substantial customisation.

## Tools and Libraries

Third-party assets are vendored locally, so no external requests are made at page load.

### JavaScript
- Vanilla JavaScript — menu, theme toggle, and title fitting (no jQuery)
- [highlight.js](https://highlightjs.org/) (only on pages with code blocks)
- [Simple Jekyll Search](https://github.com/christian-fei/Simple-Jekyll-Search) (search page only)
- [MathJax](https://www.mathjax.org/) v4 (only on pages using LaTeX)

### CSS
- [Bootstrap 5](https://getbootstrap.com/) (subset with PurgeCSS)
- [Font Awesome 7](https://fontawesome.com/) (subset with PurgeCSS)
- Self-hosted [Google Fonts](https://fonts.google.com/) — Open Sans, Montserrat, Anonymous Pro (latin subsets)

### Build tooling
- [Jekyll 4](https://jekyllrb.com/) (see `Gemfile`)
- [PurgeCSS](https://purgecss.dev/) and [clean-css](https://github.com/clean-css/clean-css) for CSS subsetting and minification
- Python (`scripts/update_dependencies.py`) for downloading vendor assets

## Building & deployment
This site is built with **Jekyll 4** and deployed via GitHub Actions
(`.github/workflows/pages.yml`). Ruby gems are managed in `Gemfile`; there is no
`github-pages` gem dependency. To build locally:

```
bundle install
bundle exec jekyll serve
```

In the repository's Pages settings, set the source to **GitHub Actions**.

## Dependency updates
Third-party assets (Font Awesome, HighlightJS, Simple Jekyll Search, MathJax,
Bootstrap and Google Fonts) are vendored locally so no external requests are
made at page load. A GitHub Actions workflow (`.github/workflows/update-dependencies.yml`)
runs weekly and opens a pull request whenever any of them can be updated. See
`scripts/update_dependencies.py` for the download logic.

The workflow also runs `npm run purge` (`scripts/purge-css.js`), which subsets
Bootstrap and Font Awesome CSS down to only the rules the site actually uses
(keeping the CSS files roughly 5–15 KB instead of 120+ KB).

## License
The jekyll theme, HTML, CSS and JavaScript is licensed under GPLv3 (unless stated otherwise in the file).
