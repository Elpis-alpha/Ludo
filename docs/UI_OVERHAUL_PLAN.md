# Ludo — Light/Mid UI Overhaul Plan

Static site (index.html, style.css, app.js, base/ = shared utils/fonts/icons). No build step; keep it that way.

## Goals
Modern, neat, "cool" look; better UX; SEO basics; a standard repo. Light–mid scope: restyle and fix, do NOT rewrite game logic.

## 1. Visual design (style.css, index.html)
- Design tokens in `:root` (colors, radii, shadows, spacing, font). One modern font (Inter or Poppins, already loaded via Google Fonts) – drop unused heavy fonts from the critical path.
- Dark, glassmorphism-lite theme: deep gradient background (replace/overlay images/bg.jpg), frosted cards, soft glow accents.
- Header: slim sticky nav, clear New / Exit buttons with hover/focus states.
- Welcome + setup screens: centered glass card, large heading, primary/secondary button styles, styled radio "pills" for player-count and safe-rule, nicer avatar/name/colour picker.
- Board: rounded outer frame, softer cell borders, subtle shadow, clearer safe/start cells, chips with depth (gradient + shadow), smooth move/capture transitions that already exist should be preserved.
- Spin button and spinners: polished, pulsing call-to-action when it is the human's turn.
- Message popups: consistent card styling and fade/scale in.
- Footer: compact, tidy icon row; fix broken links (LinkedIn is `linkedin.om`, WhatsApp number differs from phone, http -> https).
- Responsive down to 360px wide; respect `prefers-reduced-motion`.

## 2. UX / a11y
- Visible `:focus-visible` rings; buttons are real `<button>`s; labels tied to inputs; `aria-live` on game messages; alt text for avatars; sensible tab order.
- Disable "Continue Game" when no saved game exists (check how app.js saves state).
- Keyboard: Space/Enter to spin when it is the human's turn (only if trivial to add).
- Confirm before Exit/New if a game is in progress (use existing message system if possible).

## 3. Core functionality
- Play-test via browser; fix any bugs found in game flow (spin, move, capture, win, AI turn, continue game, resize). Keep fixes minimal and list them in the commit message.

## 4. SEO
- Proper `<title>`, meta description, canonical, Open Graph + Twitter card tags (generate `images/og.png` ~1200x630 from logo512/board screenshot), `theme-color`, `lang`, JSON-LD `VideoGame`/`WebApplication`, `robots.txt`, `sitemap.xml`, manifest cleanup (name, description, `start_url`, theme/background colours matching new theme, maskable icon if easy).
- Semantic markup: one `<h1>` on the page (currently several), `<header>`, `<main>`, `<footer>`, `<noscript>` message. Remove duplicated head tags; `rel=preconnect` kept.

## 5. Repo hygiene
- README: description, screenshot, features, rules, how to run (`python3 -m http.server`), project structure, license note.
- `.gitignore`, `.editorconfig`, LICENSE (MIT) – ask nothing, just add.
- Remove `images/avatar.rar` and other dead weight if unused (verify with grep). Keep Google verification html files (needed for Search Console).
- Don't reorganise into folders unless trivial and safe; if `base/` is renamed, update all references.

## 6. Verification (required)
- Serve locally, use Playwright MCP (browser_navigate / browser_take_screenshot) to screenshot: welcome, each setup step, board mid-game, mobile (390x844) and desktop (1440x900). Look at them, iterate until good.
- Check browser console for errors.
- Commit in logical chunks (design, a11y/ux, seo, repo) and push to origin main.
