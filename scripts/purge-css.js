/**
 * Subset Bootstrap and Font Awesome CSS to only the rules this site uses.
 *
 * Run with:  npm run purge
 *
 * Output is written back over the vendored files in css/. The full files are
 * re-downloaded by scripts/update_dependencies.py (GitHub Actions) before this
 * step runs, so every update stays as small as possible.
 */
const { PurgeCSS } = require('purgecss');
const { globSync } = require('glob');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

// Content globs are expanded and read explicitly (relative to the project
// root) so results are identical across Windows and Linux.
const CONTENT_GLOBS = [
  '_includes/**/*.html',
  '_layouts/**/*.html',
  '*.html',
  '*.markdown',
  '_posts/**/*.md',
  '_data/**/*.yml',
  '_config.yml',
];

function readContent() {
  const inputs = [];
  for (const pattern of CONTENT_GLOBS) {
    for (const file of globSync(pattern, { cwd: root })) {
      const raw = fs.readFileSync(path.join(root, file), 'utf8');
      const extension = path.extname(file).slice(1) || 'html';
      inputs.push({ raw, extension });
    }
  }
  return inputs;
}

// Font Awesome base/style selectors that must always be kept (they are the
// machinery that renders icons, and may not literally appear in the templates).
// Note: PurgeCSS matches safelist entries against bare names, so no leading dot.
const FA_BASE = [
  ':root', ':host',
  'fa', 'fa-solid', 'fa-brands', 'fa-regular', 'fa-classic',
  'fas', 'fab', 'far',
  'fa-1x', 'fa-2x', 'fa-3x', 'fa-4x', 'fa-5x',
  'fa-2xs', 'fa-xs', 'fa-sm', 'fa-lg', 'fa-xl', 'fa-2xl',
  'fa-fw', 'fa-width-fixed',
];

// Every Font Awesome icon used anywhere on the site. Kept explicitly because
// some are inserted dynamically via Liquid, e.g. `fa-{{ page.thumbnail }}`.
const FA_ICONS = [
  'fa-linktree', 'fa-twitter', 'fa-mastodon', 'fa-bluesky', 'fa-github-alt',
  'fa-linkedin', 'fa-stack-overflow', 'fa-facebook', 'fa-instagram',
  'fa-reddit-alien', 'fa-rss',
  'fa-house', 'fa-box-archive', 'fa-magnifying-glass', 'fa-bars', 'fa-xmark',
  'fa-heart', 'fa-tags',
];

const safelist = {
  standard: [
    ...FA_BASE,
    ...FA_ICONS,
  ],
};

// Keep the leading `/*! ... */` banner (license attribution) in the output.
function keepBanner(css, sourcePath) {
  const src = fs.readFileSync(sourcePath, 'utf8');
  const match = src.match(/^\/\*![\s\S]*?\*\//);
  if (match && !css.startsWith('/*!')) {
    return `${match[0]}\n${css}`;
  }
  return css;
}

async function purgeFiles(cssFiles, outFiles) {
  const results = await new PurgeCSS().purge({
    content: readContent(),
    css: cssFiles.map((f) => ({ raw: fs.readFileSync(path.join(root, f), 'utf8') })),
    safelist,
    fontFace: false,   // keep all @font-face rules
    keyframes: false,  // keep all keyframes
    variables: false,  // keep all CSS custom properties
  });

  results.forEach((result, i) => {
    const out = path.join(root, outFiles[i]);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, keepBanner(result.css, path.join(root, cssFiles[i])));
    console.log(`  ${outFiles[i]}: ${result.css.length} chars`);
  });
}

(async () => {
  await purgeFiles(
    ['css/bootstrap.min.css'],
    ['css/bootstrap.min.css'],
  );
  await purgeFiles(
    [
      'css/fontawesome/v7/fontawesome.min.css',
      'css/fontawesome/v7/brands.min.css',
    ],
    [
      'css/fontawesome/v7/fontawesome.min.css',
      'css/fontawesome/v7/brands.min.css',
    ],
  );
  console.log('CSS subsetting complete.');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
