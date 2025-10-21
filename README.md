# Weather Live Starter (VS Code)
A minimal one-page site that embeds a YouTube channel that is live, an interactive US radar (RainViewer), and live National Weather Service alerts.

## Quick Start
1. Install VS Code: https://code.visualstudio.com/
2. (Optional) Install Git: https://git-scm.com/
3. Open this folder in VS Code (`File → Open Folder...`).
4. Install the **Live Server** extension (by Ritwick Dey).
5. Right‑click `index.html` → **Open with Live Server** to preview at `http://localhost:5500/`.
6. Edit the header "Subscribe on YouTube" link or styles as you like.

### Notes
- YouTube video ID is set to **L2epTWHZjFY** as an example.
- Geolocation works on `https://` or `http://localhost`. Browsers block it on plain `http` except localhost.
- Keep the attributions (RainViewer, NWS, OSM).
- For production, deploy to Netlify/Vercel/GitHub Pages.

## Deploy (Netlify quick way)
1. Sign up at https://app.netlify.com/
2. Click **Sites → Drag and drop** your project folder.
3. Netlify will give you an `https://` URL with free SSL.
4. Add a custom domain (optional).

## Deploy (Vercel git way)
1. Create a GitHub repo and push this folder.
2. Import the repo at https://vercel.com/new
3. Framework preset: **Other** (static).
4. Deploy. Vercel gives you an `https://` URL and SSL.

## Customize
- Colors are in CSS `:root` variables.
- Replace the YouTube embed id and subscribe link.
- The email form is a placeholder; paste in your provider's embed code.

Enjoy!
