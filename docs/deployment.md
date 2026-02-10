# Deployment

Docuserve provides two CLI commands for working with documentation folders, plus a `build-site.js` script for advanced site assembly.

## Serving Locally

The `serve` command starts an HTTP server that overlays your markdown folder with the Docuserve application assets. No files are copied into your docs folder -- the SPA assets are served transparently from the module's `dist/` directory.

```bash
npx pict-docuserve serve ./docs
```

This starts a server on `http://127.0.0.1:3333`. Your markdown files (`cover.md`, `_sidebar.md`, `_topbar.md`, and all `*.md` pages) are served from the docs folder, while `index.html`, the CSS, and the JavaScript bundles come from the module.

### Custom port

```bash
npx pict-docuserve serve ./docs --port 8080
```

### How the overlay works

For each HTTP request, the server checks the docs folder first. If the file is not found there, it falls back to the module's built `dist/` folder. This means:

- `/cover.md` -- served from your docs folder
- `/index.html` -- served from `dist/` (the Docuserve SPA entry point)
- `/js/pict.min.js` -- served from `dist/js/`
- `/pict-docuserve.min.js` -- served from `dist/`

If your docs folder contains its own `index.html`, it takes precedence.

## Injecting for Static Hosting

The `inject` command copies the Docuserve application assets into a target folder, making it self-contained and ready to deploy to any static host.

```bash
npx pict-docuserve inject ./docs
```

After injection, the folder contains your markdown files alongside:

```
docs/
├── index.html                    # Pict app entry point
├── pict-docuserve.min.js         # Bundled application
├── pict-docuserve.compatible.min.js
├── css/
│   └── docuserve.css             # Base styles
├── js/
│   └── pict.min.js               # Pict library
├── .nojekyll                     # GitHub Pages marker
├── cover.md                      # Your splash content
├── _sidebar.md                   # Your sidebar navigation
└── *.md                          # Your documentation pages
```

Deploy this folder to GitHub Pages, Netlify, or any HTTP server.

## GitHub Pages Deployment

### Option 1: Inject and push

```bash
# Inject assets into your docs folder
npx pict-docuserve inject ./docs

# Commit and push -- configure GitHub Pages to serve from docs/
git add docs/
git commit -m "Update documentation"
git push
```

### Option 2: gh-pages branch

```bash
npx pict-docuserve inject ./my-docs

cd my-docs
git init
git add -A
git commit -m "Deploy documentation"
git push -f git@github.com:your/repo.git main:gh-pages
```

### Option 3: GitHub Actions

Create a workflow that builds and deploys on push:

```yaml
name: Deploy Docs
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install
      - run: npx pict-docuserve inject ./docs
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./docs
```

## Advanced: build-site.js

For cases where you want to assemble the Pict application build together with documentation content into a separate output folder, Docuserve includes `build-site.js`.

```bash
# Build the Pict application first
npm run build

# Assemble dist/ + docs content into site/
node build-site.js --docs-path ./my-docs --output-path ./my-site
```

The script copies the entire `dist/` folder as the base, then overlays all `.md` files, `retold-catalog.json`, and `retold-keyword-index.json` from the docs source. It also creates a `.nojekyll` marker.

```bash
# Build everything (app + site) in one step
npm run build-site

# Build with the example applications
npm run build-examples
```
