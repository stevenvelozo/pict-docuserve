const libPictView = require('pict-view');

/**
 * Docuserve-Layout — application chrome built on pict-section-modal's
 * shell() API.
 *
 * Layout:
 *
 *   ┌──────────────────────────────────────────────────────────────┐
 *   │ #Theme-TopBar  (top, fixed, 56px)                            │
 *   │   BrandMark + Docuserve-TopBar-Nav + Docuserve-TopBar-User   │
 *   ├────────┬─────────────────────────────────────────────────────┤
 *   │ #Doc-  │ #Docuserve-Content-Container  (center)              │
 *   │ userve │   - splash / content / search views render here     │
 *   │ -Side- │                                                     │
 *   │ bar-   │                                                     │
 *   │ Cont…  │                                                     │
 *   │ (left, │                                                     │
 *   │ resiz) │                                                     │
 *   └────────┴─────────────────────────────────────────────────────┘
 *
 * The legacy `data-theme="dark|light"` toggle, custom topbar markup, and
 * hand-rolled body flex layout are all retired here in favour of the
 * pict-section-theme + pict-section-modal stack.
 */

const _ViewConfiguration =
{
	ViewIdentifier: "Docuserve-Layout",

	DefaultRenderable: "Docuserve-Layout-Shell",
	DefaultDestinationAddress: "#Docuserve-Application-Container",

	AutoRender: false,

	CSS: /*css*/`
		html, body { height: 100%; margin: 0; padding: 0; }
		body
		{
			background: var(--theme-color-background-primary, #FDFBF7);
			color:      var(--theme-color-text-primary,       #2A241E);
			font-family: var(--theme-typography-family-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif);
		}
		/* height: 100% (not 100vh) — Theme-Scale applies CSS zoom on
		   <html>; vh units render against the un-zoomed viewport and
		   push panels off-screen at non-1.0 scale. */
		#Docuserve-Application-Container
		{
			height: 100%;
			min-height: 0;
			overflow: hidden;
		}
		.pict-modal-shell-host   { height: 100%; }
		.pict-modal-shell        { background: var(--theme-color-background-primary, #FDFBF7); }
		.pict-modal-shell-panel  { background: var(--theme-color-background-panel,   #FFFFFF); }
		.pict-modal-shell-center { background: var(--theme-color-background-primary, #FDFBF7); }

		/* Center workspace — content / splash / search views write into
		   #Docuserve-Content-Container which the shell provisions as the
		   center destination. */
		#Docuserve-Content-Container
		{
			height: 100%;
			min-height: 0;
			overflow-y: auto;
		}

		/* The Sidebar view writes into the panel's destination
		   (#Docuserve-Sidebar-Container).  Its own CSS lives in
		   PictView-Docuserve-Sidebar — here we just guarantee the panel
		   wrap is scrollable and themed. */
		#Docuserve-Sidebar-Container
		{
			height: 100%;
			min-height: 0;
			overflow-y: auto;
			background: var(--theme-color-background-secondary, var(--docuserve-sidebar-bg, #FAF7F1));
		}
	`,

	Templates:
	[
		{
			Hash: "Docuserve-Layout-Shell-Template",
			// Minimal template — the shell owns the real DOM. The mount
			// div is where the shell attaches; everything else (topbar,
			// sidebar, center) is built by shell.addPanel + shell.center.
			Template: /*html*/`<div id="Docuserve-Layout-Mount" style="height:100%"></div>`
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
		this._shell = null;
		this._shellPanelsBuilt = false;
	}

	onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent)
	{
		this.pict.CSSMap.injectCSS();

		if (!this._shellPanelsBuilt)
		{
			this._buildShell();
			this._shellPanelsBuilt = true;
		}

		// Resolve the current hash on initial load — splash / content /
		// search views render into the shell-managed center destination.
		this.pict.PictApplication.resolveHash();

		this._wireHashChangeListener();

		return super.onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent);
	}

	_buildShell()
	{
		let tmpModal = this.pict.views['Pict-Section-Modal'];
		if (!tmpModal || typeof tmpModal.shell !== 'function')
		{
			if (this.log && this.log.warn) { this.log.warn('Docuserve-Layout: pict-section-modal.shell not available'); }
			return;
		}

		let tmpMount = document.getElementById('Docuserve-Layout-Mount');
		if (!tmpMount)
		{
			if (this.log && this.log.warn) { this.log.warn('Docuserve-Layout: #Docuserve-Layout-Mount missing'); }
			return;
		}

		this._shell = tmpModal.shell(tmpMount, { PersistenceKey: 'docuserve-shell' });

		// Top — Theme-TopBar (BrandMark + NavView + UserView slots; Theme-Button on the far right).
		this._shell.addPanel(
		{
			Hash: 'topbar',
			Side: 'top',
			Mode: 'fixed',
			Size: 56,
			ContentDestinationId: 'Theme-TopBar',
			ContentView: 'Theme-TopBar'
		});

		// Left — sidebar.  Resizable + collapsible + responsive-drawer
		// below 900px wide (the sidebar flips to a top drawer above the
		// content area when the viewport gets narrow).
		this._shell.addPanel(
		{
			Hash: 'sidebar',
			Side: 'left',
			Mode: 'resizable',
			Size: 280,
			MinSize: 200,
			MaxSize: 500,
			Title: 'Documentation',
			ContentDestinationId: 'Docuserve-Sidebar-Container',
			ContentView: 'Docuserve-Sidebar',
			ResponsiveDrawer: 900
		});

		// Center — the content area where splash / content / search render.
		this._shell.center({ ContentDestinationId: 'Docuserve-Content-Container' });
	}

	_wireHashChangeListener()
	{
		if (this._hashListenerBound) { return; }
		this._hashListenerBound = true;
		let tmpSelf = this;
		window.addEventListener('hashchange', () =>
		{
			tmpSelf.pict.PictApplication.resolveHash();
		});
	}

	// ─────────────────────────────────────────────
	//  Public panel accessors (used by views that need to toggle the
	//  sidebar — e.g. mobile menu buttons).
	// ─────────────────────────────────────────────

	getSidebarPanel() { return this._shell ? this._shell.getPanel('sidebar') : null; }

	toggleSidebar()
	{
		let tmpPanel = this.getSidebarPanel();
		if (tmpPanel) { tmpPanel.toggle(); }
	}
}

module.exports = DocuserveLayoutView;
module.exports.default_configuration = _ViewConfiguration;
