export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { to, subject, text } = req.body;

  if (!to || !subject || !text) {
    return res.status(400).json({ error: "Missing required fields: to, subject, text" });
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "10IQ Recruiting <recruiting@mail.netset.pro>",
        to,
        subject,
        text,
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(JSON.stringify(data));
    res.status(200).json({ success: true, id: data.id });
  } catch (err) {
    console.error("Resend error:", err);
    res.status(500).json({ error: "Email send failed" });
  }
}
