# tf-item-schema-api

TF2 item metadata wrapper with:

- HTTP API: `GET /v1/inventory/:target`
- TypeScript SDK: `createTf2ItemsClient`

## Documentation

- GitHub Pages docs: <https://rhgx.github.io/tf-item-schema-api/>
- Local docs source: `website/`

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev
```

Required env:

- `STEAM_API_KEY`

Optional env:

- `PORT` (default `3000`)

Health endpoints:

- `GET /health`
- `GET /v1/health`

## Docs Development

```bash
npm run docs:dev
```

Build docs:

```bash
npm run docs:build
npm run docs:serve
```

## Tests and Type Checks

```bash
npm run typecheck
npm test
```

## GitHub Pages Deployment

Deployment is automated through `.github/workflows/docs-pages.yml` on pushes to `main` affecting `website/**`.
