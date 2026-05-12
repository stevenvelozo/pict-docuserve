const libPictView = require('pict-view');

/**
 * Docuserve-Demo — renders one interactive demo registered with the
 * Docuserve-Demos provider.
 *
 * Layout (themed via pict-provider-theme tokens):
 *
 *   ┌──────────────────────────────────────────────────────────────┐
 *   │ <Demo Name>                                                  │
 *   │ <description paragraph>                                      │
 *   ├──────────────────────────────────┬───────────────────────────┤
 *   │ Live                             │ Sources                   │
 *   │  - the demo's Mount() function   │  - tabs per Sources entry │
 *   │    renders into this container   │  - rendered through       │
 *   │                                  │    pict-section-code      │
 *   │                                  │                           │
 *   └──────────────────────────────────┴───────────────────────────┘
 *
 * If a demo declares no Sources, the right pane is omitted and the live
 * area uses the full width.
 *
 * Re-mount strategy: every call to `showDemo(...)` rebuilds the inner
 * containers from scratch, then calls the demo's Mount(pict, container,
 * spec).  This keeps state isolated between demos and gives library
 * authors a clean container to render into.
 */

const _ViewConfiguration =
{
	ViewIdentifier: "Docuserve-Demo",

	DefaultRenderable: "Docuserve-Demo-Display",
	DefaultDestinationAddress: "#Docuserve-Content-Container",

	AutoRender: false,

	CSS: /*css*/`
		.docuserve-demo
		{
			padding: 1.5em 2em;
			max-width: 1200px;
			margin: 0 auto;
			color: var(--theme-color-text-primary, #2A241E);
		}
		.docuserve-demo-header
		{
			border-bottom: 1px solid var(--theme-color-border-default, #DDD6CA);
			padding-bottom: 0.75em;
			margin-bottom: 1.25em;
		}
		.docuserve-demo-title
		{
			font-size: 1.5em;
			font-weight: 600;
			margin: 0 0 0.3em;
			color: var(--theme-color-text-primary, #3D3229);
		}
		.docuserve-demo-meta
		{
			font-size: 0.78em;
			color: var(--theme-color-text-muted, #8A7F72);
			letter-spacing: 0.04em;
			text-transform: uppercase;
			margin: 0 0 0.6em;
		}
		.docuserve-demo-meta a
		{
			color: inherit;
			text-decoration: none;
		}
		.docuserve-demo-meta a:hover
		{
			color: var(--theme-color-brand-primary, #2E7D74);
			text-decoration: underline;
		}
		.docuserve-demo-description
		{
			font-size: 0.95em;
			line-height: 1.55;
			color: var(--theme-color-text-secondary, #5E5549);
		}
		.docuserve-demo-body
		{
			display: flex;
			gap: 1.5em;
			min-height: 320px;
			align-items: stretch;
		}
		.docuserve-demo-live
		{
			flex: 1 1 60%;
			min-width: 0;
			background: var(--theme-color-background-panel, #FFFFFF);
			border: 1px solid var(--theme-color-border-default, #DDD6CA);
			border-radius: 6px;
			padding: 1em;
			overflow: auto;
		}
		.docuserve-demo-live.full-width
		{
			flex: 1 1 100%;
		}
		.docuserve-demo-sources
		{
			flex: 1 1 40%;
			min-width: 0;
			background: var(--theme-color-background-secondary, #FAF8F4);
			border: 1px solid var(--theme-color-border-default, #DDD6CA);
			border-radius: 6px;
			overflow: hidden;
			display: flex;
			flex-direction: column;
		}
		.docuserve-demo-sources-tabs
		{
			display: flex;
			align-items: stretch;
			background: var(--theme-color-background-tertiary, #F0EDE8);
			border-bottom: 1px solid var(--theme-color-border-default, #DDD6CA);
		}
		.docuserve-demo-sources-tab
		{
			padding: 0.55em 0.9em;
			background: transparent;
			border: none;
			border-right: 1px solid var(--theme-color-border-light, #E8E2D7);
			color: var(--theme-color-text-secondary, #5E5549);
			font-size: 0.8em;
			font-weight: 500;
			cursor: pointer;
			font-family: var(--theme-typography-family-mono, ui-monospace, monospace);
		}
		.docuserve-demo-sources-tab:hover
		{
			background: var(--theme-color-background-hover, #EDE9E3);
		}
		.docuserve-demo-sources-tab.active
		{
			background: var(--theme-color-background-panel, #FFFFFF);
			color: var(--theme-color-brand-primary, #2E7D74);
			box-shadow: inset 0 -2px 0 0 var(--theme-color-brand-primary, #2E7D74);
		}
		.docuserve-demo-sources-body
		{
			flex: 1;
			min-height: 0;
			overflow: auto;
			background: var(--theme-color-background-panel, #FFFFFF);
		}
		.docuserve-demo-source-pane
		{
			display: none;
			padding: 0.5em;
		}
		.docuserve-demo-source-pane.active
		{
			display: block;
		}
		.docuserve-demo-source-pane pre
		{
			margin: 0;
			padding: 0.75em 1em;
			font-family: var(--theme-typography-family-mono, ui-monospace, monospace);
			font-size: 0.82em;
			line-height: 1.5;
			background: var(--theme-color-background-secondary, #F6F3EE);
			border: 1px solid var(--theme-color-border-light, #E5DED1);
			border-radius: 4px;
			overflow: auto;
			white-space: pre;
			color: var(--theme-color-text-primary, #2A241E);
		}
		.docuserve-demo-empty
		{
			padding: 2em;
			text-align: center;
			color: var(--theme-color-text-muted, #8A7F72);
			font-style: italic;
		}

		@media (max-width: 900px)
		{
			.docuserve-demo-body { flex-direction: column; }
			.docuserve-demo-live, .docuserve-demo-sources { flex: 1 1 auto; }
		}
	`,

	Templates:
	[
		{
			Hash: "Docuserve-Demo-Template",
			Template: /*html*/`
<div class="docuserve-demo">
	<div class="docuserve-demo-header">
		<div class="docuserve-demo-meta" id="Docuserve-Demo-Meta"></div>
		<h1 class="docuserve-demo-title" id="Docuserve-Demo-Title">Demo</h1>
		<div class="docuserve-demo-description" id="Docuserve-Demo-Description"></div>
	</div>
	<div class="docuserve-demo-body" id="Docuserve-Demo-Body">
		<div class="docuserve-demo-live" id="Docuserve-Demo-Live"></div>
		<div class="docuserve-demo-sources" id="Docuserve-Demo-Sources" style="display:none">
			<div class="docuserve-demo-sources-tabs" id="Docuserve-Demo-Sources-Tabs"></div>
			<div class="docuserve-demo-sources-body" id="Docuserve-Demo-Sources-Body"></div>
		</div>
	</div>
</div>`
		},
		{
			Hash: "Docuserve-Demo-Empty-Template",
			Template: /*html*/`<div class="docuserve-demo"><div class="docuserve-demo-empty">No demo registered at this route.</div></div>`
		}
	],

	Renderables:
	[
		{
			RenderableHash: "Docuserve-Demo-Display",
			TemplateHash: "Docuserve-Demo-Template",
			DestinationAddress: "#Docuserve-Content-Container",
			RenderMethod: "replace"
		}
	]
};

