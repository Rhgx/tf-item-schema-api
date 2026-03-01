---
sidebar_position: 6
---

# Deployment (GitHub Pages)

This project deploys docs from `website/` to GitHub Pages using GitHub Actions.

## 1) Configure GitHub Pages

In your repository settings:

1. Go to `Settings -> Pages`.
2. Under Build and deployment, select `GitHub Actions`.

No manual `gh-pages` branch publishing is required.

## 2) Workflow File

Deployment workflow:

- `.github/workflows/docs-pages.yml`

On pushes to `main`, it:

1. Installs dependencies
2. Builds the docs site from `website/`
3. Uploads the build output
4. Deploys to GitHub Pages

## 3) Verify Locally Before Pushing

```bash
cd website
npm run build
npm run serve
```

## 4) Expected URL

- `https://rhgx.github.io/tf-item-schema-api/`
