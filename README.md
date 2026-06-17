# WebShare

Local network file sharing between devices.

Run it on one machine, scan the QR code with your phone, and instantly share files and text within the same Wi-Fi / local network.

## Requirements

- Node.js >= 20.0.0
- npm

## Install

```bash
npm install
```

## Usage

### Development

```bash
npm run dev
```

The server starts on `0.0.0.0:3000` by default and opens the host URL in your default browser.

### Production

```bash
npm start
```

### PM2

```bash
npm run build
npm run pm2:start
```

Stop / restart / logs:

```bash
npm run pm2:stop
npm run pm2:restart
npm run pm2:logs
```

## Build a standalone binary

```bash
npm run build
```

Outputs `dist/webshare`. Update `ecosystem.config.js` if you change the output path or targets.

## Environment variables

| Variable        | Default                     | Description                           |
| --------------- | --------------------------- | ------------------------------------- |
| `PORT`          | `3000`                      | HTTP server port                      |
| `MAX_FILE_SIZE` | `500 * 1024 * 1024` (500MB) | Maximum total upload size per request |

## Project structure

```
.
├── src/                  # Backend (Express + Socket.IO)
│   ├── config.js
│   ├── server.js
│   ├── middleware/
│   ├── routes/
│   ├── socket/
│   └── utils/
├── public/               # Frontend
│   ├── index.html
│   ├── css/
│   └── js/
│       ├── app.js
│       ├── api.js
│       ├── constants.js
│       ├── notifications.js
│       ├── state.js
│       ├── utils.js
│       └── ui/
├── ecosystem.config.js   # PM2 config
└── package.json
```

## Scripts

| Script                 | Description                        |
| ---------------------- | ---------------------------------- |
| `npm start`            | Start production server            |
| `npm run dev`          | Start with Node `--watch`          |
| `npm run build`        | Build standalone binary with `pkg` |
| `npm run lint`         | Run ESLint                         |
| `npm run lint:fix`     | Run ESLint with `--fix`            |
| `npm run format`       | Format all files with Prettier     |
| `npm run format:check` | Check Prettier formatting          |

## Security note

A random token is generated on every server start. The token is embedded in the QR code / share URL and set as an HTTP-only cookie after the first authenticated request. Static assets are served without the token so the UI can load before authentication.
