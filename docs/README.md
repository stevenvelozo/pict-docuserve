# Pict Docuserve

A single-page documentation viewer built on the Pict MVC framework. Docuserve replaces docsify with a native Pict application that renders markdown documentation, supports cross-repo module browsing, and assembles into a static site for GitHub Pages.

## Why Docuserve?

Docuserve was created to replace docsify for the Retold ecosystem. Rather than depending on a third-party Vue-based library, the documentation site is now itself a Pict application -- eating our own cooking. This means:

- The documentation site demonstrates the framework it documents
- Full control over rendering, navigation, and theming
- No external runtime dependencies beyond Pict itself
- Built-in support for the Indoctrinate catalog format

## Quick Start

The fastest way to view a folder of markdown as a documentation site:

```bash
npm i pict-docuserve
npx pict-docuserve serve ./docs
```

This starts a server on `http://127.0.0.1:3333` that serves your markdown folder with the Docuserve SPA -- no files are copied into your docs folder.

To prepare a folder for static hosting (GitHub Pages, Netlify, etc.):

```bash
npx pict-docuserve inject ./docs
```

This copies `index.html`, the Pict library, and the Docuserve application bundle into the target folder, making it self-contained.

### Building from Source

```bash
# Install dependencies
npm install

# Build the Pict application (to dist/)
npm run build
```

## How It Works

Docuserve is a standard Pict application with views and a documentation provider:

1. **Splash View** -- The landing page, driven by `cover.md` or inferred from the catalog
2. **Sidebar View** -- Navigation tree with inline search, driven by `_sidebar.md` or inferred from the catalog
3. **Content View** -- Renders fetched markdown as HTML in the main content area
4. **Search View** -- Full-page search with ranked results (only available when a keyword index is present)
5. **TopBar View** -- Navigation header with brand, links, and a search link

The **Documentation Provider** handles all data loading: it fetches the module catalog, `cover.md`, `_sidebar.md`, `_topbar.md`, and `retold-keyword-index.json` at startup, then fetches and parses individual markdown documents on demand.

## Content Files

Docuserve looks for these files at the root of the served site:

| File | Purpose | Required? |
|------|---------|-----------|
| `retold-catalog.json` | Module catalog from Indoctrinate | Recommended |
| `retold-keyword-index.json` | Lunr search index from Indoctrinate | Optional |
| `cover.md` | Splash screen content | Optional |
| `_sidebar.md` | Sidebar navigation | Optional |
| `_topbar.md` | Top bar navigation and links | Optional |
| `*.md` | Documentation pages | Yes |

If `cover.md` is missing, the splash screen shows cards for each catalog group. If `_sidebar.md` is missing, the sidebar is built from the catalog. If `retold-keyword-index.json` is missing, search UI does not appear. If even the catalog is missing, you still get a working app -- it just won't have module navigation.

## Example Applications

The `example_applications/` folder contains three sample documentation sites that demonstrate Docuserve with different content:

- `todo-app/docs/` -- A task management application
- `contacts-app/docs/` -- A contacts/CRM application
- `sports-stats-api/docs/` -- A sports statistics API

Try one out:

```bash
npx pict-docuserve serve ./example_applications/todo-app/docs
```

## Learn More

- [Architecture](architecture.md) -- How the application is structured
- [Content Authoring](content-authoring.md) -- Writing documentation for Docuserve
- [Deployment](deployment.md) -- Building, serving, and deploying documentation
- [Configuration](configuration.md) -- Customizing behavior and appearance
