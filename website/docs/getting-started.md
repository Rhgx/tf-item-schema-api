---
sidebar_position: 2
---

# Getting Started

## Prerequisites

- Node.js `>=20`
- Steam Web API key

## Install

From repository root:

```bash
npm install
```

For docs site:

```bash
cd website
npm install
```

## Environment

Create `.env` in repository root:

```bash
STEAM_API_KEY=your_steam_api_key
PORT=3000
```

## Run API

```bash
npm run dev
```

Health endpoints:

- `GET /health`
- `GET /v1/health`

## Run Docs Locally

```bash
cd website
npm start
```

By default docs run at `http://localhost:3000/tf-item-schema-api/`.
