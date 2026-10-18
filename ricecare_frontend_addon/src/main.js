import './style.css'

const API = (import.meta.env.VITE_API_URL || 'https://rice-care-ai-qx69.onrender.com').replace(/\/$/, '')
const names = {
  'Bacterial Blight': 'โรคขอบใบแห้ง',
  'Brown Spot': 'โรคใบจุดสีน้ำตาล',
  'Healthy': 'ใบข้าวสุขภาพดี',
  'Leaf Blast': 'โรคไหม้',
  'Leaf Smut': 'โรคใบจุดดำ',
  'Tungro': 'โรคทงก้า'
}
const notes = {
  'Bacterial Blight': 'อาจพบแผลเหลืองตามขอบใบและลุกลามเป็นสีน้ำตาล',
  'Brown Spot': 'อาจพบจุดสีน้ำตาลบนใบ ควรตรวจดูการกระจายของแผล',
  'Healthy': 'โมเดลจัดภาพนี้อยู่ในกลุ่มใบข้าวสุขภาพดี',
  'Leaf Blast': 'อาจพบแผลคล้ายรูปตาบนใบ ควรตรวจดูอาการเพิ่มเติม',
  'Leaf Smut': 'ควรตรวจยืนยันกับลักษณะอาการจริงของใบข้าว',
  'Tungro': 'อาจพบใบเหลืองส้มและต้นแคระแกร็น ควรตรวจยืนยันเพิ่มเติม'
}
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
const $ = id => document.getElementById(id)

document.querySelector('#app').innerHTML = `
<header class="topbar"><a class="brand" href="#"><span>🌾</span> RiceCare <b>AI</b></a><div class="status"><i id="status-dot"></i><span id="status-text">กำลังเชื่อมต่อ API</span></div></header>
<main>
  <section class="hero"><div class="eyebrow">✦ AI FOR SMART FARMING</div><h1>ดูแลข้าวให้ดีขึ้น<br><em>เริ่มจากรู้จักโรค</em></h1><p>อัปโหลดภาพใบข้าว เพื่อให้ AI วิเคราะห์กลุ่มโรคที่อาจพบจากภาพ</p><div class="tags"><span>✦ วิเคราะห์ด้วย AI</span><span>✦ 6 กลุ่ม</span><span>✦ ใช้งานง่าย</span></div></section>
  <section class="layout">
    <article class="panel"><div class="panel-head"><div><small>STEP 01</small><h2>อัปโหลดภาพใบข้าว</h2></div><span class="decor">✳</span></div><p class="muted">เลือกภาพที่เห็นใบชัดเจน แสงเพียงพอ และไม่เบลอ</p>
      <input id="file-input" type="file" accept="image/png,image/jpeg,image/webp" hidden>
      <div id="dropzone" class="dropzone" tabindex="0" role="button" aria-label="เลือกภาพใบข้าว"><div id="preview-wrap" class="preview-wrap hidden"><img id="preview" alt="ภาพใบข้าวที่เลือก"></div><div id="prompt"><span class="upload-icon">↑</span><strong>ลากรูปมาวางที่นี่</strong><span>หรือคลิกเพื่อเลือกไฟล์</span><small>JPG, PNG, WEBP · ไม่เกิน 10 MB</small></div></div>
      <div id="file-meta" class="file-meta hidden"></div><div class="actions"><button id="choose-btn" class="secondary">เลือกภาพ</button><button id="analyze-btn" class="primary" disabled>วิเคราะห์ภาพ <b>→</b></button></div>
      <p id="error" class="error hidden" role="alert"></p><p class="privacy">🔒 ภาพจะถูกส่งไปยัง Backend เพื่อประมวลผล</p>
    </article>
    <article class="panel"><div class="panel-head"><div><small>STEP 02</small><h2>ผลการวิเคราะห์</h2></div><span class="decor">⌁</span></div>
      <div id="empty" class="empty"><div class="orb">✳</div><strong>รอภาพใบข้าวของคุณ</strong><p>ผลการวิเคราะห์จะแสดงที่นี่<br>หลังจากอัปโหลดและกดวิเคราะห์</p></div>
      <div id="loading" class="empty hidden"><div class="spinner"></div><strong>กำลังวิเคราะห์ภาพ...</strong><p>โปรดรอสักครู่</p></div><div id="result" class="hidden"></div>
    </article>
  </section>
  <aside class="notice"><span>i</span><p><b>ข้อควรรู้</b><br>RiceCare AI เป็นเครื่องมือช่วยคัดกรองเบื้องต้น ผลลัพธ์อาจคลาดเคลื่อนตามคุณภาพภาพและข้อมูลฝึกโมเดล ไม่ควรใช้แทนคำแนะนำจากผู้เชี่ยวชาญด้านพืช</p></aside>
</main><footer><b>🌾 RiceCare AI</b><span>AI-powered rice leaf screening · Prototype</span></footer>
`

