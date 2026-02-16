const libPictContentView = require('pict-section-content');

const _ViewConfiguration =
{
	ViewIdentifier: "Docuserve-Content",

	DefaultRenderable: "Docuserve-Content-Display",
	DefaultDestinationAddress: "#Docuserve-Content-Container",

	AutoRender: false,

	CSS: /*css*/`
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
	 * @param {string} pHTMLContent - The HTML to display
	 */
	displayContent(pHTMLContent)
	{
		super.displayContent(pHTMLContent, 'Docuserve-Content-Body');
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
