# Architecture

Docuserve follows the standard Pict application pattern: a main application class registers views and providers, which collaborate through `AppData` and the Pict service layer.

## Application Lifecycle

1. **HTML loads** `pict.min.js` and `pict-docuserve.min.js`
2. **Bootstrap** via `Pict.safeOnDocumentReady()` instantiates the application
3. **Constructor** registers the router, documentation provider, and all views
4. **`onAfterInitializeAsync`** initializes `AppData.Docuserve` state and triggers the provider to load the catalog, `cover.md`, and `_sidebar.md` in parallel
5. **Layout renders** the shell (top bar + sidebar + content area)
6. **Splash view** populates from `cover.md` data (or catalog fallback)
7. **Sidebar view** populates from `_sidebar.md` data (or catalog fallback)
8. **Router resolves** the current hash URL to show the correct content

## Component Overview

### Documentation Provider

`Pict-Provider-Docuserve-Documentation.js` is the data layer. It handles:

- **Catalog loading** -- Fetches `retold-catalog.json` and builds sidebar group data
- **Cover loading** -- Fetches and parses `cover.md` into structured splash data
- **Sidebar loading** -- Fetches and parses `_sidebar.md` into navigation groups
- **Document fetching** -- Retrieves markdown from local paths or raw GitHub URLs
- **Markdown parsing** -- Converts markdown to HTML (headings, code blocks, tables, lists, links, etc.)
- **Link conversion** -- Translates docsify-style paths to Docuserve hash routes

### Views

| View | File | Purpose |
|------|------|---------|
| Layout | `PictView-Docuserve-Layout.js` | Shell with top bar, sidebar, content containers |
| TopBar | `PictView-Docuserve-TopBar.js` | Navigation header with brand and links |
| Sidebar | `PictView-Docuserve-Sidebar.js` | Group/module navigation tree |
| Splash | `PictView-Docuserve-Splash.js` | Landing page with title, highlights, actions |
| Content | `PictView-Docuserve-Content.js` | Markdown content display area |

### Router

Hash-based routing with these patterns:

| Route | Action |
|-------|--------|
| `#/Home` | Show splash screen |
| `#/doc/:group/:module` | Load module README from GitHub |
| `#/doc/:group/:module/*path` | Load specific doc from module |
| `#/page/:docpath` | Load a local markdown page |

## Data Flow

```
                    cover.md ──> AppData.Cover ──> Splash View
                        │
retold-catalog.json ──> AppData.Catalog
        │                   │
        │               (fallback)
        │                   │
        └──> AppData.SidebarGroups ──> Sidebar View
                        │
                _sidebar.md (overrides if present)
```

The catalog always loads first and provides default sidebar data. Then `cover.md` and `_sidebar.md` load in parallel; if they succeed, they override the defaults.

## File Structure

```
pict-docuserve/
├── source/
│   ├── Pict-Application-Docuserve.js
│   ├── Pict-Application-Docuserve-Configuration.json
│   ├── cli/
│   │   ├── Docuserve-CLI-Run.js             # CLI entry point (bin)
│   │   ├── Docuserve-CLI-Program.js         # CLI program setup
│   │   └── commands/
│   │       ├── Docuserve-Command-Serve.js   # serve command
│   │       └── Docuserve-Command-Inject.js  # inject command
│   ├── providers/
│   │   ├── Pict-Provider-Docuserve-Documentation.js
│   │   └── PictRouter-Docuserve-Configuration.json
│   └── views/
│       ├── PictView-Docuserve-Layout.js
│       ├── PictView-Docuserve-TopBar.js
│       ├── PictView-Docuserve-Sidebar.js
│       ├── PictView-Docuserve-Splash.js
│       └── PictView-Docuserve-Content.js
├── html/index.html
├── css/docuserve.css
├── build-site.js
├── docs/                    # This documentation
├── example_applications/    # Example doc sites
│   ├── todo-app/docs/
│   ├── contacts-app/docs/
│   └── sports-stats-api/docs/
└── dist/                    # Build output
```
