# Catalog Only Test

This site has a `retold-catalog.json` and `retold-keyword-index.json` but **no** `cover.md`, `_sidebar.md`, `_topbar.md` or `errorpage.md`.

This simulates a site generated purely by `indoctrinate` + `pict-docuserve inject` with no hand-written markdown configuration.

## What to Verify

1. The splash page should show "Catalog Test Project" as the title (from `Catalog.Name`)
2. The sidebar should show groups and modules from the catalog
3. The search box should appear (keyword index is loaded)
4. The top bar brand should use the catalog name
5. No hard-coded "Retold" should appear anywhere