class DocuserveDemoView extends libPictView
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);
	}

	onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent)
	{
		this.pict.CSSMap.injectCSS();
		return super.onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent);
	}

	/**
	 * Render the empty "no demo registered" message into the content
	 * container.  Used as a 404 for unknown demo routes.
	 */
	showEmpty()
	{
		let tmpHTML = this.pict.parseTemplateByHash('Docuserve-Demo-Empty-Template', {});
		this.pict.ContentAssignment.assignContent('#Docuserve-Content-Container', tmpHTML);
	}

	/**
	 * Render a demo by Hash + Group + Module triple, then call its
	 * Mount() function to instantiate the live view.  Sources (if any)
	 * are rendered into the right pane with tabbed switching.
	 */
	showDemo(pGroup, pModule, pHash)
	{
		let tmpDemos = this.pict.providers['Docuserve-Demos'];
		if (!tmpDemos)
		{
			this.log.warn('Docuserve-Demo: Docuserve-Demos provider not registered');
			this.showEmpty();
			return;
		}

		let tmpEntry = tmpDemos.get(pGroup, pModule, pHash);
		if (!tmpEntry)
		{
			this.log.warn('Docuserve-Demo: no demo registered for ' + pGroup + '/' + pModule + '/' + pHash);
			this.showEmpty();
			return;
		}

		// Render the shell.  AutoRender is false; this view's
		// onAfterRender doesn't run because we call assignContent
		// directly with the parsed template — but the shell renderable
		// path would also work.  Either way the inner containers
		// (#Docuserve-Demo-Live etc.) get freshly created.
		let tmpHTML = this.pict.parseTemplateByHash('Docuserve-Demo-Template', {});
		this.pict.ContentAssignment.assignContent('#Docuserve-Content-Container', tmpHTML);
		this.pict.CSSMap.injectCSS();

		// Populate header
		let tmpTitleEl = document.getElementById('Docuserve-Demo-Title');
		let tmpMetaEl  = document.getElementById('Docuserve-Demo-Meta');
		let tmpDescEl  = document.getElementById('Docuserve-Demo-Description');
		if (tmpTitleEl) { tmpTitleEl.textContent = tmpEntry.Name || tmpEntry.Hash; }
		if (tmpMetaEl)
		{
			tmpMetaEl.innerHTML = this._escapeHTML(tmpEntry.Group) + ' · '
				+ '<a href="#/doc/' + this._escapeHTML(tmpEntry.Group) + '/' + this._escapeHTML(tmpEntry.Module) + '">' + this._escapeHTML(tmpEntry.Module) + '</a>';
		}
		if (tmpDescEl) { tmpDescEl.textContent = tmpEntry.Description || ''; }

		// Populate live container by calling the demo's Mount.
		let tmpLiveEl = document.getElementById('Docuserve-Demo-Live');
		let tmpSourcesEl = document.getElementById('Docuserve-Demo-Sources');
		if (tmpLiveEl)
		{
			let tmpHasSources = Array.isArray(tmpEntry.Sources) && tmpEntry.Sources.length > 0;
			if (tmpSourcesEl)
			{
				tmpSourcesEl.style.display = tmpHasSources ? '' : 'none';
				tmpLiveEl.classList.toggle('full-width', !tmpHasSources);
			}

			try
			{
				tmpEntry.Mount(this.pict, tmpLiveEl, tmpEntry.Spec || {});
			}
			catch (pError)
			{
				this.log.warn('Docuserve-Demo: Mount() threw for ' + pHash + ': ' + (pError && pError.message ? pError.message : pError));
				tmpLiveEl.innerHTML = '<div class="docuserve-demo-empty">Demo failed to mount: ' + this._escapeHTML(pError && pError.message ? pError.message : String(pError)) + '</div>';
			}
		}

		// Populate sources tabs.
		if (Array.isArray(tmpEntry.Sources) && tmpEntry.Sources.length > 0)
		{
			this._renderSources(tmpEntry.Sources);
		}
	}

	_renderSources(pSources)
	{
		let tmpTabsEl = document.getElementById('Docuserve-Demo-Sources-Tabs');
		let tmpBodyEl = document.getElementById('Docuserve-Demo-Sources-Body');
		if (!tmpTabsEl || !tmpBodyEl) { return; }

		let tmpTabsHTML = '';
		let tmpBodyHTML = '';
		for (let i = 0; i < pSources.length; i++)
		{
			let tmpSrc = pSources[i];
			let tmpActiveCls = (i === 0) ? ' active' : '';
			let tmpLabel = this._escapeHTML(tmpSrc.Name || ('source-' + (i + 1)));
			tmpTabsHTML += '<button type="button" class="docuserve-demo-sources-tab' + tmpActiveCls + '" '
				+ 'data-source-idx="' + i + '" '
				+ 'onclick="_Pict.views[\'Docuserve-Demo\']._switchSourceTab(' + i + ')">'
				+ tmpLabel + '</button>';
			tmpBodyHTML += '<div class="docuserve-demo-source-pane' + tmpActiveCls + '" data-source-idx="' + i + '">'
				+ '<pre><code>' + this._escapeHTML(tmpSrc.Content || '') + '</code></pre>'
				+ '</div>';
		}
		tmpTabsEl.innerHTML = tmpTabsHTML;
		tmpBodyEl.innerHTML = tmpBodyHTML;
	}

	_switchSourceTab(pIdx)
	{
		let tmpTabs = document.querySelectorAll('.docuserve-demo-sources-tab');
		let tmpPanes = document.querySelectorAll('.docuserve-demo-source-pane');
		for (let i = 0; i < tmpTabs.length; i++)
		{
			let tmpIdx = parseInt(tmpTabs[i].getAttribute('data-source-idx'), 10);
			tmpTabs[i].classList.toggle('active', tmpIdx === pIdx);
		}
		for (let i = 0; i < tmpPanes.length; i++)
		{
			let tmpIdx = parseInt(tmpPanes[i].getAttribute('data-source-idx'), 10);
			tmpPanes[i].classList.toggle('active', tmpIdx === pIdx);
		}
	}

	_escapeHTML(pText)
	{
		if (pText == null) { return ''; }
		return String(pText)
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	}
}

module.exports = DocuserveDemoView;
module.exports.default_configuration = _ViewConfiguration;
