import json
import os
from pathlib import Path
from io import BytesIO

import numpy as np
import tensorflow as tf
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, UnidentifiedImageError
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = Path(os.getenv("MODEL_PATH", BASE_DIR / "models" / "best_rice_model.keras"))
CLASS_NAMES_PATH = Path(os.getenv("CLASS_NAMES_PATH", BASE_DIR / "models" / "class_names.json"))
IMAGE_SIZE = (224, 224)
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

app = FastAPI(
    title="RiceCare AI API",
    description="API สำหรับจำแนกภาพใบข้าวด้วยโมเดล TensorFlow/Keras",
    version="1.0.0",
)

# เปลี่ยน allow_origins เป็น URL จริงของ Frontend ก่อน Deploy
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = None
class_names = None


@app.on_event("startup")
def load_model():
    global model, class_names

    if not MODEL_PATH.exists():
        raise RuntimeError(
            f"ไม่พบไฟล์โมเดล: {MODEL_PATH}. "
            "ให้นำ best_rice_model.keras ไปไว้ในโฟลเดอร์ models/"
        )

    if not CLASS_NAMES_PATH.exists():
        raise RuntimeError(
            f"ไม่พบไฟล์ชื่อคลาส: {CLASS_NAMES_PATH}. "
            "ให้นำ class_names.json ไปไว้ในโฟลเดอร์ models/"
        )

    model = tf.keras.models.load_model(MODEL_PATH)

    with open(CLASS_NAMES_PATH, "r", encoding="utf-8") as f:
        class_names = json.load(f)

    if not isinstance(class_names, list) or not class_names:
        raise RuntimeError("class_names.json ต้องเป็น JSON array ของชื่อคลาส")

    output_classes = int(model.output_shape[-1])
    if output_classes != len(class_names):
        raise RuntimeError(
            f"จำนวน output ของโมเดล ({output_classes}) "
            f"ไม่ตรงกับจำนวนคลาส ({len(class_names)})"
        )


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    classes: list[str]


@app.get("/", tags=["General"])
def root():
    return {
        "name": "RiceCare AI API",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health", response_model=HealthResponse, tags=["General"])
def health():
    return HealthResponse(
        status="ok" if model is not None else "model_not_loaded",
        model_loaded=model is not None,
        classes=class_names or [],
    )


@app.post("/predict", tags=["Prediction"])
async def predict(file: UploadFile = File(...)):
    if model is None or class_names is None:
        raise HTTPException(status_code=503, detail="โมเดลยังไม่พร้อมใช้งาน")

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=415, detail="กรุณาอัปโหลดไฟล์ภาพ")

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="ไฟล์ภาพว่างเปล่า")
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="ไฟล์ใหญ่เกิน 10 MB")

    try:
        image = Image.open(BytesIO(contents)).convert("RGB")
        image = image.resize(IMAGE_SIZE, Image.Resampling.LANCZOS)
    except (UnidentifiedImageError, OSError):
        raise HTTPException(status_code=400, detail="ไม่สามารถอ่านไฟล์ภาพนี้ได้")

    # ต้องตรงกับขั้นตอน preprocessing ที่ใช้ตอนเทรน:
    # RGB, 224x224, ค่า pixel 0-255
    image_array = np.asarray(image, dtype=np.float32)
    image_array = np.expand_dims(image_array, axis=0)

    predictions = model.predict(image_array, verbose=0)[0]
    predicted_index = int(np.argmax(predictions))
    predicted_class = class_names[predicted_index]
    confidence = float(predictions[predicted_index])

    scores = [
        {"class_name": name, "score": round(float(score), 6)}
        for name, score in zip(class_names, predictions)
    ]
    scores.sort(key=lambda item: item["score"], reverse=True)

    return {
        "predicted_class": predicted_class,
        "confidence": round(confidence, 6),
        "confidence_percent": round(confidence * 100, 2),
        "scores": scores,
        "disclaimer": "ผลนี้เป็นการคาดการณ์จาก AI ไม่ใช่การวินิจฉัยโรคที่รับประกันความถูกต้อง",
    }
