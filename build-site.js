#!/usr/bin/env node
/**
 * build-site.js
 *
 * Assembles the pict-docuserve dist output together with the retold documentation
 * content into a single folder suitable for GitHub Pages deployment.
 *
 * Usage:
 *   node build-site.js [--docs-path PATH] [--output-path PATH]
 *
 * Defaults:
 *   --docs-path    ../../../docs     (the retold /docs/ folder)
 *   --output-path  ./site            (output folder)
 */
'use strict';

const libFS = require('fs');
const libPath = require('path');

// ---------------------------------------------------------------------------
// Parse arguments
// ---------------------------------------------------------------------------
let tmpDocsPath = libPath.resolve(__dirname, '..', '..', '..', 'docs');
let tmpOutputPath = libPath.resolve(__dirname, 'site');
let tmpDistPath = libPath.resolve(__dirname, 'dist');

let tmpArgs = process.argv.slice(2);
for (let i = 0; i < tmpArgs.length; i++)
{
	if (tmpArgs[i] === '--docs-path' && tmpArgs[i + 1])
	{
		tmpDocsPath = libPath.resolve(tmpArgs[i + 1]);
		i++;
	}
	else if (tmpArgs[i] === '--output-path' && tmpArgs[i + 1])
	{
		tmpOutputPath = libPath.resolve(tmpArgs[i + 1]);
		i++;
	}
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Validate inputs
// ---------------------------------------------------------------------------
if (!libFS.existsSync(tmpDistPath))
{
	console.error('Error: dist/ folder not found. Run `npm run build` first.');
	process.exit(1);
}

if (!libFS.existsSync(tmpDocsPath))
{
	console.error('Error: docs folder not found at ' + tmpDocsPath);
	console.error('Use --docs-path to specify the retold docs/ folder location.');
	process.exit(1);
}

// ---------------------------------------------------------------------------
// Assemble the site
// ---------------------------------------------------------------------------
console.log('Assembling site...');
console.log('  dist:   ' + tmpDistPath);
console.log('  docs:   ' + tmpDocsPath);
console.log('  output: ' + tmpOutputPath);

// Clean and create output directory
if (libFS.existsSync(tmpOutputPath))
{
	libFS.rmSync(tmpOutputPath, { recursive: true, force: true });
}
ensureDir(tmpOutputPath);

// 1. Copy only the required dist/ artifacts (minified bundles, css, index.html)
console.log('  Copying dist/ build artifacts...');
copyFile(libPath.join(tmpDistPath, 'index.html'), libPath.join(tmpOutputPath, 'index.html'));
copyDir(libPath.join(tmpDistPath, 'css'), libPath.join(tmpOutputPath, 'css'));
ensureDir(libPath.join(tmpOutputPath, 'js'));
copyFile(libPath.join(tmpDistPath, 'js', 'pict.min.js'), libPath.join(tmpOutputPath, 'js', 'pict.min.js'));
copyFile(libPath.join(tmpDistPath, 'js', 'pict.min.js.map'), libPath.join(tmpOutputPath, 'js', 'pict.min.js.map'));
copyFile(libPath.join(tmpDistPath, 'pict-docuserve.min.js'), libPath.join(tmpOutputPath, 'pict-docuserve.min.js'));
copyFile(libPath.join(tmpDistPath, 'pict-docuserve.min.js.map'), libPath.join(tmpOutputPath, 'pict-docuserve.min.js.map'));

// 2. Copy markdown content files from docs/
console.log('  Copying documentation markdown files...');
let tmpDocsEntries = libFS.readdirSync(tmpDocsPath, { withFileTypes: true });
let tmpCopiedFiles = [];

for (let i = 0; i < tmpDocsEntries.length; i++)
{
	let tmpEntry = tmpDocsEntries[i];
	let tmpSourcePath = libPath.join(tmpDocsPath, tmpEntry.name);
	let tmpDestPath = libPath.join(tmpOutputPath, tmpEntry.name);

	// Copy markdown files (including cover.md and _sidebar.md which drive the splash and sidebar views)
	if (tmpEntry.isFile() && tmpEntry.name.match(/\.md$/))
	{
		copyFile(tmpSourcePath, tmpDestPath);
		tmpCopiedFiles.push(tmpEntry.name);
	}

	// Copy the catalog JSON
	if (tmpEntry.isFile() && tmpEntry.name === 'retold-catalog.json')
	{
		copyFile(tmpSourcePath, tmpDestPath);
		tmpCopiedFiles.push(tmpEntry.name);
	}

	// Copy the keyword index if it exists (for future search support)
	if (tmpEntry.isFile() && tmpEntry.name === 'retold-keyword-index.json')
	{
		copyFile(tmpSourcePath, tmpDestPath);
		tmpCopiedFiles.push(tmpEntry.name);
	}
}

// 3. Create .nojekyll for GitHub Pages
console.log('  Creating .nojekyll marker...');
libFS.writeFileSync(libPath.join(tmpOutputPath, '.nojekyll'), '');

// 4. Report
console.log('');
console.log('Site assembled successfully!');
console.log('  Files copied from docs/: ' + tmpCopiedFiles.join(', '));
console.log('  Output: ' + tmpOutputPath);
console.log('');
console.log('To preview locally:');
console.log('  npx http-server ' + tmpOutputPath);
console.log('');
console.log('To deploy to GitHub Pages, push the contents of ' + tmpOutputPath + '/ to your gh-pages branch.');
