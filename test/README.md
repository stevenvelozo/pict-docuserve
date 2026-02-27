# pict-docuserve Test Sites

Each subfolder under `test/sites/` is a self-contained documentation site that exercises a different permutation of optional configuration files. Use these to verify that pict-docuserve degrades gracefully when files are missing and works correctly when they are present.

## Running a Test Site

```bash
# From the pict-docuserve root:
npx pict-docuserve serve test/sites/<site-name>
```

Or for any site:

```bash
node source/cli/Docuserve-CLI-Run.js serve test/sites/<site-name>
```

## Test Sites

### `markdown-only`

The simplest possible site: just a folder of `.md` files with no special configuration.

| File | Present? |
|------|----------|
| `README.md` | Yes |
| `_cover.md` | No |
| `_sidebar.md` | No |
| `_topbar.md` | No |
| `errorpage.md` | No |
| `retold-catalog.json` | No |
| `retold-keyword-index.json` | No |

**Expected behavior:** Title and sidebar auto-discovered from README.md heading. Splash shows a "Read the Docs" button. Top bar shows "Documentation" or the README title. No search.

---

### `with-sidebar`

Markdown files plus a hand-written `_sidebar.md` for navigation.

| File | Present? |
|------|----------|
| `README.md` | Yes |
| `_cover.md` | No |
| `_sidebar.md` | **Yes** |
| `_topbar.md` | No |
| `errorpage.md` | No |
| `retold-catalog.json` | No |
| `retold-keyword-index.json` | No |

**Expected behavior:** Sidebar driven by `_sidebar.md` with groups and nested pages. Splash falls back to generic "Documentation" title. Top bar uses defaults.

---

### `with-cover`

Markdown files plus `_cover.md` and `_topbar.md` for branding, but no explicit sidebar.

| File | Present? |
|------|----------|
| `README.md` | Yes |
| `_cover.md` | **Yes** |
| `_sidebar.md` | No |
| `_topbar.md` | **Yes** |
| `errorpage.md` | No |
| `retold-catalog.json` | No |
| `retold-keyword-index.json` | No |

**Expected behavior:** Splash driven by _cover.md with title, tagline, highlights and action buttons. Top bar branded from `_topbar.md` with nav links. Sidebar auto-discovered from README.md.

---

### `full-featured`

Every optional markdown file present plus a standalone keyword index. No catalog.

| File | Present? |
|------|----------|
| `README.md` | Yes |
| `_cover.md` | **Yes** |
| `_sidebar.md` | **Yes** |
| `_topbar.md` | **Yes** |
| `errorpage.md` | **Yes** |
| `retold-catalog.json` | No |
| `retold-keyword-index.json` | **Yes** |

**Expected behavior:** Everything works: custom splash, custom sidebar, custom top bar, search in sidebar and top bar, custom error page for bad routes. This is the "deluxe standalone" configuration.

---

### `catalog-only`

A `retold-catalog.json` and `retold-keyword-index.json` with no markdown configuration files. Simulates pure `indoctrinate` + `inject` output.

| File | Present? |
|------|----------|
| `README.md` | Yes |
| `_cover.md` | No |
| `_sidebar.md` | No |
| `_topbar.md` | No |
| `errorpage.md` | No |
| `retold-catalog.json` | **Yes** |
| `retold-keyword-index.json` | **Yes** |

**Expected behavior:** Splash shows "Catalog Test Project" (from `Catalog.Name`), not "Retold". Sidebar shows catalog groups and modules. Search works. Top bar uses catalog name as brand.
