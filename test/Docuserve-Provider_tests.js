/**
* Unit tests for Pict Docuserve Documentation Provider
*
* @license     MIT
*
* @author      Steven Velozo <steven@velozo.com>
*/

var Chai = require("chai");
var Expect = Chai.expect;

var libPict = require('pict');
var libDocuserveProvider = require('../source/providers/Pict-Provider-Docuserve-Documentation.js');

// A mock catalog matching the retold structure
var _MockCatalog =
{
	Generated: '2026-01-01T00:00:00.000Z',
	GitHubOrg: 'stevenvelozo',
	DefaultBranch: 'master',
	Groups:
	[
		{
			Name: 'Fable',
			Key: 'fable',
			Description: 'Core ecosystem',
			Modules:
			[
				{ Name: 'fable', Repo: 'fable', Group: 'fable', Branch: 'master', HasDocs: true, Sidebar: [] },
				{ Name: 'fable-log', Repo: 'fable-log', Group: 'fable', Branch: 'master', HasDocs: true, Sidebar: [] },
				{ Name: 'fable-serviceproviderbase', Repo: 'fable-serviceproviderbase', Group: 'fable', Branch: 'master', HasDocs: true, Sidebar: [] }
			]
		},
		{
			Name: 'Meadow',
			Key: 'meadow',
			Description: 'Data access layer',
			Modules:
			[
				{ Name: 'meadow', Repo: 'meadow', Group: 'meadow', Branch: 'master', HasDocs: true, Sidebar: [] },
				{ Name: 'foxhound', Repo: 'foxhound', Group: 'meadow', Branch: 'master', HasDocs: true, Sidebar: [] },
				{ Name: 'meadow-endpoints', Repo: 'meadow-endpoints', Group: 'meadow', Branch: 'develop', HasDocs: false, Sidebar: [] }
			]
		},
		{
			Name: 'Pict',
			Key: 'pict',
			Description: 'UI framework',
			Modules:
			[
				{ Name: 'pict', Repo: 'pict', Group: 'pict', Branch: 'master', HasDocs: true, Sidebar: [] },
				{ Name: 'pict-template', Repo: 'pict-template', Group: 'pict', Branch: 'master', HasDocs: true, Sidebar: [] }
			]
		},
		{
			Name: 'Utility',
			Key: 'utility',
			Description: 'Build tools',
			Modules:
			[
				{ Name: 'precedent', Repo: 'precedent', Group: 'utility', Branch: 'master', HasDocs: false, Sidebar: [] }
			]
		}
	]
};

/**
 * Create a provider instance with a pre-loaded mock catalog.
 */
var createProvider = () =>
{
	let tmpPict = new libPict();
	let tmpEnvironment = new libPict.EnvironmentLog(tmpPict);

	tmpPict.AppData.Docuserve =
	{
		CatalogLoaded: false,
		Catalog: null,
		SidebarGroups: [],
		DocsBaseURL: ''
	};

	let tmpProvider = tmpPict.addProvider('Docuserve-Documentation', libDocuserveProvider.default_configuration, libDocuserveProvider);

	// Inject the mock catalog directly
	tmpProvider._Catalog = _MockCatalog;
	tmpPict.AppData.Docuserve.Catalog = _MockCatalog;
	tmpPict.AppData.Docuserve.CatalogLoaded = true;

	return tmpProvider;
};

