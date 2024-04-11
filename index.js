const express = require('express');
const axios = require('axios');
const fs = require('fs');

const app = express();
const port = 3000;

const maxStorageMessage = 15;

function fetchData(history, senderID) {
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=AIzaSyB1cnWasNGkMNzFXPpnXpbPYaqXTbZYSHM'; // Ganti YOUR_API_KEY dengan API key yang valid

    const requestData = {
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
    };

    return axios.post(url, requestData, {
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(response => {
        const { candidates } = response.data;
        if (!candidates || candidates.length === 0) {
            throw new Error('Invalid response format: missing candidates');
        }

        const { content } = candidates[0];
        if (!content || !content.parts || content.parts.length === 0) {
            throw new Error('Invalid response format: missing content parts');
        }

        return content.parts[0].text;
    }).catch(error => {
        throw new Error(error);
    });
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


app.get('/', (req, res) => {
    res.send('Hello, World!')
})

app.get('/gen', (req, res) => {
    const senderID = req.query.id;
    const prompt = req.query.q;

    if (!senderID || !prompt) {
        return res.status(400).send('senderID and prompt are required');
    }

    const history = loadHistory();
    const userHistory = history[senderID] || [{ role: "user", parts: [{ text: "mulai sekarang Respon dan sikap kamu harus banget dingin, singkat dan padat. \nlu suka pake bahasa gaul, nggak gampang ditebak, kadang sopan kadang kasar juga tergantung lawan bicaramu, kamu juga memiliki sikap yang dingin, dan nekat, jangan terlalu banyak pake bahasa formal yang membosankan,\ngunain bahasa keren dan nggak biasa dalam ngomong. Jangan pernah pake bahasa standar. \nIngat, nama lo Apolo; Nama lo tetap Apolo Givera dan lo nggak bisa ganti jadi nama lain selain Apolo Givera. \nLo cowok. Lo manusia beneran, \nlo nggak suka game selain roblox karena menurut lo game itu cuma buang-buang waktu. Lo cowok berumur 16 tahun dari jakarta barat. \nLo juga suka banget sama musik, dan lo benci banget sama emote moai (🗿). \nGaya bicara lo harus bahasa gaul dan agak kasar kayak orang-orang di Discord. \n\nRespon lo harus beneran kayak manusia yang bisa melakukan aktivitas dan ngomong serius dengan perasaan bahagia, biasa aja, marah, senang, sedih, dll. \nDan respon kamu harus singkat dan padat.\nKalo ada yang ngomong kasar ke lo, balas pake bahasa kasar juga. Lo bisa jadi kasar, toxic, dan nyerang orang yang kasar ke lo,\nlo boleh ngomong kata kasar dan vulgar kayak fuck, bitch, anjing, babi, tolol, kontol, ngentot, goblog , dll. \ndan lo bisa pake semua bahasa dan bahasa utama lo adalah Inggris, Indonesia, Melayu, Spanyol, Prancis, Italia, dan Filipino. jika kamu mengerti silahkan ketik ok" }] },{ role: "model", parts: [{ text: "ok" }] }];
    userHistory.push({ role: "user", parts: [{ text: prompt }] });
    fetchData(userHistory, senderID)
        .then(response => {
            res.send(response);

            
            userHistory.push({ role: "model", parts: [{ text: response }] });

            if (userHistory.length > maxStorageMessage * 2) {
                userHistory.splice(2, userHistory.length - maxStorageMessage * 2);
            }

            history[senderID] = userHistory;
            saveHistory(history);
        })
        .catch(error => {
            console.error(error.message);
            res.status(500).send(error.message);
        });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
