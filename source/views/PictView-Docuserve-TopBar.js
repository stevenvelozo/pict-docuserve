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
			background-color: var(--docuserve-topbar-bg);
			color: var(--docuserve-topbar-text);
			padding: 0 1.5em;
			height: 56px;
			box-shadow: 0 2px 4px rgba(0, 0, 0, 0.18);
			position: sticky;
			top: 0;
			z-index: 100;
			transition: background-color 0.15s ease, color 0.15s ease;
		}
		.docuserve-topbar-brand {
			font-size: 1.25em;
			font-weight: 600;
			letter-spacing: 0.02em;
			color: var(--docuserve-topbar-text);
			text-decoration: none;
			cursor: pointer;
		}
		.docuserve-topbar-brand small {
			font-size: 0.65em;
			font-weight: 400;
			color: var(--docuserve-topbar-text-dim);
			margin-left: 0.2em;
		}
		.docuserve-topbar-brand:hover {
			color: #fff;
		}
		.docuserve-topbar-brandgroup {
			display: flex;
			align-items: baseline;
			gap: 0.6em;
		}
		.docuserve-topbar-version {
			font-size: 0.75em;
			font-weight: 500;
			color: var(--docuserve-topbar-version-text);
			background-color: var(--docuserve-topbar-version-bg);
			border: 1px solid var(--docuserve-topbar-version-border);
			padding: 0.12em 0.5em;
			border-radius: 10px;
			font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
			letter-spacing: 0.02em;
			white-space: nowrap;
		}
		.docuserve-topbar-version:empty {
			display: none;
		}
		.docuserve-topbar-nav {
			display: flex;
			align-items: center;
			gap: 0.25em;
		}
		.docuserve-topbar-nav a {
			color: var(--docuserve-topbar-text-muted);
			text-decoration: none;
			padding: 0.5em 0.75em;
			border-radius: 4px;
			font-size: 0.9em;
			transition: background-color 0.15s, color 0.15s;
			cursor: pointer;
		}
		.docuserve-topbar-nav a:hover {
			background-color: var(--docuserve-topbar-hover-bg);
			color: #fff;
		}
		.docuserve-topbar-links {
			display: flex;
			align-items: center;
			gap: 0.5em;
		}
		.docuserve-topbar-links a {
			color: var(--docuserve-topbar-text-dim);
			text-decoration: none;
			font-size: 0.85em;
			padding: 0.4em 0.6em;
			border-radius: 4px;
			transition: background-color 0.15s, color 0.15s;
		}
		.docuserve-topbar-links a:hover {
			background-color: var(--docuserve-topbar-hover-bg);
			color: var(--docuserve-topbar-text);
		}
		.docuserve-topbar-theme {
			display: inline-flex;
			align-items: center;
			gap: 2px;
			margin: 0 0.35em 0 0.15em;
			padding: 2px;
			background: rgba(255, 255, 255, 0.035);
			border: 1px solid rgba(255, 255, 255, 0.08);
			border-radius: 999px;
		}
		.docuserve-topbar-theme-btn {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			width: 24px;
			height: 24px;
			padding: 0;
			background: transparent;
			border: none;
			border-radius: 999px;
			color: var(--docuserve-topbar-text-dim);
			cursor: pointer;
			transition: background-color 0.15s ease, color 0.15s ease;
		}
		.docuserve-topbar-theme-btn svg {
			display: block;
			width: 14px;
			height: 14px;
			stroke: currentColor;
			fill: none;
			stroke-width: 1.75;
			stroke-linecap: round;
			stroke-linejoin: round;
		}
		.docuserve-topbar-theme-btn:hover {
			color: var(--docuserve-topbar-text);
		}
		.docuserve-topbar-theme-btn[aria-pressed="true"] {
			background: var(--docuserve-topbar-hover-bg);
			color: var(--docuserve-topbar-text);
		}
		.docuserve-topbar-toggle {
			display: none;
			background: none;
			border: none;
			color: var(--docuserve-topbar-text-muted);
			font-size: 1.3em;
			cursor: pointer;
			padding: 0.3em 0.5em;
			margin-left: 0.5em;
			line-height: 1;
		}
		.docuserve-topbar-toggle:hover {
			color: #fff;
		}
		.docuserve-topbar-right {
			display: flex;
			align-items: center;
		}
	`,

	Templates:
	[
		{
			Hash: "Docuserve-TopBar-Template",
			Template: /*html*/`
