const libPictView                 = require('pict-view');
const libPictSectionCode          = require('pict-section-code');
const libFableServiceProviderBase = require('fable-serviceproviderbase');

// Note: we deliberately do NOT `require('fable')` here.  Fable is already
// bundled into the host page's pict.min.js (via pict's own dep tree);
// each playground Run reads the Fable class off the live pict instance:
//   `new this.fable.constructor({ ... })`
//
// We also do NOT `require('codejar')`.  CodeJar is published as an ES
// module ("export function CodeJar(...)") which browserify's classic
// parser refuses, so we lazy-load it from jsDelivr via dynamic import()
// and hand the constructor to pict-section-code's connectCodeJarPrototype.
// The `new Function(...)` wrapper hides the import() syntax from
// browserify so it's preserved as a runtime call.
const _CodeJarCDN = 'https://cdn.jsdelivr.net/npm/codejar@4.2.0/dist/codejar.min.js';

/**
 * Docuserve-Fable-Playground — a live editor + log-capture sandbox.
 *
 * The editor itself is a `pict-section-code` view mounted inside the
 * playground's editor pane.  That gets us:
 *   - CodeJar editor wrapped in proper Pict view lifecycle.
 *   - Regex-based JS/JSON/HTML/CSS highlighter (no hljs CDN dep).
 *   - Line numbers, gutter sync, tab handling, auto-close brackets.
 *   - Themes for free: every editor surface + syntax token chains
 *     through `--theme-color-*` tokens.
 *
 * Pressing "Run" creates a fresh Fable, runs the user code with a
 * capture logger attached, and re-renders the right-hand log pane.
 * Async logs (setTimeout / Promise callbacks) surface via a debounced
 * re-render.  Code edits flow into AppData (via pict-section-code's
 * `CodeDataAddress`) and a subclass hook persists them to localStorage.
 */

const _DefaultCode = `// Fable Playground.  'fable' is a fresh Fable instance.
// Anything you log lands in the panel to the right.

fable.log.info('Hello from the playground!');

// Each level has its own color:
fable.log.trace('trace messages (most verbose)');
fable.log.debug('debug messages');
fable.log.info('info messages');
fable.log.warn('warnings stand out');
fable.log.error('errors are loud');
fable.log.fatal('FATAL records flag in red');

// Records can carry a data payload:
fable.log.info('Action completed', { user: 'alice', ms: 42 });

// Full service access:
fable.log.info('Generated UUID', { id: fable.UUID.getUUID() });
fable.log.info('Product setting', { product: fable.SettingsManager.settings.Product });

// Async logs work too — the panel updates as records arrive:
setTimeout(() => fable.log.info('arrived 100ms later'), 100);
setTimeout(() => fable.log.warn('arrived 250ms later'), 250);

// Bonus: require() works for a curated set of Retold modules:
const Fable = require('fable');
let mine = new Fable({ Product: 'BYO-Fable' });
fable.log.info('Fable class via require()', { sameAsFableCtor: Fable === fable.constructor });
`;

const _LocalStorageKey         = 'docuserve-fable-playground-code';
const _AutoCaptureStorageKey   = 'docuserve-fable-playground-auto-capture';
const _CodeDataAddress         = 'AppData.Docuserve.Playground.Code';
const _CodeEditorViewId        = 'Docuserve-Fable-Playground-CodeEditor';
const _CodeEditorMountId       = 'Docuserve-Fable-Playground-Editor-Mount';
const _AutoCaptureToggleId     = 'Docuserve-Fable-Playground-AutoCapture-Toggle';

/**
 * pict-section-code subclass that hooks the change event to persist
 * code edits to localStorage (debounced) and notify the parent
 * playground view's status indicator.
 */
class FablePlaygroundCodeEditor extends libPictSectionCode
{
	onCodeChange(pCode)
	{
		super.onCodeChange(pCode);
		if (this._lsTimer) { clearTimeout(this._lsTimer); }
		this._lsTimer = setTimeout(() =>
		{
			this._lsTimer = null;
			try { window.localStorage.setItem(_LocalStorageKey, pCode); }
			catch (pError) { /* quota or no LS — silent */ }
			let tmpPlayground = this.fable.pict.views['Docuserve-Fable-Playground'];
			if (tmpPlayground && typeof tmpPlayground._setStatus === 'function')
			{
				tmpPlayground._setStatus('saved');
			}
		}, 500);
	}
}

