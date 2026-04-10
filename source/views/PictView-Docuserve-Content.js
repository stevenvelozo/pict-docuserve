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
			color: var(--docuserve-text);
		}
		.pict-content-loading {
			display: flex;
			align-items: center;
			justify-content: center;
			min-height: 200px;
			color: var(--docuserve-text-dim);
			font-size: 1em;
		}
		.pict-content h1 {
			font-size: 2em;
			color: var(--docuserve-text-strong);
			border-bottom: 1px solid var(--docuserve-border);
			padding-bottom: 0.3em;
			margin-top: 0;
		}
		.pict-content h2 {
			font-size: 1.5em;
			color: var(--docuserve-text-strong);
			border-bottom: 1px solid var(--docuserve-border-soft);
			padding-bottom: 0.25em;
			margin-top: 1.5em;
		}
		.pict-content h3 {
			font-size: 1.25em;
			color: var(--docuserve-text-strong);
			margin-top: 1.25em;
		}
		.pict-content h4, .pict-content h5, .pict-content h6 {
			color: var(--docuserve-text-muted);
			margin-top: 1em;
		}
		.pict-content p {
			line-height: 1.7;
			color: var(--docuserve-text);
			margin: 0.75em 0;
		}
		.pict-content a {
			color: var(--docuserve-accent);
			text-decoration: none;
		}
		.pict-content a:hover {
			text-decoration: underline;
		}
		/* Plain <pre> (no wrap) - rare; keep for safety */
		.pict-content pre {
			background: var(--docuserve-code-bg);
			color: var(--docuserve-code-text);
			padding: 1.25em;
			border-radius: 6px;
			border: 1px solid var(--docuserve-code-border);
			overflow-x: auto;
			line-height: 1.5;
			font-size: 0.9em;
		}
		/* Inline code */
		.pict-content code {
			background: var(--docuserve-inline-code-bg);
			padding: 0.15em 0.4em;
			border-radius: 3px;
			font-size: 0.9em;
			color: var(--docuserve-inline-code-text);
			font-family: 'SFMono-Regular', 'SF Mono', 'Menlo', 'Consolas', 'Liberation Mono', 'Courier New', monospace;
		}
		.pict-content pre code {
			background: none;
			padding: 0;
			color: inherit;
			font-size: inherit;
		}
		/* Fenced code block wrapper emitted by pict-section-content */
		.pict-content-code-wrap {
			position: relative;
			font-family: 'SFMono-Regular', 'SF Mono', 'Menlo', 'Consolas', 'Liberation Mono', 'Courier New', monospace;
			font-size: 14px;
			line-height: 1.5;
			border-radius: 6px;
			border: 1px solid var(--docuserve-code-border);
			overflow: auto;
			margin: 1em 0;
			background: var(--docuserve-code-bg);
		}
		.pict-content-code-wrap .pict-content-code-line-numbers {
			position: absolute;
			top: 0;
			left: 0;
			width: 40px;
			padding: 1.25em 0;
			text-align: right;
			background: var(--docuserve-code-gutter-bg);
			border-right: 1px solid var(--docuserve-code-gutter-border);
			color: var(--docuserve-code-gutter-text);
			font-family: inherit;
			font-size: inherit;
			line-height: inherit;
			user-select: none;
			pointer-events: none;
			box-sizing: border-box;
		}
		.pict-content-code-wrap .pict-content-code-line-numbers span {
			display: block;
			padding: 0 8px 0 0;
		}
		.pict-content-code-wrap pre {
			margin: 0;
			background: var(--docuserve-code-bg);
			color: var(--docuserve-code-text);
			padding: 1.25em 1.25em 1.25em 52px;
			border: none;
			border-radius: 0;
			overflow-x: auto;
			line-height: 1.5;
			font-size: inherit;
		}
		.pict-content-code-wrap pre code {
			background: none;
			padding: 0;
			color: inherit;
			font-size: inherit;
			font-family: inherit;
		}
		/* Syntax tokens — these rules must match the span classes emitted by
		   pict-section-code's highlighter.  Also apply without .pict-content-code-wrap
		   as a belt-and-suspenders for any <pre><code> not emitted from a fence. */
		.pict-content-code-wrap .keyword,
		.pict-content pre code .keyword { color: var(--docuserve-tok-keyword); }
		.pict-content-code-wrap .string,
		.pict-content pre code .string { color: var(--docuserve-tok-string); }
		.pict-content-code-wrap .number,
		.pict-content pre code .number { color: var(--docuserve-tok-number); }
		.pict-content-code-wrap .comment,
		.pict-content pre code .comment { color: var(--docuserve-tok-comment); font-style: italic; }
		.pict-content-code-wrap .operator,
		.pict-content pre code .operator { color: var(--docuserve-tok-operator); }
		.pict-content-code-wrap .punctuation,
		.pict-content pre code .punctuation { color: var(--docuserve-tok-punctuation); }
		.pict-content-code-wrap .function-name,
		.pict-content pre code .function-name { color: var(--docuserve-tok-function); }
		.pict-content-code-wrap .property,
		.pict-content pre code .property { color: var(--docuserve-tok-property); }
		.pict-content-code-wrap .tag,
		.pict-content pre code .tag { color: var(--docuserve-tok-tag); }
		.pict-content-code-wrap .attr-name,
		.pict-content pre code .attr-name { color: var(--docuserve-tok-attr-name); }
		.pict-content-code-wrap .attr-value,
		.pict-content pre code .attr-value { color: var(--docuserve-tok-attr-value); }
		.pict-content blockquote {
			border-left: 4px solid var(--docuserve-blockquote-border);
			margin: 1em 0;
			padding: 0.5em 1em;
			background: var(--docuserve-blockquote-bg);
			color: var(--docuserve-blockquote-text);
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
			color: var(--docuserve-text);
		}
		.pict-content hr {
			border: none;
			border-top: 1px solid var(--docuserve-border);
			margin: 2em 0;
		}
		.pict-content table {
			width: 100%;
			border-collapse: collapse;
			margin: 1em 0;
		}
		.pict-content table th {
			background: var(--docuserve-table-header-bg);
			border: 1px solid var(--docuserve-border);
			padding: 0.6em 0.8em;
			text-align: left;
			font-weight: 600;
			color: var(--docuserve-text-strong);
		}
		.pict-content table td {
			border: 1px solid var(--docuserve-border);
			padding: 0.5em 0.8em;
			color: var(--docuserve-text);
		}
		.pict-content table tr:nth-child(even) {
			background: var(--docuserve-table-row-alt-bg);
		}
		.pict-content img {
			max-width: 100%;
			height: auto;
		}
		.pict-content pre.mermaid {
			background: var(--docuserve-mermaid-bg);
			color: #2A241E;
			text-align: center;
			padding: 1em;
			border: 1px solid var(--docuserve-border-soft);
		}
		/* Force dark text inside mermaid SVGs so diagrams stay readable
		   in dark mode (mermaid bg is always light). */
		.pict-content pre.mermaid text,
		.pict-content pre.mermaid .nodeLabel,
		.pict-content pre.mermaid .edgeLabel,
		.pict-content pre.mermaid .label,
		.pict-content pre.mermaid .cluster-label,
		.pict-content pre.mermaid span,
		.pict-content pre.mermaid foreignObject p,
		.pict-content pre.mermaid foreignObject div,
		.pict-content pre.mermaid foreignObject span {
			color: #2A241E !important;
			fill: #2A241E !important;
		}
		.pict-content pre.mermaid .edgePath .path {
			stroke: #5E5549 !important;
		}
		.pict-content pre.mermaid .arrowheadPath {
			fill: #5E5549 !important;
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
			border-bottom: 1px solid var(--docuserve-border-soft);
			font-size: 0.85em;
			text-align: right;
		}
		.docuserve-module-external-link a {
			color: var(--docuserve-accent);
			text-decoration: none;
		}
		.docuserve-module-external-link a:hover {
			text-decoration: underline;
		}
		.docuserve-not-found {
			text-align: center;
			padding: 3em 1em;
			color: var(--docuserve-text-muted);
		}
		.docuserve-not-found h2 {
			color: var(--docuserve-text-dim);
			font-size: 1.5em;
			border-bottom: none;
		}
		.docuserve-not-found code {
			background: var(--docuserve-inline-code-bg);
			padding: 0.15em 0.4em;
			border-radius: 3px;
			font-size: 0.9em;
			color: var(--docuserve-inline-code-text);
		}

		/* Fullscreen viewer for images and mermaid diagrams (click-to-zoom) */
		.pict-content [data-fullscreen-source] {
			cursor: zoom-in;
			outline: 1px solid transparent;
			outline-offset: 3px;
			border-radius: 4px;
			transition: outline-color 0.15s ease;
		}
		.pict-content [data-fullscreen-source]:hover {
			outline-color: var(--docuserve-accent);
		}
		/* Code block container with hover-revealed action buttons */
		.pict-content-code-container {
			position: relative;
			display: flex;
			align-items: flex-start;
			gap: 8px;
			margin: 1em 0;
		}
		.pict-content-code-container > .pict-content-code-wrap {
			margin: 0;
			flex: 1 1 auto;
			min-width: 0;
		}
		.pict-content-code-actions {
			position: sticky;
			top: 64px;
			align-self: flex-start;
			display: flex;
			flex-direction: column;
			gap: 6px;
			flex: 0 0 auto;
			padding-top: 6px;
			opacity: 0;
			transform: translateX(-4px);
			transition: opacity 0.15s ease, transform 0.15s ease;
			pointer-events: none;
		}
		.pict-content-code-container:hover .pict-content-code-actions,
		.pict-content-code-container:focus-within .pict-content-code-actions {
			opacity: 1;
			transform: translateX(0);
			pointer-events: auto;
		}
		.pict-content-code-action-btn {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			width: 28px;
			height: 28px;
			padding: 0;
			background: var(--docuserve-bg-elevated);
			color: var(--docuserve-text-muted);
			border: 1px solid var(--docuserve-border);
			border-radius: 6px;
			cursor: pointer;
			box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
			transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
		}
		.pict-content-code-action-btn svg {
			display: block;
			width: 14px;
			height: 14px;
			stroke: currentColor;
			fill: none;
			stroke-width: 1.6;
			stroke-linecap: round;
			stroke-linejoin: round;
		}
		.pict-content-code-action-btn:hover {
			background: var(--docuserve-accent);
			color: #FFFFFF;
			border-color: var(--docuserve-accent);
			box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
		}
		.pict-content-code-action-btn:focus-visible {
			outline: 2px solid var(--docuserve-accent);
			outline-offset: 2px;
		}
		.pict-content-code-action-btn.is-copied {
			background: var(--docuserve-accent);
			color: #FFFFFF;
			border-color: var(--docuserve-accent);
		}
		.pict-content-code-action-btn.is-copy-failed {
			background: #B23A3A;
			color: #FFFFFF;
			border-color: #B23A3A;
		}
		.pict-fullscreen-overlay {
			position: fixed;
			inset: 0;
			z-index: 9999;
			display: flex;
			flex-direction: column;
			background: rgba(0, 0, 0, 0.62);
			backdrop-filter: blur(6px);
			-webkit-backdrop-filter: blur(6px);
			color: var(--docuserve-text);
		}
		.pict-fullscreen-overlay[hidden] {
			display: none;
		}
		.pict-fullscreen-titlebar {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 1em;
			height: 48px;
			padding: 0 1em;
			background: var(--docuserve-bg-elevated);
			color: var(--docuserve-text-strong);
			border-bottom: 1px solid var(--docuserve-border);
			box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
			flex: 0 0 auto;
		}
		.pict-fullscreen-title {
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
			font-size: 0.95em;
			font-weight: 600;
			letter-spacing: 0.01em;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			color: var(--docuserve-text-strong);
		}
		.pict-fullscreen-controls {
			display: inline-flex;
			align-items: center;
			gap: 4px;
		}
		.pict-fullscreen-btn {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			width: 32px;
			height: 32px;
			padding: 0;
			background: transparent;
			border: 1px solid transparent;
			border-radius: 6px;
			color: var(--docuserve-text-muted);
			cursor: pointer;
			transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
		}
		.pict-fullscreen-btn svg {
			display: block;
			width: 16px;
			height: 16px;
			stroke: currentColor;
			fill: none;
			stroke-width: 1.75;
			stroke-linecap: round;
			stroke-linejoin: round;
		}
		.pict-fullscreen-btn:hover {
			background: var(--docuserve-border-soft);
			color: var(--docuserve-text-strong);
		}
		.pict-fullscreen-btn:focus-visible {
			outline: 2px solid var(--docuserve-accent);
			outline-offset: 2px;
		}
		.pict-fullscreen-close:hover {
			background: var(--docuserve-accent);
			color: #FFFFFF;
		}
		.pict-fullscreen-stage {
			flex: 1 1 auto;
			display: flex;
			align-items: center;
			justify-content: center;
			overflow: hidden;
			padding: 1.5em;
			cursor: zoom-in;
			touch-action: none;
		}
		.pict-fullscreen-stage.is-zoomed {
			cursor: grab;
		}
		.pict-fullscreen-stage.is-panning {
			cursor: grabbing;
		}
		.pict-fullscreen-content {
			display: flex;
			align-items: center;
			justify-content: center;
			max-width: 100%;
			max-height: 100%;
			transform-origin: center center;
			transition: transform 0.05s linear;
			will-change: transform;
		}
		.pict-fullscreen-content > * {
			box-shadow: 0 12px 48px rgba(0, 0, 0, 0.45);
		}
		.pict-fullscreen-content .pict-fullscreen-img {
			max-width: 90vw;
			max-height: calc(100vh - 96px);
			width: auto;
			height: auto;
			object-fit: contain;
			background: var(--docuserve-bg-elevated);
			padding: 12px;
			border-radius: 6px;
		}
		.pict-fullscreen-content .pict-fullscreen-mermaid-svg {
			width: min(90vw, 1400px);
			height: auto;
			max-height: calc(100vh - 96px);
			background: var(--docuserve-mermaid-bg);
			color: #2A241E;
			padding: 16px;
			border-radius: 6px;
		}
		.pict-fullscreen-content .pict-fullscreen-mermaid-svg text,
		.pict-fullscreen-content .pict-fullscreen-mermaid-svg .nodeLabel,
		.pict-fullscreen-content .pict-fullscreen-mermaid-svg .edgeLabel,
		.pict-fullscreen-content .pict-fullscreen-mermaid-svg .label,
		.pict-fullscreen-content .pict-fullscreen-mermaid-svg span,
		.pict-fullscreen-content .pict-fullscreen-mermaid-svg foreignObject p,
		.pict-fullscreen-content .pict-fullscreen-mermaid-svg foreignObject div,
		.pict-fullscreen-content .pict-fullscreen-mermaid-svg foreignObject span {
			color: #2A241E !important;
			fill: #2A241E !important;
		}
		.pict-fullscreen-content .pict-fullscreen-codewrap {
			max-width: 90vw;
			max-height: calc(100vh - 96px);
			margin: 0;
			overflow: auto;
			box-shadow: 0 12px 48px rgba(0, 0, 0, 0.45);
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
