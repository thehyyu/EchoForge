# System Architecture

## 系統地圖

```
瀏覽器
  │
  ├─── HTTP ──────────────────────────────────────────┐
  │                                                   │
  ▼                                                   ▼
Vercel (Next.js)                              Google OAuth
  │                                           （只在登入時用）
  ├── 前台  /zh /en /category /tag /search
  ├── 後台  /admin
  └── API   /api/admin/*
       │
       ├─── SQL 讀寫 ──────────► Neon Postgres
       │                           │
       │                           │  posts
       │                           │  jobs  ◄─────────────────────┐
       │                           │                               │
       └─── 上傳音檔 ──────────► Vercel Blob                      │
                                   │                               │
                                   │ 下載音檔                      │ 輪詢 + 寫回結果
                                   │                               │
                        ┌──────────┘               ┌──────────────┘
                        │                          │
                        ▼                          │
                   ┌────────────────────────────────────────────┐
                   │              Mac mini（本機）               │
                   │                                            │
                   │   poll.py  ◄── 每 30 秒輪詢 Neon jobs      │
                   │      │                                     │
                   │      ├─── localhost:11434 ──► Ollama        │
                   │      │                       Qwen2.5 14B   │
                   │      │                       （不對外暴露） │
                   │      │                                     │
                   │      └─── subprocess ──────► Selenium      │
                   │                              safaridriver   │
                   │                              （只爬 Gemini）│
                   └────────────────────────────────────────────┘
```

---

## 連動關係

| 路徑 | 說明 |
|------|------|
| 瀏覽器 → Vercel → Neon | 所有前後台頁面讀寫 |
| Vercel API → Neon jobs | 後台操作寫入 job，非同步觸發 pipeline |
| Vercel API → Vercel Blob | 音檔上傳 |
| poll.py → Neon jobs | 每 30 秒輪詢取任務、處理完寫回結果 |
| poll.py → Vercel Blob | 下載音檔進行 Whisper 轉文字 |
| poll.py → Ollama | 本機 AI 推論（潤飾、分類、翻譯） |

---

## 獨立部分

| 元件 | 為什麼獨立 |
|------|-----------|
| **Ollama** | 只在 Mac mini 本機執行，Vercel 完全不知道它的存在，唯一介面是 poll.py |
| **Selenium** | 只在 gemini job 時被 poll.py 啟動，其他時間不運作 |
| **Google OAuth** | 只在後台登入瞬間介入，之後 session 由 next-auth 自己管理 |
| **poll.py vs Vercel** | 兩者從不直接通訊，唯一橋樑是 Neon DB（Ollama 隔離原則） |

---

## 核心設計原則

**Ollama 隔離原則**：Vercel 上的 API route 不得直接呼叫 Ollama。
所有需要 AI 處理的動作一律透過寫入 `jobs` 資料表，
由 Mac mini 上的 poll.py 取出後在本機處理。

這確保：
- Ollama 永遠不需要對外暴露
- Vercel function 不會因為 AI 推論時間過長而 timeout
- pipeline 與前台可以獨立部署、獨立重啟
