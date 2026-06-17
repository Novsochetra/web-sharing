# Agent Guide

This file contains project conventions and workflow notes for AI coding agents.

## Tech stack

- **Backend**: Node.js, Express 5, Socket.IO 4, Multer 2
- **Frontend**: Vanilla JavaScript (ES modules), Socket.IO client served by the server
- **Styling**: Plain CSS, no framework
- **Package manager**: npm

## Code style

- Formatter: **Prettier** (see `.prettierrc`)
- Linter: **ESLint** flat config (see `eslint.config.mjs`)
- Editor config: `.editorconfig`
- 2 spaces, single quotes, trailing commas where valid in ES5, print width 100

## Commands to run before finishing

Always run these after making code changes:

```bash
npm run lint
npm run format:check
```

If either fails, fix it. Use `npm run format` to auto-format and `npm run lint:fix` for auto-fixable lint issues.

## Git / commits

Husky + lint-staged are installed. Every commit triggers:

```bash
npx lint-staged
```

This runs ESLint --fix + Prettier --write on staged `.js`/`.mjs`/`.cjs` files and Prettier on `.css`/`.html`/`.json`/`.md` files. Commits will be blocked until the staged files pass.

## Project layout

### Backend (`src/`)

- `src/config.js` — environment-based constants and runtime token
- `src/server.js` — entry point; wires middleware, routes, socket.io, starts server
- `src/middleware/` — Express middleware
- `src/routes/` — Express route handlers. Export `createRouter(io?)` factory functions.
- `src/socket/` — Socket.IO auth and event handlers
- `src/utils/` — small pure/shared helpers

### Frontend (`public/js/`)

- `public/js/app.js` — entry point
- `public/js/api.js` — all `fetch` / `XMLHttpRequest` calls
- `public/js/constants.js` — UI labels and notification metadata
- `public/js/state.js` — shared mutable state and accessors
- `public/js/notifications.js` — toast notification manager
- `public/js/utils.js` — pure helpers (`esc`, `formatSize`, `timeAgo`, etc.)
- `public/js/ui/` — DOM modules grouped by feature (qr, send, inbox, preview)

`public/index.html` loads `app.js` as a module:

```html
<script type="module" src="/js/app.js"></script>
```

## Naming conventions

- Files and modules: lowercase, kebab-case
- Functions / variables: camelCase
- Constants / enums: UPPER_SNAKE_CASE
- DOM element variables: use the element ID or a descriptive noun (`sendBtn`, `fileInput`)

## Things to preserve

- Keep the existing API contract. Frontend expects `{ url, qrcode }`, `{ ip, port, token }`, `{ uploadIds }`, `{ uploadId }`, `{ success: true }`, etc.
- Token auth behavior: static assets bypass the token; all `/api/*` and HTML pages require a valid `?token=` query or `token` cookie.
- `data.json` lives inside the per-session `uploads/<token>/` directory.
