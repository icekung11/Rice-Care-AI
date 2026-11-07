# RiceCare AI

RiceCare AI is a prototype web application that helps screen rice leaf images for possible diseases. A TensorFlow/Keras model is served through a FastAPI backend, while the Vite frontend communicates with it over an HTTP API.

> **Important:** Results are AI predictions intended only for preliminary screening. They are not guaranteed diagnoses and should not replace advice from an agricultural or plant health expert.

## Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [Technology Stack](#technology-stack)
- [Supported Classes](#supported-classes)
- [Run Locally](#run-locally)
  - [1. Prepare the Backend and Model](#1-prepare-the-backend-and-model)
  - [2. Install and Run the Backend](#2-install-and-run-the-backend)
  - [3. Install and Run the Frontend](#3-install-and-run-the-frontend)
- [Configuration](#configuration)
- [API](#api)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Limitations and Privacy](#limitations-and-privacy)

## Features

- Upload or drag and drop a rice leaf image for analysis.
- Display the predicted class, model confidence, and scores for each class.
- Check API connectivity and model readiness through the backend.
- Accept JPG/JPEG, PNG, and WEBP images. The frontend limits uploads to 10 MB.
- Deploy the static frontend and API separately.

## Project Structure

```text
.
├── README.md
├── .github/
│   └── workflows/
│       └── deploy-pages.yml       # Builds and deploys the frontend to GitHub Pages
├── ricecare_backend/
│   ├── app.py                     # FastAPI application and model inference
│   ├── requirements.txt
│   ├── README_TH.md               # Backend guide in Thai
│   └── models/
│       ├── best_rice_model.keras  # Model used for predictions
│       └── class_names.json       # Class names in model output order
└── ricecare_frontend_addon/
    ├── index.html
    ├── package.json
    ├── package-lock.json
    ├── .env.example
    └── src/
        ├── main.js
        └── style.css
```

## Technology Stack

- **Backend:** Python, FastAPI, Uvicorn, TensorFlow/Keras, Pillow, and NumPy
- **Frontend:** JavaScript, Vite, and CSS
- **Hosting:** GitHub Pages for the frontend; the backend and model must be hosted separately

## Supported Classes

The current model classifies images into six categories:

| Class name | Name shown in the frontend |
|---|---|
| `Bacterial Blight` | โรคขอบใบแห้ง |
| `Brown Spot` | โรคใบจุดสีน้ำตาล |
| `Healthy` | ใบข้าวสุขภาพดี |
| `Leaf Blast` | โรคไหม้ |
| `Leaf Smut` | โรคใบจุดดำ |
| `Tungro` | โรคทงก้า |

The names and order in `class_names.json` must match the model output. If you replace the model, update this file accordingly. At startup, the backend checks that the number of model outputs matches the number of class names.

## Run Locally

Install a Python version supported by the TensorFlow version you use (Python 3.11 is a good starting point) and Node.js 20 or later with npm.

### 1. Prepare the Backend and Model

The repository includes the model and `class_names.json`. To use a different model, place both of these files in `ricecare_backend/models/`:

- `best_rice_model.keras`
- `class_names.json`

The `class_names.json` file must be a JSON array, for example:

```json
[
  "Bacterial Blight",
  "Brown Spot",
  "Healthy",
  "Leaf Blast",
  "Leaf Smut",
  "Tungro"
]
```

### 2. Install and Run the Backend

Open PowerShell at the repository root and run:

```powershell
cd ricecare_backend
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
uvicorn app:app --reload
```

When the server starts successfully:

- API base URL: <http://127.0.0.1:8000>
- Swagger UI: <http://127.0.0.1:8000/docs>
- Model health check: <http://127.0.0.1:8000/health>

If PowerShell prevents virtual environment activation, you can invoke `.\.venv\Scripts\python.exe` and `.\.venv\Scripts\uvicorn.exe` directly.

### 3. Install and Run the Frontend

Open another terminal at the repository root:

```powershell
cd ricecare_frontend_addon
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Open the URL printed by Vite in the terminal (usually <http://127.0.0.1:5173>).

The `.env.example` file points the frontend to `http://127.0.0.1:8000` for local development. The frontend checks `/health` and submits images to `/predict`.

**CORS for localhost:** The backend currently allows the GitHub Pages and Netlify origins, but does not allow Vite on localhost. If the browser reports a CORS error, add `http://127.0.0.1:5173` to `allow_origins` in `ricecare_backend/app.py`, then restart the backend. If you open Vite using `localhost` instead of `127.0.0.1`, add the matching origin as well.

## Configuration

### Frontend: `VITE_API_URL`

Set the base URL of the backend. Do not include the `/predict` or `/health` path:

```dotenv
VITE_API_URL=http://127.0.0.1:8000
```

For local development, set this in `ricecare_frontend_addon/.env.local` (see `.env.example`). If the variable is not set, the frontend defaults to `https://rice-care-ai-qx69.onrender.com`.

Vite reads environment variables at startup or build time. Restart the dev server or rebuild the frontend after changing the value.

### Backend: Model File Paths

By default, the backend expects these files:

```text
ricecare_backend/models/best_rice_model.keras
ricecare_backend/models/class_names.json
```

If the model files are stored elsewhere, set the `MODEL_PATH` and `CLASS_NAMES_PATH` environment variables to their respective file paths.

## API

### `GET /`

Checks that the API is running and returns the service name and API documentation path.

### `GET /health`

Checks whether the model has loaded. Example response:

```json
{
  "status": "ok",
  "model_loaded": true,
  "classes": [
    "Bacterial Blight",
    "Brown Spot",
    "Healthy",
    "Leaf Blast",
    "Leaf Smut",
    "Tungro"
  ]
}
```

### `POST /predict`

Send an image as `multipart/form-data` using the field name `file`. Example with curl:

```bash
curl -X POST "http://127.0.0.1:8000/predict" \
  -F "file=@rice_leaf.jpg;type=image/jpeg"
```

Example response:

```json
{
  "predicted_class": "Brown Spot",
  "confidence": 0.9412,
  "confidence_percent": 94.12,
  "scores": [
    {"class_name": "Brown Spot", "score": 0.9412},
    {"class_name": "Leaf Blast", "score": 0.0321}
  ],
  "disclaimer": "ผลนี้เป็นการคาดการณ์จาก AI ไม่ใช่การวินิจฉัยโรคที่รับประกันความถูกต้อง"
}
```

The actual `scores` array contains scores for all classes, sorted from highest to lowest. The backend converts the image to RGB, resizes it to 224 × 224, and passes pixel values in the 0–255 range to the model, as specified by the preprocessing code.

Possible error responses:

| HTTP status | Meaning |
|---|---|
| `400` | The file is empty or cannot be read as an image |
| `413` | The file is larger than 10 MB |
| `415` | The request does not specify an image content type |
| `503` | The model or class names are not ready |

## Deployment

### Frontend on GitHub Pages

The workflow at `.github/workflows/deploy-pages.yml` builds and deploys the frontend when changes are pushed to the `main` branch, or when the workflow is run manually:

1. Push the repository to GitHub and set `main` as the default branch.
2. Open **Settings → Pages** and select **GitHub Actions** as the build and deployment source.
3. Push to `main`, or go to **Actions → Deploy to GitHub Pages → Run workflow**.
4. The project site is available at <https://icekung11.github.io/Rice-Care-AI/>.

The workflow builds the site with the `/Rice-Care-AI/` base path and sets `VITE_API_URL` to `https://rice-care-ai-qx69.onrender.com`. If you use a different backend URL, update this value in the workflow and deploy again.

### Backend

Deploy the backend and model files to a service that can run Python/FastAPI. GitHub Pages cannot host the backend. Before using the deployed application, make sure that:

- The model and `class_names.json` are accessible to the application, or set `MODEL_PATH` and `CLASS_NAMES_PATH`.
- Uvicorn binds to `0.0.0.0` and uses the port provided by the hosting service.
- The backend URL matches the `VITE_API_URL` used to build the frontend.
- The frontend website's origin is included in `allow_origins` in `ricecare_backend/app.py`.
- `/health` returns `model_loaded: true`, and `/predict` works after deployment.

The backend currently allows `https://icekung11.github.io` and `https://ricecare-ai.netlify.app`. If you use a different frontend domain, update the CORS allowlist accordingly.

## Troubleshooting

- **The backend cannot find the model:** Check that `best_rice_model.keras` and `class_names.json` are in the `models/` folder, or verify the paths configured through environment variables.
- **The number of classes does not match the model:** Check that the number and order of names in `class_names.json` match the model outputs and training configuration.
- **TensorFlow installation fails:** Check your Python version and compatibility with the TensorFlow version and operating system you are using.
- **The frontend says it cannot connect to the API:** Open `/health` directly and check that the backend is running and `model_loaded` is `true`.
- **A CORS error appears:** Add the frontend origin, including its protocol and port, to `allow_origins`, then restart the backend.
- **The GitHub Pages site cannot reach the API:** Check `VITE_API_URL` in the workflow, the backend CORS allowlist, and the backend deployment status.
- **The hosted backend is slow to respond initially:** Some hosting services may sleep when idle. Wait for the backend to wake up, then check `/health` again.

## Limitations and Privacy

- `confidence` is derived from the model output (softmax) and is not necessarily a calibrated probability.
- Image quality, camera angle, lighting, background, and differences from the training data can affect prediction accuracy.
- Selected images are sent to the backend for processing. Do not upload images containing personal information or images you do not want to transmit.
- The API limits image uploads to 10 MB and resizes images to 224 × 224 before inference.