suite
(
	'Pict Docuserve Documentation Provider',
	function()
	{
		setup
		(
			() =>
			{
			}
		);

		suite
		(
			'Object Sanity',
			function()
			{
				test
				(
					'The provider should initialize itself into a happy little object.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						Expect(tmpProvider).to.be.an('object', 'Provider should initialize as an object.');
						Expect(tmpProvider._Catalog).to.be.an('object', 'Catalog should be loaded.');
						Expect(tmpProvider._ContentCache).to.be.an('object', 'Content cache should exist.');
						fDone();
					}
				);
			}
		);

		suite
		(
			'Catalog Lookups',
			function()
			{
				test
				(
					'isGroupInCatalog should find known groups.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						Expect(tmpProvider.isGroupInCatalog('fable')).to.equal(true);
						Expect(tmpProvider.isGroupInCatalog('meadow')).to.equal(true);
						Expect(tmpProvider.isGroupInCatalog('pict')).to.equal(true);
						Expect(tmpProvider.isGroupInCatalog('utility')).to.equal(true);
						fDone();
					}
				);
				test
				(
					'isGroupInCatalog should return false for unknown groups.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						Expect(tmpProvider.isGroupInCatalog('nonexistent')).to.equal(false);
						Expect(tmpProvider.isGroupInCatalog('')).to.equal(false);
						Expect(tmpProvider.isGroupInCatalog(null)).to.equal(false);
						fDone();
					}
				);
				test
				(
					'isGroupInCatalog should handle missing catalog gracefully.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						tmpProvider._Catalog = null;
						Expect(tmpProvider.isGroupInCatalog('fable')).to.equal(false);
						fDone();
					}
				);
				test
				(
					'isModuleInCatalog should find known modules.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						Expect(tmpProvider.isModuleInCatalog('fable', 'fable')).to.equal(true);
						Expect(tmpProvider.isModuleInCatalog('fable', 'fable-log')).to.equal(true);
						Expect(tmpProvider.isModuleInCatalog('meadow', 'foxhound')).to.equal(true);
						Expect(tmpProvider.isModuleInCatalog('pict', 'pict-template')).to.equal(true);
						Expect(tmpProvider.isModuleInCatalog('utility', 'precedent')).to.equal(true);
						fDone();
					}
				);
				test
				(
					'isModuleInCatalog should return false for wrong group/module combos.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						// Right module, wrong group
						Expect(tmpProvider.isModuleInCatalog('pict', 'fable')).to.equal(false);
						// Nonexistent module
						Expect(tmpProvider.isModuleInCatalog('fable', 'nonexistent')).to.equal(false);
						// Nonexistent group
						Expect(tmpProvider.isModuleInCatalog('fake', 'fable')).to.equal(false);
						fDone();
					}
				);
				test
				(
					'isModuleInCatalog should handle missing catalog gracefully.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						tmpProvider._Catalog = null;
						Expect(tmpProvider.isModuleInCatalog('fable', 'fable')).to.equal(false);
						fDone();
					}
				);
			}
		);

		suite
		(
			'GitHub URL Resolution',
			function()
			{
				test
				(
					'resolveGitHubURLToRoute should resolve known catalog modules.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						Expect(tmpProvider.resolveGitHubURLToRoute('https://github.com/stevenvelozo/fable')).to.equal('#/doc/fable/fable');
						Expect(tmpProvider.resolveGitHubURLToRoute('https://github.com/stevenvelozo/fable-log')).to.equal('#/doc/fable/fable-log');
						Expect(tmpProvider.resolveGitHubURLToRoute('https://github.com/stevenvelozo/foxhound')).to.equal('#/doc/meadow/foxhound');
						Expect(tmpProvider.resolveGitHubURLToRoute('https://github.com/stevenvelozo/pict')).to.equal('#/doc/pict/pict');
						Expect(tmpProvider.resolveGitHubURLToRoute('https://github.com/stevenvelozo/pict-template')).to.equal('#/doc/pict/pict-template');
						Expect(tmpProvider.resolveGitHubURLToRoute('https://github.com/stevenvelozo/precedent')).to.equal('#/doc/utility/precedent');
						fDone();
					}
				);
				test
				(
					'resolveGitHubURLToRoute should handle trailing slashes and paths.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						Expect(tmpProvider.resolveGitHubURLToRoute('https://github.com/stevenvelozo/fable/')).to.equal('#/doc/fable/fable');
						Expect(tmpProvider.resolveGitHubURLToRoute('https://github.com/stevenvelozo/fable/tree/master')).to.equal('#/doc/fable/fable');
						Expect(tmpProvider.resolveGitHubURLToRoute('https://github.com/stevenvelozo/meadow-endpoints/issues')).to.equal('#/doc/meadow/meadow-endpoints');
						fDone();
					}
				);
				test
				(
					'resolveGitHubURLToRoute should return null for unknown repos.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						Expect(tmpProvider.resolveGitHubURLToRoute('https://github.com/stevenvelozo/nonexistent')).to.equal(null);
						fDone();
					}
				);
				test
				(
					'resolveGitHubURLToRoute should return null for different GitHub orgs.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						Expect(tmpProvider.resolveGitHubURLToRoute('https://github.com/otherorg/fable')).to.equal(null);
						Expect(tmpProvider.resolveGitHubURLToRoute('https://github.com/facebook/react')).to.equal(null);
						fDone();
					}
				);
				test
				(
					'resolveGitHubURLToRoute should return null for non-GitHub URLs.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						Expect(tmpProvider.resolveGitHubURLToRoute('https://npmjs.com/package/fable')).to.equal(null);
						Expect(tmpProvider.resolveGitHubURLToRoute('https://example.com/stevenvelozo/fable')).to.equal(null);
						fDone();
					}
				);
				test
				(
					'resolveGitHubURLToRoute should handle edge cases gracefully.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						Expect(tmpProvider.resolveGitHubURLToRoute(null)).to.equal(null);
						Expect(tmpProvider.resolveGitHubURLToRoute('')).to.equal(null);
						Expect(tmpProvider.resolveGitHubURLToRoute('https://github.com/')).to.equal(null);
						Expect(tmpProvider.resolveGitHubURLToRoute('https://github.com/stevenvelozo')).to.equal(null);
						Expect(tmpProvider.resolveGitHubURLToRoute('not a url')).to.equal(null);
						fDone();
					}
				);
				test
				(
					'resolveGitHubURLToRoute should handle http URLs.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						Expect(tmpProvider.resolveGitHubURLToRoute('http://github.com/stevenvelozo/fable')).to.equal('#/doc/fable/fable');
						fDone();
					}
				);
				test
				(
					'resolveGitHubURLToRoute with no catalog should return null.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						tmpProvider._Catalog = null;
						Expect(tmpProvider.resolveGitHubURLToRoute('https://github.com/stevenvelozo/fable')).to.equal(null);
						fDone();
					}
				);
			}
		);

		suite
		(
			'Document URL Resolution',
			function()
			{
				test
				(
					'resolveDocumentURL should build correct raw GitHub URLs.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						var tmpURL = tmpProvider.resolveDocumentURL('fable', 'fable', 'README.md');
						Expect(tmpURL).to.equal('https://raw.githubusercontent.com/stevenvelozo/fable/master/docs/README.md');
						fDone();
					}
				);
				test
				(
					'resolveDocumentURL should default path to README.md.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						var tmpURL = tmpProvider.resolveDocumentURL('fable', 'fable');
						Expect(tmpURL).to.equal('https://raw.githubusercontent.com/stevenvelozo/fable/master/docs/README.md');
						fDone();
					}
				);
				test
				(
					'resolveDocumentURL should use module-specific branch.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						var tmpURL = tmpProvider.resolveDocumentURL('meadow', 'meadow-endpoints', 'api.md');
						Expect(tmpURL).to.equal('https://raw.githubusercontent.com/stevenvelozo/meadow-endpoints/develop/docs/api.md');
						fDone();
					}
				);
				test
				(
					'resolveDocumentURL should handle nested paths.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						var tmpURL = tmpProvider.resolveDocumentURL('fable', 'fable', 'services/logging.md');
						Expect(tmpURL).to.equal('https://raw.githubusercontent.com/stevenvelozo/fable/master/docs/services/logging.md');
						fDone();
					}
				);
				test
				(
					'resolveDocumentURL should return null for unknown modules.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						Expect(tmpProvider.resolveDocumentURL('fable', 'nonexistent', 'README.md')).to.equal(null);
						Expect(tmpProvider.resolveDocumentURL('fake', 'fable', 'README.md')).to.equal(null);
						fDone();
					}
				);
				test
				(
					'resolveDocumentURL with no catalog should return null.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						tmpProvider._Catalog = null;
						Expect(tmpProvider.resolveDocumentURL('fable', 'fable', 'README.md')).to.equal(null);
						fDone();
					}
				);
			}
		);

		suite
		(
			'Sidebar Link Conversion',
			function()
			{
				test
				(
					'convertSidebarLink should convert root to Home.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						Expect(tmpProvider.convertSidebarLink('/')).to.equal('#/Home');
						fDone();
					}
				);
				test
				(
					'convertSidebarLink should convert catalog module paths to doc routes.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						Expect(tmpProvider.convertSidebarLink('/fable/fable/')).to.equal('#/doc/fable/fable');
						Expect(tmpProvider.convertSidebarLink('/meadow/foxhound/')).to.equal('#/doc/meadow/foxhound');
						Expect(tmpProvider.convertSidebarLink('/pict/pict/')).to.equal('#/doc/pict/pict');
						fDone();
					}
				);
				test
				(
					'convertSidebarLink should convert .md files to page routes.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						Expect(tmpProvider.convertSidebarLink('architecture.md')).to.equal('#/page/architecture');
						Expect(tmpProvider.convertSidebarLink('getting-started.md')).to.equal('#/page/getting-started');
						fDone();
					}
				);
				test
				(
					'convertSidebarLink should handle non-catalog paths as page routes.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						Expect(tmpProvider.convertSidebarLink('/unknown/path/')).to.equal('#/page/unknown/path');
						fDone();
					}
				);
				test
				(
					'convertSidebarLink should handle empty input.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						Expect(tmpProvider.convertSidebarLink('')).to.equal('');
						Expect(tmpProvider.convertSidebarLink(null)).to.equal('');
						fDone();
					}
				);
			}
		);

		suite
		(
			'Document Link Conversion',
			function()
			{
				test
				(
					'convertDocLink should handle absolute catalog paths.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						// Trailing slash is preserved in the route
						Expect(tmpProvider.convertDocLink('/fable/fable/')).to.equal('#/doc/fable/fable/');
						Expect(tmpProvider.convertDocLink('/meadow/foxhound/api.md')).to.equal('#/doc/meadow/foxhound/api.md');
						fDone();
					}
				);
				test
				(
					'convertDocLink should resolve relative paths within module context.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						// Relative link within fable/fable docs
						Expect(tmpProvider.convertDocLink('api.md', 'fable', 'fable')).to.equal('#/doc/fable/fable/api.md');
						Expect(tmpProvider.convertDocLink('./api.md', 'fable', 'fable')).to.equal('#/doc/fable/fable/api.md');
						fDone();
					}
				);
				test
				(
					'convertDocLink should resolve relative paths within subdirectories.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						// When viewing fable/fable/services/README.md, a relative link to logging.md
						Expect(tmpProvider.convertDocLink('logging.md', 'fable', 'fable', 'services/README.md')).to.equal('#/doc/fable/fable/services/logging.md');
						fDone();
					}
				);
				test
				(
					'convertDocLink should fall back to page routes without module context.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						Expect(tmpProvider.convertDocLink('architecture.md')).to.equal('#/page/architecture');
						Expect(tmpProvider.convertDocLink('getting-started.md')).to.equal('#/page/getting-started');
						fDone();
					}
				);
				test
				(
					'convertDocLink should handle non-catalog absolute paths as page routes.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						Expect(tmpProvider.convertDocLink('/unknown/path')).to.equal('#/page/unknown/path');
						fDone();
					}
				);
			}
		);

		suite
		(
			'Sidebar Markdown Parsing',
			function()
			{
				test
				(
					'parseSidebarMarkdown should parse groups and modules.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						var tmpSidebar = tmpProvider.parseSidebarMarkdown(
							'- [Home](/)\n'
							+ '- [Fable — Core Ecosystem](fable.md)\n'
							+ '  - [fable](/fable/fable/)\n'
							+ '  - [fable-log](/fable/fable-log/)\n'
							+ '- [Meadow — Data Access](meadow.md)\n'
							+ '  - [meadow](/meadow/meadow/)\n'
						);
						Expect(tmpSidebar).to.be.an('array');
						Expect(tmpSidebar.length).to.equal(3);

						// Home group
						Expect(tmpSidebar[0].Name).to.equal('Home');
						Expect(tmpSidebar[0].Route).to.equal('#/Home');
						Expect(tmpSidebar[0].Modules.length).to.equal(0);

						// Fable group
						Expect(tmpSidebar[1].Name).to.equal('Fable — Core Ecosystem');
						Expect(tmpSidebar[1].Key).to.equal('fable');
						Expect(tmpSidebar[1].Modules.length).to.equal(2);
						Expect(tmpSidebar[1].Modules[0].Name).to.equal('fable');
						Expect(tmpSidebar[1].Modules[0].Route).to.equal('#/doc/fable/fable');
						Expect(tmpSidebar[1].Modules[1].Name).to.equal('fable-log');

						// Meadow group
						Expect(tmpSidebar[2].Name).to.equal('Meadow — Data Access');
						Expect(tmpSidebar[2].Key).to.equal('meadow');
						Expect(tmpSidebar[2].Modules.length).to.equal(1);
						fDone();
					}
				);
				test
				(
					'parseSidebarMarkdown should handle plain text group headers.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						var tmpSidebar = tmpProvider.parseSidebarMarkdown(
							'- Getting Started\n'
							+ '  - [Architecture](architecture.md)\n'
						);
						Expect(tmpSidebar.length).to.equal(1);
						Expect(tmpSidebar[0].Name).to.equal('Getting Started');
						Expect(tmpSidebar[0].Route).to.equal('');
						Expect(tmpSidebar[0].Modules.length).to.equal(1);
						Expect(tmpSidebar[0].Modules[0].Name).to.equal('Architecture');
						fDone();
					}
				);
				test
				(
					'parseSidebarMarkdown should handle empty input.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						var tmpSidebar = tmpProvider.parseSidebarMarkdown('');
						Expect(tmpSidebar).to.be.an('array');
						Expect(tmpSidebar.length).to.equal(0);
						fDone();
					}
				);
			}
		);

		suite
		(
			'Cover Markdown Parsing',
			function()
			{
				test
				(
					'parseCover should extract all cover components.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						var tmpCover = tmpProvider.parseCover(
							'# Retold\n'
							+ '> A story-obsessed application suite\n'
							+ 'Build amazing web applications.\n'
							+ '- **Fable** — Core ecosystem\n'
							+ '- **Meadow** — Data access layer\n'
							+ '[Get Started](getting-started.md)\n'
							+ '[GitHub](https://github.com/stevenvelozo/retold)\n'
						);
						Expect(tmpCover).to.be.an('object');
						Expect(tmpCover.Title).to.equal('Retold');
						Expect(tmpCover.Tagline).to.equal('A story-obsessed application suite');
						Expect(tmpCover.Description).to.equal('Build amazing web applications.');
						Expect(tmpCover.Highlights.length).to.equal(2);
						Expect(tmpCover.Highlights[0].Label).to.equal('Fable');
						Expect(tmpCover.Highlights[0].Text).to.equal('Core ecosystem');
						Expect(tmpCover.Highlights[1].Label).to.equal('Meadow');
						Expect(tmpCover.Actions.length).to.equal(2);
						Expect(tmpCover.Actions[0].Text).to.equal('Get Started');
						Expect(tmpCover.Actions[0].Href).to.equal('getting-started.md');
						fDone();
					}
				);
				test
				(
					'parseCover should handle minimal input.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						var tmpCover = tmpProvider.parseCover('# My Docs\n');
						Expect(tmpCover.Title).to.equal('My Docs');
						Expect(tmpCover.Tagline).to.equal('');
						Expect(tmpCover.Highlights.length).to.equal(0);
						Expect(tmpCover.Actions.length).to.equal(0);
						fDone();
					}
				);
				test
				(
					'parseCover should handle empty input.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						var tmpCover = tmpProvider.parseCover('');
						Expect(tmpCover.Title).to.equal('');
						Expect(tmpCover.Tagline).to.equal('');
						Expect(tmpCover.Description).to.equal('');
						fDone();
					}
				);
			}
		);

		suite
		(
			'Top Bar Parsing',
			function()
			{
				test
				(
					'parseTopbar should extract brand and links.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						var tmpTopbar = tmpProvider.parseTopbar(
							'# Retold\n'
							+ '- [Getting Started](getting-started.md)\n'
							+ '- [Modules](modules.md)\n'
							+ '- [GitHub](https://github.com/stevenvelozo/retold)\n'
						);
						Expect(tmpTopbar.Brand).to.equal('Retold');
						Expect(tmpTopbar.NavLinks.length).to.equal(2);
						Expect(tmpTopbar.NavLinks[0].Text).to.equal('Getting Started');
						Expect(tmpTopbar.ExternalLinks.length).to.equal(1);
						Expect(tmpTopbar.ExternalLinks[0].Text).to.equal('GitHub');
						Expect(tmpTopbar.ExternalLinks[0].Href).to.equal('https://github.com/stevenvelozo/retold');
						fDone();
					}
				);
			}
		);

		suite
		(
			'Markdown Parsing',
			function()
			{
				test
				(
					'parseMarkdown should handle headings.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						var tmpResult = tmpProvider.parseMarkdown('# Hello World\n## Subheading');
						Expect(tmpResult).to.contain('<h1');
						Expect(tmpResult).to.contain('Hello World');
						Expect(tmpResult).to.contain('<h2');
						Expect(tmpResult).to.contain('Subheading');
						fDone();
					}
				);
				test
				(
					'parseMarkdown should handle code blocks.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						var tmpResult = tmpProvider.parseMarkdown('```javascript\nvar x = 1;\n```');
						Expect(tmpResult).to.contain('<pre>');
						Expect(tmpResult).to.contain('<code');
						Expect(tmpResult).to.contain('language-javascript');
						Expect(tmpResult).to.contain('var x = 1;');
						fDone();
					}
				);
				test
				(
					'parseMarkdown should handle mermaid blocks.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						var tmpResult = tmpProvider.parseMarkdown('```mermaid\ngraph TD\n  A-->B\n```');
						Expect(tmpResult).to.contain('<pre class="mermaid">');
						Expect(tmpResult).to.contain('graph TD');
						fDone();
					}
				);
				test
				(
					'parseMarkdown should handle unordered lists.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						var tmpResult = tmpProvider.parseMarkdown('- Item 1\n- Item 2\n- Item 3');
						Expect(tmpResult).to.contain('<ul>');
						Expect(tmpResult).to.contain('<li>');
						Expect(tmpResult).to.contain('Item 1');
						Expect(tmpResult).to.contain('Item 3');
						Expect(tmpResult).to.contain('</ul>');
						fDone();
					}
				);
				test
				(
					'parseMarkdown should handle ordered lists.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						var tmpResult = tmpProvider.parseMarkdown('1. First\n2. Second\n3. Third');
						Expect(tmpResult).to.contain('<ol>');
						Expect(tmpResult).to.contain('<li>');
						Expect(tmpResult).to.contain('First');
						Expect(tmpResult).to.contain('</ol>');
						fDone();
					}
				);
				test
				(
					'parseMarkdown should handle blockquotes.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						var tmpResult = tmpProvider.parseMarkdown('> This is a quote');
						Expect(tmpResult).to.contain('<blockquote>');
						Expect(tmpResult).to.contain('This is a quote');
						fDone();
					}
				);
				test
				(
					'parseMarkdown should handle horizontal rules.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						Expect(tmpProvider.parseMarkdown('---')).to.contain('<hr>');
						Expect(tmpProvider.parseMarkdown('***')).to.contain('<hr>');
						Expect(tmpProvider.parseMarkdown('___')).to.contain('<hr>');
						fDone();
					}
				);
				test
				(
					'parseMarkdown should handle tables.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						var tmpResult = tmpProvider.parseMarkdown(
							'| Name | Type |\n'
							+ '|------|------|\n'
							+ '| foo  | bar  |'
						);
						Expect(tmpResult).to.contain('<table>');
						Expect(tmpResult).to.contain('<th>');
						Expect(tmpResult).to.contain('Name');
						Expect(tmpResult).to.contain('<td>');
						Expect(tmpResult).to.contain('foo');
						Expect(tmpResult).to.contain('</table>');
						fDone();
					}
				);
				test
				(
					'parseMarkdown should handle empty input.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						Expect(tmpProvider.parseMarkdown('')).to.equal('');
						Expect(tmpProvider.parseMarkdown(null)).to.equal('');
						fDone();
					}
				);
				test
				(
					'parseMarkdown should handle math blocks.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						var tmpResult = tmpProvider.parseMarkdown('$$\nE = mc^2\n$$');
						Expect(tmpResult).to.contain('docuserve-katex-display');
						Expect(tmpResult).to.contain('E = mc^2');
						fDone();
					}
				);
				test
				(
					'parseMarkdown should handle nested code fences.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						var tmpResult = tmpProvider.parseMarkdown('````\n```\ninner\n```\n````');
						Expect(tmpResult).to.contain('<pre>');
						Expect(tmpResult).to.contain('inner');
						fDone();
					}
				);
			}
		);

		suite
		(
			'Inline Markdown Parsing',
			function()
			{
				test
				(
					'parseInline should handle bold text.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						Expect(tmpProvider.parseInline('**bold**')).to.contain('<strong>bold</strong>');
						Expect(tmpProvider.parseInline('__also bold__')).to.contain('<strong>also bold</strong>');
						fDone();
					}
				);
				test
				(
					'parseInline should handle italic text.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						Expect(tmpProvider.parseInline('*italic*')).to.contain('<em>italic</em>');
						fDone();
					}
				);
				test
				(
					'parseInline should handle inline code.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						Expect(tmpProvider.parseInline('use `npm install`')).to.contain('<code>npm install</code>');
						fDone();
					}
				);
				test
				(
					'parseInline should handle images.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						var tmpResult = tmpProvider.parseInline('![alt text](image.png)');
						Expect(tmpResult).to.contain('<img');
						Expect(tmpResult).to.contain('src="image.png"');
						Expect(tmpResult).to.contain('alt="alt text"');
						fDone();
					}
				);
				test
				(
					'parseInline should convert internal links to hash routes.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						var tmpResult = tmpProvider.parseInline('[Architecture](/fable/fable/architecture.md)');
						Expect(tmpResult).to.contain('#/doc/fable/fable/architecture.md');
						Expect(tmpResult).to.not.contain('target="_blank"');
						fDone();
					}
				);
				test
				(
					'parseInline should open external links in new tab.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						var tmpResult = tmpProvider.parseInline('[NPM](https://npmjs.com/package/fable)');
						Expect(tmpResult).to.contain('href="https://npmjs.com/package/fable"');
						Expect(tmpResult).to.contain('target="_blank"');
						fDone();
					}
				);
				test
				(
					'parseInline should convert GitHub URLs of catalog modules to internal routes.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						var tmpResult = tmpProvider.parseInline('[fable](https://github.com/stevenvelozo/fable)');
						Expect(tmpResult).to.contain('#/doc/fable/fable');
						Expect(tmpResult).to.not.contain('target="_blank"');
						fDone();
					}
				);
				test
				(
					'parseInline should leave non-catalog GitHub URLs as external links.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						var tmpResult = tmpProvider.parseInline('[react](https://github.com/facebook/react)');
						Expect(tmpResult).to.contain('href="https://github.com/facebook/react"');
						Expect(tmpResult).to.contain('target="_blank"');
						fDone();
					}
				);
				test
				(
					'parseInline should handle inline LaTeX.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						var tmpResult = tmpProvider.parseInline('The equation $E=mc^2$ is famous.');
						Expect(tmpResult).to.contain('docuserve-katex-inline');
						fDone();
					}
				);
				test
				(
					'parseInline should handle empty input.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						Expect(tmpProvider.parseInline('')).to.equal('');
						Expect(tmpProvider.parseInline(null)).to.equal('');
						fDone();
					}
				);
			}
		);

		suite
		(
			'HTML Escaping',
			function()
			{
				test
				(
					'escapeHTML should escape special characters.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						Expect(tmpProvider.escapeHTML('<script>alert("xss")</script>')).to.equal('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
						Expect(tmpProvider.escapeHTML("it's")).to.equal("it&#39;s");
						Expect(tmpProvider.escapeHTML('a & b')).to.equal('a &amp; b');
						fDone();
					}
				);
				test
				(
					'escapeHTML should handle empty input.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						Expect(tmpProvider.escapeHTML('')).to.equal('');
						Expect(tmpProvider.escapeHTML(null)).to.equal('');
						fDone();
					}
				);
			}
		);

		suite
		(
			'Error Page',
			function()
			{
				test
				(
					'getErrorPageHTML should return default page when no custom page loaded.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						var tmpResult = tmpProvider.getErrorPageHTML('/some/missing/path');
						Expect(tmpResult).to.contain('Page Not Found');
						Expect(tmpResult).to.contain('/some/missing/path');
						Expect(tmpResult).to.contain('#/Home');
						fDone();
					}
				);
				test
				(
					'getErrorPageHTML should use custom page when loaded.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						tmpProvider.pict.AppData.Docuserve.ErrorPageLoaded = true;
						tmpProvider.pict.AppData.Docuserve.ErrorPageHTML = '<div>Custom error for {{path}}</div>';
						var tmpResult = tmpProvider.getErrorPageHTML('test/doc.md');
						Expect(tmpResult).to.contain('Custom error for test/doc.md');
						fDone();
					}
				);
				test
				(
					'getErrorPageHTML should escape path in custom pages.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						tmpProvider.pict.AppData.Docuserve.ErrorPageLoaded = true;
						tmpProvider.pict.AppData.Docuserve.ErrorPageHTML = '<div>Error: {{path}}</div>';
						var tmpResult = tmpProvider.getErrorPageHTML('<script>alert("xss")</script>');
						Expect(tmpResult).to.not.contain('<script>');
						Expect(tmpResult).to.contain('&lt;script&gt;');
						fDone();
					}
				);
			}
		);

		suite
		(
			'Sidebar Data from Catalog',
			function()
			{
				test
				(
					'buildSidebarData should build groups and modules from catalog.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						tmpProvider.buildSidebarData(_MockCatalog);
						var tmpGroups = tmpProvider.pict.AppData.Docuserve.SidebarGroups;
						Expect(tmpGroups).to.be.an('array');
						Expect(tmpGroups.length).to.equal(4);

						Expect(tmpGroups[0].Name).to.equal('Fable');
						Expect(tmpGroups[0].Key).to.equal('fable');
						Expect(tmpGroups[0].Modules.length).to.equal(3);
						Expect(tmpGroups[0].Modules[0].Route).to.equal('#/doc/fable/fable');

						Expect(tmpGroups[1].Name).to.equal('Meadow');
						Expect(tmpGroups[1].Modules.length).to.equal(3);

						Expect(tmpGroups[2].Name).to.equal('Pict');
						Expect(tmpGroups[2].Modules.length).to.equal(2);
						fDone();
					}
				);
			}
		);

		suite
		(
			'Module Sidebar',
			function()
			{
				test
				(
					'getModuleSidebar should return sidebar for known modules.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						var tmpSidebar = tmpProvider.getModuleSidebar('fable', 'fable');
						Expect(tmpSidebar).to.be.an('array');
						fDone();
					}
				);
				test
				(
					'getModuleSidebar should return null for unknown modules.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						Expect(tmpProvider.getModuleSidebar('fable', 'nonexistent')).to.equal(null);
						Expect(tmpProvider.getModuleSidebar('fake', 'fable')).to.equal(null);
						fDone();
					}
				);
				test
				(
					'getModuleSidebar with no catalog should return null.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						tmpProvider._Catalog = null;
						Expect(tmpProvider.getModuleSidebar('fable', 'fable')).to.equal(null);
						fDone();
					}
				);
			}
		);

		suite
		(
			'Content Cache',
			function()
			{
				test
				(
					'Content cache should be empty on initialization.',
					(fDone) =>
					{
						var tmpProvider = createProvider();
						Expect(Object.keys(tmpProvider._ContentCache).length).to.equal(0);
						fDone();
					}
				);
			}
		);
	}
);
