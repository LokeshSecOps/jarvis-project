const chatWindow = document.getElementById("chatWindow");
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const resetBtn = document.getElementById("resetBtn");

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
    });

    const data = await res.json();
    thinkingEl.remove();

    if (data.error) {
      addMessage(`Error: ${data.error}`, "assistant");
    } else {
      addMessage(data.reply, "assistant");
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
  await fetch("/api/reset", { method: "POST" });
  chatWindow.innerHTML = "";
  addMessage("Memory cleared. Online and ready.", "assistant");
});
