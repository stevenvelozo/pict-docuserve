const libPictView = require('pict-view');

const _ViewConfiguration =
{
	ViewIdentifier: "Docuserve-TopBar",

	DefaultRenderable: "Docuserve-TopBar-Content",
	DefaultDestinationAddress: "#Docuserve-TopBar-Container",

	AutoRender: false,

	CSS: /*css*/`
		.docuserve-topbar {
			display: flex;
			align-items: center;
			justify-content: space-between;
			background-color: #2c3e50;
			color: #ecf0f1;
			padding: 0 1.5em;
			height: 56px;
			box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
			position: sticky;
			top: 0;
			z-index: 100;
		}
		.docuserve-topbar-brand {
			font-size: 1.25em;
			font-weight: 600;
			letter-spacing: 0.02em;
			color: #ecf0f1;
			text-decoration: none;
			cursor: pointer;
		}
		.docuserve-topbar-brand:hover {
			color: #fff;
		}
		.docuserve-topbar-nav {
			display: flex;
			align-items: center;
			gap: 0.25em;
		}
		.docuserve-topbar-nav a {
			color: #bdc3c7;
			text-decoration: none;
			padding: 0.5em 0.75em;
			border-radius: 4px;
			font-size: 0.9em;
			transition: background-color 0.15s, color 0.15s;
			cursor: pointer;
		}
		.docuserve-topbar-nav a:hover {
			background-color: #34495e;
			color: #fff;
		}
		.docuserve-topbar-links {
			display: flex;
			align-items: center;
			gap: 0.5em;
		}
		.docuserve-topbar-links a {
			color: #95a5a6;
			text-decoration: none;
			font-size: 0.85em;
			padding: 0.4em 0.6em;
			border-radius: 4px;
			transition: background-color 0.15s, color 0.15s;
		}
		.docuserve-topbar-links a:hover {
			background-color: #34495e;
			color: #ecf0f1;
		}
	`,

	Templates:
	[
		{
			Hash: "Docuserve-TopBar-Template",
			Template: /*html*/`
<div class="docuserve-topbar">
	<a id="Docuserve-TopBar-Brand" class="docuserve-topbar-brand" href="#/Home"></a>
	<div id="Docuserve-TopBar-Nav" class="docuserve-topbar-nav"></div>
	<div id="Docuserve-TopBar-Links" class="docuserve-topbar-links"></div>
</div>
`
		}
	],

	Renderables:
	[
		{
			RenderableHash: "Docuserve-TopBar-Content",
			TemplateHash: "Docuserve-TopBar-Template",
			DestinationAddress: "#Docuserve-TopBar-Container",
			RenderMethod: "replace"
		}
	]
};

class DocuserveTopBarView extends libPictView
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);
	}

	onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent)
	{
		this.renderTopBarContent();
		return super.onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent);
	}

	/**
	 * Populate the top bar from _topbar.md data or fall back to defaults.
	 */
	renderTopBarContent()
	{
		let tmpDocuserve = this.pict.AppData.Docuserve;
		let tmpBrandEl = document.getElementById('Docuserve-TopBar-Brand');
		let tmpNavEl = document.getElementById('Docuserve-TopBar-Nav');
		let tmpLinksEl = document.getElementById('Docuserve-TopBar-Links');

		if (!tmpBrandEl || !tmpNavEl || !tmpLinksEl)
		{
			return;
		}

		if (tmpDocuserve.TopBarLoaded && tmpDocuserve.TopBar)
		{
			// Data-driven from _topbar.md
			let tmpTopBar = tmpDocuserve.TopBar;

			// Brand
			tmpBrandEl.textContent = tmpTopBar.Brand || 'Documentation';

			// Navigation links (centre)
			let tmpNavHTML = '<a href="#/Home">Home</a>';
			for (let i = 0; i < tmpTopBar.NavLinks.length; i++)
			{
				let tmpLink = tmpTopBar.NavLinks[i];
				tmpNavHTML += '<a href="' + tmpLink.Href + '">' + this.escapeHTML(tmpLink.Text) + '</a>';
			}
			tmpNavEl.innerHTML = tmpNavHTML;

			// External links (right side)
			let tmpLinksHTML = '';
			for (let i = 0; i < tmpTopBar.ExternalLinks.length; i++)
			{
				let tmpLink = tmpTopBar.ExternalLinks[i];
				tmpLinksHTML += '<a href="' + this.escapeHTML(tmpLink.Href) + '" target="_blank" rel="noopener">' + this.escapeHTML(tmpLink.Text) + '</a>';
			}
			tmpLinksEl.innerHTML = tmpLinksHTML;
		}
		else
		{
			// Fallback: use brand from cover or a default, and just show Home
			let tmpBrand = 'Documentation';
			if (tmpDocuserve.CoverLoaded && tmpDocuserve.Cover && tmpDocuserve.Cover.Title)
			{
				tmpBrand = tmpDocuserve.Cover.Title;
			}
			else if (tmpDocuserve.CatalogLoaded && tmpDocuserve.Catalog && tmpDocuserve.Catalog.Name)
			{
				tmpBrand = tmpDocuserve.Catalog.Name;
			}

			tmpBrandEl.textContent = tmpBrand;
			tmpNavEl.innerHTML = '<a href="#/Home">Home</a>';
			tmpLinksEl.innerHTML = '';
		}
	}

	/**
	 * Escape HTML special characters.
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

module.exports = DocuserveTopBarView;

module.exports.default_configuration = _ViewConfiguration;
