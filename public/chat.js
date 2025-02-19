/**
 * chat.js
 * Client-side chat logic for Snugchat.
 * 
 * NOTES:
 * - Uses a modal for entering display name.
 * - Establishes a WebSocket connection.
 * - Handles sending/receiving encrypted messages.
 * - Sends periodic "PING" messages to measure latency.
 * - Updates connection status and user count.
 * - Implements chat deletion.
 */

let username = ""; // Set via the username modal
let ws;
let lastPingTime = 0;
let ping = 0;

// Display a message in the chat window
function displayMessage(user, text, timestamp) {
  const messagesDiv = document.getElementById("messages");
  const messageContainer = document.createElement("div");
  messageContainer.classList.add("message");
  messageContainer.classList.add(user === username ? "self" : "user");

  const time = new Date(timestamp).toLocaleTimeString();
  messageContainer.innerHTML = `<strong>${user}</strong> <span class="timestamp">[${time}]</span><p>${text}</p>`;
  messagesDiv.appendChild(messageContainer);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Decrypt incoming messages using CryptoJS
function decryptMessage(encryptedText, password) {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedText, password);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (e) {
    return "Decryption error";
  }
}

function connect() {
  ws = new WebSocket(`ws://${window.location.host}/ws?chatId=${chatId}&password=${encodeURIComponent(chatPassword)}&username=${encodeURIComponent(username)}`);

  ws.onopen = () => {
    console.log("Connected to chat server...");
    updateConnectionIndicator(true);
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === "error") {
      showError(data.message);
      window.location.href = "/";
      return;
    }
    if (data.type === "history") {
      data.data.forEach(msg => {
        const decrypted = decryptMessage(msg.text, chatPassword);
        displayMessage(msg.user, decrypted, msg.timestamp);
      });
    } else if (data.type === "message") {
      const decrypted = decryptMessage(data.data.text, chatPassword);
      displayMessage(data.data.user, decrypted, data.data.timestamp);
    } else if (data.type === "control" && data.subtype === "pong") {
      // Calculate ping (in ms)
      ping = new Date().getTime() - lastPingTime;
      updateConnectionIndicator(true, ping);
    } else if (data.type === "status") {
      updateUserCount(data.userCount);
    }
  };

  ws.onclose = () => {
    console.log("Disconnected from chat server");
    updateConnectionIndicator(false);
  };

  // Send ping every 5 seconds
  setInterval(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      lastPingTime = new Date().getTime();
      ws.send("PING");
    }
  }, 5000);
}

function sendMessage() {
  const input = document.getElementById("message");
  if (ws && input.value.trim()) {
    ws.send(input.value.trim());
    input.value = "";
  }
}

// Update connection indicator (green if connected, red if not)
// Hover text shows the latest ping in ms.
function updateConnectionIndicator(isConnected, currentPing = ping) {
  const indicator = document.getElementById("connection-indicator");
  if (isConnected) {
    indicator.style.backgroundColor = "#4caf50"; // green
    indicator.title = `Ping: ${currentPing} ms`;
  } else {
    indicator.style.backgroundColor = "#f44336"; // red
    indicator.title = "Disconnected";
  }
}

// Update connected user count display
function updateUserCount(count) {
  const countElem = document.getElementById("user-count");
  countElem.innerText = `${count} connected`;
}

// Show a modern error popup (could be extended)
function showError(message) {
  alert(`Error: ${message}`);
}

// Delete chat API call
function deleteChat() {
  if (!confirm("Are you sure you want to delete this chat? This action cannot be undone.")) {
    return;
  }
  fetch(`/api/chats/${chatId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: chatPassword })
  })
  .then(response => response.json())
  .then(data => {
    if (data.error) {
      showError(data.error);
    } else {
      alert("Chat deleted successfully.");
      window.location.href = "/";
    }
  })
  .catch(err => {
    console.error(err);
    showError("Failed to delete chat.");
  });
}

// Event listeners for sending messages
document.getElementById("send-button").addEventListener("click", sendMessage);
document.getElementById("message").addEventListener("keydown", function (event) {
  if (event.key === "Enter") sendMessage();
});

// Handle username modal submission
document.getElementById("username-submit").addEventListener("click", function(){
  const input = document.getElementById("username-input");
  username = input.value.trim();
  if (!username) {
    alert("Please enter a valid name.");
    return;
  }
  document.getElementById("username-modal").style.display = "none";
  connect();
});

// Handle delete chat button
document.getElementById("delete-chat").addEventListener("click", deleteChat);
