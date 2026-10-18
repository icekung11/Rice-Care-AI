# RiceCare AI

## Deploy frontend to GitHub Pages

GitHub Pages hosts the static Vite frontend only. The FastAPI backend and
TensorFlow model must remain deployed separately; this frontend uses
`https://rice-care-ai-qx69.onrender.com` by default.

1. Push this repository to GitHub, with `main` as the default branch.
2. In the repository, open **Settings → Pages** and select **GitHub Actions**
   as the build and deployment source.
3. Push to `main` (or manually run **Deploy to GitHub Pages** from the
   **Actions** tab). The workflow builds the frontend and publishes it.
4. Visit `https://icekung11.github.io/Rice-Care-AI/`.

The deployment workflow builds with the `/Rice-Care-AI/` project-site path.
To use a different backend, update `VITE_API_URL` in
`.github/workflows/deploy-pages.yml` and allow the GitHub Pages origin
(`https://icekung11.github.io`) in the backend's CORS configuration.

## Run locally

```powershell
cd ricecare_frontend_addon
npm ci
npm run dev
```

Set `VITE_API_URL` in a local `.env` file when using a different API URL.
