const libPictContentView = require('pict-section-content');

const _ViewConfiguration =
{
	ViewIdentifier: "Docuserve-Content",

	DefaultRenderable: "Docuserve-Content-Display",
	DefaultDestinationAddress: "#Docuserve-Content-Container",

	AutoRender: false,

	// The parent pict-section-content CSS must be included here because
	// pict-view's Object.assign replaces the CSS property entirely when
	// the child provides its own.  We cannot read the parent's
	// default_configuration.CSS at module scope because browserify's
	// module initialisation order does not guarantee it is populated yet.
	CSS: /*css*/`
		.pict-content {
			padding: 2em 3em;
			max-width: 900px;
			margin: 0 auto;
		}
		.pict-content-loading {
			display: flex;
			align-items: center;
			justify-content: center;
			min-height: 200px;
			color: #8A7F72;
			font-size: 1em;
		}
		.pict-content h1 {
			font-size: 2em;
			color: #3D3229;
			border-bottom: 1px solid #DDD6CA;
			padding-bottom: 0.3em;
			margin-top: 0;
		}
		.pict-content h2 {
			font-size: 1.5em;
			color: #3D3229;
			border-bottom: 1px solid #EAE3D8;
			padding-bottom: 0.25em;
			margin-top: 1.5em;
		}
		.pict-content h3 {
			font-size: 1.25em;
			color: #3D3229;
			margin-top: 1.25em;
		}
		.pict-content h4, .pict-content h5, .pict-content h6 {
			color: #5E5549;
			margin-top: 1em;
		}
		.pict-content p {
			line-height: 1.7;
			color: #423D37;
			margin: 0.75em 0;
		}
		.pict-content a {
			color: #2E7D74;
			text-decoration: none;
		}
		.pict-content a:hover {
			text-decoration: underline;
		}
		.pict-content pre {
			background: #3D3229;
			color: #E8E0D4;
			padding: 1.25em;
			border-radius: 6px;
			overflow-x: auto;
			line-height: 1.5;
			font-size: 0.9em;
		}
		.pict-content code {
			background: #F0ECE4;
			padding: 0.15em 0.4em;
			border-radius: 3px;
			font-size: 0.9em;
			color: #9E6B47;
		}
		.pict-content pre code {
			background: none;
			padding: 0;
			color: inherit;
			font-size: inherit;
		}
		.pict-content blockquote {
			border-left: 4px solid #2E7D74;
			margin: 1em 0;
			padding: 0.5em 1em;
			background: #F7F5F0;
			color: #5E5549;
		}
		.pict-content blockquote p {
			margin: 0.25em 0;
		}
		.pict-content ul, .pict-content ol {
			padding-left: 2em;
			line-height: 1.8;
		}
		.pict-content li {
			margin: 0.25em 0;
			color: #423D37;
		}
		.pict-content hr {
			border: none;
			border-top: 1px solid #DDD6CA;
			margin: 2em 0;
		}
		.pict-content table {
			width: 100%;
			border-collapse: collapse;
			margin: 1em 0;
		}
		.pict-content table th {
			background: #F5F0E8;
			border: 1px solid #DDD6CA;
			padding: 0.6em 0.8em;
			text-align: left;
			font-weight: 600;
			color: #3D3229;
		}
		.pict-content table td {
			border: 1px solid #DDD6CA;
			padding: 0.5em 0.8em;
			color: #423D37;
		}
		.pict-content table tr:nth-child(even) {
			background: #F7F5F0;
		}
		.pict-content img {
			max-width: 100%;
			height: auto;
		}
		.pict-content pre.mermaid {
			background: #fff;
			color: #3D3229;
			text-align: center;
			padding: 1em;
		}
		.pict-content .pict-content-katex-display {
			text-align: center;
			margin: 1em 0;
			padding: 0.5em;
			overflow-x: auto;
		}
		.pict-content .pict-content-katex-inline {
			display: inline;
		}
		.docuserve-module-external-link {
			padding: 0.5em 0;
			margin-bottom: 0.5em;
			border-bottom: 1px solid #EAE3D8;
			font-size: 0.85em;
		}
		.docuserve-module-external-link a {
			color: #2E7D74;
			text-decoration: none;
		}
		.docuserve-module-external-link a:hover {
			text-decoration: underline;
		}
		.docuserve-not-found {
			text-align: center;
			padding: 3em 1em;
			color: #5E5549;
		}
		.docuserve-not-found h2 {
			color: #8A7F72;
			font-size: 1.5em;
			border-bottom: none;
		}
		.docuserve-not-found code {
			background: #F0ECE4;
			padding: 0.15em 0.4em;
			border-radius: 3px;
			font-size: 0.9em;
			color: #9E6B47;
		}
	`,

	Templates:
	[
		{
			Hash: "Docuserve-Content-Template",
			Template: /*html*/`
<div class="pict-content" id="Docuserve-Content-Body">
	<div class="pict-content-loading">Loading documentation...</div>
</div>
`
		}
	],

	Renderables:
	[
		{
			RenderableHash: "Docuserve-Content-Display",
			TemplateHash: "Docuserve-Content-Template",
			DestinationAddress: "#Docuserve-Content-Container",
			RenderMethod: "replace"
		}
	]
};

class DocuserveContentView extends libPictContentView
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);
	}

	/**
	 * Display parsed HTML content in the content area.
	 *
	 * When viewing a module's documentation, prepends a link to the
	 * module's own GitHub Pages documentation site.
	 *
	 * @param {string} pHTMLContent - The HTML to display
	 */
	displayContent(pHTMLContent)
	{
		let tmpHTML = pHTMLContent;
		let tmpGroup = this.pict.AppData.Docuserve.CurrentGroup;
		let tmpModule = this.pict.AppData.Docuserve.CurrentModule;

		if (tmpGroup && tmpModule)
		{
			let tmpDocProvider = this.pict.providers['Docuserve-Documentation'];
			if (tmpDocProvider)
			{
				let tmpPagesURL = tmpDocProvider.resolveGitHubPagesURL(tmpGroup, tmpModule);
				if (tmpPagesURL)
				{
					tmpHTML = '<div class="docuserve-module-external-link">'
						+ '<a href="' + tmpPagesURL + '" target="_blank" rel="noopener">'
						+ '&#x2197; View ' + tmpModule + ' documentation site'
						+ '</a>'
						+ '</div>'
						+ tmpHTML;
				}
			}
		}

		super.displayContent(tmpHTML, 'Docuserve-Content-Body');
	}

	/**
	 * Show a loading indicator.
	 */
	showLoading()
	{
		super.showLoading('Loading documentation...', 'Docuserve-Content-Body');
	}
}

module.exports = DocuserveContentView;

module.exports.default_configuration = _ViewConfiguration;