let selectedFile = null
let previewUrl = null
function showError(message = '') {
  $('error').textContent = message
  $('error').classList.toggle('hidden', !message)
}
function selectFile(file) {
  showError()
  if (!file) return
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return showError('รองรับเฉพาะไฟล์ JPG, PNG หรือ WEBP')
  if (file.size > 10 * 1024 * 1024) return showError('ไฟล์ต้องมีขนาดไม่เกิน 10 MB')
  selectedFile = file
  if (previewUrl) URL.revokeObjectURL(previewUrl)
  previewUrl = URL.createObjectURL(file)
  $('preview').src = previewUrl
  $('preview-wrap').classList.remove('hidden')
  $('prompt').classList.add('hidden')
  $('file-meta').textContent = `${file.name} · ${(file.size / 1024 / 1024).toFixed(2)} MB`
  $('file-meta').classList.remove('hidden')
  $('analyze-btn').disabled = false
}
$('choose-btn').addEventListener('click', () => $('file-input').click())
$('dropzone').addEventListener('click', () => $('file-input').click())
$('dropzone').addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('file-input').click() }
})
$('file-input').addEventListener('change', e => selectFile(e.target.files?.[0]))
$('dropzone').addEventListener('dragover', e => { e.preventDefault(); $('dropzone').classList.add('dragging') })
$('dropzone').addEventListener('dragleave', () => $('dropzone').classList.remove('dragging'))
$('dropzone').addEventListener('drop', e => {
  e.preventDefault(); $('dropzone').classList.remove('dragging'); selectFile(e.dataTransfer.files?.[0])
})

$('analyze-btn').addEventListener('click', async () => {
  if (!selectedFile) return
  showError()
  $('choose-btn').disabled = true
  $('analyze-btn').disabled = true
  $('analyze-btn').innerHTML = '<span class="spinner mini"></span> กำลังวิเคราะห์'
  $('empty').classList.add('hidden')
  $('result').classList.add('hidden')
  $('loading').classList.remove('hidden')
  try {
    const form = new FormData()
    form.append('file', selectedFile)
    const response = await fetch(`${API}/predict`, { method: 'POST', body: form })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data.detail || `API error ${response.status}`)
    renderResult(data)
  } catch (err) {
    $('empty').classList.remove('hidden')
    showError(`วิเคราะห์ไม่สำเร็จ: ${err.message} — ตรวจสอบว่า Backend ทำงานที่ ${API}`)
  } finally {
    $('loading').classList.add('hidden')
    $('choose-btn').disabled = false
    $('analyze-btn').innerHTML = 'วิเคราะห์ภาพ <b>→</b>'
    $('analyze-btn').disabled = !selectedFile
  }
})
function toProbability(raw) {
  if (raw === null || raw === undefined || raw === '') {
    return null;
  }

  const number = Number(raw);

  if (!Number.isFinite(number)) {
    return null;
  }

  // รองรับคะแนนทั้งรูปแบบ 0–1 และ 0–100
  return Math.max(0, Math.min(1, number > 1 ? number / 100 : number));
}

function getScore(item) {
  if (typeof item === 'number' || typeof item === 'string') {
    return toProbability(item);
  }

  if (!item || typeof item !== 'object') {
    return null;
  }

  return toProbability(
    item.confidence ??
    item.score ??
    item.probability ??
    item.prob ??
    item.value
  );
}

