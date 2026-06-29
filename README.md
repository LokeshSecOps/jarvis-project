# J.A.R.V.I.S. — Setup & Deployment Guide

A simple, free AI chat assistant. Backend in Flask, brain powered by Groq's free API (Llama 3.3 70B).

--- 

## 1. Get your free Groq API key (2 min)  
 
1. Go to https://console.groq.com/keys
2. Sign up (free, no credit card) 
3. Click "Create API Key", copy it

## 2. Run it locally (5 min)

```bash
cd jarvis-project
pip install -r requirements.txt

# Create your .env file
cp .env.example .env
# Open .env and paste your real key in place of "your_groq_api_key_here"

python app.py
```

Open **http://127.0.0.1:5000** in your browser. Start chatting.

---

## 3. Deploy for free (so you can demo it live / submit a link)

### Option A: Render.com (recommended, easiest)

1. Push this project to a GitHub repo
2. Go to https://render.com → New → Web Service → connect your repo
3. Settings:
   - **Build command**: `pip install -r requirements.txt`
   - **Start command**: `gunicorn app:app`
4. Add environment variable: `GROQ_API_KEY` = your key (Render dashboard → Environment)
5. Deploy. You'll get a free URL like `https://jarvis-yourname.onrender.com`

> Note: add `gunicorn` to requirements.txt before deploying (see below) — Flask's built-in server isn't meant for production.

### Option B: Railway.app
Same idea — connect GitHub repo, set `GROQ_API_KEY` env var, deploy. Free tier available.

### Option C: PythonAnywhere
Good if Render/Railway free tiers are full. Slightly more manual WSGI config.

---

## 4. Before deploying: add gunicorn

```bash
echo "gunicorn==22.0.0" >> requirements.txt
```

---

## 5. Project structure

```
jarvis-project/
├── app.py                 # Flask backend, talks to Groq
├── requirements.txt
├── .env.example            # copy to .env and add your key
├── templates/
│   └── index.html          # chat page
└── static/
    ├── style.css            # JARVIS-style dark/blue theme
    └── script.js            # handles sending/receiving messages
```

---

## 6. For your project report / viva

Things worth mentioning if your evaluator asks "how does it work":

- **Architecture**: Client (browser) → Flask backend → Groq LLM API → response streamed back
- **Why Groq**: free tier, very low latency (good for live demo), runs open-weight models like Llama 3.3
- **System prompt**: defines the JARVIS persona (see `SYSTEM_PROMPT` in app.py) — this is "prompt engineering," a key technique in working with LLMs
- **Conversation memory**: stored server-side in memory (resets on restart) — could be extended to a database (SQLite) for persistence across sessions, a good "future work" point
- **Limitations to mention honestly**: no real OS-level control (unlike movie JARVIS), free tier has rate limits, memory isn't persistent

---

## 7. Easy upgrades if you have extra time

- **Persistent memory**: swap the in-memory list for SQLite (few lines of change)
- **Streaming responses**: Groq supports streaming tokens — makes replies feel faster/typed live
- **Voice**: add Web Speech API (browser-native, free) for voice input/output
- **Multiple "skills"**: e.g. weather, calculator — have the model call functions (Groq supports tool/function calling)
