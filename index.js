const { Client, LocalAuth } = require("whatsapp-web.js");
const express = require("express");
const qrcode = require("qrcode-terminal");

const app = express();
app.use(express.json());

const client = new Client({
  authStrategy: new LocalAuth(), // Salva sessão entre restarts
  puppeteer: {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
});

client.on("qr", (qr) => {
  console.log("ESCANEIE O QR CODE ABAIXO PARA CONECTAR NO WHATSAPP:");
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("✅ WhatsApp conectado e pronto!");
});

client.on("auth_failure", (msg) => {
  console.error("❌ Falha na autenticação:", msg);
});

client.initialize();

app.post("/send", async (req, res) => {
  const { number, message } = req.body;

  if (!number || !message)
    return res.status(400).send("Número e mensagem obrigatórios");

  const chatId = number.includes("@c.us") ? number : `${number}@c.us`;

  try {
    const isRegistered = await client.isRegisteredUser(chatId);
    console.log(`Número ${chatId} registrado no WhatsApp?`, isRegistered);

    const sendResult = await client.sendMessage(chatId, message);
    console.log("Mensagem enviada, resultado:", sendResult);
    res.send("✅ Mensagem enviada com sucesso!");
  } catch (err) {
    console.error("Erro ao enviar mensagem:", err);
    res.status(500).send("Erro ao enviar mensagem");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