function renderResult(data) {
  const classNames = {
    'Bacterial Blight': 'โรคขอบใบแห้ง',
    'Brown Spot': 'โรคใบจุดสีน้ำตาล',
    'Healthy': 'ใบข้าวสุขภาพดี',
    'Leaf Blast': 'โรคไหม้',
    'Leaf Smut': 'โรคใบจุดดำ',
    'Tungro': 'โรคทงก้า'
  };

  const predictedClass =
    data.predicted_class ??
    data.predictedClass ??
    data.class_name ??
    data.label ??
    'ไม่พบผลทำนาย';

  const confidence = toProbability(
    data.confidence ?? data.score ?? data.probability
  );

  const confidencePercent =
    Number.isFinite(Number(data.confidence_percent))
      && data.confidence_percent !== null
      && data.confidence_percent !== ''
      ? Math.max(0, Math.min(100, Number(data.confidence_percent)))
      : confidence === null
        ? null
        : confidence * 100;

  const scores = Array.isArray(data.scores) ? data.scores : [];

  const escapeHTML = (value) =>
    String(value).replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[char]);

  const scoreHTML = scores.map(item => {
    const className =
      typeof item === 'object' && item !== null
        ? (
            item.class_name ??
            item.className ??
            item.label ??
            item.class ??
            'ไม่ทราบคลาส'
          )
        : 'ไม่ทราบคลาส';

    const probability = getScore(item);

    const percent = probability === null
      ? null
      : probability * 100;

    const display = percent === null
      ? 'ไม่มีคะแนน'
      : `${percent.toFixed(2)}%`;

    const width = percent ?? 0;

    return `
      <div class="score">
        <div>
          <span>${escapeHTML(classNames[className] ?? className)}</span>
          <b>${display}</b>
        </div>

        <div class="bar">
          <i style="width: ${width}%"></i>
        </div>
      </div>
    `;
  }).join('');

  const result = document.querySelector('#result');

  result.innerHTML = `
    <div class="label">กลุ่มที่ AI คาดการณ์</div>

    <h3>${escapeHTML(classNames[predictedClass] ?? predictedClass)}</h3>

    <div class="english">${escapeHTML(predictedClass)}</div>

    <div class="confidence">
      <div>
        <span>ค่าความมั่นใจของโมเดล</span>
        <b>
          ${
            confidencePercent === null
              ? 'ไม่มีข้อมูล'
              : `${confidencePercent.toFixed(2)}%`
          }
        </b>
      </div>

      <div class="bar">
        <i style="width: ${confidencePercent ?? 0}%"></i>
      </div>

      <small>
        ค่าความมั่นใจไม่ใช่การรับรองว่าทำนายถูกต้อง
      </small>
    </div>

    <h4>คะแนนของทุกกลุ่ม</h4>

    ${
      scoreHTML ||
      '<p class="muted">API ไม่ได้ส่งข้อมูล scores กลับมา</p>'
    }

    <button id="reset-btn" class="secondary reset">
      เลือกภาพใหม่
    </button>
  `;

  result.classList.remove('hidden');
  document.querySelector('#empty').classList.add('hidden');

  document.querySelector('#reset-btn').addEventListener('click', () => {
    document.querySelector('#file-input').value = '';
    document.querySelector('#preview').removeAttribute('src');
    document.querySelector('#preview-wrap').classList.add('hidden');
    document.querySelector('#prompt').classList.remove('hidden');
    document.querySelector('#file-meta').classList.add('hidden');
    document.querySelector('#result').classList.add('hidden');
    document.querySelector('#empty').classList.remove('hidden');

    selectedFile = null;

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      previewUrl = null;
    }

    document.querySelector('#analyze-btn').disabled = true;
  });
}
async function checkAPI() {
  try {
    const response = await fetch(`${API}/health`)
    const data = await response.json()
    if (!response.ok || !data.model_loaded) throw new Error()
    $('status-dot').classList.add('online')
    $('status-text').textContent = 'เชื่อมต่อ AI แล้ว'
  } catch {
    $('status-dot').classList.add('offline')
    $('status-text').textContent = 'ยังไม่เชื่อมต่อ API'
  }
}
checkAPI()
