const libPictApplication = require('pict-application');

// Provider
const libDocumentationProvider = require('./providers/Pict-Provider-Docuserve-Documentation.js');

// Views
const libViewLayout = require('./views/PictView-Docuserve-Layout.js');
const libViewTopBar = require('./views/PictView-Docuserve-TopBar.js');
const libViewSidebar = require('./views/PictView-Docuserve-Sidebar.js');
const libViewSplash = require('./views/PictView-Docuserve-Splash.js');
const libViewContent = require('./views/PictView-Docuserve-Content.js');
const libViewSearch = require('./views/PictView-Docuserve-Search.js');

class DocuserveApplication extends libPictApplication
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		// Add the documentation provider
		this.pict.addProvider('Docuserve-Documentation', libDocumentationProvider.default_configuration, libDocumentationProvider);

		// Add views
		this.pict.addView('Docuserve-Layout', libViewLayout.default_configuration, libViewLayout);
		this.pict.addView('Docuserve-TopBar', libViewTopBar.default_configuration, libViewTopBar);
		this.pict.addView('Docuserve-Sidebar', libViewSidebar.default_configuration, libViewSidebar);
		this.pict.addView('Docuserve-Splash', libViewSplash.default_configuration, libViewSplash);
		this.pict.addView('Docuserve-Content', libViewContent.default_configuration, libViewContent);
		this.pict.addView('Docuserve-Search', libViewSearch.default_configuration, libViewSearch);
	}

	onAfterInitializeAsync(fCallback)
	{
		// Initialize application state
		this.pict.AppData.Docuserve =
		{
			CatalogLoaded: false,
			Catalog: null,
			CoverLoaded: false,
			Cover: null,
			SidebarLoaded: false,
			SidebarGroups: [],
			TopBarLoaded: false,
			TopBar: null,
			ErrorPageLoaded: false,
			ErrorPageHTML: null,
			KeywordIndexLoaded: false,
			KeywordDocumentCount: 0,
			CurrentGroup: '',
			CurrentModule: '',
			CurrentPath: '',
			// Whether the sidebar is currently visible
			SidebarVisible: true,
			// Base URL for local docs (relative to where the app is served)
			DocsBaseURL: '',
			// URL for the catalog JSON
			CatalogURL: 'retold-catalog.json'
		};

		// Load the catalog, then render the layout
		let tmpDocProvider = this.pict.providers['Docuserve-Documentation'];
		tmpDocProvider.loadCatalog(() =>
		{
			// Set the page title from cover.md or _topbar.md
			let tmpDocuserve = this.pict.AppData.Docuserve;
			if (tmpDocuserve.CoverLoaded && tmpDocuserve.Cover && tmpDocuserve.Cover.Title)
			{
				document.title = tmpDocuserve.Cover.Title;
			}
			else if (tmpDocuserve.TopBarLoaded && tmpDocuserve.TopBar && tmpDocuserve.TopBar.Brand)
			{
				document.title = tmpDocuserve.TopBar.Brand;
			}

			// Render the layout shell, which triggers child view rendering
			this.pict.views['Docuserve-Layout'].render();

			return super.onAfterInitializeAsync(fCallback);
		});
	}

	/**
	 * Read the current window.location.hash and dispatch to the correct handler.
	 *
	 * Route patterns:
	 *   #/Home                         -> showView('Docuserve-Splash')
	 *   #/search/<query>               -> navigateToSearch(query)
	 *   #/page/<docpath>               -> navigateToPage(docpath)
	 *   #/doc/<group>/<module>          -> navigateToModule(group, module)
	 *   #/doc/<group>/<module>/<path>   -> navigateToModulePath(group, module, path)
	 */
	resolveHash()
	{
		let tmpHash = (window.location.hash || '').replace(/^#\/?/, '');

		if (!tmpHash || tmpHash === 'Home')
		{
			this.showView('Docuserve-Splash');
			return;
		}

		let tmpParts = tmpHash.split('/');

		if (tmpParts[0] === 'search')
		{
			let tmpQuery = decodeURIComponent(tmpParts.slice(1).join('/'));
			this.navigateToSearch(tmpQuery);
			return;
		}

		if (tmpParts[0] === 'page' && tmpParts.length >= 2)
		{
			// Rejoin everything after 'page/' in case the path has slashes
			let tmpDocPath = tmpParts.slice(1).join('/');
			this.navigateToPage(tmpDocPath);
			return;
		}

		if (tmpParts[0] === 'doc' && tmpParts.length >= 3)
		{
			let tmpGroup = tmpParts[1];
			let tmpModule = tmpParts[2];
			if (tmpParts.length >= 4)
			{
				let tmpPath = tmpParts.slice(3).join('/');
				this.navigateToModulePath(tmpGroup, tmpModule, tmpPath);
			}
			else
			{
				this.navigateToModule(tmpGroup, tmpModule);
			}
			return;
		}

		// Unknown route — treat as a page
		this.navigateToPage(tmpHash);
	}

	/**
	 * Navigate to a hash route.
	 *
	 * Sets window.location.hash, which triggers the hashchange listener in the
	 * layout view, which calls resolveHash() automatically.
	 *
	 * @param {string} pRoute - The route path (e.g. '/Home', '/page/quick-start')
	 */
	navigateTo(pRoute)
	{
		window.location.hash = pRoute;
	}

	/**
	 * Show a specific view in the content area.
	 *
	 * @param {string} pViewIdentifier - The view identifier to render
	 */
	showView(pViewIdentifier)
	{
		if (pViewIdentifier in this.pict.views)
		{
			this.pict.AppData.Docuserve.CurrentGroup = '';
			this.pict.AppData.Docuserve.CurrentModule = '';
			this.pict.AppData.Docuserve.CurrentPath = '';

			this.pict.views[pViewIdentifier].render();

			// Update sidebar to clear module nav and refresh active states
			this.pict.views['Docuserve-Sidebar'].clearModuleNav();
			this.pict.views['Docuserve-Sidebar'].renderSidebarGroups();
		}
	}

	/**
	 * Navigate to a module's documentation.
	 *
	 * @param {string} pGroup - The group key
	 * @param {string} pModule - The module name
	 */
	navigateToModule(pGroup, pModule)
	{
		this.navigateToModulePath(pGroup, pModule, 'README.md');
	}

	/**
	 * Navigate to a specific path within a module's documentation.
	 *
	 * @param {string} pGroup - The group key
	 * @param {string} pModule - The module name
	 * @param {string} pPath - The document path
	 */
	navigateToModulePath(pGroup, pModule, pPath)
	{
		let tmpDocProvider = this.pict.providers['Docuserve-Documentation'];
		let tmpContentView = this.pict.views['Docuserve-Content'];
		let tmpSidebarView = this.pict.views['Docuserve-Sidebar'];

		// Update current navigation state
		this.pict.AppData.Docuserve.CurrentGroup = pGroup;
		this.pict.AppData.Docuserve.CurrentModule = pModule;
		this.pict.AppData.Docuserve.CurrentPath = pPath;

		// Render the content view shell and show loading
		tmpContentView.render();
		tmpContentView.showLoading();

		// Update sidebar to show active module and module-specific nav
		tmpSidebarView.renderSidebarGroups();
		tmpSidebarView.renderModuleNav(pGroup, pModule);

		// Resolve the document URL and fetch it
		let tmpURL = tmpDocProvider.resolveDocumentURL(pGroup, pModule, pPath || 'README.md');

		if (!tmpURL)
		{
			tmpContentView.displayContent(tmpDocProvider.getErrorPageHTML(pGroup + '/' + pModule));
			return;
		}

		tmpDocProvider.fetchDocument(tmpURL, (pError, pHTML) =>
		{
			if (!pError)
			{
				tmpContentView.displayContent(pHTML);
				return;
			}

			// Remote fetch failed — try a local fallback using the
			// group/module/path as a relative path.  This handles cases
			// where the catalog contains entries (e.g. example apps)
			// that don't correspond to real GitHub repositories.
			let tmpLocalPath = pGroup + '/' + pModule + '/' + (pPath || 'README.md');
			tmpDocProvider.fetchLocalDocument(tmpLocalPath, (pLocalError, pLocalHTML) =>
			{
				tmpContentView.displayContent(pLocalHTML);
			});
		});
	}

	/**
	 * Navigate to a local documentation page (e.g. architecture.md).
	 *
	 * @param {string} pDocPath - The doc path without extension
	 */
	navigateToPage(pDocPath)
	{
		let tmpDocProvider = this.pict.providers['Docuserve-Documentation'];
		let tmpContentView = this.pict.views['Docuserve-Content'];
		let tmpSidebarView = this.pict.views['Docuserve-Sidebar'];

		// Update state
		this.pict.AppData.Docuserve.CurrentGroup = '';
		this.pict.AppData.Docuserve.CurrentModule = '';
		this.pict.AppData.Docuserve.CurrentPath = pDocPath;

		// Render the content view shell and show loading
		tmpContentView.render();
		tmpContentView.showLoading();

		// Clear module-specific sidebar nav
		tmpSidebarView.clearModuleNav();
		tmpSidebarView.renderSidebarGroups();

		// Fetch the local document
		let tmpPath = pDocPath;
		if (!tmpPath.match(/\.md$/))
		{
			tmpPath = tmpPath + '.md';
		}

		tmpDocProvider.fetchLocalDocument(tmpPath, (pError, pHTML) =>
		{
			// fetchDocument always provides displayable HTML in pHTML,
			// even on error, so we can use it directly.
			tmpContentView.displayContent(pHTML);
		});
	}

	/**
	 * Navigate to the search page with an optional query.
	 *
	 * @param {string} pQuery - The search query (may be empty for blank search page)
	 */
	navigateToSearch(pQuery)
	{
		let tmpSidebarView = this.pict.views['Docuserve-Sidebar'];
		let tmpSearchView = this.pict.views['Docuserve-Search'];

		// Update state
		this.pict.AppData.Docuserve.CurrentGroup = '';
		this.pict.AppData.Docuserve.CurrentModule = '';
		this.pict.AppData.Docuserve.CurrentPath = '';

		// Clear module-specific sidebar nav
		tmpSidebarView.clearModuleNav();
		tmpSidebarView.renderSidebarGroups();

		// Render the search view with the query
		tmpSearchView.render();
		tmpSearchView.showSearch(pQuery || '');
	}
}

module.exports = DocuserveApplication;

module.exports.default_configuration = require('./Pict-Application-Docuserve-Configuration.json');
