const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('\n--- SCAN THIS QR CODE WITH YOUR WHATSAPP ---\n');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connection closed. Reconnecting...', shouldReconnect);
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('✅ WhatsApp Bot is Successfully Connected!');
        }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        for (const msg of messages) {
            if (!msg.message || msg.key.fromMe) continue;

            const from = msg.key.remoteJid;
            const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || '').trim();

            // 1: Namaz Timings
            if (text === '1') {
                const msg1 = `🕌 *اوقات - مسجد اللہ اکبر*

فجر: 4:45 AM
ظہر: 1:15 PM
عصر: 5:30 PM
مغرب: 6:45 PM
عشاء: 8:00 PM

جمعہ: 1:30 PM

اللہ قبول فرمائے آمین 🤲`;
                await sock.sendMessage(from, { text: msg1 });

            // 2: Juma Ka Bayan
            } else if (text === '2') {
                const msg2 = `*جمعہ کا بیان*

ہر جمعہ بعد نماز بیان ہوتا ہے۔
موضوع: [انسانیت سے محبت]

بیان سننے کے لیے مسجد تشریف لائیں
جزاک اللہ`;
                await sock.sendMessage(from, { text: msg2 });

            // 3: Chanda / Atiyat
            } else if (text === '3') {
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
                await sock.sendMessage(from, { text: msg3 });

            // 4: Contact Info
            } else if (text === '4') {
                const msg4 = `📞 *رابطہ معلومات - مسجد اللہ اکبر*

کسی بھی معلومات یا رہنمائی کے لیے رابطہ کریں:

📱 *رابطہ نمبر:* 0321-7050502 (Imtiaz Akbar)

جزاک اللہ خیر 🤲`;
                await sock.sendMessage(from, { text: msg4 });

            // Default / Menu
            } else {
                const menuText = `🕌 *مسجد اللہ اکبر میں خوش آمدید*

براہِ مہربانی نیچے دیے گئے نمبر میں سے کوئی ایک بھیجیں:

1️⃣ نماز کا ٹائم
2️⃣ جمعہ کا بیان
3️⃣ چندہ / عطیات
4️⃣ امام صاحب کا نمبر / رابطہ
5️⃣ لوکیشن

اللہ آپ کو جزائے خیر دے`;
                await sock.sendMessage(from, { text: menuText });
            }
        }
    });
}

connectToWhatsApp();
