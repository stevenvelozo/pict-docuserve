const libPictView = require('pict-view');

const _ViewConfiguration =
{
	ViewIdentifier: "Docuserve-Search",

	DefaultRenderable: "Docuserve-Search-Display",
	DefaultDestinationAddress: "#Docuserve-Content-Container",

	AutoRender: false,

	CSS: /*css*/`
		.docuserve-search {
			padding: 2em 3em;
			max-width: 900px;
			margin: 0 auto;
		}
		.docuserve-search-header {
			margin-bottom: 1.5em;
		}
		.docuserve-search-header h1 {
			font-size: 1.75em;
			color: var(--theme-color-text-primary, #3D3229);
			margin: 0 0 0.75em 0;
		}
		.docuserve-search-input {
			width: 100%;
			padding: 0.75em 1em;
			font-size: 1.1em;
			border: 2px solid var(--theme-color-border-default, #D4CCBE);
			border-radius: 6px;
			outline: none;
			box-sizing: border-box;
			transition: border-color 0.15s;
		}
		.docuserve-search-input:focus {
			border-color: var(--theme-color-brand-primary, #2E7D74);
		}
		.docuserve-search-status {
			margin-top: 0.75em;
			font-size: 0.9em;
			color: var(--theme-color-text-muted, #8A7F72);
		}
		.docuserve-search-results {
			margin-top: 1em;
		}
		.docuserve-search-result {
			display: block;
			padding: 1em 1.25em;
			margin-bottom: 0.5em;
			border: 1px solid var(--theme-color-border-light, #EAE3D8);
			border-radius: 6px;
			text-decoration: none;
			color: inherit;
			transition: border-color 0.15s, box-shadow 0.15s;
		}
		.docuserve-search-result:hover {
			border-color: var(--theme-color-brand-primary, #2E7D74);
			box-shadow: 0 2px 8px rgba(46, 125, 116, 0.1);
		}
		.docuserve-search-result-title {
			font-size: 1.05em;
			font-weight: 600;
			color: var(--theme-color-brand-primary, #2E7D74);
			margin-bottom: 0.25em;
		}
		.docuserve-search-result-breadcrumb {
			font-size: 0.8em;
			color: var(--theme-color-text-muted, #8A7F72);
			margin-bottom: 0.2em;
		}
		.docuserve-search-result-breadcrumb-sep {
			display: inline-block;
			vertical-align: middle;
			font-size: 0.85em;
			margin: 0 0.15em;
			opacity: 0.7;
		}
		.docuserve-search-result-path {
			font-size: 0.8em;
			color: var(--theme-color-text-muted, #A39889);
			font-family: monospace;
		}
		.docuserve-search-empty {
			text-align: center;
			padding: 3em 1em;
			color: var(--theme-color-text-muted, #8A7F72);
			font-size: 1em;
		}
	`,

	Templates:
	[
		{
			Hash: "Docuserve-Search-Template",
			Template: /*html*/`<div class="docuserve-search">
	<div class="docuserve-search-header">
		<h1>Search Documentation</h1>
		<input type="text" class="docuserve-search-input" id="Docuserve-Search-Input" placeholder="Search across all modules..." oninput="{~P~}.views['Docuserve-Search'].onSearchInput(this.value)">
		<div id="Docuserve-Search-Status" class="docuserve-search-status">{~D:AppData.Docuserve.SearchStatus~}</div>
	</div>
	<div id="Docuserve-Search-Results" class="docuserve-search-results">
		{~TS:Docuserve-Search-Result-Template:AppData.Docuserve.SearchResults~}
	</div>
</div>`
		},
		{
			Hash: "Docuserve-Search-ResultsBody-Template",
			Template: /*html*/`{~TS:Docuserve-Search-Result-Template:AppData.Docuserve.SearchResults~}`
		},
		{
			Hash: "Docuserve-Search-Result-Template",
			Template: /*html*/`<a class="docuserve-search-result" href="{~D:Record.Route~}">
	<div class="docuserve-search-result-title">{~D:Record.Title~}</div>
	{~TS:Docuserve-Search-Result-Breadcrumb-Template:Record.BreadcrumbSlot~}
	{~TS:Docuserve-Search-Result-Path-Template:Record.PathSlot~}
</a>`
		},
		{
			Hash: "Docuserve-Search-Result-Breadcrumb-Template",
			Template: /*html*/`<div class="docuserve-search-result-breadcrumb">{~D:Record.Group~} <span class="docuserve-search-result-breadcrumb-sep">{~I:ChevronRight~}</span> {~D:Record.Module~}</div>`
		},
		{
			Hash: "Docuserve-Search-Result-Path-Template",
			Template: /*html*/`<div class="docuserve-search-result-path">{~D:Record.DocPath~}</div>`
		}
	],

	Renderables:
	[
		{
			RenderableHash: "Docuserve-Search-Display",
			TemplateHash: "Docuserve-Search-Template",
			DestinationAddress: "#Docuserve-Content-Container",
			RenderMethod: "replace"
		}
	]
};

