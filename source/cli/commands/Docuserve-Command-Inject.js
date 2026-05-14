const libCommandLineCommand = require('pict-service-commandlineutility').ServiceCommandLineCommand;

const libFS = require('fs');
const libPath = require('path');

/**
 * Recursively create a directory if it does not exist.
 */
function ensureDir(pPath)
{
	if (!libFS.existsSync(pPath))
	{
		libFS.mkdirSync(pPath, { recursive: true });
	}
}

/**
 * Copy a single file, creating parent directories as needed.
 */
function copyFile(pSource, pDest)
{
	ensureDir(libPath.dirname(pDest));
	libFS.copyFileSync(pSource, pDest);
}

class DocuserveCommandInject extends libCommandLineCommand
{
	constructor(pFable, pManifest, pServiceHash)
	{
		super(pFable, pManifest, pServiceHash);

		this.options.CommandKeyword = 'inject';
		this.options.Description = 'Copy docuserve app assets into a docs folder for static hosting.';

		this.options.CommandArguments.push({ Name: '[docs-path]', Description: 'Target documentation folder to inject assets into (defaults to ./docs/).' });

		this.addCommand();
	}

	onRun()
	{
		let tmpDocsPath = libPath.resolve(this.ArgumentString || './docs/');
		let tmpDistPath = libPath.resolve(__dirname, '..', '..', '..', 'dist');

		if (!libFS.existsSync(tmpDocsPath))
		{
			this.log.error(`Target folder not found at ${tmpDocsPath}`);
			process.exit(1);
		}

		// Create .nojekyll for GitHub Pages compatibility (always, even if dist is missing)
		libFS.writeFileSync(libPath.join(tmpDocsPath, '.nojekyll'), '');
		this.log.info(`Created .nojekyll in ${tmpDocsPath}`);

		if (!libFS.existsSync(tmpDistPath))
		{
			this.log.error(`dist/ folder not found at ${tmpDistPath}.  Run npm run build first.`);
			process.exit(1);
		}

		this.log.info(`Injecting docuserve assets...`);
		this.log.info(`  From: ${tmpDistPath}`);
		this.log.info(`  Into: ${tmpDocsPath}`);

		// Copy index.html (references pict and pict-docuserve JS via jsDelivr CDN)
		copyFile(
			libPath.join(tmpDistPath, 'index.html'),
			libPath.join(tmpDocsPath, 'index.html')
		);

		// If the calling module's package.json has a precomputed retold.brand
		// block (produced by `pict-section-theme-brand`), surface it to the
		// served bundle as _brand.json.  Docuserve fetches this file at boot
		// and applies it to the Theme-Section provider — so the docs wear
		// the brand of the module that owns them, not docuserve's.
		this._writeBrandJSON(tmpDocsPath);

		// NOTE: pict.min.js and pict-docuserve.min.js are loaded from jsDelivr CDN
		// in the default index.html.  Use `pict-docuserve prepare-local` (or
		// `npx quack prepare-local`) to copy local JS bundles for offline use.

		this.log.info('');
		this.log.info('Injection complete!  JS dependencies load from jsDelivr CDN.');
		this.log.info('Deploy to any static host (GitHub Pages, Netlify, etc.) or serve with any HTTP server.');
		this.log.info('');
		this.log.info('For offline/local development, run `pict-docuserve prepare-local` to copy JS bundles locally.');
		this.log.info('');
	}

	/**
	 * Read process.cwd()/package.json and, if it carries a `retold.brand`
	 * block, write that block to <docs>/_brand.json.  No-op (silent) when
	 * the caller has no brand — runtime falls back to docuserve's own.
	 */
	_writeBrandJSON(pDocsPath)
	{
		let tmpPackagePath = libPath.resolve(process.cwd(), 'package.json');
		if (!libFS.existsSync(tmpPackagePath))
		{
			return;
		}

		let tmpPackage;
		try
		{
			tmpPackage = JSON.parse(libFS.readFileSync(tmpPackagePath, 'utf8'));
		}
		catch (pError)
		{
			this.log.warn(`Could not parse ${tmpPackagePath}: ${pError.message}`);
			return;
		}

		if (!tmpPackage.retold || !tmpPackage.retold.brand)
		{
			return;
		}

		let tmpBrandPath = libPath.join(pDocsPath, '_brand.json');
		libFS.writeFileSync(tmpBrandPath, JSON.stringify(tmpPackage.retold.brand, null, '\t') + '\n');
		this.log.info(`  Brand:   ${tmpPackage.retold.brand.Name || tmpPackage.retold.brand.Hash} → ${tmpBrandPath}`);
	}
}

module.exports = DocuserveCommandInject;
