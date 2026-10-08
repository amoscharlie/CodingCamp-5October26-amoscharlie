# Life Dashboard — Project Steering

## Project Overview
A To-Do List Life Dashboard built with plain HTML, CSS, and Vanilla JavaScript.
No frameworks. No build tools. No backend.

## Tech Stack
- **HTML** — `index.html` (single file, all structure)
- **CSS**  — `css/style.css` (single file, all styles + light/dark theme)
- **JS**   — `js/app.js` (single file, all behaviour + LocalStorage)

## Features Implemented
- Live clock & date display
- Time-based greeting (Good Morning / Afternoon / Evening)
- Custom user name in greeting (saved to LocalStorage)
- Light / Dark mode toggle (saved to LocalStorage)
- Focus Timer (Pomodoro) — start / stop / reset + custom duration
- To-Do List — add / edit / delete / check-off, duplicate prevention, sort (A→Z, Z→A, Done last)
- Quick Links — add / remove, URL validation, duplicate prevention
- All data persisted in `localStorage` (no backend needed)

## Folder Rules
- Only **one** CSS file: `css/style.css`
- Only **one** JS file: `js/app.js`
- No test setup required

## Coding Standards
- Use `'use strict'` at the top of every JS file
- Keep functions small and single-purpose
- Use `escapeHtml()` before inserting any user-supplied text into the DOM
- Store all LocalStorage keys as constants in the `LS` object at the top of `app.js`

## Deployment
- Hosted on **GitHub Pages** from the `main` branch root
- Use GitHub Desktop for commits and pushes