const _ViewConfiguration =
{
	ViewIdentifier: "Docuserve-Fable-Playground",

	DefaultRenderable: "Docuserve-Fable-Playground-Content",
	DefaultDestinationAddress: "#Docuserve-Content-Container",

	AutoRender: false,

	CSS: /*css*/`
		/* The shell renders the panel content into a wrapper that has
		   min-height: 100% but no explicit height — which means our
		   percentage-height children would resolve to 0.  Promote the
		   destination to a flex column so the playground inside it
		   can use flex: 1 to fill the drawer height. */
		#Docuserve-Playground-Drawer-Content {
			display: flex;
			flex-direction: column;
			height: 100%;
			min-height: 0;
		}
		/* Playground fills the bottom drawer height-wise.  The drawer
		   itself owns the outer resize; everything inside flexes to
		   whatever vertical space remains so a thin drawer is usable
		   and a tall drawer just gives the editor more room. */
		.docuserve-playground {
			flex: 1 1 0;
			min-height: 0;
			display: flex;
			flex-direction: column;
			padding: 0;
			color: var(--theme-color-text-primary, #2A241E);
		}
		.docuserve-playground-body {
			flex: 1 1 0;
			min-height: 0;
			display: flex;
			gap: 0;
		}
		@media (max-width: 900px) {
			.docuserve-playground-body { flex-direction: column; gap: 0; }
		}
		.docuserve-playground-pane {
			flex: 1 1 0;
			min-width: 0;
			min-height: 0;
			display: flex;
			flex-direction: column;
		}
		.docuserve-playground-pane-code   { border-right: 1px solid var(--theme-color-border-default, #DDD6CA); }
		.docuserve-playground-pane-log    { background: var(--theme-color-background-secondary, #F6F3EE); }

		/* Per-pane header — small uppercase label on the left, controls
		   on the right.  Same row height as the doc page section
		   labels so it slots in visually under the topbar. */
		.docuserve-playground-pane-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 0.5em;
			padding: 0.45em 0.9em;
			border-bottom: 1px solid var(--theme-color-border-default, #DDD6CA);
			background: var(--theme-color-background-panel, #FFFFFF);
		}
		.docuserve-playground-pane-log .docuserve-playground-pane-header {
			background: var(--theme-color-background-secondary, #F6F3EE);
		}
		.docuserve-playground-pane-title {
			font-size: 0.72em;
			font-weight: 600;
			text-transform: uppercase;
			letter-spacing: 0.06em;
			color: var(--theme-color-text-muted, #8A7F72);
		}
		.docuserve-playground-pane-controls {
			display: flex;
			align-items: center;
			gap: 0.15em;
		}

		/* Compact icon button — subtle by default, brand-primary on
		   hover.  Used for help, copy, copy-log, clear-log, and run.
		   All glyphs are 14px @ 1em via SVG so they ride the font-size
		   set on the parent. */
		.docuserve-playground-iconbtn {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			width: 1.6em;
			height: 1.6em;
			padding: 0;
			background: transparent;
			color: var(--theme-color-text-muted, #8A7F72);
			border: 1px solid transparent;
			border-radius: 4px;
			cursor: pointer;
			font-size: 14px;
			transition: color 0.12s, background-color 0.12s, border-color 0.12s, opacity 0.12s;
			opacity: 0.6;
		}
		.docuserve-playground-iconbtn svg {
			width: 1em;
			height: 1em;
			display: block;
			fill: none;
			stroke: currentColor;
			stroke-width: 2;
			stroke-linecap: round;
			stroke-linejoin: round;
		}
		.docuserve-playground-iconbtn:hover {
			opacity: 1;
			color: var(--theme-color-brand-primary, #2E7D74);
			background: var(--theme-color-background-hover, #EAE3D8);
			border-color: var(--theme-color-border-default, #DDD6CA);
		}
		.docuserve-playground-iconbtn:focus-visible {
			opacity: 1;
			outline: 2px solid var(--theme-color-brand-primary, #2E7D74);
			outline-offset: 1px;
		}
		/* Run is the destination action — slightly brighter at rest so
		   the user's eye lands on it, with a filled play triangle that
		   uses fill instead of stroke. */
		.docuserve-playground-iconbtn-run {
			color: var(--theme-color-brand-primary, #2E7D74);
			opacity: 0.7;
		}
		.docuserve-playground-iconbtn-run svg { fill: currentColor; stroke: none; }
		.docuserve-playground-iconbtn-run:hover {
			opacity: 1;
			background: var(--theme-color-brand-primary, #2E7D74);
			color: var(--theme-color-background-panel, #FFFFFF);
			border-color: var(--theme-color-brand-primary, #2E7D74);
		}

		/* The copy-log button only materializes on hover of the log
		   pane — it's a "by the way" action, not something the user
		   should be reaching for during normal exploration. */
		.docuserve-playground-iconbtn-copylog { opacity: 0; pointer-events: none; }
		.docuserve-playground-pane-log:hover .docuserve-playground-iconbtn-copylog,
		.docuserve-playground-pane-log:focus-within .docuserve-playground-iconbtn-copylog {
			opacity: 0.6;
			pointer-events: auto;
		}
		.docuserve-playground-pane-log:hover .docuserve-playground-iconbtn-copylog:hover { opacity: 1; }

		/* Auto-attach toggle — compact inline checkbox + label sized
		   to sit alongside the icon buttons without overpowering
		   them. */
		.docuserve-playground-toggle {
			display: inline-flex;
			align-items: center;
			gap: 0.35em;
			margin-right: 0.25em;
			font-size: 11px;
			color: var(--theme-color-text-muted, #8A7F72);
			cursor: pointer;
			user-select: none;
		}
		.docuserve-playground-toggle input[type="checkbox"] {
			accent-color: var(--theme-color-brand-primary, #2E7D74);
			cursor: pointer;
			margin: 0;
			width: 0.95em;
			height: 0.95em;
		}
		.docuserve-playground-toggle:hover { color: var(--theme-color-text-secondary, #5E5549); }

		/* Editor mount fills the remaining pane height; pict-section-code
		   styles the inner editor + gutter itself. */
		#${_CodeEditorMountId} {
			flex: 1 1 0;
			min-height: 0;
			display: flex;
			flex-direction: column;
			overflow: hidden;
		}
		#${_CodeEditorMountId} .pict-code-editor-wrap {
			flex: 1;
			min-height: 0;
			height: 100%;
		}
		.docuserve-playground-log {
			flex: 1 1 0;
			min-height: 0;
			font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
			font-size: 12.5px;
			line-height: 1.6;
			background: var(--theme-color-background-secondary, #F6F3EE);
			padding: 0.8em 0.9em;
			overflow: auto;
			margin: 0;
			white-space: pre-wrap;
			word-break: break-word;
			color: var(--theme-color-text-primary, #2A241E);
			border: 0;
			border-radius: 0;
		}
		.docuserve-playground-log-line {
			display: block;
			padding: 0.05em 0;
		}
		.docuserve-playground-log-time {
			color: var(--theme-color-text-muted, #8A7F72);
		}
		.docuserve-playground-log-level {
			display: inline-block;
			min-width: 5.5ch;
			text-align: right;
			font-weight: 600;
			margin: 0 0.4em 0 0.25em;
		}
		.docuserve-playground-log-level-trace { color: var(--theme-color-text-muted,      #8A7F72); }
		.docuserve-playground-log-level-debug { color: var(--theme-color-text-secondary,  #5E5549); }
		.docuserve-playground-log-level-info  { color: var(--theme-color-brand-primary,   #2E7D74); }
		.docuserve-playground-log-level-warn  { color: var(--theme-color-status-warning,  #B25A00); }
		.docuserve-playground-log-level-error { color: var(--theme-color-status-error,    #B23A3A); }
		.docuserve-playground-log-level-fatal {
			color: var(--theme-color-background-panel, #FFFFFF);
			background: var(--theme-color-status-error, #B23A3A);
			padding: 0 0.3em;
			border-radius: 2px;
		}
		/* Banner records (start / finish) — span the full row width
		   with no level chip or timestamp, since the message itself
		   is the dash-bordered marker.  font-size: 0 on the row
		   collapses the literal whitespace text nodes the line
		   template inserts between time/level/message (those are
		   needed for copy-paste of regular rows but would otherwise
		   leak 2 leading spaces onto every banner line); the message
		   span re-asserts the inherited font size so it renders. */
		.docuserve-playground-log-line-banner
		{
			font-size: 0;
		}
		.docuserve-playground-log-line-banner .docuserve-playground-log-time,
		.docuserve-playground-log-line-banner .docuserve-playground-log-level
		{
			display: none;
		}
		.docuserve-playground-log-line-banner .docuserve-playground-log-message
		{
			font-size: 12.5px;
			color: var(--theme-color-text-muted, #8A7F72);
			font-weight: 600;
			letter-spacing: 0.02em;
		}
		.docuserve-playground-log-message { color: var(--theme-color-text-primary, #2A241E); }
		.docuserve-playground-log-datum {
			color: var(--theme-color-syntax-property, #9E3A50);
		}
		.docuserve-playground-log-empty {
			display: block;
			color: var(--theme-color-text-muted, #8A7F72);
			font-style: italic;
		}
		.docuserve-playground-log-meta {
			display: block;
			padding-top: 0.4em;
			margin-top: 0.4em;
			border-top: 1px dashed var(--theme-color-border-light, #E5DED1);
			color: var(--theme-color-text-muted, #8A7F72);
			font-size: 0.85em;
		}
	`,

	Templates:
	[
		{
			Hash: "Docuserve-Fable-Playground-Template",
			Template: /*html*/`
<div class="docuserve-playground">
	<div class="docuserve-playground-body">
		<div class="docuserve-playground-pane docuserve-playground-pane-code">
			<div class="docuserve-playground-pane-header">
				<span class="docuserve-playground-pane-title">Code</span>
				<div class="docuserve-playground-pane-controls">
					<button type="button" class="docuserve-playground-iconbtn" id="Docuserve-Fable-Playground-HelpBtn" aria-label="What's the playground?">
						<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 3.5"/><circle cx="12" cy="17" r="0.5" fill="currentColor" stroke="none"/></svg>
					</button>
					<label class="docuserve-playground-toggle" title="When on, user code that does new Fable(...) via require('fable') gets the playground's log capture pre-attached, so app.log.info(...) calls appear in the panel.">
						<input type="checkbox" id="Docuserve-Fable-Playground-AutoCapture-Toggle" onchange="{~P~}.views['Docuserve-Fable-Playground'].setAutoCapture(this.checked)">
						auto-attach
					</label>
					<button type="button" class="docuserve-playground-iconbtn" title="Copy code" aria-label="Copy code" onclick="{~P~}.views['Docuserve-Fable-Playground'].copyCode()">
						<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>
					</button>
					<button type="button" class="docuserve-playground-iconbtn docuserve-playground-iconbtn-run" title="Run" aria-label="Run code" onclick="{~P~}.views['Docuserve-Fable-Playground'].run()">
						<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4l13 8-13 8z"/></svg>
					</button>
				</div>
			</div>
			<div id="${_CodeEditorMountId}"></div>
		</div>
		<div class="docuserve-playground-pane docuserve-playground-pane-log">
			<div class="docuserve-playground-pane-header">
				<span class="docuserve-playground-pane-title">Log output</span>
				<div class="docuserve-playground-pane-controls">
					<button type="button" class="docuserve-playground-iconbtn docuserve-playground-iconbtn-copylog" title="Copy log" aria-label="Copy log" onclick="{~P~}.views['Docuserve-Fable-Playground'].copyLog()">
						<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>
					</button>
					<button type="button" class="docuserve-playground-iconbtn" title="Clear log" aria-label="Clear log" onclick="{~P~}.views['Docuserve-Fable-Playground'].clear()">
						<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
					</button>
					<button type="button" class="docuserve-playground-iconbtn" title="Close playground" aria-label="Close playground" onclick="{~P~}.views['Docuserve-Layout'].collapsePlayground()">
						<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
					</button>
				</div>
			</div>
			<pre class="docuserve-playground-log" id="Docuserve-Fable-Playground-Log">{~T:Docuserve-Fable-Playground-Log-Body-Template:AppData~}</pre>
		</div>
	</div>
</div>
`
		},
		{
			Hash: "Docuserve-Fable-Playground-Log-Body-Template",
			Template: /*html*/`{~TS:Docuserve-Fable-Playground-Log-Line-Template:AppData.Docuserve.Playground.LogLines~}{~TS:Docuserve-Fable-Playground-Log-Empty-Template:AppData.Docuserve.Playground.LogEmptySlot~}{~TS:Docuserve-Fable-Playground-Log-Meta-Template:AppData.Docuserve.Playground.LogMetaSlot~}`
		},
		{
			Hash: "Docuserve-Fable-Playground-Log-Line-Template",
			Template: /*html*/`<span class="docuserve-playground-log-line docuserve-playground-log-line-{~D:Record.Level~}"><span class="docuserve-playground-log-time">{~D:Record.Time~}</span> <span class="docuserve-playground-log-level docuserve-playground-log-level-{~D:Record.Level~}">{~D:Record.Level~}</span> <span class="docuserve-playground-log-message">{~D:Record.Message~}</span>{~TS:Docuserve-Fable-Playground-Log-Datum-Template:Record.DatumSlot~}</span>`
		},
		{
			Hash: "Docuserve-Fable-Playground-Log-Datum-Template",
			Template: /*html*/` <span class="docuserve-playground-log-datum">{~D:Record.Datum~}</span>`
		},
		{
			Hash: "Docuserve-Fable-Playground-Log-Empty-Template",
			Template: /*html*/`<span class="docuserve-playground-log-empty">(no log output yet — press Run)</span>`
		},
		{
			Hash: "Docuserve-Fable-Playground-Log-Meta-Template",
			Template: /*html*/`<span class="docuserve-playground-log-meta">{~D:Record.Meta~}</span>`
		}
	],

	// The playground is mounted into the Layout's bottom shell panel by
	// `mountIntoDrawer()` — not via the standard pict-view renderable
	// pipeline.  Templates above are still consumed (via parseTemplateByHash),
	// but no auto-render destination is needed.
	Renderables: []
};

