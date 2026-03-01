---
sidebar_position: 2
---

# Getting Started

## 1) Requirements

- Node.js `>=20`
- Steam Web API key

## 2) Install

From the repository root:

```bash
npm install
```

If you also want to run the docs site locally:

```bash
cd website
npm install
```

## 3) Configure Environment

Create `.env` in the project root:

```bash
STEAM_API_KEY=your_steam_api_key
PORT=3000
```

## 4) Run the API

```bash
npm run dev
```

The API starts on `http://localhost:3000` by default.

Health checks:

- `GET /health`
- `GET /v1/health`

Test inventory endpoint:

```bash
curl "http://localhost:3000/v1/inventory/gaben?language=en"
```

## 5) Run Docs Locally

```bash
cd website
npm start
```

Docs run at:

- `http://localhost:3000/tf-item-schema-api/` (default project base URL)

## Common Issues

- Missing API key:
  - Set `STEAM_API_KEY` in `.env`, or pass header `x-steam-api-key`.
- Private inventory:
  - Endpoint returns `private_inventory`.
- Vanity/profile not found:
  - Endpoint returns `vanity_not_found`.
