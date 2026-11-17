
const express = require("express");
const path = require("path");

const app = express();

app.use(express.json({ limit: "30kb" }));
app.use(express.static(path.join(__dirname, "public")));

app.post("/api/generate", async (req, res) => {
  const { prompt, tool, tone, length } = req.body || {};

  if (typeof prompt !== "string" || !prompt.trim()) {
    return res.status(400).json({ error: "Введите запрос." });
  }

  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({
      error: "Не найден GROQ_API_KEY в настройках сервера."
    });
  }

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages: [
            {
              role: "system",
              content: "Ты умный русскоязычный помощник NEUROVA AI. Отвечай понятно, грамотно и полезно. Соблюдай безопасный и уважительный тон."
            },
            {
              role: "user",
              content: `${tool || "Общий вопрос"}\nСтиль: ${tone || "Обычный"}\nОбъём: ${length || "Средний"}\nЗапрос: ${prompt.trim()}`
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq error:", data);
      return res.status(response.status).json({
        error: data.error?.message || "Ошибка при обращении к Groq."
      });
    }

    res.json({
      text: data.choices?.[0]?.message?.content || "Нет ответа от модели."
    });

  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({
      error: "Не удалось связаться с облачным AI. Попробуйте позже."
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`NEUROVA AI запущен на порту ${PORT}`);
});
