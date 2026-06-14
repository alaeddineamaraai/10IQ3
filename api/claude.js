export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { system, messages } = req.body;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system,
        messages,
      }),
    });

    const data = await response.json();
    const text = data.content?.[0]?.text || "";
    res.status(200).json({ text });
  } catch (err) {
    console.error("Claude API error:", err);
    res.status(500).json({ error: "Claude API failed", text: "" });
  }
}
