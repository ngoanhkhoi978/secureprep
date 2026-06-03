# Hệ thống hỏi đáp pháp luật giao thông Việt Nam

Ứng dụng AI hỏi đáp luật giao thông đường bộ Việt Nam, sử dụng **GraphRAG** + **Hybrid Search** (dense + sparse + rerank) để trả lời chính xác với trích dẫn điều luật cụ thể.

---

## Kiến trúc hệ thống

```
┌────────────────────────────┐
│  Frontend  (React + Vite)  │   http://localhost:5173
└──────────────┬─────────────┘
               │  HTTPS (Cloudflare Tunnel hoặc localhost)
               ▼
┌────────────────────────────┐
│  Backend   (FastAPI)        │   http://0.0.0.0:8000
│  POST /api/chat/stream      │   (chạy trên máy GPU riêng)
└──────┬──────────┬───────────┘
       │          │          │
       ▼          ▼          ▼
 [LM Studio]  [Qdrant]   [Neo4j]
 [Qwen3-8B]   [Vector]   [Graph]
```

| Thành phần | Chi tiết |
|---|---|
| **Frontend** | React 19 · Tailwind CSS 4 · Vite 8 · Framer Motion |
| **Backend** | FastAPI · Python ≥ 3.10 · streaming plain-text |
| **LLM** | Qwen3-8B qua LM Studio (OpenAI-compatible API) |
| **Vector DB** | Qdrant — lưu embedding văn bản pháp luật |
| **Graph DB** | Neo4j — lưu quan hệ phân cấp Điều/Khoản/Mục |
| **Embedding** | Fine-tuned model tiếng Việt pháp luật giao thông |
| **Reranker** | AITeamVN/Vietnamese_Reranker |

---

## Yêu cầu hệ thống

### Frontend
- Node.js ≥ 18
- npm ≥ 9

### Backend *(chạy trên máy riêng)*
- Python ≥ 3.10
- CUDA GPU *(khuyến nghị cho model inference)*
- LM Studio đang chạy và đã load model
- Qdrant server đang chạy
- Neo4j server đang chạy

---

## Cài đặt và chạy

### Frontend

```bash
# 1. Clone và cài dependencies
git clone <repo-url>
cd legalchatbot
npm install

# 2. Cấu hình biến môi trường
cp .env.example .env
# Mở .env và điền URL API backend

# 3. Chạy development server
npm run dev
# → Mở trình duyệt: http://localhost:5173
```

### Backend

```bash
# Sao chép thư mục src/api/ lên máy GPU, sau đó:

cd src/api/

# Tạo và kích hoạt virtual environment
python -m venv venv
source venv/bin/activate         # Linux / macOS
# hoặc: venv\Scripts\activate   # Windows

# Cài đặt dependencies
pip install -r requirements.txt

# Cấu hình biến môi trường
cp .env.example .env
# Mở .env và điền thông tin thực

# Chạy server
python app.py
# → API lắng nghe tại: http://0.0.0.0:8000
```

---

## Cấu hình biến môi trường

### Frontend — `.env` (thư mục gốc)

Sao chép từ `.env.example`:

```env
VITE_API_BASE_URL=https://your-api-domain.example.com
```

| Biến | Bắt buộc | Mô tả | Ví dụ |
|---|:---:|---|---|
| `VITE_API_BASE_URL` | ✅ | URL của FastAPI backend | `https://legal.hungreo.dpdns.org` |

> Nếu backend chạy local: `VITE_API_BASE_URL=http://localhost:8000`

---

### Backend — `src/api/.env`

Sao chép từ `src/api/.env.example`:

#### LLM — LM Studio

```env
LM_STUDIO_BASE_URL=http://localhost:1234/v1
LM_STUDIO_API_KEY=lm-studio
LM_MODEL=qwen/qwen3-8b
```

| Biến | Mặc định | Mô tả |
|---|---|---|
| `LM_STUDIO_BASE_URL` | `http://localhost:1234/v1` | URL LM Studio server (có thể là Cloudflare tunnel) |
| `LM_STUDIO_API_KEY` | `lm-studio` | API key (bất kỳ chuỗi nào với LM Studio local) |
| `LM_MODEL` | `qwen/qwen3-8b` | Tên model đang load trong LM Studio |

#### Qdrant

```env
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION=luat_giao_thong_new_finetune_model
```

| Biến | Mặc định | Mô tả |
|---|---|---|
| `QDRANT_URL` | `http://localhost:6333` | URL Qdrant server |
| `QDRANT_COLLECTION` | `luat_giao_thong_new_finetune_model` | Tên collection chứa dữ liệu |

#### Models

```env
EMBEDDING_MODEL_PATH=./nrk-legal-large-traffic-ft-merged-v2
RERANKER_MODEL_NAME=AITeamVN/Vietnamese_Reranker
```

