# ioio inventory platform

ioio inventory platform is a lightweight inventory web app for electronic components,
development boards, modules, and other prototyping hardware.

## What it does

- Add inventory items quickly with a camera photo or uploaded image
- Save both a common name and a technical name
- Store optional category, quantity, location, and notes
- Search by common name or technical name
- Browse items as a visual inventory list
- Keep data in browser local storage
- Export inventory data as JSON

## Run locally

Camera access works best from `localhost`, so serve the folder instead of opening
`index.html` directly.

```bash
cd /Users/johannesnilsson/Documents/Codex/2026-05-07-i-have-a-new-project-to
python3 -m http.server 8080
```

Then open:

`http://localhost:8080`

## Files

- `index.html` - app structure
- `styles.css` - UI styling and responsive layout
- `app.js` - camera, storage, search, and inventory logic
