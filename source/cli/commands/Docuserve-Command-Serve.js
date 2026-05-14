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

/**
 * Serve an HTML file with the jsDelivr CDN reference to pict-docuserve
 * rewritten to a local relative path.  Used for index.html so that
 * `npm start -- ../somewhere/docs` picks up the dev build sitting in
 * dist/ rather than the last-published version on the CDN — otherwise
 * every code edit would need a publish before it could be tested
 * against another module's docs.
 *
 * The original file on disk is unchanged; this is a server-side
 * transform only.
 */
function serveIndexHTMLWithLocalBundle(pFilePath, pResponse, fNotFound)
{
	libFS.readFile(pFilePath, 'utf8', (pError, pData) =>
	{
		if (pError)
		{
			return fNotFound();
		}
		let tmpRewritten = pData.replace(
			/https:\/\/cdn\.jsdelivr\.net\/npm\/pict-docuserve@[^/]+\/dist\/pict-docuserve\.min\.js/g,
			'./pict-docuserve.min.js'
		);
		pResponse.writeHead(200, { 'Content-Type': 'text/html' });
		pResponse.end(tmpRewritten);
	});
}

class DocuserveCommandServe extends libCommandLineCommand
{
	constructor(pFable, pManifest, pServiceHash)
	{
		super(pFable, pManifest, pServiceHash);

		this.options.CommandKeyword = 'serve';
		this.options.Description = 'Start a local HTTP server for a documentation folder.';

		this.options.CommandArguments.push({ Name: '[docs-path]', Description: 'Path to the documentation folder containing markdown files (defaults to ./docs/).' });

		this.options.CommandOptions.push({ Name: '-p, --port [port]', Description: 'Port to serve on.', Default: '3333' });

		this.addCommand();
	}

	/**
	 * Translate the user-supplied path into the actual docs folder to
	 * serve.  Accepted shapes:
	 *
	 *   1. A docs folder directly (the historical default — markdown
	 *      files at the top level).  Used as-is.
	 *   2. A `package.json` file path.  Resolves to `<dirname>/docs`
	 *      so `npm start -- ../some/module/package.json` works.
	 *   3. A module-root directory (contains a `package.json` AND a
	 *      `docs/` subdirectory).  Resolves to `<root>/docs` so
	 *      `npm start -- ../some/module` works.
	 *   4. Anything else falls through to the original path; the
	 *      caller-level existence check then surfaces a clear error.
	 */
	_resolveDocsPath(pArgPath)
	{
		let tmpStats = null;
		try { tmpStats = libFS.statSync(pArgPath); }
		catch (pError) { return pArgPath; }

		// Case 2: pointed straight at a package.json file.
		if (tmpStats.isFile() && libPath.basename(pArgPath).toLowerCase() === 'package.json')
		{
			return libPath.join(libPath.dirname(pArgPath), 'docs');
		}

		if (tmpStats.isDirectory())
		{
			// Case 3: module root — has a package.json AND a docs/ child.
			// Both signals required so we don't accidentally redirect
			// a docs folder that happens to live next to a stray
			// package.json.
			let tmpHasPackageJSON = libFS.existsSync(libPath.join(pArgPath, 'package.json'));
			let tmpHasDocsSubdir  = libFS.existsSync(libPath.join(pArgPath, 'docs'));
			if (tmpHasPackageJSON && tmpHasDocsSubdir)
			{
				return libPath.join(pArgPath, 'docs');
			}
		}

		// Case 1 / 4: use as-is.
		return pArgPath;
	}

	onRun()
	{
		let tmpArgPath = libPath.resolve(this.ArgumentString || './docs/');
		let tmpDocsPath = this._resolveDocsPath(tmpArgPath);
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

			// index.html gets a server-side rewrite so the dev bundle
			// (dist/pict-docuserve.min.js) loads instead of the
			// published CDN version.  Lets `npm start -- ../some/docs`
			// test the local build against any module's docs without a
			// publish cycle.
			if (tmpURLPath === '/index.html')
			{
				serveIndexHTMLWithLocalBundle(tmpDocsFilePath, pResponse, () =>
				{
					serveIndexHTMLWithLocalBundle(tmpDistFilePath, pResponse, () =>
					{
						pResponse.writeHead(404, { 'Content-Type': 'text/plain' });
						pResponse.end('Not Found');
					});
				});
				return;
			}

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
