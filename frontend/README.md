# ForensicAnalyzerPro Frontend

## Overview
This frontend is built with **SvelteKit** and styled with **Tailwind CSS**.  
It delivers a modern, responsive interface inspired by the **Star Trek LCARS** design language:

* Pastel accent colors, rounded "pill" elements, and card layouts  
* Dynamic navigation with active‐state animation  
* Live stardate + 24-hour clock that updates every second  
* Adaptive layout (CSS Grid + Flexbox) for desktops & mobile  
* Typography: **Inter** (body) & **Exo 2** (headings) for a clean, futuristic look

## Project Structure
```
frontend/
 ├─ src/
 │   ├─ app.html          # HTML template – global CSS vars & Google Fonts
 │   ├─ app.css           # Tailwind directives + LCARS theme styles
 │   ├─ routes/
 │   │   ├─ +layout.svelte# Global CSS import & layout slot
 │   │   └─ +page.svelte  # Dashboard page (cards, nav, stardate logic)
 │   └─ …
 ├─ tailwind.config.cjs   # Tailwind content paths & theme extensions
 ├─ postcss.config.js     # PostCSS plugins (@tailwindcss/postcss, autoprefixer)
 ├─ svelte.config.js      # SvelteKit config with PostCSS preprocessing
 └─ README.md             # (this file)
```

## Local Development (with **Bun**)
```bash
# install deps (run once)
cd frontend
bun install

# start dev server (port 5173 or next available)
bun run dev
```
Open the printed **Local** URL in your browser to view the live LCARS UI.  
Hot-module reload (HMR) is enabled – changes appear instantly.

## Build & Preview
```bash
# produce optimized build (static + SSR bundles)
bun run build

# preview the production build locally
bun run preview
```

## Customizing the Theme
1. **Colors / Radii** – edit CSS variables in `src/app.html` or the `tailwind.config.cjs` extension section.  
2. **Typography** – change Google Fonts link & `tailwind.config.cjs` fontFamily.
3. **Pages / Routes** – add files under `src/routes/` (SvelteKit file-based routing).
4. **Components** – place reusable components in `src/lib/` and import where needed.

## Stardate Formula
The stardate format follows **`YYYY.DDD • HH:MM:SS`**  
* `YYYY` – current year  
* `DDD` – zero-padded day-of-year (001-366)  
* Time shown in 24-hour notation.  
Logic lives in `+page.svelte` and updates every second via `setInterval`.

## Accessibility Notes
Svelte's linter raises warnings for click handlers on non-interactive elements.  
Nav items use `<div>` for styling flexibility; to fully satisfy a11y rules, convert them to `<button>` or add `role="button"` + keyboard handlers.

---
Happy exploring the galaxy with your new LCARS interface! 🖖
