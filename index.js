const { Client, LocalAuth } = require("whatsapp-web.js");
const express = require("express");
const qrcode = require("qrcode-terminal");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());

const SECRET = "a9a6963b-eb59-4a14-9506-bbe0edbbee19";

// Middleware para validar JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) return res.status(401).json({ error: "Token não fornecido" });

  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Token inválido" });
    req.user = user;
    next();
  });
}

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

// Rota protegida para enviar mensagem - precisa JWT válido
app.post("/send", authenticateToken, async (req, res) => {
  const { number, message } = req.body;

  if (!number || !message)
    return res.status(400).send("Número e mensagem obrigatórios");

  const chatId = number.includes("@c.us") ? number : `${number}@c.us`;

  try {
    const isRegistered = await client.isRegisteredUser(chatId);
    console.log(`Número ${chatId} registrado no WhatsApp?`, isRegistered);

    if (!isRegistered) {
      return res.status(400).send("Número não registrado no WhatsApp");
    }

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
