/**
 * Docuserve-Brand — docuserve's own wordmark, used only as a fallback.
 *
 * Docuserve is a viewer: the docs being served dictate the brand, not
 * docuserve itself.  Resolution order at boot (see
 * `Pict-Application-Docuserve._resolveBrand`):
 *
 *   1. `options.Brand` passed to the application constructor (host
 *      override).
 *   2. `_brand.json` fetched from the docs root.  Written there by the
 *      `pict-docuserve inject` CLI from the calling module's
 *      `package.json#retold.brand` block.
 *   3. This file — docuserve's own brand, the last-resort fallback so
 *      the chrome is never blank.
 *
 * Precomputed at build time.  Source of truth lives in
 * `Retold-Modules-Manifest.json` under this module's `Branding.Palette`
 * field; the `pict-section-theme-brand` CLI generates the deterministic
 * logo + colors and writes them into our `package.json` under
 * `retold.brand`.  This file then just exports that block.
 *
 * To change docuserve's own fallback look:
 *
 *   1. Edit the Branding block in Retold-Modules-Manifest.json (palette,
 *      DisplayName, Tagline).
 *   2. Run `npm run brand` to regenerate package.json + favicon files.
 *   3. Run `npx quack build` to rebuild the bundle.
 *
 * Curated palette keys: mix, default, desert, ocean, forest, synthwave,
 * twilight, cosmos, carnival.
 */

// Path: source/ → up 1 to pict-docuserve/.
const tmpPackage = require('../package.json');

if (!tmpPackage.retold || !tmpPackage.retold.brand)
{
	throw new Error('pict-docuserve: package.json is missing retold.brand — '
		+ 'run `npm run brand` (which calls pict-section-theme-brand) before building');
}

module.exports = tmpPackage.retold.brand;
