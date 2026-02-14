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
			color: #8A7F72;
			font-size: 1em;
		}
		.docuserve-content h1 {
			font-size: 2em;
			color: #3D3229;
			border-bottom: 1px solid #DDD6CA;
			padding-bottom: 0.3em;
			margin-top: 0;
		}
		.docuserve-content h2 {
			font-size: 1.5em;
			color: #3D3229;
			border-bottom: 1px solid #EAE3D8;
			padding-bottom: 0.25em;
			margin-top: 1.5em;
		}
		.docuserve-content h3 {
			font-size: 1.25em;
			color: #3D3229;
			margin-top: 1.25em;
		}
		.docuserve-content h4, .docuserve-content h5, .docuserve-content h6 {
			color: #5E5549;
			margin-top: 1em;
		}
		.docuserve-content p {
			line-height: 1.7;
			color: #423D37;
			margin: 0.75em 0;
		}
		.docuserve-content a {
			color: #2E7D74;
			text-decoration: none;
		}
		.docuserve-content a:hover {
			text-decoration: underline;
		}
		.docuserve-content pre {
			background: #3D3229;
			color: #E8E0D4;
			padding: 1.25em;
			border-radius: 6px;
			overflow-x: auto;
			line-height: 1.5;
			font-size: 0.9em;
		}
		.docuserve-content code {
			background: #F0ECE4;
			padding: 0.15em 0.4em;
			border-radius: 3px;
			font-size: 0.9em;
			color: #9E6B47;
		}
		.docuserve-content pre code {
			background: none;
			padding: 0;
			color: inherit;
			font-size: inherit;
		}
		.docuserve-content blockquote {
			border-left: 4px solid #2E7D74;
			margin: 1em 0;
			padding: 0.5em 1em;
			background: #F7F5F0;
			color: #5E5549;
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
			color: #423D37;
		}
		.docuserve-content hr {
			border: none;
			border-top: 1px solid #DDD6CA;
			margin: 2em 0;
		}
		.docuserve-content table {
			width: 100%;
			border-collapse: collapse;
			margin: 1em 0;
		}
		.docuserve-content table th {
			background: #F5F0E8;
			border: 1px solid #DDD6CA;
			padding: 0.6em 0.8em;
			text-align: left;
			font-weight: 600;
			color: #3D3229;
		}
		.docuserve-content table td {
			border: 1px solid #DDD6CA;
			padding: 0.5em 0.8em;
			color: #423D37;
		}
		.docuserve-content table tr:nth-child(even) {
			background: #F7F5F0;
		}
		.docuserve-content img {
			max-width: 100%;
			height: auto;
		}
		.docuserve-content pre.mermaid {
			background: #fff;
			color: #3D3229;
			text-align: center;
			padding: 1em;
		}
		.docuserve-content .docuserve-katex-display {
			text-align: center;
			margin: 1em 0;
			padding: 0.5em;
			overflow-x: auto;
		}
		.docuserve-content .docuserve-katex-inline {
			display: inline;
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

		// Post-render: initialize Mermaid diagrams if mermaid is available
		this.renderMermaidDiagrams();

		// Post-render: render KaTeX equations if katex is available
		this.renderKaTeXEquations();
	}

	/**
	 * Render any Mermaid diagram blocks in the content area.
	 * Mermaid blocks are `<pre class="mermaid">` elements produced by parseMarkdown.
	 */
	renderMermaidDiagrams()
	{
		if (typeof mermaid === 'undefined')
		{
			return;
		}

		let tmpContentBody = document.getElementById('Docuserve-Content-Body');
		if (!tmpContentBody)
		{
			return;
		}

		let tmpMermaidElements = tmpContentBody.querySelectorAll('pre.mermaid');
		if (tmpMermaidElements.length < 1)
		{
			return;
		}

		// mermaid.run() will process all pre.mermaid elements in the container
		try
		{
			mermaid.run({ nodes: tmpMermaidElements });
		}
		catch (pError)
		{
			this.log.error('Mermaid rendering error: ' + pError.message);
		}
	}

	/**
	 * Render KaTeX inline and display math elements in the content area.
	 * Inline: `<span class="docuserve-katex-inline">`
	 * Display: `<div class="docuserve-katex-display">`
	 */
	renderKaTeXEquations()
	{
		if (typeof katex === 'undefined')
		{
			return;
		}

		let tmpContentBody = document.getElementById('Docuserve-Content-Body');
		if (!tmpContentBody)
		{
			return;
		}

		// Render inline math
		let tmpInlineElements = tmpContentBody.querySelectorAll('.docuserve-katex-inline');
		for (let i = 0; i < tmpInlineElements.length; i++)
		{
			try
			{
				katex.render(tmpInlineElements[i].textContent, tmpInlineElements[i], { throwOnError: false, displayMode: false });
			}
			catch (pError)
			{
				this.log.warn('KaTeX inline error: ' + pError.message);
			}
		}

		// Render display math
		let tmpDisplayElements = tmpContentBody.querySelectorAll('.docuserve-katex-display');
		for (let i = 0; i < tmpDisplayElements.length; i++)
		{
			try
			{
				katex.render(tmpDisplayElements[i].textContent, tmpDisplayElements[i], { throwOnError: false, displayMode: true });
			}
			catch (pError)
			{
				this.log.warn('KaTeX display error: ' + pError.message);
			}
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
