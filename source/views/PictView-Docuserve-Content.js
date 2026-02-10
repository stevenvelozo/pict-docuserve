const libPictView = require('pict-view');

const _ViewConfiguration =
{
	ViewIdentifier: "Docuserve-Content",

	DefaultRenderable: "Docuserve-Content-Display",
	DefaultDestinationAddress: "#Docuserve-Content-Container",

	AutoRender: false,

	CSS: /*css*/`
		.docuserve-content {
			padding: 2em 3em;
			max-width: 900px;
			margin: 0 auto;
		}
		.docuserve-content-loading {
			display: flex;
			align-items: center;
			justify-content: center;
			min-height: 200px;
			color: #999;
			font-size: 1em;
		}
		.docuserve-content h1 {
			font-size: 2em;
			color: #2c3e50;
			border-bottom: 1px solid #eee;
			padding-bottom: 0.3em;
			margin-top: 0;
		}
		.docuserve-content h2 {
			font-size: 1.5em;
			color: #2c3e50;
			border-bottom: 1px solid #f0f0f0;
			padding-bottom: 0.25em;
			margin-top: 1.5em;
		}
		.docuserve-content h3 {
			font-size: 1.25em;
			color: #333;
			margin-top: 1.25em;
		}
		.docuserve-content h4, .docuserve-content h5, .docuserve-content h6 {
			color: #555;
			margin-top: 1em;
		}
		.docuserve-content p {
			line-height: 1.7;
			color: #444;
			margin: 0.75em 0;
		}
		.docuserve-content a {
			color: #42b983;
			text-decoration: none;
		}
		.docuserve-content a:hover {
			text-decoration: underline;
		}
		.docuserve-content pre {
			background: #2c3e50;
			color: #ecf0f1;
			padding: 1.25em;
			border-radius: 6px;
			overflow-x: auto;
			line-height: 1.5;
			font-size: 0.9em;
		}
		.docuserve-content code {
			background: #f4f4f5;
			padding: 0.15em 0.4em;
			border-radius: 3px;
			font-size: 0.9em;
			color: #e74c3c;
		}
		.docuserve-content pre code {
			background: none;
			padding: 0;
			color: inherit;
			font-size: inherit;
		}
		.docuserve-content blockquote {
			border-left: 4px solid #42b983;
			margin: 1em 0;
			padding: 0.5em 1em;
			background: #f9f9f9;
			color: #666;
		}
		.docuserve-content blockquote p {
			margin: 0.25em 0;
		}
		.docuserve-content ul, .docuserve-content ol {
			padding-left: 2em;
			line-height: 1.8;
		}
		.docuserve-content li {
			margin: 0.25em 0;
			color: #444;
		}
		.docuserve-content hr {
			border: none;
			border-top: 1px solid #eee;
			margin: 2em 0;
		}
		.docuserve-content table {
			width: 100%;
			border-collapse: collapse;
			margin: 1em 0;
		}
		.docuserve-content table th {
			background: #f5f7fa;
			border: 1px solid #e0e0e0;
			padding: 0.6em 0.8em;
			text-align: left;
			font-weight: 600;
			color: #2c3e50;
		}
		.docuserve-content table td {
			border: 1px solid #e0e0e0;
			padding: 0.5em 0.8em;
			color: #444;
		}
		.docuserve-content table tr:nth-child(even) {
			background: #fafafa;
		}
		.docuserve-content img {
			max-width: 100%;
			height: auto;
		}
		.docuserve-not-found {
			text-align: center;
			padding: 3em 1em;
			color: #666;
		}
		.docuserve-not-found h2 {
			color: #999;
			font-size: 1.5em;
			border-bottom: none;
		}
		.docuserve-not-found code {
			background: #f4f4f5;
			padding: 0.15em 0.4em;
			border-radius: 3px;
			font-size: 0.9em;
			color: #e74c3c;
		}
	`,

	Templates:
	[
		{
			Hash: "Docuserve-Content-Template",
			Template: /*html*/`
<div class="docuserve-content" id="Docuserve-Content-Body">
	<div class="docuserve-content-loading">Loading documentation...</div>
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

class DocuserveContentView extends libPictView
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);
	}

	/**
	 * Display parsed HTML content in the content area.
	 *
	 * @param {string} pHTMLContent - The HTML to display
	 */
	displayContent(pHTMLContent)
	{
		this.pict.ContentAssignment.assignContent('#Docuserve-Content-Body', pHTMLContent);

		// Scroll to top of content area
		let tmpContentContainer = document.getElementById('Docuserve-Content-Container');
		if (tmpContentContainer)
		{
			tmpContentContainer.scrollTop = 0;
		}
	}

	/**
	 * Show a loading indicator.
	 */
	showLoading()
	{
		this.pict.ContentAssignment.assignContent('#Docuserve-Content-Body', '<div class="docuserve-content-loading">Loading documentation...</div>');
	}
}

module.exports = DocuserveContentView;

module.exports.default_configuration = _ViewConfiguration;
