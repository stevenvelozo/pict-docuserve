const libPictView = require('pict-view');

const _ViewConfiguration =
{
	ViewIdentifier: "Docuserve-Sidebar",

	DefaultRenderable: "Docuserve-Sidebar-Content",
	DefaultDestinationAddress: "#Docuserve-Sidebar-Container",

	AutoRender: false,

	CSS: /*css*/`
		.docuserve-sidebar {
			background-color: #f8f9fa;
			border-right: 1px solid #e0e0e0;
			padding: 1em 0;
			height: 100%;
			position: relative;
		}
		.docuserve-sidebar-close {
			position: absolute;
			top: 0.5em;
			right: 0.5em;
			background: none;
			border: none;
			color: #999;
			font-size: 1.2em;
			cursor: pointer;
			padding: 0.2em 0.4em;
			line-height: 1;
		}
		.docuserve-sidebar-close:hover {
			color: #42b983;
		}
		.docuserve-sidebar-search {
			padding: 0 1em 1em 1em;
			border-bottom: 1px solid #e9ecef;
			margin-bottom: 0.5em;
		}
		.docuserve-sidebar-search input {
			width: 100%;
			padding: 0.5em 0.75em;
			border: 1px solid #ddd;
			border-radius: 4px;
			font-size: 0.85em;
			outline: none;
			box-sizing: border-box;
		}
		.docuserve-sidebar-search input:focus {
			border-color: #42b983;
		}
		.docuserve-sidebar-home {
			padding: 0.5em 1.25em;
			font-weight: 600;
			font-size: 0.85em;
			text-transform: uppercase;
			letter-spacing: 0.03em;
		}
		.docuserve-sidebar-home a {
			color: #666;
			text-decoration: none;
			cursor: pointer;
			user-select: none;
		}
		.docuserve-sidebar-home a:hover {
			color: #42b983;
		}
		.docuserve-sidebar-group {
			margin-top: 0.25em;
		}
		.docuserve-sidebar-group-title {
			display: block;
			padding: 0.5em 1.25em;
			font-weight: 600;
			font-size: 0.85em;
			color: #666;
			text-decoration: none;
			text-transform: uppercase;
			letter-spacing: 0.03em;
			cursor: pointer;
			user-select: none;
		}
		.docuserve-sidebar-group-title:hover {
			color: #42b983;
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
			color: #555;
			text-decoration: none;
			font-size: 0.85em;
			transition: background-color 0.1s, color 0.1s;
			cursor: pointer;
		}
		.docuserve-sidebar-modules a:hover {
			background-color: #e9ecef;
			color: #42b983;
		}
		.docuserve-sidebar-modules a.active {
			color: #42b983;
			font-weight: 600;
			background-color: #e8f5e9;
		}
		.docuserve-sidebar-modules .no-docs {
			display: block;
			padding: 0.3em 1.25em 0.3em 2em;
			color: #bbb;
			font-size: 0.85em;
		}
		.docuserve-sidebar-module-nav {
			border-top: 1px solid #e9ecef;
			margin-top: 0.5em;
			padding-top: 0.5em;
		}
		.docuserve-sidebar-module-nav-section {
			padding: 0.4em 1.25em;
			font-weight: 600;
			font-size: 0.8em;
			color: #888;
			text-transform: uppercase;
			letter-spacing: 0.02em;
		}
		.docuserve-sidebar-module-nav a {
			display: block;
			padding: 0.25em 1.25em 0.25em 2.25em;
			color: #555;
			text-decoration: none;
			font-size: 0.82em;
			transition: background-color 0.1s, color 0.1s;
			cursor: pointer;
		}
		.docuserve-sidebar-module-nav a:hover {
			background-color: #e9ecef;
			color: #42b983;
		}
	`,

	Templates:
	[
		{
			Hash: "Docuserve-Sidebar-Template",
			Template: /*html*/`
<div class="docuserve-sidebar">
	<button class="docuserve-sidebar-close" onclick="{~P~}.views['Docuserve-Sidebar'].toggleSidebar()">&times;</button>
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
	}

	onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent)
	{
		this.renderSidebarGroups();

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
			this.pict.ContentAssignment.assignContent('#Docuserve-Sidebar-Groups', '<p style="padding: 1em; color: #999; font-size: 0.85em;">Loading catalog...</p>');
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
