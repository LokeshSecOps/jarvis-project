import os
import uuid
from flask import Flask, request, jsonify, render_template, session
from groq import Groq
from dotenv import load_dotenv

load_dotenv()   
   
app = Flask(__name__)
 
# Secret key used to sign the session cookie. In production, set this via
# an environment variable so it isn't regenerated (and all sessions lost)
# every time the server restarts.
app.secret_key = os.environ.get("FLASK_SECRET_KEY", os.urandom(24).hex())

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

# Per-session conversation history (resets when server restarts).
# Keyed by a random session ID stored in each browser's secure cookie, so
# every visitor gets their own independent conversation rather than sharing
# one global history.
conversation_histories = {}

MAX_HISTORY = 20  # keep last N messages per session so the prompt doesn't grow forever


def get_session_id():
    """Return the current visitor's session ID, creating one if needed."""
    if "session_id" not in session:
        session["session_id"] = str(uuid.uuid4())
    return session["session_id"]


def get_history(session_id):
    """Return (creating if needed) the conversation history list for a session."""
    if session_id not in conversation_histories:
        conversation_histories[session_id] = []
    return conversation_histories[session_id]


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

    session_id = get_session_id()
    history = get_history(session_id)

    history.append({"role": "user", "content": user_message})

    # Trim history to keep things fast and within token limits
    trimmed_history = history[-MAX_HISTORY:]

    messages = [{"role": "system", "content": SYSTEM_PROMPT}] + trimmed_history

    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.7,
            max_tokens=1024,
        )
        reply = completion.choices[0].message.content
        history.append({"role": "assistant", "content": reply})
        return jsonify({"reply": reply})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/reset", methods=["POST"])
def reset():
    session_id = get_session_id()
    conversation_histories[session_id] = []
    return jsonify({"status": "cleared"})


if __name__ == "__main__":
    # debug=True is fine for local dev; turn off in production
    app.run(debug=True, host="0.0.0.0", port=5000)

