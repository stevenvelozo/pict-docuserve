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
 * Recursively copy a directory's contents into a destination.
 */
function copyDir(pSource, pDest)
{
	ensureDir(pDest);
	let tmpEntries = libFS.readdirSync(pSource, { withFileTypes: true });

	for (let i = 0; i < tmpEntries.length; i++)
	{
		let tmpEntry = tmpEntries[i];
		let tmpSourcePath = libPath.join(pSource, tmpEntry.name);
		let tmpDestPath = libPath.join(pDest, tmpEntry.name);

		if (tmpEntry.isDirectory())
		{
			copyDir(tmpSourcePath, tmpDestPath);
		}
		else
		{
			libFS.copyFileSync(tmpSourcePath, tmpDestPath);
		}
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

		// Copy css/ folder
		copyDir(
			libPath.join(tmpDistPath, 'css'),
			libPath.join(tmpDocsPath, 'css')
		);

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
}

module.exports = DocuserveCommandInject;
