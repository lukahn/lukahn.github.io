/**
 * Download the full (unpurged) vendor CSS from jsDelivr.
 *
 * This is the single source of truth for the Bootstrap and Font Awesome CSS
 * URLs, and for the Font Awesome font-path rewrite. `purge-css.js` calls it
 * before subsetting, so the purge is repeatable and no longer depends on
 * scripts/update_dependencies.py for CSS.
 *
 * Run directly with:  node scripts/fetch-vendor-css.js
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const JS_DELIVR = 'https://cdn.jsdelivr.net/npm';

// Font Awesome publishes `url(../webfonts/...)`; this repo stores the fonts
// under fonts/fontawesome/v7/, so rewrite the paths to match.
const FA_FONT_REWRITE = ['url(../webfonts/', 'url(../../../fonts/fontawesome/v7/'];

const VENDOR_CSS = [
  { url: `${JS_DELIVR}/bootstrap@5/dist/css/bootstrap.min.css`, dest: 'css/bootstrap.min.css' },
  { url: `${JS_DELIVR}/@fortawesome/fontawesome-free@7/css/fontawesome.min.css`, dest: 'css/fontawesome/v7/fontawesome.min.css', rewrite: true },
  { url: `${JS_DELIVR}/@fortawesome/fontawesome-free@7/css/brands.min.css`, dest: 'css/fontawesome/v7/brands.min.css', rewrite: true },
  { url: `${JS_DELIVR}/@fortawesome/fontawesome-free@7/css/solid.min.css`, dest: 'css/fontawesome/v7/solid.min.css', rewrite: true },
];

async function fetchVendorCss() {
  for (const { url, dest, rewrite } of VENDOR_CSS) {
    const out = path.join(root, dest);
    const res = await fetch(url, { headers: { 'user-agent': 'lukahn.com build tooling' } });
    if (!res.ok) {
      throw new Error(`Failed to download ${url}: HTTP ${res.status}`);
    }
    let data = Buffer.from(await res.arrayBuffer());
    if (rewrite) {
      data = Buffer.from(data.toString('utf8').split(FA_FONT_REWRITE[0]).join(FA_FONT_REWRITE[1]));
    }
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, data);
    console.log(`  downloaded  ${dest} (${data.length} bytes)`);
  }
}

module.exports = { fetchVendorCss };

if (require.main === module) {
  fetchVendorCss().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
