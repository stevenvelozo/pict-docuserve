const libCommandLineCommand = require('pict-service-commandlineutility').ServiceCommandLineCommand;

const libHTTP = require('http');
const libFS = require('fs');
const libPath = require('path');

const _MimeTypes = (
	{
		'.html': 'text/html',
		'.js': 'text/javascript',
		'.css': 'text/css',
		'.json': 'application/json',
		'.md': 'text/markdown',
		'.map': 'application/json',
		'.svg': 'image/svg+xml',
		'.png': 'image/png',
		'.jpg': 'image/jpeg',
		'.jpeg': 'image/jpeg',
		'.gif': 'image/gif',
		'.ico': 'image/x-icon',
		'.woff': 'font/woff',
		'.woff2': 'font/woff2',
		'.ttf': 'font/ttf',
		'.eot': 'application/vnd.ms-fontobject',
		'.txt': 'text/plain'
	});

/**
 * Attempt to serve a file from the given path.
 *
 * @param {string} pFilePath - Absolute path to the file
 * @param {object} pResponse - HTTP response object
 * @param {function} fNotFound - Callback if the file does not exist
 */
function serveFile(pFilePath, pResponse, fNotFound)
{
	libFS.stat(pFilePath, (pError, pStats) =>
	{
		if (pError || !pStats.isFile())
		{
			return fNotFound();
		}

		let tmpExt = libPath.extname(pFilePath).toLowerCase();
		let tmpContentType = _MimeTypes[tmpExt] || 'application/octet-stream';

		pResponse.writeHead(200, { 'Content-Type': tmpContentType });

		let tmpStream = libFS.createReadStream(pFilePath);
		tmpStream.pipe(pResponse);
	});
}

class DocuserveCommandServe extends libCommandLineCommand
{
	constructor(pFable, pManifest, pServiceHash)
	{
		super(pFable, pManifest, pServiceHash);

		this.options.CommandKeyword = 'serve';
		this.options.Description = 'Start a local HTTP server for a documentation folder.';

		this.options.CommandArguments.push({ Name: '<docs-path>', Description: 'Path to the documentation folder containing markdown files.' });

		this.options.CommandOptions.push({ Name: '-p, --port [port]', Description: 'Port to serve on.', Default: '3333' });

		this.addCommand();
	}

	onRun()
	{
		let tmpDocsPath = libPath.resolve(this.ArgumentString || '.');
		let tmpDistPath = libPath.resolve(__dirname, '..', '..', '..', 'dist');
		let tmpPort = parseInt(this.CommandOptions.port, 10) || 3333;

		if (!libFS.existsSync(tmpDocsPath))
		{
			this.log.error(`Docs folder not found at ${tmpDocsPath}`);
			process.exit(1);
		}
		if (!libFS.existsSync(tmpDistPath))
		{
			this.log.error(`dist/ folder not found at ${tmpDistPath}.  Run npm run build first.`);
			process.exit(1);
		}

		let tmpServer = libHTTP.createServer((pRequest, pResponse) =>
		{
			let tmpURLPath = pRequest.url.split('?')[0];
			tmpURLPath = decodeURIComponent(tmpURLPath);

			// Reject path traversal attempts
			if (tmpURLPath.indexOf('..') >= 0)
			{
				pResponse.writeHead(403, { 'Content-Type': 'text/plain' });
				pResponse.end('Forbidden');
				return;
			}

			// Rewrite root to index.html
			if (tmpURLPath === '/')
			{
				tmpURLPath = '/index.html';
			}

			let tmpDocsFilePath = libPath.join(tmpDocsPath, tmpURLPath);
			let tmpDistFilePath = libPath.join(tmpDistPath, tmpURLPath);

			// Overlay: try the docs folder first, fall back to dist/
			serveFile(tmpDocsFilePath, pResponse, () =>
			{
				serveFile(tmpDistFilePath, pResponse, () =>
				{
					pResponse.writeHead(404, { 'Content-Type': 'text/plain' });
					pResponse.end('Not Found');
				});
			});
		});

		tmpServer.listen(tmpPort, '127.0.0.1', () =>
		{
			this.log.info('');
			this.log.info(`pict-docuserve is running!`);
			this.log.info('');
			this.log.info(`  Local:   http://127.0.0.1:${tmpPort}`);
			this.log.info(`  Docs:    ${tmpDocsPath}`);
			this.log.info(`  Assets:  ${tmpDistPath}`);
			this.log.info('');
			this.log.info('  Press Ctrl+C to stop.');
			this.log.info('');
		});
	}
}

module.exports = DocuserveCommandServe;
