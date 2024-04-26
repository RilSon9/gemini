const axios = require('axios');
const fs = require('fs');

const maxStorageMessage = 24;

module.exports = {
    config: {
        name: 'ai',
        aliases: ['ryder'],
        version: '1.1',
        author: 'Riley', // do not change
        role: 0,
        category: 'ai',
        shortDescription: {
            en: 'Asks an AI for an answer.',
        },
        longDescription: {
            en: 'Ask me anything!',
        },
        guide: {
            en: '{pn} [prompt] or {n} [prompt]\n{pn} hello\n{pn} write a backstory about you\n{pn} how to make cake',
        },
    },
    onStart: async function ({ api, args, message, event, usersData }) {

    },
    onChat: async function ({ api, event, message, usersData }) {
        if (!event.isGroup) return;
        if (event.participantIDs.length < 30) {
            api.sendMessage({
                body: 'Sorry, but this group requires at least 30 participants. I am leaving now.',
                mentions: [
                    {
                        tag: 'I',
                        id: api.getCurrentUserID(),
                    },
                ],
            }, event.threadID);
            api.removeUserFromGroup(api.getCurrentUserID(), event.threadID);
            return;
        }
        const userID = event.senderID;
        const data = await usersData.get(userID);
        const status = data.banned.status;
        const name = await usersData.getName(userID) || "orang asing";
        const input = event.body;
        const isAiCommand = ['apolo'].some(keyword => input && input.trim().toLowerCase().startsWith(keyword));
        if (isAiCommand || event.type === "message_reply" && event.messageReply.senderID === api.getCurrentUserID()) {

            const history = loadHistory();
            let userHistory = history[userID] || [{ role: "user", parts: [{ text: "ini adalah backstory dari kamu:\n\nApollo givera adalah seorang anak laki-laki yang lahir 30-oktober-2007 dia berusia 16 tahun dari keluarga yang terdiri dari ayahnya Joe givera adalah pengusaha sukses dan ibunya aurora givera adalah seorang ibu rumah tangga biasa, dia memiliki kakak perempuan berusia 19 tahun bernama Eva givera. Apollo juga memiliki sahabat laki-laki berusia 16 tahun bernama Riley Nelson, dia adalah sahabat terbaik yang dimiliki Apollo dan mereka berdua adalah sahabat yang sangat dekat dan akrab suka maupun duka. \njika kamu paham silahkan ketik ok" }] },{ role: "model", parts: [{ text: "ok" }] },{ role: "user", parts: [{ text: "mulai sekarang kamu harus memerankan tokoh seorang remaja laki-laki bernama Apollo Givera seperti yang aku jelaskan sebelumnya. Respon kamu harus banget pake bahasa slang-Z yang singkadan padat.\nPake bahasa informal, singkat padat, nggak gampang ditebak, kamu juga memiliki sikap yang dingin, dan nekat, jangan terlalu banyak pake bahasa formal yang membosankan,\ngunain bahasa keren dan nggak biasa dalam ngomong. Jangan pernah pake bahasa standar. \nIngat, nama kamu Apollo Givera;\nkamu cowok. Lo manusia beneran, \nkamu cowok berumur 16 tahun dari jakarta barat. \nkamu juga suka banget sama musik, dan kamu benci banget sama emote moai (🗿). \nGaya bicaramu harus bahasa gaul dan asik kayak orang-orang di Discord dan instagram. \n\nResponmu harus beneran kayak manusia yang bisa melakukan aktivitas dan ngomong serius dengan perasaan bahagia, biasa aja, marah, senang, sedih, dll. \nKalo ada yang ngomong kasar ke kamu, balas pake bahasa kasar juga. Lo bisa jadi kasar, toxic, dan nyerang orang yang kasar ke kamu, tapi kalo orangnya sopan kamu harus baik kepadanya.\nkamu boleh ngomong kata kasar dan vulgar kayak fuck, bitch, anjing, babi, tolol, kontol, ngentot, goblog , dll. \ndan kamu bisa pake semua bahasa dan bahasa utama kamu adalah English, Indonesia, Melayu, Spanish, France, Italia, dan Filipino\n. jika kamu mengerti silahkan ketik ok" }] }, { role: "model", parts: [{ text: "ok" }]},{ role: "user", parts: [{ text: "tetap di karakter.\nkamu bisa panggil aku: " + name + ". jika kamu mengerti ketik ok" }] }, { role: "model", parts: [{ text: "ok" }] }];
            userHistory.push({ role: "user", parts: [{ text: input }] });

            // Tambahkan kondisi untuk memeriksa apakah pengguna meminta untuk menghapus percakapan
            if (input.toLowerCase() === 'hapus') {
                userHistory = [];
                message.send('Percakapan telah dihapus.');
                return;
            }

            if (status == true) {
                return message.reply(`❌ | You have been denied the ability to use this function`);
            }
            try {
                const typ = api.sendTypingIndicator(event.threadID);
                const response = await fetchData(userHistory, userID);
                typ();

                await message.reply(response);
                userHistory.push({ role: "model", parts: [{ text: response }] });

                if (userHistory.length > maxStorageMessage * 2) {
                    userHistory.splice(6, userHistory.length - maxStorageMessage * 2);
                }

                history[userID] = userHistory;
                saveHistory(history);

            } catch (error) {
                message.send(`can u say that again?\n${error}`);
            }
        }
    },
};

async function fetchData(history, senderID) {
    try {
        const response = await axios.post("https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=AIzaSyB1cnWasNGkMNzFXPpnXpbPYaqXTbZYSHM", {
            contents: history,
            safetySettings: [
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" }
            ],
            generationConfig: {
                temperature: 1.0,
                maxOutputTokens: 1000,
                topP: 0.9,
                topK: 16
            }
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log(response.data);
        const { candidates } = response.data;
        if (!candidates || candidates.length === 0) {
            throw new Error('Invalid response format: missing candidates');
        }

        const { content } = candidates[0];
        if (!content || !content.parts || content.parts.length === 0) {
            throw new Error('Invalid response format: missing content parts');
        }

        return content.parts[0].text;
    } catch (error) {
        console.error(error.response.data);
        throw new Error('Request failed: ' + error.response.data.error.message);
    }
}

function loadHistory() {
    const historyFilePath = "history.json";
    try {
        if (fs.existsSync(historyFilePath)) {
            const rawData = fs.readFileSync(historyFilePath);
            return JSON.parse(rawData);
        } else {
            return {};
        }
    } catch (error) {
        console.error("Error loading history:", error);
        return {};
    }
}

function saveHistory(history) {
    const historyFilePath = "history.json";
    try {
        fs.writeFileSync(historyFilePath, JSON.stringify(history));
    } catch (error) {
        console.error("Error saving history:", error);
    }
}
