# Third-Party Software Components

This project includes third-party software components.  
Each component is listed below with source, version, and local file location.

> Maintainer note: update this file whenever upgrading or replacing a dependency.

## 1) Marked

- **Package:** Marked
- **Version:** `18.0.5`
- **Purpose in SnapViewer:** Markdown parsing/rendering for snapshot preview
- **Upstream project:** `https://marked.js.org/`
- **Source of bundled file(s):** `https://cdn.jsdelivr.net/npm/marked/lib/marked.umd.min.js`
- **Local path(s):** `vendor/marked/marked.umd.min.js`

## 2) DOMPurify

- **Package:** DOMPurify
- **Version:** `3.4.11`
- **Purpose in SnapViewer:** HTML sanitization of rendered markdown
- **Upstream project:** `https://github.com/cure53/dompurify`
- **Source of bundled file(s):** `https://cdn.jsdelivr.net/npm/dompurify/dist/purify.min.js`
- **Local path(s):** `vendor/dompurify/purify.min.js`

## 3) Bootstrap Icons

- **Package:** Bootstrap Icons
- **Version:** `1.13.1`
- **Purpose in SnapViewer:** UI iconography
- **Upstream project:** `https://icons.getbootstrap.com/`
- **Source of bundled file(s):**
  - `https://cdn.jsdelivr.net/npm/bootstrap-icons/font/bootstrap-icons.min.css`
  - `https://cdn.jsdelivr.net/npm/bootstrap-icons/font/fonts/bootstrap-icons.woff2`
- **Local path(s):**
  - `vendor/bootstrap-icons/bootstrap-icons.min.css`
  - `vendor/bootstrap-icons/fonts/bootstrap-icons.woff2`

## 4) PrismJS

- **Package:** PrismJS
- **Version:** `1.30.0`
- **Purpose in SnapViewer:** Syntax highlighting in raw SVG/text view
- **Upstream project:** `https://prismjs.com/`
- **Source of bundled file(s):**
  - `https://cdn.jsdelivr.net/npm/prismjs/prism.min.js`
  - `https://cdn.jsdelivr.net/npm/prismjs/themes/prism-tomorrow.min.css`
- **Local path(s):**
  - `vendor/prismjs/prism.min.js`
  - `vendor/prismjs/prism-tomorrow.min.css`

## Local Policy for Third-Party Updates

When updating a third-party dependency:

1. Record the new version in this file.
2. Verify the package source is official.
3. Review changelog/release notes for security fixes and breaking changes.
4. Re-run app smoke tests:
   - open folder flow
   - markdown render + sanitize
   - SVG visual/raw preview
   - tree interactions/tooltips/dropdowns
5. Commit dependency update and notice-file change together.
