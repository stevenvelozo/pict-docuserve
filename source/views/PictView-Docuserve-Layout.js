const libPictView = require('pict-view');

const _ViewConfiguration =
{
	ViewIdentifier: "Docuserve-Layout",

	DefaultRenderable: "Docuserve-Layout-Shell",
	DefaultDestinationAddress: "#Docuserve-Application-Container",

	AutoRender: false,

	CSS: /*css*/`
		#Docuserve-Application-Container {
			display: flex;
			flex-direction: column;
			height: 100vh;
			overflow: hidden;
		}
		#Docuserve-TopBar-Container {
			flex-shrink: 0;
		}
		.docuserve-body {
			display: flex;
			flex: 1;
			min-height: 0;
		}
		#Docuserve-Sidebar-Container {
			flex-shrink: 0;
			width: 280px;
			overflow-y: auto;
			background-color: #F5F0E8;
		}
		#Docuserve-Content-Container {
			flex: 1;
			min-width: 0;
			overflow-y: auto;
		}
	`,

	Templates:
	[
		{
			Hash: "Docuserve-Layout-Shell-Template",
			Template: /*html*/`
<div id="Docuserve-TopBar-Container"></div>
<div class="docuserve-body">
	<div id="Docuserve-Sidebar-Container"></div>
	<div id="Docuserve-Content-Container"></div>
</div>
`
		}
	],

	Renderables:
	[
		{
			RenderableHash: "Docuserve-Layout-Shell",
			TemplateHash: "Docuserve-Layout-Shell-Template",
			DestinationAddress: "#Docuserve-Application-Container",
			RenderMethod: "replace"
		}
	]
};

class DocuserveLayoutView extends libPictView
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);
	}

	onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent)
	{
		// After the layout shell is rendered, render the child views into their containers
		this.pict.views['Docuserve-TopBar'].render();
		this.pict.views['Docuserve-Sidebar'].render();

		// Show the splash screen initially
		this.pict.views['Docuserve-Splash'].render();

		// Inject all view CSS into the PICT-CSS style element
		this.pict.CSSMap.injectCSS();

		// Resolve the current hash on initial load
		this.pict.PictApplication.resolveHash();

		// Listen for hash changes so that plain <a href="#/..."> links trigger
		// navigation.  This covers sidebar links, splash action buttons,
		// in-content links, and browser back/forward navigation.
		if (!this._HashChangeListenerBound)
		{
			this._HashChangeListenerBound = true;
			let tmpSelf = this;
			window.addEventListener('hashchange', () =>
			{
				tmpSelf.pict.PictApplication.resolveHash();
			});
		}

		return super.onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent);
	}
}

module.exports = DocuserveLayoutView;

module.exports.default_configuration = _ViewConfiguration;
