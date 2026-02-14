const libPictView = require('pict-view');

const _ViewConfiguration =
{
	ViewIdentifier: "Docuserve-Sidebar",

	DefaultRenderable: "Docuserve-Sidebar-Content",
	DefaultDestinationAddress: "#Docuserve-Sidebar-Container",

	AutoRender: false,

	CSS: /*css*/`
		.docuserve-sidebar {
			background-color: #F5F0E8;
			border-right: 1px solid #DDD6CA;
			padding: 1em 0;
			padding-top: 0;
			height: 100%;
			position: relative;
		}
		.docuserve-sidebar-header {
			display: flex;
			justify-content: flex-end;
			padding: 0.4em 0.5em 0;
		}
		.docuserve-sidebar-close {
			background: none;
			border: none;
			color: #8A7F72;
			font-size: 1.2em;
			cursor: pointer;
			padding: 0.2em 0.4em;
			line-height: 1;
		}
		.docuserve-sidebar-close:hover {
			color: #2E7D74;
		}
		.docuserve-sidebar-search {
			padding: 0 1em 1em 1em;
			border-bottom: 1px solid #EAE3D8;
			margin-bottom: 0.5em;
		}
		.docuserve-sidebar-search input {
			width: 100%;
			padding: 0.5em 0.75em;
			border: 1px solid #D4CCBE;
			border-radius: 4px;
			font-size: 0.85em;
			outline: none;
			box-sizing: border-box;
		}
		.docuserve-sidebar-search input:focus {
			border-color: #2E7D74;
		}
		.docuserve-sidebar-search-results {
			margin-top: 0.5em;
		}
		.docuserve-sidebar-search-results a {
			display: block;
			padding: 0.4em 0.5em;
			color: #423D37;
			text-decoration: none;
			font-size: 0.82em;
			border-radius: 3px;
			transition: background-color 0.1s;
			cursor: pointer;
		}
		.docuserve-sidebar-search-results a:hover {
			background-color: #EAE3D8;
			color: #2E7D74;
		}
		.docuserve-sidebar-search-result-title {
			font-weight: 600;
			color: #3D3229;
		}
		.docuserve-sidebar-search-results a:hover .docuserve-sidebar-search-result-title {
			color: #2E7D74;
		}
		.docuserve-sidebar-search-result-meta {
			font-size: 0.9em;
			color: #8A7F72;
		}
		.docuserve-sidebar-search-all {
			display: block;
			padding: 0.4em 0.5em;
			font-size: 0.82em;
			color: #2E7D74;
			text-decoration: none;
			font-weight: 600;
			cursor: pointer;
			border-top: 1px solid #EAE3D8;
			margin-top: 0.25em;
			padding-top: 0.5em;
		}
		.docuserve-sidebar-search-all:hover {
			text-decoration: underline;
		}
		.docuserve-sidebar-home {
			padding: 0.5em 1.25em;
			font-weight: 600;
			font-size: 0.85em;
			text-transform: uppercase;
			letter-spacing: 0.03em;
		}
		.docuserve-sidebar-home a {
			color: #5E5549;
			text-decoration: none;
			cursor: pointer;
			user-select: none;
		}
		.docuserve-sidebar-home a:hover {
			color: #2E7D74;
		}
		.docuserve-sidebar-group {
			margin-top: 0.25em;
		}
		.docuserve-sidebar-group-title {
			display: block;
			padding: 0.5em 1.25em;
			font-weight: 600;
			font-size: 0.85em;
			color: #5E5549;
			text-decoration: none;
			text-transform: uppercase;
			letter-spacing: 0.03em;
			cursor: pointer;
			user-select: none;
		}
		.docuserve-sidebar-group-title:hover {
			color: #2E7D74;
		}
		.docuserve-sidebar-modules {
			list-style: none;
			margin: 0;
			padding: 0;
		}
		.docuserve-sidebar-modules li {
			padding: 0;
		}
		.docuserve-sidebar-modules a {
			display: block;
			padding: 0.3em 1.25em 0.3em 2em;
			color: #5E5549;
			text-decoration: none;
			font-size: 0.85em;
			transition: background-color 0.1s, color 0.1s;
			cursor: pointer;
		}
		.docuserve-sidebar-modules a:hover {
			background-color: #EAE3D8;
			color: #2E7D74;
		}
		.docuserve-sidebar-modules a.active {
			color: #2E7D74;
			font-weight: 600;
			background-color: #E0EDEB;
		}
		.docuserve-sidebar-modules .no-docs {
			display: block;
			padding: 0.3em 1.25em 0.3em 2em;
			color: #A39889;
			font-size: 0.85em;
		}
		.docuserve-sidebar-module-nav {
			border-top: 1px solid #EAE3D8;
			margin-top: 0.5em;
			padding-top: 0.5em;
		}
		.docuserve-sidebar-module-nav-section {
			padding: 0.4em 1.25em;
			font-weight: 600;
			font-size: 0.8em;
			color: #8A7F72;
			text-transform: uppercase;
			letter-spacing: 0.02em;
		}
		.docuserve-sidebar-module-nav a {
			display: block;
			padding: 0.25em 1.25em 0.25em 2.25em;
			color: #5E5549;
			text-decoration: none;
			font-size: 0.82em;
			transition: background-color 0.1s, color 0.1s;
			cursor: pointer;
		}
		.docuserve-sidebar-module-nav a:hover {
			background-color: #EAE3D8;
			color: #2E7D74;
		}
	`,

	Templates:
	[
		{
			Hash: "Docuserve-Sidebar-Template",
			Template: /*html*/`
<div class="docuserve-sidebar">
	<div class="docuserve-sidebar-header">
		<button class="docuserve-sidebar-close" onclick="{~P~}.views['Docuserve-Sidebar'].toggleSidebar()">&times;</button>
	</div>
	<div id="Docuserve-Sidebar-Search" class="docuserve-sidebar-search" style="display:none;">
		<input type="text" placeholder="Search docs..." id="Docuserve-Sidebar-Search-Input">
		<div id="Docuserve-Sidebar-Search-Results" class="docuserve-sidebar-search-results"></div>
	</div>
	<div class="docuserve-sidebar-home">
		<a onclick="{~P~}.PictApplication.navigateTo('/Home')">Home</a>
	</div>
	<div id="Docuserve-Sidebar-Groups"></div>
	<div id="Docuserve-Sidebar-ModuleNav"></div>
</div>
`
		}
	],

	Renderables:
	[
		{
			RenderableHash: "Docuserve-Sidebar-Content",
			TemplateHash: "Docuserve-Sidebar-Template",
			DestinationAddress: "#Docuserve-Sidebar-Container",
			RenderMethod: "replace"
		}
	]
};

