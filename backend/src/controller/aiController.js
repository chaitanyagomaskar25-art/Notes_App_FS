export const aiAssist = async (req, res) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        message:
          "AI features are optional and not configured. Set OPENAI_API_KEY to enable.",
      });
    }

    const { action, text, title } = req.body || {};
    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Text is required" });
    }

    const prompts = {
      summarize:
        "Summarize the following note concisely in a few bullet points.",
      grammar: "Fix grammar, spelling and punctuation. Keep the meaning.",
      rewrite: "Rewrite the following text to be clearer and more engaging.",
      title: "Generate a short, descriptive title for the following note.",
      explain:
        "Explain the following code snippet in simple terms, step by step.",
    };

    const systemPrompt =
      prompts[action] || "Help improve the following text.";

    const userContent =
      action === "title"
        ? `Title context: ${title || ""}\n\nContent:\n${text}`
        : text;

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContent },
          ],
          temperature: 0.4,
          max_tokens: 600,
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      return res.status(502).json({ message: "AI request failed", detail: err });
    }

    const data = await response.json();
    const result = data?.choices?.[0]?.message?.content?.trim() || "";
    return res.status(200).json({ result });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};