class DocuserveSearchView extends libPictView
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		this._SearchDebounceTimer = null;
	}

	/**
	 * Show the search page with an optional initial query.
	 *
	 * Re-renders the view (so the input value gets stamped from AppData),
	 * focuses the input, and triggers the search if a query was provided.
	 *
	 * @param {string} pQuery - The initial search query
	 */
	showSearch(pQuery)
	{
		// Seed status before render so the template stamps it into place.
		this._setIdleStatus(pQuery);
		this.pict.AppData.Docuserve.SearchResults = [];
		this.render();

		let tmpInput = document.getElementById('Docuserve-Search-Input');
		if (tmpInput)
		{
			tmpInput.value = pQuery || '';
			tmpInput.focus();
		}

		if (pQuery && pQuery.trim())
		{
			this.performSearch(pQuery);
		}

		// Scroll to top
		let tmpContentContainer = document.getElementById('Docuserve-Content-Container');
		if (tmpContentContainer)
		{
			tmpContentContainer.scrollTop = 0;
		}
	}

	/**
	 * Inline handler for the search input.  Debounces dispatch to avoid
	 * running the lunr index on every keystroke.
	 *
	 * @param {string} pValue - The current input value
	 */
	onSearchInput(pValue)
	{
		if (this._SearchDebounceTimer)
		{
			clearTimeout(this._SearchDebounceTimer);
		}
		this._SearchDebounceTimer = setTimeout(() =>
		{
			this.performSearch(pValue);
		}, 250);
	}

	/**
	 * Perform a search and re-render the results region.  The header
	 * status text is updated via assignContent so it doesn't disturb the
	 * input element's focus and selection.
	 *
	 * @param {string} pQuery - The search query
	 */
	performSearch(pQuery)
	{
		let tmpDocuserve = this.pict.AppData.Docuserve;

		if (!pQuery || !pQuery.trim())
		{
			this._setIdleStatus(pQuery);
			tmpDocuserve.SearchResults = [];
			this._renderResultsRegion();
			this._renderStatusRegion();
			return;
		}

		let tmpDocProvider = this.pict.providers['Docuserve-Documentation'];
		let tmpResults     = tmpDocProvider.search(pQuery);

		if (tmpResults.length === 0)
		{
			tmpDocuserve.SearchResults = [];
			tmpDocuserve.SearchStatus  = 'No results found for \'' + this._escapeHTML(pQuery) + '\'.';
			this._renderResultsRegion();
			this._renderStatusRegion();
			return;
		}

		let tmpRecords = [];
		for (let i = 0; i < tmpResults.length; i++)
		{
			let tmpResult = tmpResults[i];
			tmpRecords.push(
			{
				Title:  tmpResult.Title,
				Route:  tmpResult.Route,
				Group:  tmpResult.Group  || '',
				Module: tmpResult.Module || '',
				BreadcrumbSlot: (tmpResult.Group && tmpResult.Module)
					? [{ Group: tmpResult.Group, Module: tmpResult.Module }]
					: [],
				PathSlot: tmpResult.DocPath ? [{ DocPath: tmpResult.DocPath }] : [],
				DocPath: tmpResult.DocPath || ''
			});
		}

		tmpDocuserve.SearchResults = tmpRecords;
		tmpDocuserve.SearchStatus  = tmpResults.length + ' result' + (tmpResults.length !== 1 ? 's' : '')
			+ ' for \'' + this._escapeHTML(pQuery) + '\'';

		this._renderResultsRegion();
		this._renderStatusRegion();
	}

	// ─────────────────────────────────────────────
	//  Private helpers
	// ─────────────────────────────────────────────

	_setIdleStatus(pQuery)
	{
		let tmpDocCount = this.pict.AppData.Docuserve.KeywordDocumentCount || 0;
		this.pict.AppData.Docuserve.SearchStatus = tmpDocCount > 0
			? 'Search across ' + tmpDocCount + ' documents.'
			: 'Enter a search term to find documentation.';
	}

	_renderResultsRegion()
	{
		let tmpHTML = this.pict.parseTemplateByHash('Docuserve-Search-ResultsBody-Template', {});
		this.pict.ContentAssignment.assignContent('#Docuserve-Search-Results', tmpHTML);
	}

	_renderStatusRegion()
	{
		this.pict.ContentAssignment.assignContent('#Docuserve-Search-Status',
			this.pict.AppData.Docuserve.SearchStatus || '');
	}

	_escapeHTML(pText)
	{
		if (!pText)
		{
			return '';
		}
		return String(pText)
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	}
}

module.exports = DocuserveSearchView;

module.exports.default_configuration = _ViewConfiguration;
