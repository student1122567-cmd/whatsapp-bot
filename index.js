const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

// Webhook Verification
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token === VERIFY_TOKEN) {
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

// Incoming Message Handling
app.post('/webhook', async (req, res) => {
    const body = req.body;

    if (body.object) {
        if (
            body.entry &&
            body.entry[0].changes &&
            body.entry[0].changes[0].value.messages &&
            body.entry[0].changes[0].value.messages[0]
        ) {
            const message = body.entry[0].changes[0].value.messages[0];
            const from = message.from;

            if (message.type === 'text') {
                const userText = message.text.body.trim();

                // 1: Namaz Timings (Image 16)
                if (userText === '1') {
                    const msg1 = `🕌 *اوقات - مسجد اللہ اکبر*

فجر: 4:45 AM
ظہر: 1:15 PM
عصر: 5:30 PM
مغرب: 6:45 PM
عشاء: 8:00 PM

جمعہ: 1:30 PM

اللہ قبول فرمائے آمین 🤲`;
                    await sendTextMessage(from, msg1);

                // 2: Juma Ka Bayan (Image 17)
                } else if (userText === '2') {
                    const msg2 = `*جمعہ کا بیان*

ہر جمعہ بعد نماز بیان ہوتا ہے۔
موضوع: [انسانیت سے محبت]

بیان سننے کے لیے مسجد تشریف لائیں
جزاک اللہ`;
                    await sendTextMessage(from, msg2);

                // 3: Chanda / Atiyat (Image 18)
                } else if (userText === '3') {
                    const msg3 = `*مسجد اللہ اکبر - چندہ / عطیات*

اللہ آپ کے تعاون کو قبول فرمائے آمین 🤲

آپ ان طریقوں سے چندہ دے سکتے ہیں:

1. مسجد میں آ کر خود دیں

اللہ آپ کو اس کا بہترین اجر دے
Imtiaz akbar
Meezan bank
2801-0100828427
Jazz cash
0321-7050502`;
                    await sendTextMessage(from, msg3);

                // Default / Baqi Menu
                } else {
                    await sendMainMenu(from);
                }
            }
        }
        res.sendStatus(200);
    } else {
        res.sendStatus(404);
    }
});

// Urdu Main Menu
async function sendMainMenu(to) {
    const menuText = `🕌 *مسجد اللہ اکبر میں خوش آمدید*

براہِ مہربانی نیچے دیے گئے نمبر میں سے کوئی ایک بھیجیں:

1️⃣ نماز کا ٹائم
2️⃣ جمعہ کا بیان
3️⃣ چندہ / عطیات
4️⃣ امام صاحب کا نمبر
5️⃣ لوکیشن

اللہ آپ کو جزائے خیر دے`;

    await sendTextMessage(to, menuText);
}

// Helper Function
async function sendTextMessage(to, text) {
    try {
        await axios({
            method: 'POST',
            url: `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`,
            headers: {
                'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
                'Content-Type': 'application/json',
            },
            data: {
                messaging_product: 'whatsapp',
                to: to,
                text: { body: text }
            }
        });
    } catch (error) {
        console.error('Error sending message:', error.response ? error.response.data : error.message);
    }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
