---
sidebar_position: 6
---

# Deployment (GitHub Pages)

This repository deploys docs from `website/` to GitHub Pages using GitHub Actions.

## GitHub Settings

In your repository settings:

1. Go to `Settings -> Pages`.
2. Under Build and deployment, select `GitHub Actions`.

No manual branch publishing step is needed once the workflow is active.

## Workflow

The workflow file is:

- `.github/workflows/docs-pages.yml`

It runs on pushes to `main`, builds Docusaurus in `website/`, uploads the static output, and deploys to Pages.

## Local Build Check

```bash
cd website
npm run build
npm run serve
```

## Expected URL

- `https://rhgx.github.io/tf-item-schema-api/`
