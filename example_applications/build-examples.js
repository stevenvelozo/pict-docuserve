#!/usr/bin/env node
/**
 * build-examples.js
 *
 * Serves each example documentation folder using pict-docuserve to verify
 * they render correctly.  When run without arguments, it prints available
 * examples and usage information.
 *
 * Usage:
 *   node build-examples.js                        # List examples
 *   node build-examples.js serve <example-name>   # Serve one example
 *   node build-examples.js serve todo-app         # e.g. serve the todo-app
 *
 * The example documentation folders contain only markdown and optional JSON
 * metadata files.  Pict-docuserve serves its own HTML, CSS and JavaScript
 * assets transparently from its dist/ folder -- no files are copied or
 * injected into the example docs folders.
 */
'use strict';

const libFS = require('fs');
const libPath = require('path');
const { execSync, spawn } = require('child_process');

// ---------------------------------------------------------------------------
// Discover examples
// ---------------------------------------------------------------------------
let tmpExamplesRoot = __dirname;
let tmpExamples = [];

let tmpEntries = libFS.readdirSync(tmpExamplesRoot, { withFileTypes: true });
for (let i = 0; i < tmpEntries.length; i++)
{
	let tmpEntry = tmpEntries[i];
	if (!tmpEntry.isDirectory())
	{
		continue;
	}

	let tmpDocsPath = libPath.join(tmpExamplesRoot, tmpEntry.name, 'docs');
	if (libFS.existsSync(tmpDocsPath))
	{
		tmpExamples.push(
		{
			Name: tmpEntry.name,
			DocsPath: tmpDocsPath
		});
	}
}

// ---------------------------------------------------------------------------
// Parse arguments
// ---------------------------------------------------------------------------
let tmpArgs = process.argv.slice(2);
let tmpCommand = tmpArgs[0] || '';
let tmpTarget = tmpArgs[1] || '';

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------
if (tmpCommand === 'stage-docs')
{
	// Copy example app docs into the docs/ folder so that
	// search results can fetch them locally via the #/doc/ route fallback.
	// The keyword index keys use the structure: example_applications/<app>/README.md
	// so we mirror that under docs/.
	let tmpDocsRoot = libPath.resolve(__dirname, '..', 'docs');

	for (let i = 0; i < tmpExamples.length; i++)
	{
		let tmpExample = tmpExamples[i];
		let tmpDestDir = libPath.join(tmpDocsRoot, 'example_applications', tmpExample.Name);

		// Create the destination directory
		libFS.mkdirSync(tmpDestDir, { recursive: true });

		// Copy all files from the example's docs/ folder
		let tmpFiles = libFS.readdirSync(tmpExample.DocsPath);
		for (let j = 0; j < tmpFiles.length; j++)
		{
			let tmpSrcFile = libPath.join(tmpExample.DocsPath, tmpFiles[j]);
			let tmpDestFile = libPath.join(tmpDestDir, tmpFiles[j]);

			let tmpStat = libFS.statSync(tmpSrcFile);
			if (tmpStat.isFile())
			{
				libFS.copyFileSync(tmpSrcFile, tmpDestFile);
			}
		}

		console.log(`  Staged: ${tmpExample.Name} -> docs/example_applications/${tmpExample.Name}/`);
	}

	console.log('');
	console.log(`Example docs staged into ${tmpDocsRoot}/example_applications/`);
}
else if (tmpCommand === 'serve')
{
	let tmpExample = null;

	if (tmpTarget)
	{
		tmpExample = tmpExamples.find((pEx) => pEx.Name === tmpTarget);
		if (!tmpExample)
		{
			console.error(`Unknown example: ${tmpTarget}`);
			console.error(`Available examples: ${tmpExamples.map((pEx) => pEx.Name).join(', ')}`);
			process.exit(1);
		}
	}
	else if (tmpExamples.length > 0)
	{
		tmpExample = tmpExamples[0];
		console.log(`No example specified, defaulting to: ${tmpExample.Name}`);
	}
	else
	{
		console.error('No example applications found.');
		process.exit(1);
	}

	// Find the pict-docuserve binary
	let tmpDocuserveBin = libPath.resolve(__dirname, '..', 'source', 'cli', 'Docuserve-CLI-Run.js');
	if (!libFS.existsSync(tmpDocuserveBin))
	{
		// Fallback to node_modules
		tmpDocuserveBin = libPath.resolve(__dirname, '..', 'node_modules', '.bin', 'pict-docuserve');
	}

	console.log(`Serving example: ${tmpExample.Name}`);
	console.log(`  Docs: ${tmpExample.DocsPath}`);
	console.log('');

	let tmpChild = spawn('node', [tmpDocuserveBin, 'serve', tmpExample.DocsPath], { stdio: 'inherit' });
	tmpChild.on('close', (pCode) => process.exit(pCode));
}
else
{
	// Default: list examples
	console.log('Pict Docuserve Example Applications');
	console.log('===================================');
	console.log('');

	if (tmpExamples.length === 0)
	{
		console.log('No example applications found.');
	}
	else
	{
		console.log('Available examples:');
		console.log('');
		for (let i = 0; i < tmpExamples.length; i++)
		{
			console.log(`  ${tmpExamples[i].Name}`);
			console.log(`    docs: ${tmpExamples[i].DocsPath}`);
		}
		console.log('');
		console.log('To serve an example locally:');
		console.log('');
		console.log('  node example_applications/build-examples.js serve <example-name>');
		console.log('');
		console.log('Or serve any example directly with pict-docuserve:');
		console.log('');
		console.log('  npx pict-docuserve serve ./example_applications/<example-name>/docs');
		console.log('');
	}
}
