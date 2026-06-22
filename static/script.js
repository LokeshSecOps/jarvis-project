const chatWindow = document.getElementById("chatWindow");
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const resetBtn = document.getElementById("resetBtn");
const micBtn = document.getElementById("micBtn");
const voiceToggleBtn = document.getElementById("voiceToggleBtn");

// ---- Voice output (text-to-speech) ----
// Off by default; user opts in via the speaker button in the header.
let voiceEnabled = false;

function speak(text) {
  if (!voiceEnabled || !("speechSynthesis" in window)) return;
  // Cancel any reply still being read aloud before starting the next one
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  window.speechSynthesis.speak(utterance);
}

voiceToggleBtn.addEventListener("click", () => {
  voiceEnabled = !voiceEnabled;
  voiceToggleBtn.setAttribute("aria-pressed", String(voiceEnabled));
  voiceToggleBtn.title = voiceEnabled ? "Spoken replies on" : "Spoken replies off";
  if (!voiceEnabled) window.speechSynthesis.cancel();
});

// ---- Voice input (speech-to-text) ----
// Uses the browser's built-in Web Speech API. Supported well in Chrome/Edge;
// not supported in some browsers (e.g. Firefox), so the mic button is hidden
// automatically if the API isn't available.
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognizer = null;
let isListening = false;

if (SpeechRecognition) {
  recognizer = new SpeechRecognition();
  recognizer.lang = "en-US";
  recognizer.interimResults = false;
  recognizer.maxAlternatives = 1;

  recognizer.onstart = () => {
    isListening = true;
    micBtn.setAttribute("aria-pressed", "true");
    micBtn.title = "Listening... click to stop";
  };

  recognizer.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    userInput.value = transcript;
  };

  recognizer.onerror = () => {
    addMessage("Could not hear that clearly. Please try again or type your message.", "assistant");
  };

  recognizer.onend = () => {
    isListening = false;
    micBtn.setAttribute("aria-pressed", "false");
    micBtn.title = "Speak your message";
  };

  micBtn.addEventListener("click", () => {
    if (isListening) {
      recognizer.stop();
    } else {
      userInput.value = "";
      recognizer.start();
    }
  });
} else {
  // Browser doesn't support speech recognition; hide the mic button
  // rather than showing a control that can never work.
  micBtn.style.display = "none";
}

// ---- Chat rendering ----
function addMessage(text, sender) {
  const msgDiv = document.createElement("div");
  msgDiv.className = `message ${sender}`;

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;

  msgDiv.appendChild(bubble);
  chatWindow.appendChild(msgDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return bubble;
}

function addThinkingBubble() {
  const msgDiv = document.createElement("div");
  msgDiv.className = "message assistant";

  const bubble = document.createElement("div");
  bubble.className = "bubble thinking";
  bubble.textContent = "Processing...";

  msgDiv.appendChild(bubble);
  chatWindow.appendChild(msgDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return msgDiv;
}

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = userInput.value.trim();
  if (!text) return;

  addMessage(text, "user");
  userInput.value = "";
  userInput.disabled = true;

  const thinkingEl = addThinkingBubble();

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
      credentials: "same-origin", // ensures the session cookie is sent
    });

    const data = await res.json();
    thinkingEl.remove();

    if (data.error) {
      addMessage(`Error: ${data.error}`, "assistant");
    } else {
      addMessage(data.reply, "assistant");
      speak(data.reply);
    }
  } catch (err) {
    thinkingEl.remove();
    addMessage("Connection error. Is the server running?", "assistant");
  } finally {
    userInput.disabled = false;
    userInput.focus();
  }
});

resetBtn.addEventListener("click", async () => {
  window.speechSynthesis.cancel();
  await fetch("/api/reset", { method: "POST", credentials: "same-origin" });
  chatWindow.innerHTML = "";
  addMessage("Memory cleared. Online and ready.", "assistant");
});