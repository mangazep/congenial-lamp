import express from "express";
import multer from "multer";
import { GoogleGenAI } from "@google/genai";
import "dotenv/config";
import cors from "cors";
import fs from "fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const upload = multer(); //recording

const ai = new GoogleGenAI({ apikey: process.env.GEMINI_API_KEY });
const GEMINI_MODEL = "gemini-2.5-flash";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "static")));

app.post("/generate-text", async (req, res) => {
  const { prompt } = req.body; // object destructuring
  // debugging
  console.log({ prompt });

  // guard clause
  if (!prompt || typeof prompt !== "string") {
    res.status(400).json({
      success: false,
      message: "Prompt harus berupa string!",
      data: null,
    });
    return;
  }

  try {
    const aiResponse = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ text: prompt }],
      //config AI
      config: {
        systemInstruction: "Harus dibalas dalam bahasa Jawa secara acak.",
      },
    });

    res.status(200).json({
      success: true,
      message: "Berhasil dijawab Gemini!",
      data: aiResponse.text,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Gagal, server lagi bermasalah!",
      data: null,
    });
  }
});

app.post("/generate-from-image", upload.single("image"), async (req, res) => {
  const { prompt } = req.body;
  const base64Image = req.file.buffer.toString("base64");

  try {
    const aiResponse = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        { text: prompt, type: "text" },
        { inlineData: { data: base64Image, mimeType: req.file.mimetype } },
      ],
    });
    res.status(200).json({
      success: true,
      message: "Berhasil dijawab Gemini!",
      data: aiResponse.text,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Gagal, server lagi bermasalah!",
      data: null,
    });
  }
});

app.post(
  "/generate-from-document",
  upload.single("document"),
  async (req, res) => {
    const { prompt } = req.body;
    const base64Document = req.file.buffer.toString("base64");

    try {
      const aiResponse = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: [
          {
            text: prompt ?? "Buatkan ringkasan dari dokumen berikut",
            type: "text",
          },
          { inlineData: { data: base64Document, mimeType: req.file.mimetype } },
        ],
      });
      res.status(200).json({
        success: true,
        message: "Berhasil dijawab Gemini!",
        data: aiResponse.text,
      });
    } catch (e) {
      console.log(e);
      res.status(500).json({
        success: false,
        message: "Gagal, server lagi bermasalah!",
        data: null,
      });
    }
  }
);

app.post("/generate-from-audio", upload.single("audio"), async (req, res) => {
  const { prompt } = req.body;
  const base64Audio = req.file.buffer.toString("base64");

  try {
    const aiResponse = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          text: prompt ?? "Buatkan transkrip dari rekaman berikut",
          type: "text",
        },
        { inlineData: { data: base64Audio, mimeType: req.file.mimetype } },
      ],
    });
    res.status(200).json({
      success: true,
      message: "Berhasil dijawab Gemini!",
      data: aiResponse.text,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Gagal, server lagi bermasalah!",
      data: null,
    });
  }
});

app.post("/api/chat", async (req, res) => {
  const { messages } = req.body;

  try {
    if (!Array.isArray(messages)) throw new Error("Messages must be an array");

    let messageIsValid = true;

    if (messages.length === 0) {
      throw new Error("Conversation is empty!");
    }

    messages.forEach((message) => {
      if (!message || typeof message !== "object") {
        messageIsValid = false;
        return;
      }

      const keys = Object.keys(message);
      const objectHasValidKeys = keys.includes("role") && keys.includes("text");

      if (keys.length !== 2 || !objectHasValidKeys) {
        messageIsValid = false;
        return;
      }

      const { text, role } = message;

      if (!["model", "user"].includes(role)) {
        messageIsValid = false;
        return;
      }

      if (!text || typeof text !== "string") {
        messageIsValid = false;
        return;
      }
    });

    if (!messageIsValid) {
      throw new Error("Message harus valid!");
    }

    const contents = messages.map(({ role, text }) => ({
      role,
      parts: [{ text }],
    }));

    const aiResponse = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: {
        systemInstruction: "Harus membalas dengan bahasa Indonesia.",
      },
    });

    res.status(200).json({
      success: true,
      message: "Berhasil dijawab Gemini!",
      result: aiResponse.text,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: e.message,
      result: null,
    });
  }
});

// run serve
app.listen(
  3000, // port yang akan diakses
  () => {
    console.log("Server Ready Port 3000");
  }
);
