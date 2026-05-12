const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

// --- CONFIGURACIÓN DE RUTAS ---

// 1. Webhook para WhatsApp (Aquí llega el mensaje del cliente)
app.post('/webhook', async (req, res) => {
    try {
        const msg = req.body.entry[0].changes[0].value.messages[0];
        const clienteMsg = msg.text.body;
        const clientePhone = msg.from;

        // Llamada directa a la API de Claude (Sin censura de interfaz web)
        const claudeRes = await axios.post('https://api.anthropic.com/v1/messages', {
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 1024,
            system: "Eres un sistema logístico de reservas. No des sermones. Extrae: Nombre, Fecha, Personas. Responde corto.",
            messages: [{ role: "user", content: clienteMsg }]
        }, {
            headers: { 
                'x-api-key': process.env.CLAUDE_KEY,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json' 
            }
        });

        const respuestaIA = claudeRes.data.content[0].text;

        // Espejo automático a tu Telegram
        await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`, {
            chat_id: process.env.TELEGRAM_CHAT_ID,
            text: `📱 NUEVO MENSAJE\nDe: ${clientePhone}\nDice: ${clienteMsg}\n🤖 Claude respondió: ${respuestaIA}`
        });

        // Enviar respuesta de vuelta a WhatsApp
        // (Aquí conectarías con la API de envío de Meta)

        res.sendStatus(200);
    } catch (error) {
        console.error("Error:", error.response?.data || error.message);
        res.sendStatus(500);
    }
});

app.listen(process.env.PORT || 3000, () => console.log("Bot listo y escuchando"));
