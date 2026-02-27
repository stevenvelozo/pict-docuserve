# Overview

This is the overview page for the full-featured test site.

## Purpose

This site tests that pict-docuserve works correctly when **all** optional configuration files are present but **no catalog** exists.

## What to Verify

1. The splash page shows content from `_cover.md`
2. The top bar shows the brand and links from `_topbar.md`
3. The sidebar shows groups and modules from `_sidebar.md`
4. The search box appears in the sidebar (keyword index is loaded)
5. Searching for terms returns results
6. Navigating to a non-existent page shows the custom error page from `errorpage.md`
