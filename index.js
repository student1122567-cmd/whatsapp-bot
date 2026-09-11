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
                await sendInteractiveButtons(from);
            } else if (message.type === 'interactive') {
                const buttonId = message.interactive.button_reply.id;
                await handleButtonClick(from, buttonId);
            }
        }
        res.sendStatus(200);
    } else {
        res.sendStatus(404);
    }
});

async function sendInteractiveButtons(to) {
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
                recipient_type: 'individual',
                to: to,
                type: 'interactive',
                interactive: {
                    type: 'button',
                    body: { text: 'Please select:' },
                    action: {
                        buttons: [
                            { type: 'reply', reply: { id: 'btn_balance', title: 'Balance Inquiry' } },
                            { type: 'reply', reply: { id: 'btn_statement', title: 'Account Statement' } },
                            { type: 'reply', reply: { id: 'btn_main_menu', title: 'Main Menu' } }
                        ]
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error sending buttons:', error.response ? error.response.data : error.message);
    }
}

async function handleButtonClick(to, buttonId) {
    let responseText = '';
    if (buttonId === 'btn_balance') {
        responseText = 'Aap ka mojooda balance: PKR 25,000/--';
    } else if (buttonId === 'btn_statement') {
        responseText = 'Aap ka account statement aap ke email par bhej diya gaya hai.';
    } else if (buttonId === 'btn_main_menu') {
        responseText = 'Aap Main Menu par aagaye hain.';
    }

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
                text: { body: responseText }
            }
        });
    } catch (error) {
        console.error('Error sending reply:', error.response ? error.response.data : error.message);
    }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));