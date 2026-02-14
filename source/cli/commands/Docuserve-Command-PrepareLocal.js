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

/**
 * Write an index.html that references local JS files instead of the jsDelivr CDN.
 */
function writeLocalIndexHTML(pDocsPath)
{
	let tmpHTML = `<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8">
		<meta http-equiv="X-UA-Compatible" content="IE=edge">
		<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
		<meta name="description" content="Documentation powered by pict-docuserve">

		<title>Documentation</title>

		<!-- Application Stylesheet -->
		<link href="css/docuserve.css" rel="stylesheet">
		<!-- KaTeX stylesheet for LaTeX equation rendering -->
		<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/katex.min.css">
		<!-- PICT Dynamic View CSS Container -->
		<style id="PICT-CSS"></style>

		<!-- Load the PICT library (local) -->
		<script src="./js/pict.min.js" type="text/javascript"></script>
		<!-- Bootstrap the Application -->
		<script type="text/javascript">
//<![CDATA[
		Pict.safeOnDocumentReady(() => { Pict.safeLoadPictApplication(PictDocuserve, 2)});
//]]>
		</script>
	</head>
	<body>
		<!-- The root container for the Pict application -->
		<div id="Docuserve-Application-Container"></div>

		<!-- Mermaid diagram rendering -->
		<script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
		<script>mermaid.initialize({ startOnLoad: false, theme: 'default' });</script>
		<!-- KaTeX for LaTeX equation rendering -->
		<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/katex.min.js"></script>
		<!-- Load the Docuserve PICT Application Bundle (local) -->
		<script src="./pict-docuserve.min.js" type="text/javascript"></script>
	</body>
</html>
`;
	libFS.writeFileSync(libPath.join(pDocsPath, 'index.html'), tmpHTML);
}

class DocuserveCommandPrepareLocal extends libCommandLineCommand
{
	constructor(pFable, pManifest, pServiceHash)
	{
		super(pFable, pManifest, pServiceHash);

		this.options.CommandKeyword = 'prepare-local';
		this.options.Description = 'Copy local JS bundles into a docs folder for offline use and rewrite index.html to reference them.';

		this.options.CommandArguments.push({ Name: '[docs-path]', Description: 'Target documentation folder (defaults to ./docs/).' });

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

		if (!libFS.existsSync(tmpDistPath))
		{
			this.log.error(`dist/ folder not found at ${tmpDistPath}.  Run npm run build first.`);
			process.exit(1);
		}

		this.log.info(`Staging local JS bundles for offline use...`);
		this.log.info(`  From: ${tmpDistPath}`);
		this.log.info(`  Into: ${tmpDocsPath}`);

		// Copy minified pict library and source map
		ensureDir(libPath.join(tmpDocsPath, 'js'));
		copyFile(
			libPath.join(tmpDistPath, 'js', 'pict.min.js'),
			libPath.join(tmpDocsPath, 'js', 'pict.min.js')
		);
		if (libFS.existsSync(libPath.join(tmpDistPath, 'js', 'pict.min.js.map')))
		{
			copyFile(
				libPath.join(tmpDistPath, 'js', 'pict.min.js.map'),
				libPath.join(tmpDocsPath, 'js', 'pict.min.js.map')
			);
		}

		// Copy minified pict-docuserve bundle and source map
		copyFile(
			libPath.join(tmpDistPath, 'pict-docuserve.min.js'),
			libPath.join(tmpDocsPath, 'pict-docuserve.min.js')
		);
		if (libFS.existsSync(libPath.join(tmpDistPath, 'pict-docuserve.min.js.map')))
		{
			copyFile(
				libPath.join(tmpDistPath, 'pict-docuserve.min.js.map'),
				libPath.join(tmpDocsPath, 'pict-docuserve.min.js.map')
			);
		}

		// Rewrite index.html to use local paths instead of jsDelivr CDN
		writeLocalIndexHTML(tmpDocsPath);

		this.log.info('');
		this.log.info('Local preparation complete!  JS bundles copied and index.html rewritten for local paths.');
		this.log.info('The docs folder is now fully self-contained for offline use.');
		this.log.info('');
	}
}

module.exports = DocuserveCommandPrepareLocal;
