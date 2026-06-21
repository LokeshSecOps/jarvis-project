"""
J.A.R.V.I.S. - A simple AI chat assistant
Final Year Project

Backend: Flask
AI Brain: Groq API (free, fast, Llama 3.3 70B)
"""

import os
from flask import Flask, request, jsonify, render_template
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# Get your free API key from https://console.groq.com/keys
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")

if not GROQ_API_KEY:
    print("WARNING: GROQ_API_KEY not set. Add it to a .env file.")

client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

# System prompt gives JARVIS its personality
SYSTEM_PROMPT = """You are J.A.R.V.I.S. (Just A Rather Very Intelligent System),
a helpful, witty, and highly capable AI assistant. You speak with calm confidence,
a touch of dry humor, and address the user respectfully. Keep answers clear and
not overly long unless the user asks for detail."""

# In-memory conversation history (resets when server restarts)
# For a real project, you could swap this for a database
conversation_history = []

MAX_HISTORY = 20  # keep last N messages so the prompt doesn't grow forever


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/chat", methods=["POST"])
def chat():
    if not client:
        return jsonify({"error": "Server missing GROQ_API_KEY. Set it in .env"}), 500

    data = request.get_json()
    user_message = (data or {}).get("message", "").strip()

    if not user_message:
        return jsonify({"error": "Empty message"}), 400

    conversation_history.append({"role": "user", "content": user_message})

    # Trim history to keep things fast and within token limits
    trimmed_history = conversation_history[-MAX_HISTORY:]

    messages = [{"role": "system", "content": SYSTEM_PROMPT}] + trimmed_history

    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.7,
            max_tokens=1024,
        )
        reply = completion.choices[0].message.content
        conversation_history.append({"role": "assistant", "content": reply})
        return jsonify({"reply": reply})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/reset", methods=["POST"])
def reset():
    conversation_history.clear()
    return jsonify({"status": "cleared"})


if __name__ == "__main__":
    # debug=True is fine for local dev; turn off in production
    app.run(debug=True, host="0.0.0.0", port=5000)