<div class="docuserve-topbar">
	<div class="docuserve-topbar-brandgroup">
		<a id="Docuserve-TopBar-Brand" class="docuserve-topbar-brand" href="#/Home"></a>
		<span id="Docuserve-TopBar-Version" class="docuserve-topbar-version" title=""></span>
	</div>
	<div id="Docuserve-TopBar-Nav" class="docuserve-topbar-nav"></div>
	<div class="docuserve-topbar-right">
		<div id="Docuserve-TopBar-Links" class="docuserve-topbar-links"></div>
		<div id="Docuserve-TopBar-Theme" class="docuserve-topbar-theme" role="group" aria-label="Theme">
			<button type="button" class="docuserve-topbar-theme-btn" data-theme-choice="system" aria-label="Use system theme" aria-pressed="false"><svg viewBox="0 0 16 16" aria-hidden="true"><rect x="1.75" y="2.5" width="12.5" height="8.5" rx="1.25"></rect><line x1="5.5" y1="13.5" x2="10.5" y2="13.5"></line><line x1="8" y1="11" x2="8" y2="13.5"></line></svg></button>
			<button type="button" class="docuserve-topbar-theme-btn" data-theme-choice="light" aria-label="Use light theme" aria-pressed="false"><svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="3.25"></circle><line x1="8" y1="1.25" x2="8" y2="2.75"></line><line x1="8" y1="13.25" x2="8" y2="14.75"></line><line x1="1.25" y1="8" x2="2.75" y2="8"></line><line x1="13.25" y1="8" x2="14.75" y2="8"></line><line x1="3.25" y1="3.25" x2="4.3" y2="4.3"></line><line x1="11.7" y1="11.7" x2="12.75" y2="12.75"></line><line x1="3.25" y1="12.75" x2="4.3" y2="11.7"></line><line x1="11.7" y1="4.3" x2="12.75" y2="3.25"></line></svg></button>
			<button type="button" class="docuserve-topbar-theme-btn" data-theme-choice="dark" aria-label="Use dark theme" aria-pressed="false"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M13.25 9.5A5.5 5.5 0 0 1 6.5 2.75a5.5 5.5 0 1 0 6.75 6.75z"></path></svg></button>
		</div>
		<button id="Docuserve-TopBar-Toggle" class="docuserve-topbar-toggle" onclick="{~P~}.views['Docuserve-Sidebar'].toggleSidebar()">&#9776;</button>
	</div>
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
		this.initThemeToggle();
		return super.onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent);
	}

	/**
	 * Build the localStorage key for the theme preference, namespaced by
	 * origin + base path so multiple docs deployments on the same host
	 * remember independently.
	 */
	getThemeStorageKey()
	{
		try
		{
			let tmpPath = (window.location.pathname || '/').replace(/\/[^/]*$/, '/');
			return 'docuserve-theme:' + window.location.origin + tmpPath;
		}
		catch (e)
		{
			return 'docuserve-theme';
		}
	}

	/**
	 * Wire up the three-state system/light/dark theme toggle button group.
	 * Loads the saved preference, applies it to <html data-theme="...">,
	 * and attaches click handlers to each button.
	 */
	initThemeToggle()
	{
		let tmpGroupEl = document.getElementById('Docuserve-TopBar-Theme');
		if (!tmpGroupEl)
		{
			return;
		}

		let tmpButtons = tmpGroupEl.querySelectorAll('.docuserve-topbar-theme-btn');
		let tmpStorageKey = this.getThemeStorageKey();
		let tmpSaved = null;
		try { tmpSaved = localStorage.getItem(tmpStorageKey); } catch (e) {}
		if (tmpSaved !== 'light' && tmpSaved !== 'dark' && tmpSaved !== 'system')
		{
			tmpSaved = 'system';
		}

		this.applyTheme(tmpSaved, tmpButtons, tmpStorageKey);

		for (let i = 0; i < tmpButtons.length; i++)
		{
			let tmpButton = tmpButtons[i];
			tmpButton.addEventListener('click', () =>
			{
				let tmpChoice = tmpButton.getAttribute('data-theme-choice');
				this.applyTheme(tmpChoice, tmpButtons, tmpStorageKey);
			});
		}
	}

	/**
	 * Apply a theme choice to the document root, update pressed state on
	 * the three buttons, and persist the choice.  `system` removes any
	 * explicit data-theme attribute so the CSS media query takes over.
	 */
	applyTheme(pChoice, pButtons, pStorageKey)
	{
		if (pChoice === 'light')
		{
			document.documentElement.setAttribute('data-theme', 'light');
		}
		else if (pChoice === 'dark')
		{
			document.documentElement.setAttribute('data-theme', 'dark');
		}
		else
		{
			document.documentElement.removeAttribute('data-theme');
			pChoice = 'system';
		}

		try { localStorage.setItem(pStorageKey, pChoice); } catch (e) {}

		if (pButtons)
		{
			for (let i = 0; i < pButtons.length; i++)
			{
				let tmpButton = pButtons[i];
				let tmpActive = tmpButton.getAttribute('data-theme-choice') === pChoice;
				tmpButton.setAttribute('aria-pressed', tmpActive ? 'true' : 'false');
			}
		}
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
		let tmpVersionEl = document.getElementById('Docuserve-TopBar-Version');

		if (!tmpBrandEl || !tmpNavEl || !tmpLinksEl)
		{
			return;
		}

		this.renderVersionChip(tmpVersionEl, tmpDocuserve);

		if (tmpDocuserve.TopBarLoaded && tmpDocuserve.TopBar)
		{
			// Data-driven from _topbar.md
			let tmpTopBar = tmpDocuserve.TopBar;

			// Brand
			tmpBrandEl.innerHTML = this.sanitizeTitle(tmpTopBar.Brand || 'Documentation');

			// Navigation links (centre)
			let tmpNavHTML = '<a href="#/Home">Home</a>';
			for (let i = 0; i < tmpTopBar.NavLinks.length; i++)
			{
				let tmpLink = tmpTopBar.NavLinks[i];
				tmpNavHTML += '<a href="' + tmpLink.Href + '">' + this.escapeHTML(tmpLink.Text) + '</a>';
			}
			tmpNavEl.innerHTML = tmpNavHTML;

			// External links (right side) — search link first if keyword index is available
			let tmpLinksHTML = '';
			if (tmpDocuserve.KeywordIndexLoaded)
			{
				tmpLinksHTML += '<a href="#/search/">Search</a>';
			}
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

			tmpBrandEl.innerHTML = this.sanitizeTitle(tmpBrand);
			tmpNavEl.innerHTML = '<a href="#/Home">Home</a>';
			tmpLinksEl.innerHTML = tmpDocuserve.KeywordIndexLoaded ? '<a href="#/search/">Search</a>' : '';
		}
	}

	/**
	 * Populate the topbar version chip from _version.json data.  Hides
	 * the element (empty innerHTML) when no version data is loaded.
	 */
	renderVersionChip(pElement, pDocuserve)
	{
		if (!pElement)
		{
			return;
		}
		if (!pDocuserve.VersionLoaded || !pDocuserve.Version || !pDocuserve.Version.Version)
		{
			pElement.innerHTML = '';
			pElement.setAttribute('title', '');
			return;
		}
		let tmpVersion = pDocuserve.Version;
		pElement.innerHTML = 'v' + this.escapeHTML(tmpVersion.Version);
		let tmpTooltipParts = [];
		if (tmpVersion.Name)
		{
			tmpTooltipParts.push(tmpVersion.Name + ' v' + tmpVersion.Version);
		}
		else
		{
			tmpTooltipParts.push('v' + tmpVersion.Version);
		}
		if (tmpVersion.GeneratedAt)
		{
			tmpTooltipParts.push('built ' + this.formatVersionDate(tmpVersion.GeneratedAt));
		}
		if (tmpVersion.GitCommit)
		{
			tmpTooltipParts.push(tmpVersion.GitCommit);
		}
		pElement.setAttribute('title', tmpTooltipParts.join(' · '));
	}

	/**
	 * Format an ISO timestamp as YYYY-MM-DD, tolerating bad input.
	 */
	formatVersionDate(pISO)
	{
		if (!pISO)
		{
			return '';
		}
		let tmpMatch = String(pISO).match(/^(\d{4}-\d{2}-\d{2})/);
		return tmpMatch ? tmpMatch[1] : String(pISO);
	}

	/**
	 * Sanitize a title string, preserving only <small> tags.
	 */
	sanitizeTitle(pText)
	{
		if (!pText)
		{
			return '';
		}
		return this.escapeHTML(pText)
			.replace(/&lt;small&gt;/gi, '<small>')
			.replace(/&lt;\/small&gt;/gi, '</small>');
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
