# RiceCare AI Backend (FastAPI)

Backend API สำหรับโหลดโมเดล Keras ที่เทรนบน Google Colab และทำนายภาพใบข้าว

## 1. โครงสร้างโฟลเดอร์

```text
ricecare_backend/
├── app.py
├── requirements.txt
├── README_TH.md
└── models/
    ├── best_rice_model.keras
    └── class_names.json
```

## 2. ดาวน์โหลดไฟล์จาก Colab

จาก Google Colab ให้ดาวน์โหลดไฟล์เหล่านี้:
- `/content/models_new/best_rice_model.keras`
- `/content/models_new/class_names.json`

นำทั้งสองไฟล์ใส่ไว้ในโฟลเดอร์ `models/` ข้าง `app.py`

`class_names.json` ต้องมีลำดับคลาสเดียวกับตอนฝึก เช่น:

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

## 3. ติดตั้งและเปิด API (Windows PowerShell)

เปิด Terminal ในโฟลเดอร์นี้:

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
uvicorn app:app --reload
```

ถ้าทำงานสำเร็จ API จะอยู่ที่ `http://127.0.0.1:8000`

เปิด `http://127.0.0.1:8000/docs` เพื่อทดลอง API ผ่าน Swagger UI

> TensorFlow รองรับระบบและเวอร์ชัน Python แตกต่างกันตามรุ่น หากติดตั้ง TensorFlow ไม่สำเร็จ ให้ใช้ Python เวอร์ชันที่ TensorFlow รุ่นที่ติดตั้งรองรับ (Python 3.11 เป็นจุดเริ่มต้นที่เหมาะสม)

## 4. Endpoints

### `GET /`
ตรวจว่า API ทำงานอยู่

### `GET /health`
ตรวจว่าโมเดลโหลดแล้วหรือไม่ และแสดงชื่อคลาส

### `POST /predict`
อัปโหลดไฟล์ภาพโดยใช้ multipart form field ชื่อ `file`

ตัวอย่าง Response:

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

## 5. ทดสอบด้วย Python

ติดตั้ง `requests` แล้วรัน:

```python
import requests

with open("rice_leaf.jpg", "rb") as image_file:
    response = requests.post(
        "http://127.0.0.1:8000/predict",
        files={"file": ("rice_leaf.jpg", image_file, "image/jpeg")}
    )

print(response.status_code)
print(response.json())
```

## หมายเหตุ

- โมเดลนี้มี 6 คลาสตาม Dataset ที่ใช้ฝึก
- ค่า `confidence` คือคะแนนจาก softmax ไม่ได้ยืนยันว่าเป็นความน่าจะเป็นที่ calibrated แล้ว
- CORS ตั้งเป็น `*` เพื่อความสะดวกตอนพัฒนา ควรเปลี่ยน `allow_origins` เป็น URL จริงของ Frontend ก่อน Deploy
- ไฟล์โมเดลไม่ได้รวมมาใน ZIP เพราะต้องดาวน์โหลดจาก Colab ของคุณเอง
