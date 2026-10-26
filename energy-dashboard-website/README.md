# Energy Consumption Analytics – Website by Priyal Sood

A multi-page website presenting an energy consumption dashboard. All charts, KPIs and insights are calculated from `data/clean_data.csv` (60,000 readings, Jan 2024 – Dec 2025; source: Kaggle).

## Run it (Windows, VS Code)
1. Install Node.js LTS from https://nodejs.org (check with `node -v`; version 18 or higher).
2. Unzip, then open the folder in VS Code (**File > Open Folder**).
3. Open **Terminal > New Terminal** and run: `npm start` (no `npm install` needed).
4. Open http://localhost:3000. Stop with `Ctrl + C`.

## Open on your phone (same Wi-Fi)
Run `ipconfig`, copy your **IPv4 Address** (for example 192.168.1.5), then open `http://192.168.1.5:3000` on your phone. Allow Node.js in Windows Firewall if asked.

## Folders
- `public/` – pages (`*.html`), `css/style.css`, `js/` (one script per page).
- `server/` – `server.js` (web server + API) and `data.js` (reads the CSV, does the calculations).
- `data/` – `clean_data.csv` and `messages.json` (saved contact messages).

API: `GET /api/summary`, `GET /api/data` (both accept `?region=&type=&slab=&year=`), `GET /api/insights`, `POST /api/contact`.

## Editing
- Page text: edit the `.html` files in `public/`.
- Navbar links and footer: `public/js/common.js`.
- Colors and fonts: top of `public/css/style.css`.
- New data: replace `data/clean_data.csv` (keep the same column names) and restart. Hand-typed numbers such as "60,000 readings" on the About and Method pages must be updated by hand.

## Put it online
Use Render (Web Service, start command `npm start`). GitHub Pages cannot run the Node.js API. On free hosting, saved messages may be lost when the server restarts.

## Notes
- Contact messages are **saved to `data/messages.json`, not emailed**.
- Charts load Chart.js from the internet (jsDelivr); without internet the charts do not show, but the KPIs still do.
