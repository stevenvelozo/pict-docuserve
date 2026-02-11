const libPictProvider = require('pict-provider');
const libLunr = require('lunr');

/**
 * Documentation Provider for Docuserve
 *
 * Loads the Indoctrinate-generated catalog and keyword index,
 * fetches markdown documents from local paths or raw GitHub URLs,
 * and parses them into HTML for rendering.
 */
class DocuserveDocumentationProvider extends libPictProvider
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		this._Catalog = null;
		this._ContentCache = {};
	}

	/**
	 * Load all documentation data sources: catalog, cover.md, _sidebar.md.
	 *
	 * Loads the catalog first (it provides the fallback data), then attempts
	 * to load cover.md and _sidebar.md in parallel.  If those markdown files
	 * exist they drive the splash and sidebar views; otherwise the catalog
	 * data is used as a fallback.
	 *
	 * @param {Function} fCallback - Callback when all loading is complete
	 */
	loadCatalog(fCallback)
	{
		let tmpCallback = (typeof(fCallback) === 'function') ? fCallback : () => {};

		let tmpCatalogURL = this.pict.AppData.Docuserve.CatalogURL || 'retold-catalog.json';

		fetch(tmpCatalogURL)
			.then((pResponse) =>
			{
				if (!pResponse.ok)
				{
					this.log.warn(`Docuserve: Could not load catalog from [${tmpCatalogURL}].`);
					return null;
				}
				return pResponse.json();
			})
			.then((pCatalog) =>
			{
				if (pCatalog)
				{
					this._Catalog = pCatalog;
					this.pict.AppData.Docuserve.Catalog = pCatalog;
					this.pict.AppData.Docuserve.CatalogLoaded = true;

					// Build sidebar navigation data from the catalog as default
					this.buildSidebarData(pCatalog);
				}

				// Now try to load cover.md, _sidebar.md, _topbar.md, errorpage.md, and keyword index in parallel
				let tmpPending = 5;
				let tmpFinish = () =>
				{
					tmpPending--;
					if (tmpPending <= 0)
					{
						return tmpCallback();
					}
				};

				this.loadCover(tmpFinish);
				this.loadSidebar(tmpFinish);
				this.loadTopbar(tmpFinish);
				this.loadErrorPage(tmpFinish);
				this.loadKeywordIndex(tmpFinish);
			})
			.catch((pError) =>
			{
				this.log.warn(`Docuserve: Error loading catalog: ${pError}`);
				return tmpCallback();
			});
	}

	/**
	 * Fetch and parse cover.md into structured data for the splash view.
	 *
	 * The expected cover.md format follows the docsify convention:
	 *   # Title
	 *   > Tagline
	 *   Description paragraph text.
	 *   - **Group** — description
	 *   [Link Text](url)
	 *
	 * Parsed result stored in this.pict.AppData.Docuserve.Cover:
	 *   { Title, Tagline, Description, Highlights: [{Label, Text}], Actions: [{Text, Href}] }
	 *
	 * @param {Function} fCallback - Callback when done
	 */
	loadCover(fCallback)
	{
		let tmpCallback = (typeof(fCallback) === 'function') ? fCallback : () => {};
		let tmpDocsBase = this.pict.AppData.Docuserve.DocsBaseURL || '';

		fetch(tmpDocsBase + 'cover.md')
			.then((pResponse) =>
			{
				if (!pResponse.ok)
				{
					return null;
				}
				return pResponse.text();
			})
			.then((pMarkdown) =>
			{
				if (!pMarkdown)
				{
					this.log.info('Docuserve: No cover.md found; splash will use catalog data.');
					return tmpCallback();
				}

				this.pict.AppData.Docuserve.Cover = this.parseCover(pMarkdown);
				this.pict.AppData.Docuserve.CoverLoaded = true;
				return tmpCallback();
			})
			.catch((pError) =>
			{
				this.log.warn(`Docuserve: Error loading cover.md: ${pError}`);
				return tmpCallback();
			});
	}

	/**
	 * Parse cover.md markdown text into a structured object.
	 *
	 * @param {string} pMarkdown - Raw cover.md content
	 * @returns {Object} Parsed cover data
	 */
	parseCover(pMarkdown)
	{
		let tmpCover = {
			Title: '',
			Tagline: '',
			Description: '',
			Highlights: [],
			Actions: []
		};

		let tmpLines = pMarkdown.split('\n');

		for (let i = 0; i < tmpLines.length; i++)
		{
			let tmpLine = tmpLines[i].trim();

			if (!tmpLine)
			{
				continue;
			}

			// Heading — the title
			let tmpHeadingMatch = tmpLine.match(/^#+\s+(.+)/);
			if (tmpHeadingMatch)
			{
				tmpCover.Title = tmpHeadingMatch[1].trim();
				continue;
			}

			// Blockquote — the tagline
			let tmpBlockquoteMatch = tmpLine.match(/^>\s*(.*)/);
			if (tmpBlockquoteMatch)
			{
				tmpCover.Tagline = tmpBlockquoteMatch[1].trim();
				continue;
			}

			// Bullet list — highlights (e.g. "- **Fable** — Core ecosystem, DI, config")
			let tmpBulletMatch = tmpLine.match(/^[-*+]\s+(.*)/);
			if (tmpBulletMatch)
			{
				let tmpBulletContent = tmpBulletMatch[1];
				// Try to split on bold label: **Label** — rest
				let tmpLabelMatch = tmpBulletContent.match(/^\*\*([^*]+)\*\*\s*[-—:]\s*(.*)/);
				if (tmpLabelMatch)
				{
					tmpCover.Highlights.push({ Label: tmpLabelMatch[1].trim(), Text: tmpLabelMatch[2].trim() });
				}
				else
				{
					tmpCover.Highlights.push({ Label: '', Text: tmpBulletContent.trim() });
				}
				continue;
			}

			// Bare link — action button (e.g. "[Get Started](getting-started.md)")
			let tmpLinkMatch = tmpLine.match(/^\[([^\]]+)\]\(([^)]+)\)\s*$/);
			if (tmpLinkMatch)
			{
				tmpCover.Actions.push({ Text: tmpLinkMatch[1].trim(), Href: tmpLinkMatch[2].trim() });
				continue;
			}

			// Otherwise it's description text
			if (!tmpCover.Description)
			{
				tmpCover.Description = tmpLine;
			}
			else
			{
				tmpCover.Description += ' ' + tmpLine;
			}
		}

		return tmpCover;
	}

	/**
	 * Fetch and parse _sidebar.md into structured navigation data.
	 *
	 * The expected _sidebar.md format follows the docsify convention:
	 *   - [Home](/)
	 *   - Group Title
	 *     - [module-name](/group/module/)
	 *   - [Group Title](group.md)
	 *     - [module-name](/group/module/)
	 *
	 * If _sidebar.md is successfully loaded and parsed, its data replaces
	 * the catalog-inferred SidebarGroups in AppData.
	 *
	 * @param {Function} fCallback - Callback when done
	 */
	loadSidebar(fCallback)
	{
		let tmpCallback = (typeof(fCallback) === 'function') ? fCallback : () => {};
		let tmpDocsBase = this.pict.AppData.Docuserve.DocsBaseURL || '';

		fetch(tmpDocsBase + '_sidebar.md')
			.then((pResponse) =>
			{
				if (!pResponse.ok)
				{
					return null;
				}
				return pResponse.text();
			})
			.then((pMarkdown) =>
			{
				if (!pMarkdown)
				{
					this.log.info('Docuserve: No _sidebar.md found; sidebar will use catalog data.');
					return tmpCallback();
				}

				let tmpSidebarData = this.parseSidebarMarkdown(pMarkdown);
				if (tmpSidebarData && tmpSidebarData.length > 0)
				{
					this.pict.AppData.Docuserve.SidebarGroups = tmpSidebarData;
					this.pict.AppData.Docuserve.SidebarLoaded = true;
				}
				return tmpCallback();
			})
			.catch((pError) =>
			{
				this.log.warn(`Docuserve: Error loading _sidebar.md: ${pError}`);
				return tmpCallback();
			});
	}

	/**
	 * Fetch and parse _topbar.md into structured data for the top bar view.
	 *
	 * The expected _topbar.md format:
	 *   # Brand Name
	 *   - [Link Text](url)
	 *   - [Link Text](url)
	 *
	 * The heading becomes the brand/title shown on the left.  List items become
	 * navigation links.  External links (starting with http) render on the
	 * right side; internal links render in the centre nav area.
	 *
	 * Parsed result stored in this.pict.AppData.Docuserve.TopBar:
	 *   { Brand, NavLinks: [{Text, Href, External}], ExternalLinks: [{Text, Href}] }
	 *
	 * @param {Function} fCallback - Callback when done
	 */
	loadTopbar(fCallback)
	{
		let tmpCallback = (typeof(fCallback) === 'function') ? fCallback : () => {};
		let tmpDocsBase = this.pict.AppData.Docuserve.DocsBaseURL || '';

		fetch(tmpDocsBase + '_topbar.md')
			.then((pResponse) =>
			{
				if (!pResponse.ok)
				{
					return null;
				}
				return pResponse.text();
			})
			.then((pMarkdown) =>
			{
				if (!pMarkdown)
				{
					this.log.info('Docuserve: No _topbar.md found; top bar will use defaults.');
					return tmpCallback();
				}

				this.pict.AppData.Docuserve.TopBar = this.parseTopbar(pMarkdown);
				this.pict.AppData.Docuserve.TopBarLoaded = true;
				return tmpCallback();
			})
			.catch((pError) =>
			{
				this.log.warn(`Docuserve: Error loading _topbar.md: ${pError}`);
				return tmpCallback();
			});
	}

	/**
	 * Parse _topbar.md markdown text into a structured object.
	 *
	 * @param {string} pMarkdown - Raw _topbar.md content
	 * @returns {Object} Parsed top bar data { Brand, NavLinks, ExternalLinks }
	 */
	parseTopbar(pMarkdown)
	{
		let tmpTopBar = {
			Brand: '',
			NavLinks: [],
			ExternalLinks: []
		};

		let tmpLines = pMarkdown.split('\n');

		for (let i = 0; i < tmpLines.length; i++)
		{
			let tmpLine = tmpLines[i].trim();

			if (!tmpLine)
			{
				continue;
			}

			// Heading — the brand name
			let tmpHeadingMatch = tmpLine.match(/^#+\s+(.+)/);
			if (tmpHeadingMatch)
			{
				tmpTopBar.Brand = tmpHeadingMatch[1].trim();
				continue;
			}

			// Bullet list item with link
			let tmpBulletMatch = tmpLine.match(/^[-*+]\s+(.*)/);
			if (tmpBulletMatch)
			{
				let tmpContent = tmpBulletMatch[1].trim();
				let tmpLinkMatch = tmpContent.match(/^\[([^\]]+)\]\(([^)]+)\)/);

				if (tmpLinkMatch)
				{
					let tmpText = tmpLinkMatch[1].trim();
					let tmpHref = tmpLinkMatch[2].trim();

					// External links (http/https) go to the right side
					if (tmpHref.match(/^https?:\/\//))
					{
						tmpTopBar.ExternalLinks.push({ Text: tmpText, Href: tmpHref });
					}
					else
					{
						// Internal link — convert to hash route
						let tmpRoute = this.convertSidebarLink(tmpHref);
						tmpTopBar.NavLinks.push({ Text: tmpText, Href: tmpRoute });
					}
				}
				continue;
			}
		}

		return tmpTopBar;
	}

	/**
	 * Fetch and parse errorpage.md into HTML for use as a custom error page.
	 *
	 * The errorpage.md is a standard markdown file.  If it contains the
	 * placeholder `{{path}}` anywhere in its source, that token will be
	 * replaced with the actual requested path at display time (via
	 * getErrorPageHTML).
	 *
	 * @param {Function} fCallback - Callback when done
	 */
	loadErrorPage(fCallback)
	{
		let tmpCallback = (typeof(fCallback) === 'function') ? fCallback : () => {};
		let tmpDocsBase = this.pict.AppData.Docuserve.DocsBaseURL || '';

		fetch(tmpDocsBase + 'errorpage.md')
			.then((pResponse) =>
			{
				if (!pResponse.ok)
				{
					return null;
				}
				return pResponse.text();
			})
			.then((pMarkdown) =>
			{
				if (!pMarkdown)
				{
					this.log.info('Docuserve: No errorpage.md found; errors will use default page.');
					return tmpCallback();
				}

				this.pict.AppData.Docuserve.ErrorPageHTML = this.parseMarkdown(pMarkdown);
				this.pict.AppData.Docuserve.ErrorPageLoaded = true;
				return tmpCallback();
			})
			.catch((pError) =>
			{
				this.log.warn(`Docuserve: Error loading errorpage.md: ${pError}`);
				return tmpCallback();
			});
	}

	/**
	 * Load the keyword search index (retold-keyword-index.json).
	 *
	 * If the index file exists, hydrates a lunr.Index for client-side search
	 * and stores the document metadata map.  If the file is not found, search
	 * features will simply not appear in the UI.
	 *
	 * @param {Function} fCallback - Callback when done
	 */
	loadKeywordIndex(fCallback)
	{
		let tmpCallback = (typeof(fCallback) === 'function') ? fCallback : () => {};
		let tmpDocsBase = this.pict.AppData.Docuserve.DocsBaseURL || '';

		fetch(tmpDocsBase + 'retold-keyword-index.json')
			.then((pResponse) =>
			{
				if (!pResponse.ok)
				{
					return null;
				}
				return pResponse.json();
			})
			.then((pIndexData) =>
			{
				if (!pIndexData || !pIndexData.LunrIndex || !pIndexData.Documents)
				{
					this.log.info('Docuserve: No keyword index found; search will be unavailable.');
					return tmpCallback();
				}

				try
				{
					this._LunrIndex = libLunr.Index.load(pIndexData.LunrIndex);
					this._KeywordDocuments = pIndexData.Documents;
					this.pict.AppData.Docuserve.KeywordIndexLoaded = true;
					this.pict.AppData.Docuserve.KeywordDocumentCount = pIndexData.DocumentCount || 0;
					this.log.info(`Docuserve: Keyword index loaded (${pIndexData.DocumentCount || 0} documents).`);
				}
				catch (pError)
				{
					this.log.warn(`Docuserve: Error hydrating lunr index: ${pError}`);
				}

				return tmpCallback();
			})
			.catch((pError) =>
			{
				this.log.warn(`Docuserve: Error loading keyword index: ${pError}`);
				return tmpCallback();
			});
	}

	/**
	 * Check whether a group/module pair exists in the loaded catalog.
	 *
	 * Used by search() to decide whether a result should route to
	 * #/doc/ (catalog module → GitHub raw URL) or #/page/ (local doc).
	 *
	 * @param {string} pGroup - The group key (e.g. "fable")
	 * @param {string} pModule - The module name (e.g. "fable")
	 * @returns {boolean} True if the module is found in the catalog
	 */
	isModuleInCatalog(pGroup, pModule)
	{
		if (!this._Catalog || !this._Catalog.Groups)
		{
			return false;
		}

		for (let i = 0; i < this._Catalog.Groups.length; i++)
		{
			let tmpGroup = this._Catalog.Groups[i];
			if (tmpGroup.Key !== pGroup)
			{
				continue;
			}

			for (let j = 0; j < tmpGroup.Modules.length; j++)
			{
				let tmpModule = tmpGroup.Modules[j];
				if (tmpModule.Name === pModule)
				{
					return true;
				}
			}
		}

		return false;
	}

	/**
	 * Search the keyword index for documents matching a query.
	 *
	 * Returns an array of result objects sorted by relevance:
	 *   [{ Key, Title, Group, Module, DocPath, Score, Route }]
	 *
	 * @param {string} pQuery - The search query
	 * @returns {Array} Search results (empty if no index or no matches)
	 */
	search(pQuery)
	{
		if (!this._LunrIndex || !this._KeywordDocuments || !pQuery || !pQuery.trim())
		{
			return [];
		}

		let tmpResults = [];

		try
		{
			let tmpLunrResults = this._LunrIndex.search(pQuery);

			for (let i = 0; i < tmpLunrResults.length; i++)
			{
				let tmpRef = tmpLunrResults[i].ref;
				let tmpScore = tmpLunrResults[i].score;
				let tmpDoc = this._KeywordDocuments[tmpRef];

				if (!tmpDoc)
				{
					continue;
				}

				// Build the hash route from the document key (group/module/docpath)
				let tmpParts = tmpRef.split('/');
				let tmpRoute = '';
				if (tmpParts.length >= 2)
				{
					// Check whether this group/module exists in the catalog.
					// If it does, route to #/doc/ which fetches from GitHub.
					// If not, fall back to #/page/ which fetches locally.
					let tmpGroup = tmpParts[0];
					let tmpModule = tmpParts[1];

					if (this.isModuleInCatalog(tmpGroup, tmpModule))
					{
						tmpRoute = '#/doc/' + tmpRef;
					}
					else
					{
						// Local document — route via #/page/ using the full ref path
						tmpRoute = '#/page/' + tmpRef;
					}
				}

				tmpResults.push({
					Key: tmpRef,
					Title: tmpDoc.Title || tmpRef,
					Group: tmpDoc.Group || '',
					Module: tmpDoc.Module || '',
					DocPath: tmpDoc.DocPath || '',
					Score: tmpScore,
					Route: tmpRoute
				});
			}
		}
		catch (pError)
		{
			this.log.warn(`Docuserve: Search error: ${pError}`);
		}

		return tmpResults;
	}

	/**
	 * Get the error page HTML for a given requested path.
	 *
	 * If a custom errorpage.md was loaded, its parsed HTML is returned with
	 * the `{{path}}` placeholder replaced by the actual requested path.
	 * Otherwise a default not-found HTML block is returned.
	 *
	 * @param {string} pRequestedPath - The path that was not found
	 * @returns {string} HTML to display
	 */
	getErrorPageHTML(pRequestedPath)
	{
		let tmpPath = pRequestedPath || 'unknown';

		if (this.pict.AppData.Docuserve.ErrorPageLoaded && this.pict.AppData.Docuserve.ErrorPageHTML)
		{
			// Replace the {{path}} placeholder with the actual requested path
			return this.pict.AppData.Docuserve.ErrorPageHTML.replace(/\{\{path\}\}/g, this.escapeHTML(tmpPath));
		}

		// Default fallback
		return '<div class="docuserve-not-found">'
			+ '<h2>Page Not Found</h2>'
			+ '<p>The document <code>' + this.escapeHTML(tmpPath) + '</code> could not be loaded.</p>'
			+ '<p><a href="#/Home">Return to the home page</a></p>'
			+ '</div>';
	}

	/**
	 * Parse _sidebar.md into the SidebarGroups format the sidebar view consumes.
	 *
	 * Returns an array of group objects:
	 *   [{ Name, Key, Route, Modules: [{ Name, HasDocs, Group, Route }] }]
	 *
	 * Top-level items (no indent) become groups.  Indented child items become
	 * modules within the preceding group.  The special "Home" entry is stored
	 * as a group with no modules.
	 *
	 * @param {string} pMarkdown - Raw _sidebar.md content
	 * @returns {Array} Parsed sidebar groups
	 */
	parseSidebarMarkdown(pMarkdown)
	{
		let tmpGroups = [];
		let tmpCurrentGroup = null;
		let tmpLines = pMarkdown.split('\n');

		for (let i = 0; i < tmpLines.length; i++)
		{
			let tmpLine = tmpLines[i];

			if (!tmpLine.trim())
			{
				continue;
			}

			// Detect indent level: child items have 2+ leading spaces
			let tmpIndentMatch = tmpLine.match(/^(\s*)/);
			let tmpIndent = tmpIndentMatch ? tmpIndentMatch[1].length : 0;
			let tmpContent = tmpLine.trim();

			// Must start with a list marker
			let tmpListMatch = tmpContent.match(/^[-*+]\s+(.*)/);
			if (!tmpListMatch)
			{
				continue;
			}

			let tmpItemContent = tmpListMatch[1].trim();

			// Parse link if present: [Text](href)
			let tmpLinkMatch = tmpItemContent.match(/^\[([^\]]+)\]\(([^)]+)\)/);

			if (tmpIndent < 2)
			{
				// Top-level item — this is a group header or standalone link
				if (tmpLinkMatch)
				{
					let tmpName = tmpLinkMatch[1].trim();
					let tmpHref = tmpLinkMatch[2].trim();

					// Derive a group key from the href or name
					let tmpKey = this.deriveGroupKey(tmpName, tmpHref);
					let tmpRoute = this.convertSidebarLink(tmpHref);

					tmpCurrentGroup = {
						Name: tmpName,
						Key: tmpKey,
						Route: tmpRoute,
						Modules: []
					};
					tmpGroups.push(tmpCurrentGroup);
				}
				else
				{
					// Plain text group header (no link)
					let tmpName = tmpItemContent;
					let tmpKey = tmpName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

					tmpCurrentGroup = {
						Name: tmpName,
						Key: tmpKey,
						Route: '',
						Modules: []
					};
					tmpGroups.push(tmpCurrentGroup);
				}
			}
			else if (tmpCurrentGroup)
			{
				// Indented item — this is a module within the current group
				if (tmpLinkMatch)
				{
					let tmpModuleName = tmpLinkMatch[1].trim();
					let tmpModuleHref = tmpLinkMatch[2].trim();
					let tmpModuleRoute = this.convertSidebarLink(tmpModuleHref);

					tmpCurrentGroup.Modules.push({
						Name: tmpModuleName,
						HasDocs: true,
						Group: tmpCurrentGroup.Key,
						Route: tmpModuleRoute
					});
				}
				else
				{
					// Plain text child entry (no docs link)
					tmpCurrentGroup.Modules.push({
						Name: tmpItemContent,
						HasDocs: false,
						Group: tmpCurrentGroup.Key,
						Route: ''
					});
				}
			}
		}

		return tmpGroups;
	}

	/**
	 * Convert a docsify-style sidebar link href into a docuserve hash route.
	 *
	 * Handles these forms:
	 *   /                        -> #/Home
	 *   /group/module/           -> #/doc/group/module
	 *   /group/module/path.md    -> #/doc/group/module/path.md
	 *   something.md             -> #/page/something
	 *
	 * @param {string} pHref - The original sidebar link href
	 * @returns {string} The converted hash route
	 */
	convertSidebarLink(pHref)
	{
		if (!pHref)
		{
			return '';
		}

		// Root home link
		if (pHref === '/')
		{
			return '#/Home';
		}

		// Strip leading/trailing slashes for parsing
		let tmpPath = pHref.replace(/^\//, '').replace(/\/$/, '');

		if (!tmpPath)
		{
			return '#/Home';
		}

		let tmpParts = tmpPath.split('/');

		// Check if it's a module path (group/module)
		if (tmpParts.length >= 2)
		{
			let tmpGroupKeys = ['fable', 'meadow', 'orator', 'pict', 'utility'];
			if (tmpGroupKeys.indexOf(tmpParts[0]) >= 0)
			{
				return '#/doc/' + tmpPath;
			}
		}

		// Local page reference
		if (tmpPath.match(/\.md$/))
		{
			return '#/page/' + tmpPath.replace(/\.md$/, '');
		}

		return '#/page/' + tmpPath;
	}

	/**
	 * Derive a short group key from a sidebar group name or href.
	 *
	 * @param {string} pName - The display name (e.g. "Fable — Core Ecosystem")
	 * @param {string} pHref - The link href (e.g. "fable.md")
	 * @returns {string} A short key (e.g. "fable")
	 */
	deriveGroupKey(pName, pHref)
	{
		// Try href first — "fable.md" -> "fable"
		if (pHref && pHref !== '/')
		{
			let tmpFromHref = pHref.replace(/^\//, '').replace(/\.md$/, '').replace(/\/$/, '');
			if (tmpFromHref && !tmpFromHref.includes('/'))
			{
				return tmpFromHref.toLowerCase();
			}
		}

		// Fall back to first word of name lowercased
		let tmpFirstWord = pName.split(/[\s—\-:]+/)[0];
		return tmpFirstWord.toLowerCase().replace(/[^a-z0-9]/g, '');
	}

	/**
	 * Build structured sidebar data from the catalog for the sidebar view.
	 *
	 * @param {Object} pCatalog - The parsed retold-catalog.json
	 */
	buildSidebarData(pCatalog)
	{
		let tmpSidebarGroups = [];

		for (let i = 0; i < pCatalog.Groups.length; i++)
		{
			let tmpGroup = pCatalog.Groups[i];
			let tmpGroupEntry = {
				Name: tmpGroup.Name,
				Key: tmpGroup.Key,
				Description: tmpGroup.Description,
				Modules: []
			};

			for (let j = 0; j < tmpGroup.Modules.length; j++)
			{
				let tmpModule = tmpGroup.Modules[j];
				tmpGroupEntry.Modules.push({
					Name: tmpModule.Name,
					HasDocs: tmpModule.HasDocs,
					Group: tmpGroup.Key,
					Route: '#/doc/' + tmpGroup.Key + '/' + tmpModule.Name
				});
			}

			tmpSidebarGroups.push(tmpGroupEntry);
		}

		this.pict.AppData.Docuserve.SidebarGroups = tmpSidebarGroups;
	}

	/**
	 * Resolve a document URL from group/module/path to a fetchable URL.
	 *
	 * @param {string} pGroup - The group key (e.g. 'fable')
	 * @param {string} pModule - The module name (e.g. 'fable')
	 * @param {string} pPath - The document path within the module docs (e.g. 'README.md')
	 * @returns {string} The resolved URL
	 */
	resolveDocumentURL(pGroup, pModule, pPath)
	{
		if (!this._Catalog)
		{
			return null;
		}

		let tmpOrg = this._Catalog.GitHubOrg || 'stevenvelozo';
		let tmpDefaultBranch = this._Catalog.DefaultBranch || 'master';

		// Find the module in the catalog
		for (let i = 0; i < this._Catalog.Groups.length; i++)
		{
			let tmpGroup = this._Catalog.Groups[i];
			if (tmpGroup.Key !== pGroup)
			{
				continue;
			}

			for (let j = 0; j < tmpGroup.Modules.length; j++)
			{
				let tmpModule = tmpGroup.Modules[j];
				if (tmpModule.Name !== pModule)
				{
					continue;
				}

				let tmpBranch = tmpModule.Branch || tmpDefaultBranch;
				let tmpDocPath = pPath || 'README.md';
				return 'https://raw.githubusercontent.com/' + tmpOrg + '/' + tmpModule.Repo + '/' + tmpBranch + '/docs/' + tmpDocPath;
			}
		}

		return null;
	}

	/**
	 * Get the module-specific sidebar entries for a given group/module.
	 *
	 * @param {string} pGroup - The group key
	 * @param {string} pModule - The module name
	 * @returns {Array|null} The sidebar entries or null
	 */
	getModuleSidebar(pGroup, pModule)
	{
		if (!this._Catalog)
		{
			return null;
		}

		for (let i = 0; i < this._Catalog.Groups.length; i++)
		{
			let tmpGroup = this._Catalog.Groups[i];
			if (tmpGroup.Key !== pGroup)
			{
				continue;
			}

			for (let j = 0; j < tmpGroup.Modules.length; j++)
			{
				let tmpModule = tmpGroup.Modules[j];
				if (tmpModule.Name !== pModule)
				{
					continue;
				}

				return tmpModule.Sidebar || null;
			}
		}

		return null;
	}

	/**
	 * Fetch a markdown document and convert it to HTML.
	 *
	 * @param {string} pURL - The URL to fetch
	 * @param {Function} fCallback - Callback receiving (error, htmlContent)
	 */
	fetchDocument(pURL, fCallback)
	{
		let tmpCallback = (typeof(fCallback) === 'function') ? fCallback : () => {};

		if (!pURL)
		{
			return tmpCallback('No URL provided', '');
		}

		// Check cache
		if (this._ContentCache[pURL])
		{
			return tmpCallback(null, this._ContentCache[pURL]);
		}

		fetch(pURL)
			.then((pResponse) =>
			{
				if (!pResponse.ok)
				{
					return null;
				}
				return pResponse.text();
			})
			.then((pMarkdown) =>
			{
				if (!pMarkdown)
				{
					return tmpCallback('Document not found', this.getErrorPageHTML(pURL));
				}

				let tmpHTML = this.parseMarkdown(pMarkdown);
				this._ContentCache[pURL] = tmpHTML;
				return tmpCallback(null, tmpHTML);
			})
			.catch((pError) =>
			{
				this.log.warn(`Docuserve: Error fetching document [${pURL}]: ${pError}`);
				return tmpCallback(pError, this.getErrorPageHTML(pURL));
			});
	}

	/**
	 * Fetch a local document relative to the docs folder.
	 *
	 * @param {string} pPath - The relative path (e.g. 'architecture.md')
	 * @param {Function} fCallback - Callback receiving (error, htmlContent)
	 */
	fetchLocalDocument(pPath, fCallback)
	{
		let tmpDocsBase = this.pict.AppData.Docuserve.DocsBaseURL || '';
		let tmpURL = tmpDocsBase + pPath;
		this.fetchDocument(tmpURL, fCallback);
	}

	/**
	 * Parse a markdown string into HTML.
	 *
	 * This is a basic markdown parser that handles the most common constructs:
	 * headings, paragraphs, code blocks, inline code, links, bold, italic,
	 * lists, blockquotes, and horizontal rules.
	 *
	 * @param {string} pMarkdown - The raw markdown text
	 * @returns {string} The parsed HTML
	 */
	parseMarkdown(pMarkdown)
	{
		if (!pMarkdown)
		{
			return '';
		}

		let tmpLines = pMarkdown.split('\n');
		let tmpHTML = [];
		let tmpInCodeBlock = false;
		let tmpCodeFenceLength = 0;
		let tmpCodeLang = '';
		let tmpCodeLines = [];
		let tmpInList = false;
		let tmpListType = '';
		let tmpInBlockquote = false;
		let tmpBlockquoteLines = [];
		let tmpInMathBlock = false;
		let tmpMathLines = [];

		for (let i = 0; i < tmpLines.length; i++)
		{
			let tmpLine = tmpLines[i];

			// Display math blocks ($$...$$) — skip if inside a code block
			if (!tmpInCodeBlock && tmpLine.trim().match(/^\$\$/))
			{
				if (tmpInMathBlock)
				{
					// End math block
					tmpHTML.push('<div class="docuserve-katex-display">' + tmpMathLines.join('\n') + '</div>');
					tmpInMathBlock = false;
					tmpMathLines = [];
				}
				else
				{
					// Close any open list or blockquote
					if (tmpInList)
					{
						tmpHTML.push(tmpListType === 'ul' ? '</ul>' : '</ol>');
						tmpInList = false;
					}
					if (tmpInBlockquote)
					{
						tmpHTML.push('<blockquote>' + this.parseMarkdown(tmpBlockquoteLines.join('\n')) + '</blockquote>');
						tmpInBlockquote = false;
						tmpBlockquoteLines = [];
					}
					tmpInMathBlock = true;
				}
				continue;
			}

			if (tmpInMathBlock)
			{
				tmpMathLines.push(tmpLine);
				continue;
			}

			// Code blocks (fenced) — track fence length so ````x```` nests around ```y```
			let tmpFenceMatch = tmpLine.match(/^(`{3,})/);
			if (tmpFenceMatch)
			{
				let tmpFenceLen = tmpFenceMatch[1].length;

				if (tmpInCodeBlock)
				{
					// Only close if the closing fence is at least as long as the opening
					if (tmpFenceLen >= tmpCodeFenceLength && tmpLine.trim() === tmpFenceMatch[1])
					{
						// End code block
						if (tmpCodeLang === 'mermaid')
						{
							// Mermaid diagrams: output raw content for client-side rendering
							tmpHTML.push('<pre class="mermaid">' + tmpCodeLines.join('\n') + '</pre>');
						}
						else
						{
							tmpHTML.push('<pre><code class="language-' + this.escapeHTML(tmpCodeLang) + '">' + this.escapeHTML(tmpCodeLines.join('\n')) + '</code></pre>');
						}
						tmpInCodeBlock = false;
						tmpCodeFenceLength = 0;
						tmpCodeLang = '';
						tmpCodeLines = [];
						continue;
					}
					else
					{
						// Inner fence with fewer backticks — treat as content
						tmpCodeLines.push(tmpLine);
						continue;
					}
				}
				else
				{
					// Close any open list or blockquote
					if (tmpInList)
					{
						tmpHTML.push(tmpListType === 'ul' ? '</ul>' : '</ol>');
						tmpInList = false;
					}
					if (tmpInBlockquote)
					{
						tmpHTML.push('<blockquote>' + this.parseMarkdown(tmpBlockquoteLines.join('\n')) + '</blockquote>');
						tmpInBlockquote = false;
						tmpBlockquoteLines = [];
					}
					// Start code block — record fence length
					tmpCodeFenceLength = tmpFenceLen;
					tmpCodeLang = tmpLine.replace(/^`{3,}/, '').trim();
					tmpInCodeBlock = true;
					continue;
				}
			}

			if (tmpInCodeBlock)
			{
				tmpCodeLines.push(tmpLine);
				continue;
			}

			// Blockquotes
			if (tmpLine.match(/^>\s?/))
			{
				if (!tmpInBlockquote)
				{
					// Close any open list
					if (tmpInList)
					{
						tmpHTML.push(tmpListType === 'ul' ? '</ul>' : '</ol>');
						tmpInList = false;
					}
					tmpInBlockquote = true;
					tmpBlockquoteLines = [];
				}
				tmpBlockquoteLines.push(tmpLine.replace(/^>\s?/, ''));
				continue;
			}
			else if (tmpInBlockquote)
			{
				tmpHTML.push('<blockquote>' + this.parseMarkdown(tmpBlockquoteLines.join('\n')) + '</blockquote>');
				tmpInBlockquote = false;
				tmpBlockquoteLines = [];
			}

			// Horizontal rule
			if (tmpLine.match(/^(-{3,}|\*{3,}|_{3,})\s*$/))
			{
				if (tmpInList)
				{
					tmpHTML.push(tmpListType === 'ul' ? '</ul>' : '</ol>');
					tmpInList = false;
				}
				tmpHTML.push('<hr>');
				continue;
			}

			// Headings
			let tmpHeadingMatch = tmpLine.match(/^(#{1,6})\s+(.+)/);
			if (tmpHeadingMatch)
			{
				if (tmpInList)
				{
					tmpHTML.push(tmpListType === 'ul' ? '</ul>' : '</ol>');
					tmpInList = false;
				}
				let tmpLevel = tmpHeadingMatch[1].length;
				let tmpText = this.parseInline(tmpHeadingMatch[2]);
				let tmpID = tmpHeadingMatch[2].toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
				tmpHTML.push('<h' + tmpLevel + ' id="' + tmpID + '">' + tmpText + '</h' + tmpLevel + '>');
				continue;
			}

			// Unordered list items
			let tmpULMatch = tmpLine.match(/^(\s*)[-*+]\s+(.*)/);
			if (tmpULMatch)
			{
				if (!tmpInList || tmpListType !== 'ul')
				{
					if (tmpInList)
					{
						tmpHTML.push(tmpListType === 'ul' ? '</ul>' : '</ol>');
					}
					tmpHTML.push('<ul>');
					tmpInList = true;
					tmpListType = 'ul';
				}
				tmpHTML.push('<li>' + this.parseInline(tmpULMatch[2]) + '</li>');
				continue;
			}

			// Ordered list items
			let tmpOLMatch = tmpLine.match(/^(\s*)\d+\.\s+(.*)/);
			if (tmpOLMatch)
			{
				if (!tmpInList || tmpListType !== 'ol')
				{
					if (tmpInList)
					{
						tmpHTML.push(tmpListType === 'ul' ? '</ul>' : '</ol>');
					}
					tmpHTML.push('<ol>');
					tmpInList = true;
					tmpListType = 'ol';
				}
				tmpHTML.push('<li>' + this.parseInline(tmpOLMatch[2]) + '</li>');
				continue;
			}

			// Close list if we've left list items
			if (tmpInList && tmpLine.trim() !== '')
			{
				tmpHTML.push(tmpListType === 'ul' ? '</ul>' : '</ol>');
				tmpInList = false;
			}

			// Empty line
			if (tmpLine.trim() === '')
			{
				continue;
			}

			// Table detection
			if (tmpLine.match(/^\|/) && i + 1 < tmpLines.length && tmpLines[i + 1].match(/^\|[\s-:|]+\|/))
			{
				// Close any open list
				if (tmpInList)
				{
					tmpHTML.push(tmpListType === 'ul' ? '</ul>' : '</ol>');
					tmpInList = false;
				}

				let tmpTableHTML = '<table>';

				// Header row
				let tmpHeaders = tmpLine.split('|').filter((pCell) => { return pCell.trim() !== ''; });
				tmpTableHTML += '<thead><tr>';
				for (let h = 0; h < tmpHeaders.length; h++)
				{
					tmpTableHTML += '<th>' + this.parseInline(tmpHeaders[h].trim()) + '</th>';
				}
				tmpTableHTML += '</tr></thead>';

				// Skip separator row
				i++;

				// Body rows
				tmpTableHTML += '<tbody>';
				while (i + 1 < tmpLines.length && tmpLines[i + 1].match(/^\|/))
				{
					i++;
					let tmpCells = tmpLines[i].split('|').filter((pCell) => { return pCell.trim() !== ''; });
					tmpTableHTML += '<tr>';
					for (let c = 0; c < tmpCells.length; c++)
					{
						tmpTableHTML += '<td>' + this.parseInline(tmpCells[c].trim()) + '</td>';
					}
					tmpTableHTML += '</tr>';
				}
				tmpTableHTML += '</tbody></table>';
				tmpHTML.push(tmpTableHTML);
				continue;
			}

			// Regular paragraph
			tmpHTML.push('<p>' + this.parseInline(tmpLine) + '</p>');
		}

		// Close any trailing open elements
		if (tmpInList)
		{
			tmpHTML.push(tmpListType === 'ul' ? '</ul>' : '</ol>');
		}
		if (tmpInBlockquote)
		{
			tmpHTML.push('<blockquote>' + this.parseMarkdown(tmpBlockquoteLines.join('\n')) + '</blockquote>');
		}
		if (tmpInCodeBlock)
		{
			tmpHTML.push('<pre><code>' + this.escapeHTML(tmpCodeLines.join('\n')) + '</code></pre>');
		}

		return tmpHTML.join('\n');
	}

	/**
	 * Parse inline markdown elements (bold, italic, code, links, images).
	 *
	 * @param {string} pText - The text to parse
	 * @returns {string} HTML with inline elements
	 */
	parseInline(pText)
	{
		if (!pText)
		{
			return '';
		}

		let tmpResult = pText;

		// Inline code (backticks) - handle first to avoid interfering with other patterns
		tmpResult = tmpResult.replace(/`([^`]+)`/g, '<code>$1</code>');

		// Inline LaTeX equations ($...$) — must be processed before other inline patterns
		// Match single $ delimiters that aren't adjacent to spaces (to avoid false positives with currency)
		tmpResult = tmpResult.replace(/\$([^\$\s][^\$]*?[^\$\s])\$/g, '<span class="docuserve-katex-inline">$1</span>');
		// Also match single-character inline math like $x$
		tmpResult = tmpResult.replace(/\$([^\$\s])\$/g, '<span class="docuserve-katex-inline">$1</span>');

		// Images
		tmpResult = tmpResult.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');

		// Links
		tmpResult = tmpResult.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (pMatch, pLinkText, pHref) =>
		{
			// Convert internal doc links to hash routes
			if (pHref.match(/^\//) || pHref.match(/^[^:]+\.md/))
			{
				let tmpRoute = this.convertDocLink(pHref);
				return '<a href="' + tmpRoute + '">' + pLinkText + '</a>';
			}
			return '<a href="' + pHref + '" target="_blank" rel="noopener">' + pLinkText + '</a>';
		});

		// Bold
		tmpResult = tmpResult.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
		tmpResult = tmpResult.replace(/__([^_]+)__/g, '<strong>$1</strong>');

		// Italic
		tmpResult = tmpResult.replace(/\*([^*]+)\*/g, '<em>$1</em>');
		tmpResult = tmpResult.replace(/_([^_]+)_/g, '<em>$1</em>');

		return tmpResult;
	}

	/**
	 * Convert a docsify-style internal link to a hash route for docuserve.
	 *
	 * @param {string} pHref - The original link href
	 * @returns {string} The converted hash route
	 */
	convertDocLink(pHref)
	{
		// Remove leading slash
		let tmpPath = pHref.replace(/^\//, '');

		// If it looks like a module path (group/module/), convert to our route format
		let tmpParts = tmpPath.split('/');
		if (tmpParts.length >= 2)
		{
			// Check if first segment matches a known group key
			let tmpGroupKeys = ['fable', 'meadow', 'orator', 'pict', 'utility'];
			if (tmpGroupKeys.indexOf(tmpParts[0]) >= 0)
			{
				return '#/doc/' + tmpPath;
			}
		}

		// Local doc page
		if (tmpPath.match(/\.md$/))
		{
			let tmpPageKey = tmpPath.replace(/\.md$/, '');
			return '#/page/' + tmpPageKey;
		}

		return '#/page/' + tmpPath;
	}

	/**
	 * Escape HTML special characters.
	 *
	 * @param {string} pText - The text to escape
	 * @returns {string} The escaped text
	 */
	escapeHTML(pText)
	{
		if (!pText)
		{
			return '';
		}
		return pText
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	}
}

module.exports = DocuserveDocumentationProvider;

module.exports.default_configuration =
{
	ProviderIdentifier: "Docuserve-Documentation",

	AutoInitialize: true,
	AutoInitializeOrdinal: 0
};