class DocuserveFablePlaygroundView extends libPictView
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);
		this._DefaultCode           = _DefaultCode;
		this._codeJarPromise        = null;
		this._asyncRenderTimer      = null;
		this._currentRunRecords     = null;
		this._currentRunStart       = 0;
		this._statusClearTimer      = null;
		this._mountedInDrawer       = false;

		// Register the pict-section-code sub-view at our own construction
		// time.  Our constructor runs during pict.addView() for the
		// playground itself — i.e., inside the application constructor,
		// before pict-application's boot-time AutoInitialize sweep has
		// snapshotted Object.keys(this.pict.views).  The sub-view ends
		// up in that snapshot and gets its onBeforeInitialize fired
		// alongside every other view; pict-section-code uses that hook
		// to build its highlight function before render() reaches into it.
		this._registerCodeEditor();
	}

	// ─────────────────────────────────────────────
	//  Public API
	// ─────────────────────────────────────────────

	/**
	 * Mount the playground into the Layout's bottom shell-panel content
	 * destination.  Called once on the panel's first expand from the
	 * Layout's OnExpand callback; subsequent expand/collapse cycles
	 * re-use the existing mount.
	 */
	mountIntoDrawer()
	{
		if (this._mountedInDrawer) { return; }
		let tmpContainer = document.getElementById('Docuserve-Playground-Drawer-Content');
		if (!tmpContainer) { return; }
		this.mountInto(tmpContainer);
		this._mountedInDrawer = true;
	}

	/**
	 * Render the playground template into any DOM container and wire up
	 * the editor.  Public so doc-page widgets and host applications can
	 * mount the playground wherever they want.
	 *
	 * @param {HTMLElement} pContainerElement - The destination element.
	 */
	mountInto(pContainerElement)
	{
		if (!pContainerElement) { return; }
		this._setupPlaygroundState();
		let tmpHTML = this.pict.parseTemplateByHash('Docuserve-Fable-Playground-Template', {});
		pContainerElement.innerHTML = tmpHTML;
		// The template can't easily emit a conditional `checked` attribute;
		// stamp the saved toggle state onto the checkbox after render.
		let tmpToggle = document.getElementById(_AutoCaptureToggleId);
		if (tmpToggle)
		{
			tmpToggle.checked = !!this.pict.AppData.Docuserve.Playground.AutoCaptureUserFables;
		}
		this._wireHelpTooltip();
		this._mountCodeEditor();
	}

	/**
	 * Attach the rich-tooltip onto the [?] help button via
	 * pict-section-modal's tooltip service.  Lazy — silently no-ops if
	 * the modal isn't registered (which would only happen during a
	 * brief boot window).  Re-runnable; the tooltip helper destroys
	 * any prior one bound to the same element.
	 */
	_wireHelpTooltip()
	{
		let tmpBtn = document.getElementById('Docuserve-Fable-Playground-HelpBtn');
		let tmpModal = this.pict.views['Pict-Section-Modal'];
		if (!tmpBtn || !tmpModal || typeof tmpModal.richTooltip !== 'function') { return; }
		if (this._helpTooltip && typeof this._helpTooltip.destroy === 'function')
		{
			this._helpTooltip.destroy();
		}
		let tmpHTML = ''
			+ '<div style="font-size:12px;line-height:1.5;">'
			+ '<strong>JS Playground</strong> &mdash; write JavaScript that receives a fresh '
			+ '<code>fable</code> instance.  Every <code>fable.log.*</code> call is captured and '
			+ 'shown in the Log Output panel.  Toggle <em>auto-attach</em> off to get a raw Fable '
			+ 'whose log streams you wire yourself.  Press the play button to run; click the '
			+ 'copy icon to grab the code or the output.'
			+ '</div>';
		this._helpTooltip = tmpModal.richTooltip(tmpBtn, tmpHTML,
			{ position: 'bottom', interactive: true, maxWidth: '340px', delay: 80 });
	}

	/**
	 * Copy the editor's current contents to the clipboard.  Falls back
	 * to a textarea trick when the async Clipboard API isn't available
	 * (older Safari, insecure contexts).
	 */
	copyCode()
	{
		this._copyToClipboard(this._getCurrentCode(), 'code');
	}

	/**
	 * Copy the captured log records to the clipboard as plain text.
	 * Format mirrors the on-screen layout: `<time>  <LEVEL>  message  [datum]`
	 * one record per line, so the result is paste-friendly into bug
	 * reports or scratch files.
	 */
	copyLog()
	{
		let tmpLines = (this.pict.AppData.Docuserve.Playground
			&& this.pict.AppData.Docuserve.Playground.LogLines) || [];
		let tmpText = tmpLines.map(function (pLine)
		{
			// Banner rows are pre-formatted dash-bordered markers —
			// emit the message verbatim so the copied transcript has
			// the same visual separators the user saw on screen.
			if (pLine.Level === 'banner') { return pLine.Message; }
			let tmpRow = pLine.Time + '  ' + pLine.Level.toUpperCase() + '  ' + pLine.Message;
			if (Array.isArray(pLine.DatumSlot) && pLine.DatumSlot.length > 0)
			{
				tmpRow += '  ' + pLine.DatumSlot[0].Datum;
			}
			return tmpRow;
		}).join('\n');
		this._copyToClipboard(tmpText, 'log');
	}

	_copyToClipboard(pText, pKind)
	{
		let tmpToast = (pSuccess) =>
		{
			let tmpModal = this.pict.views['Pict-Section-Modal'];
			if (!tmpModal || typeof tmpModal.toast !== 'function') { return; }
			tmpModal.toast(
				pSuccess ? (pKind === 'log' ? 'Log copied' : 'Code copied')
					: 'Copy failed',
				{ type: pSuccess ? 'success' : 'error', duration: 1500 });
		};
		if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function')
		{
			navigator.clipboard.writeText(pText)
				.then(() => tmpToast(true))
				.catch(() => tmpToast(false));
			return;
		}
		// Fallback for non-secure contexts (e.g. http on a LAN dev box).
		try
		{
			let tmpEl = document.createElement('textarea');
			tmpEl.value = pText;
			tmpEl.style.position = 'fixed';
			tmpEl.style.opacity  = '0';
			document.body.appendChild(tmpEl);
			tmpEl.select();
			let tmpOk = document.execCommand('copy');
			document.body.removeChild(tmpEl);
			tmpToast(tmpOk);
		}
		catch (pError) { tmpToast(false); }
	}

	/**
	 * Load a code snippet into the playground and slide the drawer open.
	 * The handoff path used by "Try in playground" buttons next to
	 * fenced code examples in the docs.  Replaces any existing editor
	 * content (including localStorage-restored edits — the explicit
	 * code wins).
	 *
	 * @param {string} pCode - The code to drop into the editor.
	 */
	/**
	 * Toggle whether `require('fable')` returns a wrapper that
	 * pre-attaches the playground's capture logger to new Fable
	 * instances.  ON (default): user code's `app.log.info(...)` calls
	 * appear in the panel.  OFF (expert mode): `require('fable')`
	 * returns the raw Fable class; user code's instances log wherever
	 * the user wires them.
	 */
	setAutoCapture(pEnabled)
	{
		this.pict.AppData.Docuserve.Playground.AutoCaptureUserFables = !!pEnabled;
		try { window.localStorage.setItem(_AutoCaptureStorageKey, pEnabled ? '1' : '0'); }
		catch (pError) { /* quota or no LS — silent */ }
	}

	loadCode(pCode)
	{
		if (typeof pCode !== 'string') { return; }
		let tmpPlayground = this.pict.AppData.Docuserve.Playground || {};
		tmpPlayground.Code = pCode;
		this.pict.AppData.Docuserve.Playground = tmpPlayground;
		// Persist so reload keeps the loaded example.
		this._saveCode(pCode);
		// If the editor is already live, push the code straight in; else
		// the upcoming mount will pick it up via AppData.
		let tmpEditor = this.pict.views[_CodeEditorViewId];
		if (tmpEditor && tmpEditor.codeJar && typeof tmpEditor.setCode === 'function')
		{
			tmpEditor.setCode(pCode);
		}
		// Slide the drawer open via the Layout view.
		let tmpLayout = this.pict.views['Docuserve-Layout'];
		if (tmpLayout && typeof tmpLayout.expandPlayground === 'function')
		{
			tmpLayout.expandPlayground();
		}
	}

	_setupPlaygroundState()
	{
		let tmpPlayground = this.pict.AppData.Docuserve.Playground || {};
		tmpPlayground.Title       = 'Fable Playground';
		tmpPlayground.Description = 'Write JavaScript that receives a fresh `fable` instance.  Every log call is captured and rendered in the panel on the right.';
		// Initial code precedence — first non-empty wins:
		//   1. AppData.Code already set (loadCode handoff, or carried
		//      over from a previous mount this session).
		//   2. localStorage saved edits.
		//   3. Default sample.
		// pict-section-code's CodeDataAddress resolver reads from
		// AppData.Code, so once we set it here the editor stamps it as
		// the initial content.
		let tmpExisting = tmpPlayground.Code;
		let tmpSaved    = this._loadSavedCode();
		tmpPlayground.Code = (typeof tmpExisting === 'string' && tmpExisting.length > 0)
			? tmpExisting
			: (typeof tmpSaved === 'string' && tmpSaved.length > 0)
				? tmpSaved
				: this._DefaultCode;
		tmpPlayground.LogLines     = [];
		tmpPlayground.LogEmptySlot = [{}];
		tmpPlayground.LogMetaSlot  = [];
		// AutoCapture toggle — default ON; LS-restored if the user has
		// explicitly turned it off in a previous session.
		let tmpSavedAuto = null;
		try { tmpSavedAuto = window.localStorage.getItem(_AutoCaptureStorageKey); }
		catch (pError) { /* silent */ }
		tmpPlayground.AutoCaptureUserFables = (tmpSavedAuto === null) ? true : (tmpSavedAuto === '1');
		this.pict.AppData.Docuserve.Playground = tmpPlayground;
	}

	_mountCodeEditor()
	{
		this._loadCodeJar().then((pCodeJar) =>
		{
			let tmpEditor = this.pict.views[_CodeEditorViewId];
			if (!tmpEditor) { return; }
			if (!tmpEditor._codeJarPrototype)
			{
				tmpEditor.connectCodeJarPrototype(pCodeJar);
			}
			if (tmpEditor.codeJar && typeof tmpEditor.destroy === 'function')
			{
				tmpEditor.destroy();
			}
			tmpEditor.render();
		}).catch((pError) =>
		{
			let tmpMount = document.getElementById(_CodeEditorMountId);
			if (tmpMount)
			{
				tmpMount.innerHTML = '<div class="docuserve-playground-codejar-error">Editor failed to load: '
					+ this._escapeHTML(pError && pError.message ? pError.message : String(pError))
					+ '</div>';
			}
		});
	}

	run()
	{
		this._cancelAsyncRender();
		this._cancelFinishBanner();

		let tmpCode = this._getCurrentCode();
		this.pict.AppData.Docuserve.Playground.Code = tmpCode;

		let tmpRecords = [];
		let tmpStart   = Date.now();
		this._currentRunRecords = tmpRecords;
		this._currentRunStart   = tmpStart;

		// Start banner — ASCII-bordered line so it stands out from
		// captured log records and copy/paste lands in any text editor
		// with the same visual weight as it had in the panel.
		tmpRecords.push(
		{
			level:   'banner',
			message: this._formatStartBanner(tmpStart),
			datum:   null,
			ms:      0
		});

		// Console capture is done via a per-run scoped `console`
		// parameter passed into new Function(...) below.  Lexical
		// scoping in the snippet means user-code console.* calls hit
		// our shim while pict/fable-log's own console.log calls
		// (firing template-render traces) keep using the global
		// console untouched — avoids the obvious feedback loop.

		let tmpFable;
		try
		{
			let tmpFableClass = this.fable && this.fable.constructor;
			if (typeof tmpFableClass !== 'function')
			{
				throw new Error('Fable constructor unavailable on this.fable');
			}
			tmpFable = new tmpFableClass({ Product: 'FablePlayground', LogStreams: [] });
			tmpFable.log.addLogger(this._buildCaptureLogger(tmpRecords, tmpStart), 'trace');
		}
		catch (pError)
		{
			tmpRecords.push({ level: 'error', message: 'Fable instantiation failed: ' + this._errorMessage(pError), datum: null, ms: 0 });
		}

		let tmpRunError = null;
		if (tmpFable)
		{
			try
			{
				// User code sees three globals: `fable`, `pict`, and a
				// curated `require` shim that pipes the most common
				// Retold module names through to the live classes on
				// the page.  Anything outside the curated set throws
				// with a clear message — surfaced as an error record
				// in the log pane, not in the host console.  The shim
				// is built with this run's records + start so that
				// require('fable') (in auto-capture mode) hands back
				// a Fable whose log routes into the same panel.
				//
				// User code is wrapped in an async IIFE so:
				//   1. `const fable = new Fable(...)` works — Fable's
				//      own docs use that pattern, and a Function
				//      parameter named `fable` can't be redeclared
				//      with const/let in the same scope.  The inner
				//      function gives the user their own scope to
				//      shadow in.
				//   2. `await` is usable at the top level of the
				//      snippet without ceremony.
				//
				// Sync errors during new Function() construction
				// (syntax errors in user code) land in the outer
				// catch.  Errors thrown asynchronously inside the
				// IIFE land in the .catch handler below — both turn
				// into error-level records in the log pane.
				let tmpRequire = this._buildRequireShim(tmpFable, tmpRecords, tmpStart);
				let tmpConsole = this._buildCapturingConsole(tmpRecords, tmpStart);
				let tmpFn = new Function('fable', 'pict', 'require', 'console',
					'return (async () => { ' + tmpCode + '\n})();');
				let tmpPromise = tmpFn(tmpFable, this.pict, tmpRequire, tmpConsole);
				if (tmpPromise && typeof tmpPromise.then === 'function')
				{
					let tmpSelf = this;
					tmpPromise.then(
						() => {},
						(pAsyncError) =>
						{
							if (tmpRecords !== tmpSelf._currentRunRecords) { return; }
							tmpRecords.push({ level: 'error', message: tmpSelf._errorMessage(pAsyncError), datum: null, ms: Date.now() - tmpStart });
							tmpSelf._scheduleAsyncLogRender();
						});
				}
			}
			catch (pError)
			{
				tmpRunError = pError;
				tmpRecords.push({ level: 'error', message: this._errorMessage(pError), datum: null, ms: Date.now() - tmpStart });
			}
		}

		// Initial paint — user sees start banner + any sync records
		// land in the panel right away.  The finish banner is deferred
		// (see below) so naked setTimeouts / fetches / etc. get a
		// chance to push their logs before we declare the run "done".
		this._setLogRecords(tmpRecords, Date.now() - tmpStart, tmpRunError);
		this._renderLogOnly();

		// Settle-window watcher — wait for the records array to be
		// quiet for IDLE_MS, then emit the finish banner.  Naked
		// setTimeouts / fetch chains / etc. keep arming the watcher
		// for as long as they push records, capped at MAX_RUN_MS.
		this._scheduleFinishBanner(tmpRecords, tmpStart, tmpRunError);
	}

	/**
	 * Defer the finish banner until the run's records array has been
	 * quiet for ~200ms.  Each fresh record (sync or async) resets the
	 * idle clock.  A 10-second cap forces the banner to emit even if
	 * the snippet has a runaway setInterval — better to truthfully
	 * say "run finished · elapsed 10000ms" once than to never close
	 * the banner pair at all.
	 *
	 * Cancellable via `_cancelFinishBanner` — called by the next run
	 * (`run()` clears the previous watcher up front) and by `clear()`.
	 */
	_scheduleFinishBanner(pRecords, pStart, pRunError)
	{
		this._cancelFinishBanner();
		let IDLE_MS    = 200;
		let MAX_RUN_MS = 10000;
		let tmpSelf = this;
		let tmpLastCount = pRecords.length;
		let tmpDeadline  = Date.now() + MAX_RUN_MS;

		let fEmit = (pHitCap) =>
		{
			tmpSelf._finishBannerTimer = null;
			if (tmpSelf._finishBannerMaxTimer)
			{
				clearTimeout(tmpSelf._finishBannerMaxTimer);
				tmpSelf._finishBannerMaxTimer = null;
			}
			if (pRecords !== tmpSelf._currentRunRecords) { return; }
			let tmpElapsed = Date.now() - pStart;
			pRecords.push(
			{
				level:   'banner',
				message: tmpSelf._formatFinishBanner(tmpElapsed, pRunError, pHitCap),
				datum:   null,
				ms:      tmpElapsed
			});
			tmpSelf._setLogRecords(pRecords, tmpElapsed, pRunError);
			tmpSelf._renderLogOnly();
		};

		let fCheck = () =>
		{
			if (pRecords !== tmpSelf._currentRunRecords)
			{
				tmpSelf._cancelFinishBanner();
				return;
			}
			if (pRecords.length === tmpLastCount)
			{
				// Quiet for IDLE_MS → run is done.
				fEmit(false);
			}
			else
			{
				tmpLastCount = pRecords.length;
				tmpSelf._finishBannerTimer = setTimeout(fCheck, IDLE_MS);
			}
		};

		this._finishBannerTimer = setTimeout(fCheck, IDLE_MS);
		this._finishBannerMaxTimer = setTimeout(() => fEmit(true), MAX_RUN_MS);
		void tmpDeadline; // kept for future "remaining time" display
	}

	_cancelFinishBanner()
	{
		if (this._finishBannerTimer)
		{
			clearTimeout(this._finishBannerTimer);
			this._finishBannerTimer = null;
		}
		if (this._finishBannerMaxTimer)
		{
			clearTimeout(this._finishBannerMaxTimer);
			this._finishBannerMaxTimer = null;
		}
	}

	/**
	 * Build a per-run `console` shim that user code receives via the
	 * `new Function('console', ...)` parameter — lexical scoping makes
	 * the snippet see THIS object as `console`, while everything else
	 * on the page (pict's template engine, fable-log's default web
	 * stream, etc.) keeps using the real global console.  That
	 * isolation is what stops the feedback loop where pict's own
	 * console.trace template-render messages get captured back into
	 * the playground and trigger another render.
	 *
	 * Each captured call forwards to the real global console so the
	 * dev console still sees the output.  Mirrors fable-log's level
	 * vocabulary so trace/debug/info/warn/error all show up coloured.
	 */
	_buildCapturingConsole(pRecords, pStart)
	{
		let tmpSelf = this;
		let tmpReal = (typeof console !== 'undefined') ? console : null;
		let fForward = (pLevel) =>
		{
			if (!tmpReal) { return function () {}; }
			let tmpFn = tmpReal[pLevel] || tmpReal.log;
			return function () { try { tmpFn.apply(tmpReal, arguments); } catch (pError) {} };
		};
		let fMake = (pLevel) =>
		{
			let tmpForward = fForward(pLevel);
			return function ()
			{
				tmpForward.apply(null, arguments);
				if (pRecords !== tmpSelf._currentRunRecords) { return; }
				let tmpArgs = Array.prototype.slice.call(arguments);
				let tmpMsgParts = [];
				let tmpDatum    = null;
				for (let i = 0; i < tmpArgs.length; i++)
				{
					let tmpArg = tmpArgs[i];
					if (typeof tmpArg === 'string') { tmpMsgParts.push(tmpArg); }
					else if (tmpDatum === null && tmpArg && typeof tmpArg === 'object') { tmpDatum = tmpArg; }
					else { tmpMsgParts.push(tmpSelf._formatDatum(tmpArg)); }
				}
				pRecords.push(
				{
					level:   pLevel,
					message: '[console] ' + tmpMsgParts.join(' '),
					datum:   tmpDatum,
					ms:      Date.now() - pStart
				});
				tmpSelf._scheduleAsyncLogRender();
			};
		};
		return {
			log:    fMake('info'),    // console.log → info level
			info:   fMake('info'),
			warn:   fMake('warn'),
			error:  fMake('error'),
			debug:  fMake('debug'),
			trace:  fMake('trace'),
			// Pass-throughs for the less-common methods so user code
			// that calls them doesn't error.
			group:        fForward('group'),
			groupEnd:     fForward('groupEnd'),
			groupCollapsed: fForward('groupCollapsed'),
			table:        fForward('table'),
			dir:          fForward('dir'),
			time:         fForward('time'),
			timeEnd:      fForward('timeEnd'),
			count:        fForward('count'),
			countReset:   fForward('countReset'),
			assert:       fForward('assert'),
			clear:        fForward('clear')
		};
	}

	_formatStartBanner(pStart)
	{
		return '─── run started · ' + this._formatWallClock(pStart) + ' ' + this._padDashes(40);
	}

	_formatFinishBanner(pElapsed, pRunError, pHitCap)
	{
		let tmpLabel;
		if (pRunError)    { tmpLabel = 'run threw'; }
		else if (pHitCap) { tmpLabel = 'run still emitting · cut off at cap'; }
		else              { tmpLabel = 'run finished'; }
		let tmpSuffix = ' · elapsed ' + pElapsed + 'ms ';
		return '─── ' + tmpLabel + tmpSuffix + this._padDashes(40);
	}

	_formatWallClock(pMs)
	{
		let tmpD = new Date(pMs);
		let pad = (pN, pW) => { let tmpS = String(pN); while (tmpS.length < pW) { tmpS = '0' + tmpS; } return tmpS; };
		return pad(tmpD.getHours(), 2) + ':' + pad(tmpD.getMinutes(), 2) + ':' + pad(tmpD.getSeconds(), 2)
			+ '.' + pad(tmpD.getMilliseconds(), 3);
	}

	_padDashes(pCount)
	{
		let tmpOut = '';
		for (let i = 0; i < pCount; i++) { tmpOut += '─'; }
		return tmpOut;
	}

	clear()
	{
		this._cancelAsyncRender();
		this._cancelFinishBanner();
		this._currentRunRecords = null;
		this._currentRunStart   = 0;
		this._setLogRecords([], 0, null);
		this._renderLogOnly();
	}

	reset()
	{
		let tmpEditor = this.pict.views[_CodeEditorViewId];
		if (tmpEditor && typeof tmpEditor.setCode === 'function')
		{
			tmpEditor.setCode(this._DefaultCode);
		}
		this.pict.AppData.Docuserve.Playground.Code = this._DefaultCode;
		this._clearSavedCode();
		this._setStatus('reset');
	}

	// ─────────────────────────────────────────────
	//  Code editor registration
	// ─────────────────────────────────────────────

	_loadCodeJar()
	{
		if (this._codeJarPromise) { return this._codeJarPromise; }
		// new Function(...) hides the import() expression from browserify
		// so the bundler doesn't try to rewrite it to a require() at
		// build time.  Returns the CodeJar constructor.
		this._codeJarPromise = new Function('u', 'return import(u)')(_CodeJarCDN)
			.then((pModule) =>
			{
				if (!pModule || typeof pModule.CodeJar !== 'function')
				{
					throw new Error('CodeJar export not found in module');
				}
				return pModule.CodeJar;
			});
		return this._codeJarPromise;
	}

	_registerCodeEditor()
	{
		let tmpConfig =
		{
			ViewIdentifier:            _CodeEditorViewId,
			DefaultDestinationAddress: '#' + _CodeEditorMountId,
			Templates:
			[
				{ Hash: 'CodeEditor-Container', Template: '<!-- pict-section-code mount -->' }
			],
			Renderables:
			[
				{ RenderableHash: 'CodeEditor-Wrap', TemplateHash: 'CodeEditor-Container', DestinationAddress: '#' + _CodeEditorMountId }
			],
			TargetElementAddress: '#' + _CodeEditorMountId,
			Language:        'javascript',
			LineNumbers:     true,
			Tab:             '\t',
			AddClosing:      true,
			CatchTab:        true,
			// Bind the editor's content to AppData via the section's
			// built-in two-way binding.  Initial content reads from this
			// address; onCodeChange writes back to it.
			CodeDataAddress: _CodeDataAddress,
			DefaultCode:     this._DefaultCode,
			// Defer render until our onAfterRender so the mount target
			// exists by the time pict-section-code looks for it.  We
			// rely on AutoInitialize (true by default) to fire the boot
			// sweep's onBeforeInitialize, which sets up the highlighter.
			AutoRender:      false,
			RenderOnLoad:    false
		};

		this.pict.addView(_CodeEditorViewId, tmpConfig, FablePlaygroundCodeEditor);
	}

	// ─────────────────────────────────────────────
	//  Async log capture
	// ─────────────────────────────────────────────

	/**
	 * Build the `require` shim that user code sees inside Run.  Maps a
	 * curated set of module names to the live classes / instances on
	 * the page, so a docs snippet like `const Fable = require('fable');
	 * new Fable(...)` runs without any rewrite.  Anything outside the
	 * curated set throws — the error becomes a captured error record,
	 * not a silent failure.
	 *
	 * When AutoCaptureUserFables is on (the default), `require('fable')`
	 * returns a thin wrapper whose `new` call hands back a real Fable
	 * with the playground's capture logger pre-attached at trace level.
	 * The wrapper also forces LogStreams: [] so the default console
	 * stream doesn't co-fire alongside the capture stream.  Turning the
	 * toggle off returns the raw Fable class — expert mode for users
	 * who want a clean Fable they control end-to-end.
	 *
	 * Curated keys:
	 *   - 'fable'                    → Fable class (or capture wrapper)
	 *   - 'pict'                     → Pict class
	 *   - 'fable-uuid'               → fable-uuid class
	 *   - 'fable-settings'           → fable-settings class
	 *   - 'fable-log'                → fable-log class
	 *   - 'fable-serviceproviderbase' → CoreServiceProviderBase class
	 */
	_buildRequireShim(pFableInstance, pRecords, pStart)
	{
		let tmpPict       = this.pict;
		let tmpFableClass = pFableInstance.constructor;
		let tmpSelf       = this;
		let tmpAutoCapture = !!this.pict.AppData.Docuserve.Playground.AutoCaptureUserFables;

		// Wrapper that hands back a real Fable instance with the
		// capture logger pre-attached.  Constructed once per shim
		// build (i.e., once per Run) so the records array + start
		// timestamp are captured fresh.
		function PlaygroundFableWrapper(pSettings)
		{
			let tmpEffectiveSettings = Object.assign({}, pSettings || {}, { LogStreams: [] });
			let tmpInstance = new tmpFableClass(tmpEffectiveSettings);
			tmpInstance.log.addLogger(tmpSelf._buildCaptureLogger(pRecords, pStart), 'trace');
			return tmpInstance;
		}

		// Built-in resolvers — every "bundled" module in the schema
		// goes through one of these.  Future "cdn" / "dynamic" sources
		// would be wired in alongside as lazy promises.
		let tmpResolvers =
		{
			'fable':                     () => tmpAutoCapture ? PlaygroundFableWrapper : tmpFableClass,
			'pict':                      () => tmpPict.constructor,
			'fable-uuid':                () => pFableInstance.UUID && pFableInstance.UUID.constructor,
			'fable-settings':            () => pFableInstance.SettingsManager && pFableInstance.SettingsManager.constructor,
			'fable-log':                 () => pFableInstance.Logging && pFableInstance.Logging.constructor,
			'fable-serviceproviderbase': () => libFableServiceProviderBase
		};

		// Allowed-imports list derived from the current module's
		// _playground.json.  When a config is present, only names it
		// declares are exposed; when it isn't (or the page is the
		// generic playground reference doc), fall back to the full
		// built-in list so legacy snippets keep running.
		let tmpConfig = this.pict.AppData.Docuserve.Playground.Config;
		let tmpAllowedNames = null;
		if (tmpConfig && Array.isArray(tmpConfig.Imports) && tmpConfig.Imports.length > 0)
		{
			tmpAllowedNames = {};
			for (let i = 0; i < tmpConfig.Imports.length; i++)
			{
				let tmpEntry = tmpConfig.Imports[i];
				if (tmpEntry && typeof tmpEntry.Name === 'string')
				{
					tmpAllowedNames[tmpEntry.Name] = tmpEntry.Source || 'bundled';
				}
			}
		}

		return function playgroundRequire(pModuleName)
		{
			let tmpResolver = tmpResolvers[pModuleName];
			let tmpAllowed = (tmpAllowedNames === null) || Object.prototype.hasOwnProperty.call(tmpAllowedNames, pModuleName);
			if (tmpResolver && tmpAllowed)
			{
				return tmpResolver();
			}
			// Friendly error.  Lists what the current module's
			// _playground.json declares so users know what's on the menu.
			let tmpKnown;
			if (tmpAllowedNames !== null) { tmpKnown = Object.keys(tmpAllowedNames); }
			else                          { tmpKnown = Object.keys(tmpResolvers); }
			throw new Error("require('" + pModuleName + "') is not available in this playground. "
				+ "Allowed here: " + tmpKnown.map(pN => "'" + pN + "'").join(', ') + ".");
		};
	}

	_buildCaptureLogger(pRecords, pStart)
	{
		let tmpUUID = 'playground-' + Date.now() + '-' + Math.floor(Math.random() * 1e9);
		let tmpSelf = this;
		let pushRecord = (pLevel, pMessage, pDatum) =>
		{
			pRecords.push(
			{
				level:   pLevel,
				message: pMessage == null ? '' : String(pMessage),
				datum:   pDatum == null ? null : pDatum,
				ms:      Date.now() - pStart
			});
			if (pRecords === tmpSelf._currentRunRecords)
			{
				tmpSelf._scheduleAsyncLogRender();
			}
		};
		return {
			loggerUUID: tmpUUID,
			initialize: () => {},
			trace: (m, d) => pushRecord('trace', m, d),
			debug: (m, d) => pushRecord('debug', m, d),
			info:  (m, d) => pushRecord('info',  m, d),
			warn:  (m, d) => pushRecord('warn',  m, d),
			error: (m, d) => pushRecord('error', m, d),
			fatal: (m, d) => pushRecord('fatal', m, d)
		};
	}

	_scheduleAsyncLogRender()
	{
		if (this._asyncRenderTimer) { return; }
		this._asyncRenderTimer = setTimeout(() =>
		{
			this._asyncRenderTimer = null;
			if (!this._currentRunRecords) { return; }
			let tmpElapsed = Date.now() - this._currentRunStart;
			this._setLogRecords(this._currentRunRecords, tmpElapsed, null);
			this._renderLogOnly();
		}, 60);
	}

	_cancelAsyncRender()
	{
		if (this._asyncRenderTimer)
		{
			clearTimeout(this._asyncRenderTimer);
			this._asyncRenderTimer = null;
		}
	}

	// ─────────────────────────────────────────────
	//  AppData → DOM
	// ─────────────────────────────────────────────

	_setLogRecords(pRecords, pElapsed, pRunError)
	{
		let tmpPlayground = this.pict.AppData.Docuserve.Playground;
		tmpPlayground.LogLines = pRecords.map((pRec) =>
		({
			Time:    this._formatTime(pRec.ms),
			Level:   pRec.level,
			Message: this._escapeHTML(pRec.message),
			DatumSlot: (pRec.datum == null)
				? []
				: [{ Datum: this._escapeHTML(this._formatDatum(pRec.datum)) }]
		}));
		tmpPlayground.LogEmptySlot = (pRecords.length === 0) ? [{}] : [];
		if (pRecords.length > 0)
		{
			let tmpMeta = pRecords.length + ' record' + (pRecords.length === 1 ? '' : 's')
				+ ' · ' + pElapsed + 'ms';
			if (pRunError) { tmpMeta += ' · run threw'; }
			tmpPlayground.LogMetaSlot = [{ Meta: tmpMeta }];
		}
		else
		{
			tmpPlayground.LogMetaSlot = [];
		}
	}

	_renderLogOnly()
	{
		let tmpHTML = this.pict.parseTemplateByHash('Docuserve-Fable-Playground-Log-Body-Template', {});
		this.pict.ContentAssignment.assignContent('#Docuserve-Fable-Playground-Log', tmpHTML);
	}

	// ─────────────────────────────────────────────
	//  Persistence
	// ─────────────────────────────────────────────

	_loadSavedCode()
	{
		try { return window.localStorage.getItem(_LocalStorageKey); }
		catch (pError) { return null; }
	}

	_saveCode(pCode)
	{
		try { window.localStorage.setItem(_LocalStorageKey, pCode); }
		catch (pError) { /* quota or no LS — silent */ }
	}

	_clearSavedCode()
	{
		try { window.localStorage.removeItem(_LocalStorageKey); }
		catch (pError) {}
	}

	// ─────────────────────────────────────────────
	//  Misc helpers
	// ─────────────────────────────────────────────

	_getCurrentCode()
	{
		let tmpEditor = this.pict.views[_CodeEditorViewId];
		if (tmpEditor && typeof tmpEditor.getCode === 'function')
		{
			let tmpCode = tmpEditor.getCode();
			if (typeof tmpCode === 'string') { return tmpCode; }
		}
		// Fallback to whatever's last-known in AppData.
		return this.pict.AppData.Docuserve.Playground.Code || '';
	}

	_setStatus(pText)
	{
		let tmpEl = document.getElementById('Docuserve-Fable-Playground-Status');
		if (!tmpEl) { return; }
		tmpEl.textContent = pText;
		if (this._statusClearTimer) { clearTimeout(this._statusClearTimer); }
		this._statusClearTimer = setTimeout(() =>
		{
			if (tmpEl.textContent === pText) { tmpEl.textContent = ''; }
		}, 1200);
	}

	_formatTime(pMs)
	{
		let tmpMs = Math.max(0, Math.floor(pMs || 0));
		let tmpPadded = String(tmpMs);
		while (tmpPadded.length < 4) { tmpPadded = ' ' + tmpPadded; }
		return tmpPadded + 'ms';
	}

	_formatDatum(pDatum)
	{
		if (typeof pDatum === 'string') { return pDatum; }
		try { return JSON.stringify(pDatum); }
		catch (pError) { return '(unserializable: ' + this._errorMessage(pError) + ')'; }
	}

	_errorMessage(pError)
	{
		if (!pError) { return ''; }
		if (pError.message) { return pError.message; }
		return String(pError);
	}

	_escapeHTML(pText)
	{
		if (pText == null) { return ''; }
		return String(pText)
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;');
	}
}

module.exports = DocuserveFablePlaygroundView;
module.exports.default_configuration = _ViewConfiguration;
