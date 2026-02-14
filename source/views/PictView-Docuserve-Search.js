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
			color: #3D3229;
			margin: 0 0 0.75em 0;
		}
		.docuserve-search-input {
			width: 100%;
			padding: 0.75em 1em;
			font-size: 1.1em;
			border: 2px solid #D4CCBE;
			border-radius: 6px;
			outline: none;
			box-sizing: border-box;
			transition: border-color 0.15s;
		}
		.docuserve-search-input:focus {
			border-color: #2E7D74;
		}
		.docuserve-search-status {
			margin-top: 0.75em;
			font-size: 0.9em;
			color: #8A7F72;
		}
		.docuserve-search-results {
			margin-top: 1em;
		}
		.docuserve-search-result {
			display: block;
			padding: 1em 1.25em;
			margin-bottom: 0.5em;
			border: 1px solid #EAE3D8;
			border-radius: 6px;
			text-decoration: none;
			color: inherit;
			transition: border-color 0.15s, box-shadow 0.15s;
		}
		.docuserve-search-result:hover {
			border-color: #2E7D74;
			box-shadow: 0 2px 8px rgba(46, 125, 116, 0.1);
		}
		.docuserve-search-result-title {
			font-size: 1.05em;
			font-weight: 600;
			color: #2E7D74;
			margin-bottom: 0.25em;
		}
		.docuserve-search-result-breadcrumb {
			font-size: 0.8em;
			color: #8A7F72;
			margin-bottom: 0.2em;
		}
		.docuserve-search-result-path {
			font-size: 0.8em;
			color: #A39889;
			font-family: monospace;
		}
		.docuserve-search-empty {
			text-align: center;
			padding: 3em 1em;
			color: #8A7F72;
			font-size: 1em;
		}
	`,

	Templates:
	[
		{
			Hash: "Docuserve-Search-Template",
			Template: /*html*/`
<div class="docuserve-search">
	<div class="docuserve-search-header">
		<h1>Search Documentation</h1>
		<input type="text" class="docuserve-search-input" id="Docuserve-Search-Input" placeholder="Search across all modules...">
		<div id="Docuserve-Search-Status" class="docuserve-search-status"></div>
	</div>
	<div id="Docuserve-Search-Results" class="docuserve-search-results"></div>
</div>
`
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

	onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent)
	{
		// Attach the search input listener
		let tmpInput = document.getElementById('Docuserve-Search-Input');
		if (tmpInput)
		{
			tmpInput.addEventListener('input', () =>
			{
				if (this._SearchDebounceTimer)
				{
					clearTimeout(this._SearchDebounceTimer);
				}

				this._SearchDebounceTimer = setTimeout(() =>
				{
					this.performSearch(tmpInput.value);
				}, 250);
			});
		}

		return super.onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent);
	}

	/**
	 * Show the search page with an optional initial query.
	 *
	 * @param {string} pQuery - The initial search query
	 */
	showSearch(pQuery)
	{
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
		else
		{
			let tmpDocCount = this.pict.AppData.Docuserve.KeywordDocumentCount || 0;
			let tmpStatusMsg = tmpDocCount > 0
				? 'Search across ' + tmpDocCount + ' documents.'
				: 'Enter a search term to find documentation.';
			this.pict.ContentAssignment.assignContent('#Docuserve-Search-Status', tmpStatusMsg);
			this.pict.ContentAssignment.assignContent('#Docuserve-Search-Results', '');
		}

		// Scroll to top
		let tmpContentContainer = document.getElementById('Docuserve-Content-Container');
		if (tmpContentContainer)
		{
			tmpContentContainer.scrollTop = 0;
		}
	}

	/**
	 * Perform a search and render the results.
	 *
	 * @param {string} pQuery - The search query
	 */
	performSearch(pQuery)
	{
		if (!pQuery || !pQuery.trim())
		{
			let tmpDocCount = this.pict.AppData.Docuserve.KeywordDocumentCount || 0;
			let tmpStatusMsg = tmpDocCount > 0
				? 'Search across ' + tmpDocCount + ' documents.'
				: 'Enter a search term to find documentation.';
			this.pict.ContentAssignment.assignContent('#Docuserve-Search-Status', tmpStatusMsg);
			this.pict.ContentAssignment.assignContent('#Docuserve-Search-Results', '');
			return;
		}

		let tmpDocProvider = this.pict.providers['Docuserve-Documentation'];
		let tmpResults = tmpDocProvider.search(pQuery);

		// Update status
		if (tmpResults.length === 0)
		{
			this.pict.ContentAssignment.assignContent('#Docuserve-Search-Status',
				'No results found for \'' + this.escapeHTML(pQuery) + '\'.');
			this.pict.ContentAssignment.assignContent('#Docuserve-Search-Results', '');
			return;
		}

		this.pict.ContentAssignment.assignContent('#Docuserve-Search-Status',
			tmpResults.length + ' result' + (tmpResults.length !== 1 ? 's' : '') + ' for \'' + this.escapeHTML(pQuery) + '\'');

		// Render results
		let tmpHTML = '';

		for (let i = 0; i < tmpResults.length; i++)
		{
			let tmpResult = tmpResults[i];
			let tmpBreadcrumb = '';
			if (tmpResult.Group && tmpResult.Module)
			{
				tmpBreadcrumb = tmpResult.Group + ' &rsaquo; ' + tmpResult.Module;
			}

			tmpHTML += '<a class="docuserve-search-result" href="' + tmpResult.Route + '">';
			tmpHTML += '<div class="docuserve-search-result-title">' + this.escapeHTML(tmpResult.Title) + '</div>';
			if (tmpBreadcrumb)
			{
				tmpHTML += '<div class="docuserve-search-result-breadcrumb">' + tmpBreadcrumb + '</div>';
			}
			if (tmpResult.DocPath)
			{
				tmpHTML += '<div class="docuserve-search-result-path">' + this.escapeHTML(tmpResult.DocPath) + '</div>';
			}
			tmpHTML += '</a>';
		}

		this.pict.ContentAssignment.assignContent('#Docuserve-Search-Results', tmpHTML);
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

module.exports = DocuserveSearchView;

module.exports.default_configuration = _ViewConfiguration;
