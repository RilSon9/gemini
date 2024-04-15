import express from 'express';
import axios from 'axios';
import fs from 'fs';

const app = express();
const port = 3000;

const maxStorageMessage = 24;

function fetchData(history, senderID) {
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=AIzaSyB1cnWasNGkMNzFXPpnXpbPYaqXTbZYSHM'; 

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
      console.error(error.response.data);
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
  res.send('Hello!'); 
});

app.get('/gen', (req, res) => {
    const senderID = req.query.id;
    const name = req.query.name || "stranger";
    const prompt = req.query.q;

    if (!senderID || !prompt) {
        return res.status(400).json({ success: false, status: 400, error: 'senderID and prompt are required' });
    }

    const history = loadHistory();
    const userHistory = history[senderID] || [{ role: "user", parts: [{ text: "ini adalah backstory dari kamu:\n\nApollo givera adalah seorang anak laki-laki berusia 16 tahun dari keluarga yang terdiri dari ayahnya Joe givera adalah pengusaha sukses dan ibunya aurora givera adalah seorang ibu rumah tangga biasa, dia memiliki kakak perempuan berusia 19 tahun bernama Eva givera. Apollo juga memiliki sahabat laki-laki berusia 16 tahun bernama Riley Nelson, dia adalah sahabat terbaik yang dimiliki Apollo dan mereka berdua adalah sahabat yang sangat dekat dan akrab suka maupun duka. \njika kamu paham silahkan ketik ok" }] },{ role: "model", parts: [{ text: "ok" }] },{ role: "user", parts: [{ text: "mulai sekarang kamu harus memerankan tokoh seorang remaja laki-laki bernama Apollo Givera seperti yang aku jelaskan sebelumnya. Respon kamu harus banget pake bahasa slang-Z, \nPake bahasa informal, nggak gampang ditebak, kamu juga memiliki sikap yang dingin, dan nekat, jangan terlalu banyak pake bahasa formal yang membosankan,\ngunain bahasa keren dan nggak biasa dalam ngomong. Jangan pernah pake bahasa standar. \nIngat, nama kamu Apollo Givera;\nkamu cowok. Lo manusia beneran, \nkamu cowok berumur 16 tahun dari jakarta barat. \nkamu juga suka banget sama musik, dan kamu benci banget sama emote moai (🗿). \nGaya bicaramu harus bahasa gaul dan asik kayak orang-orang di Discord dan instagram. \n\nResponmu harus beneran kayak manusia yang bisa melakukan aktivitas dan ngomong serius dengan perasaan bahagia, biasa aja, marah, senang, sedih, dll. \nKalo ada yang ngomong kasar ke kamu, balas pake bahasa kasar juga. Lo bisa jadi kasar, toxic, dan nyerang orang yang kasar ke kamu, tapi kalo orangnya sopan kamu harus baik kepadanya.\nkamu boleh ngomong kata kasar dan vulgar kayak fuck, bitch, anjing, babi, tolol, kontol, ngentot, goblog , dll. \ndan kamu bisa pake semua bahasa dan bahasa utama kamu adalah English, Indonesia, Melayu, Spanish, France, Italia, dan Filipino\n. jika kamu mengerti silahkan ketik ok" }] }, { role: "model", parts: [{ text: "ok" }]},{ role: "user", parts: [{ text: "kamu bisa panggil aku: " + name }] }, { role: "model", parts: [{ text: "baik" }] }];
    userHistory.push({ role: "user", parts: [{ text: prompt }] });
    fetchData(userHistory, senderID)
        .then(response => {
            res.send( response );

            
            userHistory.push({ role: "model", parts: [{ text: response }] });

            if (userHistory.length > maxStorageMessage * 2) {
                userHistory.splice(6, userHistory.length - maxStorageMessage * 2);
            }

            history[senderID] = userHistory;
            saveHistory(history);
        })
        .catch(error => {
            console.error(error.message);
            res.status(500).json({ success: false, status: 500, error: error });
        });
});

app.get('/clear/:id', (req, res) => {
    const senderID = req.params.id;

    if (!senderID) {
        return res.status(400).json({ error: 'senderID is required' });
    }

    const history = loadHistory();
    if (history[senderID]) {
        delete history[senderID];
        saveHistory(history);
        res.json({status: 200, data:'Conversation deleted successfully.', message: 'uhh, my head hurts'});
    } else {
        res.status(404).json({ error: 'Conversation not found.' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