| Biến | Mặc định | Mô tả |
|---|---|---|
| `EMBEDDING_MODEL_PATH` | `./nrk-legal-large-traffic-ft-merged-v2` | Đường dẫn đến embedding model |
| `RERANKER_MODEL_NAME` | `AITeamVN/Vietnamese_Reranker` | Tên hoặc đường dẫn reranker model |

#### Neo4j

```env
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_password
```

| Biến | Mặc định | Mô tả |
|---|---|---|
| `NEO4J_URI` | `bolt://localhost:7687` | URI kết nối Neo4j |
| `NEO4J_USERNAME` | `neo4j` | Tài khoản Neo4j |
| `NEO4J_PASSWORD` | `password` | Mật khẩu Neo4j |

---

## Scripts

```bash
npm run dev       # Development server (hot-reload)
npm run build     # Build production → thư mục dist/
npm run preview   # Preview bản build production
npm run lint      # Kiểm tra linting
```

---

## Cấu trúc thư mục

```
legalchatbot/
├── .env                        # Biến frontend — KHÔNG commit vào git
├── .env.example                # Template biến frontend
├── .gitignore
├── package.json
├── vite.config.js
├── README.md
│
├── src/
│   ├── api/
│   │   ├── app.py              # FastAPI backend (deploy riêng)
│   │   ├── .env.example        # Template biến backend
│   │   └── chat.js             # Frontend API client (streaming)
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.jsx    # Layout wrapper (phát hiện route chatbot)
│   │   │   ├── Header.jsx
│   │   │   └── Footer.jsx
│   │   └── ui/
│   │       ├── Badge.jsx       # Status badge component
│   │       ├── Button.jsx
│   │       ├── Input.jsx
│   │       ├── Skeleton.jsx    # Shimmer loading
│   │       └── Textarea.jsx
│   │
│   ├── hooks/
│   │   ├── useChatHistory.js   # Quản lý lịch sử hội thoại (localStorage)
│   │   ├── useAutosizeTextarea.js
│   │   └── useTheme.js         # Light/dark mode
│   │
│   ├── pages/
│   │   ├── ChatbotPage.jsx     # Trang chatbot chính
│   │   ├── HomePage.jsx        # Landing page
│   │   ├── TraCuuPage.jsx      # Tra cứu điều luật (placeholder)
│   │   └── CapNhatPage.jsx     # Cập nhật pháp luật (placeholder)
│   │
│   ├── index.css               # Design system CSS (variables, utilities)
│   ├── App.jsx                 # Router định nghĩa
│   └── main.jsx
│
└── public/
    └── (assets tĩnh)
```

---

## Lịch sử hội thoại

Lịch sử chat được lưu tự động vào **localStorage** của trình duyệt:

- **Storage key:** `legalbot_history_v1`
- **Tối đa:** 60 cuộc hội thoại
- **Ghi tự động**, debounced 400ms — không mất dữ liệu khi reload
- **Không đồng bộ lên server** — dữ liệu hoàn toàn local

Xóa lịch sử:
- Click **"Xóa toàn bộ lịch sử"** trong sidebar chatbot, hoặc:

```js
// DevTools → Console
localStorage.removeItem('legalbot_history_v1')
```

---

## Dùng Cloudflare Tunnel để expose backend

Nếu backend chạy trên máy local hoặc máy trong mạng LAN và cần expose ra internet:

```bash
# Cài cloudflared: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/

# Tạo tunnel tạm thời (không cần tài khoản Cloudflare)
cloudflared tunnel --url http://localhost:8000
# → In ra URL dạng: https://xxx-yyy.trycloudflare.com
```

Sau đó cập nhật file `.env` frontend:

```env
VITE_API_BASE_URL=https://xxx-yyy.trycloudflare.com
```

> **Lưu ý:** Tunnel tạm thời sẽ hết hạn sau khoảng 8–24 giờ. URL sẽ thay đổi mỗi lần tạo mới.

---

## Xử lý sự cố

| Triệu chứng | Nguyên nhân thường gặp | Cách khắc phục |
|---|---|---|
| Chatbot hiện "Ngoại tuyến" | Backend không chạy hoặc URL sai | Kiểm tra `VITE_API_BASE_URL` và rebuild frontend |
| Lỗi CORS | Backend thiếu CORS middleware | Đảm bảo `CORSMiddleware` trong `app.py` |
| Backend lỗi khi load model | LM Studio chưa load model | Mở LM Studio, load Qwen3-8B, enable server |
| Qdrant connection refused | Qdrant chưa chạy | `docker run -p 6333:6333 qdrant/qdrant` |
| Neo4j authentication failed | Sai credentials | Kiểm tra `NEO4J_USERNAME` / `NEO4J_PASSWORD` |

---

## Công nghệ sử dụng

**Frontend:** React 19 · Vite 8 · Tailwind CSS 4 · Framer Motion · React Markdown · React Router 6

**Backend:** FastAPI · Qdrant · Neo4j · Sentence Transformers · BM25 · LM Studio (Qwen3)

---

*Dữ liệu pháp luật mang tính tham khảo. Cập nhật đến ngày 28/05/2026.*
#   s e c u r e p r e p  
 