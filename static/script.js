document.addEventListener("DOMContentLoaded", () => {
  const chatForm = document.getElementById("chat-form");
  const userInput = document.getElementById("user-input");
  const chatBox = document.getElementById("chat-box");
  const sendButton = document.getElementById("send-button");

  // Variabel untuk menyimpan riwayat percakapan
  let conversationHistory = [];

  /**
   * Menambahkan pesan ke dalam chat box.
   * @param {string} message - Teks pesan.
   * @param {'user' | 'bot'} sender - Pengirim pesan.
   * @returns {HTMLDivElement} Elemen pesan yang baru dibuat.
   */
  const appendMessage = (message, sender) => {
    const messageElement = document.createElement("div");
    messageElement.classList.add("message", `${sender}-message`);
    messageElement.textContent = message;
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll ke bawah
    return messageElement;
  };

  chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const userMessage = userInput.value.trim();
    if (!userMessage) {
      return;
    }

    // 1. Tambahkan pesan pengguna ke chat box
    appendMessage(userMessage, "user");
    userInput.value = ""; // Kosongkan input
    sendButton.disabled = true; // Nonaktifkan tombol saat menunggu

    // Tambahkan pesan pengguna ke riwayat
    conversationHistory.push({ role: "user", text: userMessage });

    // 2. Tampilkan pesan "Thinking..." dari bot
    const thinkingMessageElement = appendMessage("Thinking...", "bot");
    thinkingMessageElement.classList.add("thinking");

    try {
      // 3. Kirim pesan pengguna ke backend
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: conversationHistory }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response from server.");
      }

      const data = await response.json();

      // 4. Ganti pesan "Thinking..." dengan respons AI
      if (data && data.result) {
        const botMessage = data.result;
        thinkingMessageElement.textContent = botMessage;
        // Tambahkan respons bot ke riwayat
        conversationHistory.push({ role: "model", text: botMessage });
      } else {
        thinkingMessageElement.textContent = "Sorry, no response received.";
      }
    } catch (error) {
      console.error("Error:", error);
      // 5. Tampilkan pesan error jika gagal
      thinkingMessageElement.textContent =
        "Failed to get response from server.";
    } finally {
      // Hapus kelas 'thinking' setelah selesai
      thinkingMessageElement.classList.remove("thinking");
      sendButton.disabled = false; // Aktifkan kembali tombol
    }
  });
});
