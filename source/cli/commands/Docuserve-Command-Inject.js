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

		this.options.CommandArguments.push({ Name: '<docs-path>', Description: 'Target documentation folder to inject assets into.' });

		this.addCommand();
	}

	onRun()
	{
		let tmpDocsPath = libPath.resolve(this.ArgumentString || '.');
		let tmpDistPath = libPath.resolve(__dirname, '..', '..', '..', 'dist');

		if (!libFS.existsSync(tmpDocsPath))
		{
			this.log.error(`Target folder not found at ${tmpDocsPath}`);
			process.exit(1);
		}
		if (!libFS.existsSync(tmpDistPath))
		{
			this.log.error(`dist/ folder not found at ${tmpDistPath}.  Run npm run build first.`);
			process.exit(1);
		}

		this.log.info(`Injecting docuserve assets...`);
		this.log.info(`  From: ${tmpDistPath}`);
		this.log.info(`  Into: ${tmpDocsPath}`);

		// Copy index.html
		copyFile(
			libPath.join(tmpDistPath, 'index.html'),
			libPath.join(tmpDocsPath, 'index.html')
		);

		// Copy css/ folder
		copyDir(
			libPath.join(tmpDistPath, 'css'),
			libPath.join(tmpDocsPath, 'css')
		);

		// Copy js/ folder (pict library)
		copyDir(
			libPath.join(tmpDistPath, 'js'),
			libPath.join(tmpDocsPath, 'js')
		);

		// Copy all pict-docuserve bundle files (*.js and *.js.map)
		let tmpDistEntries = libFS.readdirSync(tmpDistPath, { withFileTypes: true });
		for (let i = 0; i < tmpDistEntries.length; i++)
		{
			let tmpEntry = tmpDistEntries[i];
			if (tmpEntry.isFile() && tmpEntry.name.match(/^pict-docuserve\./))
			{
				copyFile(
					libPath.join(tmpDistPath, tmpEntry.name),
					libPath.join(tmpDocsPath, tmpEntry.name)
				);
			}
		}

		// Create .nojekyll for GitHub Pages compatibility
		libFS.writeFileSync(libPath.join(tmpDocsPath, '.nojekyll'), '');

		this.log.info('');
		this.log.info('Injection complete!  The docs folder is now self-contained.');
		this.log.info('Deploy to any static host (GitHub Pages, Netlify, etc.) or serve with any HTTP server.');
		this.log.info('');
	}
}

module.exports = DocuserveCommandInject;
