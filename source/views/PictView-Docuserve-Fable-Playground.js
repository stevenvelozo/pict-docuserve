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
		.docuserve-playground {
			display: flex;
			flex-direction: column;
			padding: 1.5em 2em;
			max-width: 1400px;
			margin: 0 auto;
			color: var(--theme-color-text-primary, #2A241E);
		}
		.docuserve-playground-header {
			border-bottom: 1px solid var(--theme-color-border-default, #DDD6CA);
			padding-bottom: 0.75em;
			margin-bottom: 1em;
		}
		.docuserve-playground-header h1 {
			font-size: 1.5em;
			font-weight: 600;
			margin: 0 0 0.25em;
			color: var(--theme-color-text-primary, #3D3229);
		}
		.docuserve-playground-header p {
			font-size: 0.9em;
			color: var(--theme-color-text-secondary, #5E5549);
			margin: 0 0 0.75em;
			line-height: 1.5;
		}
		.docuserve-playground-actions {
			display: flex;
			gap: 0.5em;
			align-items: center;
		}
		.docuserve-playground-actions button {
			padding: 0.4em 0.9em;
			font-size: 0.9em;
			background: var(--theme-color-background-panel, #FFFFFF);
			color: var(--theme-color-text-primary, #2A241E);
			border: 1px solid var(--theme-color-border-default, #DDD6CA);
			border-radius: 4px;
			cursor: pointer;
			transition: background-color 0.1s, border-color 0.1s;
		}
		.docuserve-playground-actions button:hover {
			background: var(--theme-color-background-hover, #EAE3D8);
			border-color: var(--theme-color-brand-primary, #2E7D74);
		}
		.docuserve-playground-actions .primary {
			background: var(--theme-color-brand-primary, #2E7D74);
			color: var(--theme-color-background-panel, #FFFFFF);
			border-color: var(--theme-color-brand-primary, #2E7D74);
			font-weight: 600;
		}
		.docuserve-playground-actions .primary:hover {
			background: var(--theme-color-brand-primary-hover, #236660);
			border-color: var(--theme-color-brand-primary-hover, #236660);
		}
		.docuserve-playground-actions .status {
			margin-left: auto;
			font-size: 0.75em;
			color: var(--theme-color-text-muted, #8A7F72);
			font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
		}
		.docuserve-playground-toggle {
			display: inline-flex;
			align-items: center;
			gap: 0.4em;
			margin-left: 0.5em;
			font-size: 0.8em;
			color: var(--theme-color-text-secondary, #5E5549);
			cursor: pointer;
			user-select: none;
		}
		.docuserve-playground-toggle input[type="checkbox"] {
			accent-color: var(--theme-color-brand-primary, #2E7D74);
			cursor: pointer;
			margin: 0;
		}
		.docuserve-playground-toggle code {
			font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
			font-size: 0.92em;
			color: var(--theme-color-syntax-property, #9E3A50);
			background: var(--theme-color-background-tertiary, #F0ECE4);
			padding: 0 0.25em;
			border-radius: 2px;
		}
		.docuserve-playground-body {
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: 1em;
			min-height: 500px;
		}
		@media (max-width: 900px) {
			.docuserve-playground-body { grid-template-columns: 1fr; }
		}
		.docuserve-playground-pane {
			display: flex;
			flex-direction: column;
			min-width: 0;
		}
		.docuserve-playground-pane h3 {
			font-size: 0.78em;
			font-weight: 600;
			text-transform: uppercase;
			letter-spacing: 0.04em;
			color: var(--theme-color-text-muted, #8A7F72);
			margin: 0 0 0.4em;
		}
		/* Mount target for the pict-section-code view.  The wrap + editor
		   styling all comes from pict-section-code's bundled CSS; we only
		   need to make sure the wrap fills the pane. */
		#${_CodeEditorMountId} {
			flex: 1;
			min-height: 460px;
			max-height: 70vh;
			display: flex;
			flex-direction: column;
		}
		#${_CodeEditorMountId} .pict-code-editor-wrap {
			flex: 1;
			min-height: 0;
		}
		.docuserve-playground-log {
			flex: 1;
			min-height: 460px;
			max-height: 70vh;
			font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
			font-size: 12.5px;
			line-height: 1.6;
			background: var(--theme-color-background-secondary, #F6F3EE);
			border: 1px solid var(--theme-color-border-default, #DDD6CA);
			border-radius: 6px;
			padding: 1em;
			overflow: auto;
			margin: 0;
			white-space: pre-wrap;
			word-break: break-word;
			color: var(--theme-color-text-primary, #2A241E);
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
	<div class="docuserve-playground-header">
		<h1>{~D:AppData.Docuserve.Playground.Title~}</h1>
		<p>{~D:AppData.Docuserve.Playground.Description~}</p>
		<div class="docuserve-playground-actions">
			<button class="primary" onclick="{~P~}.views['Docuserve-Fable-Playground'].run()">Run</button>
			<button onclick="{~P~}.views['Docuserve-Fable-Playground'].clear()">Clear log</button>
			<button onclick="{~P~}.views['Docuserve-Fable-Playground'].reset()">Reset code</button>
			<label class="docuserve-playground-toggle" title="When on, user code that does new Fable(...) via require('fable') gets the playground's log capture pre-attached, so app.log.info(...) calls appear in the panel.  Uncheck for a truly clean Fable.">
				<input type="checkbox" id="Docuserve-Fable-Playground-AutoCapture-Toggle" onchange="{~P~}.views['Docuserve-Fable-Playground'].setAutoCapture(this.checked)">
				Auto-attach to require('fable')
			</label>
			<span id="Docuserve-Fable-Playground-Status" class="status"></span>
		</div>
	</div>
	<div class="docuserve-playground-body">
		<div class="docuserve-playground-pane">
			<h3>Code</h3>
			<div id="${_CodeEditorMountId}"></div>
		</div>
		<div class="docuserve-playground-pane">
			<h3>Log output</h3>
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
			Template: /*html*/`<span class="docuserve-playground-log-line"><span class="docuserve-playground-log-time">{~D:Record.Time~}</span><span class="docuserve-playground-log-level docuserve-playground-log-level-{~D:Record.Level~}">{~D:Record.Level~}</span><span class="docuserve-playground-log-message">{~D:Record.Message~}</span>{~TS:Docuserve-Fable-Playground-Log-Datum-Template:Record.DatumSlot~}</span>`
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
		this._mountCodeEditor();
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

		let tmpCode = this._getCurrentCode();
		this.pict.AppData.Docuserve.Playground.Code = tmpCode;

		let tmpRecords = [];
		let tmpStart   = Date.now();
		this._currentRunRecords = tmpRecords;
		this._currentRunStart   = tmpStart;

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
				let tmpFn = new Function('fable', 'pict', 'require',
					'return (async () => { ' + tmpCode + '\n})();');
				let tmpPromise = tmpFn(tmpFable, this.pict, tmpRequire);
				if (tmpPromise && typeof tmpPromise.catch === 'function')
				{
					let tmpSelf = this;
					tmpPromise.catch((pAsyncError) =>
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

		let tmpElapsed = Date.now() - tmpStart;
		this._setLogRecords(tmpRecords, tmpElapsed, tmpRunError);
		this._renderLogOnly();
	}

	clear()
	{
		this._cancelAsyncRender();
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

		return function playgroundRequire(pModuleName)
		{
			switch (pModuleName)
			{
				case 'fable':
					return tmpAutoCapture ? PlaygroundFableWrapper : tmpFableClass;
				case 'pict':
					return tmpPict.constructor;
				case 'fable-uuid':
					return pFableInstance.UUID && pFableInstance.UUID.constructor;
				case 'fable-settings':
					return pFableInstance.SettingsManager && pFableInstance.SettingsManager.constructor;
				case 'fable-log':
					return pFableInstance.Logging && pFableInstance.Logging.constructor;
				case 'fable-serviceproviderbase':
					return libFableServiceProviderBase;
				default:
					throw new Error("require('" + pModuleName + "') is not available in the playground. "
						+ "Recognized: 'fable', 'pict', 'fable-uuid', 'fable-settings', 'fable-log', 'fable-serviceproviderbase'. "
						+ "For anything else, use the supplied `fable` / `pict` directly.");
			}
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