class DocusserveSidebarView extends libPictView
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		this._SidebarSearchDebounceTimer = null;
	}

	onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent)
	{
		this.renderSidebarGroups();

		// Conditionally show the search box if the keyword index is loaded
		let tmpSearchContainer = document.getElementById('Docuserve-Sidebar-Search');
		if (tmpSearchContainer && this.pict.AppData.Docuserve.KeywordIndexLoaded)
		{
			tmpSearchContainer.style.display = '';

			let tmpInput = document.getElementById('Docuserve-Sidebar-Search-Input');
			if (tmpInput)
			{
				tmpInput.addEventListener('input', () =>
				{
					if (this._SidebarSearchDebounceTimer)
					{
						clearTimeout(this._SidebarSearchDebounceTimer);
					}

					this._SidebarSearchDebounceTimer = setTimeout(() =>
					{
						this.performSidebarSearch(tmpInput.value);
					}, 250);
				});
			}
		}

		return super.onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent);
	}

	/**
	 * Render the sidebar group navigation from catalog data.
	 */
	renderSidebarGroups()
	{
		let tmpGroups = this.pict.AppData.Docuserve.SidebarGroups;

		if (!tmpGroups || tmpGroups.length < 1)
		{
			// Empty sidebar -- don't show a permanent loading message
			this.pict.ContentAssignment.assignContent('#Docuserve-Sidebar-Groups', '');
			return;
		}

		let tmpHTML = '';

		for (let i = 0; i < tmpGroups.length; i++)
		{
			let tmpGroup = tmpGroups[i];
			tmpHTML += '<div class="docuserve-sidebar-group">';

			// Determine the route for the group title: use the group's own route,
			// or fall back to the first module with docs.
			let tmpGroupRoute = tmpGroup.Route || '';
			if (!tmpGroupRoute)
			{
				for (let k = 0; k < tmpGroup.Modules.length; k++)
				{
					if (tmpGroup.Modules[k].HasDocs && tmpGroup.Modules[k].Route)
					{
						tmpGroupRoute = tmpGroup.Modules[k].Route;
						break;
					}
				}
			}

			if (tmpGroupRoute)
			{
				tmpHTML += '<a class="docuserve-sidebar-group-title" href="' + tmpGroupRoute + '">' + this.escapeHTML(tmpGroup.Name) + '</a>';
			}
			else
			{
				tmpHTML += '<div class="docuserve-sidebar-group-title">' + this.escapeHTML(tmpGroup.Name) + '</div>';
			}
			tmpHTML += '<ul class="docuserve-sidebar-modules">';

			for (let j = 0; j < tmpGroup.Modules.length; j++)
			{
				let tmpModule = tmpGroup.Modules[j];
				if (tmpModule.HasDocs)
				{
					let tmpActiveClass = '';
					if (this.pict.AppData.Docuserve.CurrentGroup === tmpModule.Group && this.pict.AppData.Docuserve.CurrentModule === tmpModule.Name)
					{
						tmpActiveClass = ' class="active"';
					}
					tmpHTML += '<li><a' + tmpActiveClass + ' href="' + tmpModule.Route + '">' + this.escapeHTML(tmpModule.Name) + '</a></li>';
				}
				else
				{
					tmpHTML += '<li><span class="no-docs">' + this.escapeHTML(tmpModule.Name) + '</span></li>';
				}
			}

			tmpHTML += '</ul>';
			tmpHTML += '</div>';
		}

		this.pict.ContentAssignment.assignContent('#Docuserve-Sidebar-Groups', tmpHTML);
	}

	/**
	 * Render module-specific sub-navigation when viewing a module.
	 *
	 * @param {string} pGroup - The group key
	 * @param {string} pModule - The module name
	 */
	renderModuleNav(pGroup, pModule)
	{
		let tmpDocProvider = this.pict.providers['Docuserve-Documentation'];
		if (!tmpDocProvider)
		{
			return;
		}

		let tmpSidebar = tmpDocProvider.getModuleSidebar(pGroup, pModule);
		if (!tmpSidebar)
		{
			this.pict.ContentAssignment.assignContent('#Docuserve-Sidebar-ModuleNav', '');
			return;
		}

		let tmpRoutePrefix = '#/doc/' + pGroup + '/' + pModule + '/';
		let tmpHTML = '<div class="docuserve-sidebar-module-nav">';

		for (let i = 0; i < tmpSidebar.length; i++)
		{
			let tmpEntry = tmpSidebar[i];

			if (tmpEntry.Children)
			{
				tmpHTML += '<div class="docuserve-sidebar-module-nav-section">' + this.escapeHTML(tmpEntry.Title) + '</div>';

				for (let j = 0; j < tmpEntry.Children.length; j++)
				{
					let tmpChild = tmpEntry.Children[j];
					if (tmpChild.Path)
					{
						tmpHTML += '<a href="' + tmpRoutePrefix + tmpChild.Path + '">' + this.escapeHTML(tmpChild.Title) + '</a>';
					}
				}
			}
			else if (tmpEntry.Path)
			{
				tmpHTML += '<a href="' + tmpRoutePrefix + tmpEntry.Path + '">' + this.escapeHTML(tmpEntry.Title) + '</a>';
			}
		}

		tmpHTML += '</div>';

		this.pict.ContentAssignment.assignContent('#Docuserve-Sidebar-ModuleNav', tmpHTML);
	}

	/**
	 * Perform a sidebar search and render inline results.
	 *
	 * Shows up to 8 results as compact links.  If there are results, also
	 * shows a "See all results" link to the dedicated search page.
	 *
	 * @param {string} pQuery - The search query
	 */
	performSidebarSearch(pQuery)
	{
		let tmpResultsEl = document.getElementById('Docuserve-Sidebar-Search-Results');
		if (!tmpResultsEl)
		{
			return;
		}

		if (!pQuery || !pQuery.trim())
		{
			tmpResultsEl.innerHTML = '';
			return;
		}

		let tmpDocProvider = this.pict.providers['Docuserve-Documentation'];
		let tmpResults = tmpDocProvider.search(pQuery);

		if (tmpResults.length === 0)
		{
			tmpResultsEl.innerHTML = '<div style="padding: 0.4em 0.5em; font-size: 0.82em; color: #8A7F72;">No results found.</div>';
			return;
		}

		let tmpMaxResults = 8;
		let tmpHTML = '';

		for (let i = 0; i < tmpResults.length && i < tmpMaxResults; i++)
		{
			let tmpResult = tmpResults[i];
			let tmpMeta = '';
			if (tmpResult.Group && tmpResult.Module)
			{
				tmpMeta = tmpResult.Group + ' / ' + tmpResult.Module;
			}

			tmpHTML += '<a href="' + tmpResult.Route + '">';
			tmpHTML += '<div class="docuserve-sidebar-search-result-title">' + this.escapeHTML(tmpResult.Title) + '</div>';
			if (tmpMeta)
			{
				tmpHTML += '<div class="docuserve-sidebar-search-result-meta">' + this.escapeHTML(tmpMeta) + '</div>';
			}
			tmpHTML += '</a>';
		}

		if (tmpResults.length > tmpMaxResults)
		{
			let tmpEncodedQuery = encodeURIComponent(pQuery);
			tmpHTML += '<a class="docuserve-sidebar-search-all" href="#/search/' + tmpEncodedQuery + '">See all ' + tmpResults.length + ' results</a>';
		}

		tmpResultsEl.innerHTML = tmpHTML;
	}

	/**
	 * Toggle the sidebar visibility and update the top bar hamburger button.
	 */
	toggleSidebar()
	{
		this.pict.AppData.Docuserve.SidebarVisible = !this.pict.AppData.Docuserve.SidebarVisible;

		let tmpContainer = document.getElementById('Docuserve-Sidebar-Container');
		let tmpToggle = document.getElementById('Docuserve-TopBar-Toggle');

		if (this.pict.AppData.Docuserve.SidebarVisible)
		{
			if (tmpContainer) tmpContainer.style.display = '';
			if (tmpToggle) tmpToggle.style.display = 'none';
		}
		else
		{
			if (tmpContainer) tmpContainer.style.display = 'none';
			if (tmpToggle) tmpToggle.style.display = 'inline-block';
		}
	}

	/**
	 * Clear the module-specific sub-navigation.
	 */
	clearModuleNav()
	{
		this.pict.ContentAssignment.assignContent('#Docuserve-Sidebar-ModuleNav', '');
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
			.replace(/"/g, '&quot;');
	}
}

module.exports = DocusserveSidebarView;

module.exports.default_configuration = _ViewConfiguration;
