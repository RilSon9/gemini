const fs = require("fs");
const moment = require("moment-timezone");
const cooldownTime = 30000;

let rpData = {};
if (fs.existsSync("rp.json")) {
  try {
    const data = fs.readFileSync("rp.json", "utf-8");
    rpData = JSON.parse(data);
  } catch (error) {
    console.error("Error reading rp.json:", error.message);
  }
} else {
  fs.writeFileSync("rp.json", JSON.stringify(rpData, null, 2), "utf-8");
}

module.exports = {
  config: {
    name: "rp",
    version: 1.1,
    author: "Riley",
  /** Tolong jangan ganti credit, */
    role: 0,
    shortDescription: "Menu Roleplay",
    category: "Roleplay",
    guide: "{p}rp [create | ras | play | status | rps | war | eat | heal]",
  },

  onStart: async function ({ api, event, args }) {
    const subCommand = args[0];

    switch (subCommand) {
      case "create":
  const createArgs = event.body.split("|").map(arg => arg.trim());
  const characterName = createArgs[1];
  const characterRace = createArgs[2];
  
  if (!characterName || !characterRace) {
    api.sendMessage("Format yang benar: `!rp create | Nama Karakter | Ras Karakter`", event.threadID);
    return;
  }

  if (rpData[event.senderID]) {
    api.sendMessage("Anda sudah memiliki karakter RP.", event.threadID);
  } else {
    rpData[event.senderID] = {
      name: characterName,
      race: characterRace,
      level: 1,
      energy: 100,
      money: 0,
      intelligence: 50,
      health: 100,
      power: 50,
      lastPlayTime: 0,
      lastWarTime: 0,
      lastEatTime: 0,
      lastRpsTime: 0
    };
    fs.writeFileSync("rp.json", JSON.stringify(rpData, null, 2), "utf-8");
    api.sendMessage(`Karakter RP baru dengan nama ${characterName} dan ras ${characterRace} telah dibuat!`, event.threadID);
  }
  break;    case "edit":
  const editType = args[0];
  const editValue = args.slice(1).join(" ").trim(); 
  if (!editType || !editValue) {
    api.sendMessage("Silakan gunakan format: !Rp edit [name/ras] [nilai baru]", event.threadID);
  } else if (editType === "name") {
  
    rpData[event.senderID].name = editValue;
    fs.writeFileSync("rp.json", JSON.stringify(rpData, null, 2), "utf-8");
    api.sendMessage(`Nama karakter Anda berhasil diubah menjadi "${editValue}"!`, event.threadID);
  } else if (editType === "ras") {
    
    rpData[event.senderID].ras = editValue;
    fs.writeFileSync("rp.json", JSON.stringify(rpData, null, 2), "utf-8");
    api.sendMessage(`Ras karakter Anda berhasil diubah menjadi "${editValue}"!`, event.threadID);
  } else {
    api.sendMessage("Tipe yang dapat diedit adalah 'name' atau 'ras'.", event.threadID);
  }
  break;
    case "reset":
  if (rpData[event.senderID]) {
    delete rpData[event.senderID];
    fs.writeFileSync("rp.json", JSON.stringify(rpData, null, 2), "utf-8");
    api.sendMessage("Semua data karakter RP Anda telah direset.", event.threadID);
  } else {
    api.sendMessage("Anda tidak memiliki karakter RP yang dapat direset.", event.threadID);
  }
  break;
    case "ras":
  if (rpData[event.senderID].ras) {
    api.sendMessage("Anda sudah mengatur ras karakter Anda. Anda tidak dapat mengubahnya lagi.", event.threadID);
  } else {
    const characterRas = args.join(" ").trim();
    if (characterRas === "") {
      api.sendMessage("Silakan berikan nama ras untuk karakter Anda setelah !rp ras.", event.threadID);
    } else {
      rpData[event.senderID].ras = characterRas;

      
      fs.writeFileSync("rp.json", JSON.stringify(rpData, null, 2), "utf-8");

      api.sendMessage(`Ras karakter Anda berhasil diatur sebagai "${characterRas}"!`, event.threadID);
    }
  }
  break; 
      case "evo":
  if (!rpData[event.senderID]) {
    api.sendMessage("Anda harus membuat karakter terlebih dahulu.", event.threadID);
  } else {
    const characterData = rpData[event.senderID];

    
    if (characterData.level >= 5 && characterData.money >= 100) {
      
      const newRace = args.slice(1).join(" ");
      characterData.race = newRace;

      characterData.money -= 100;

      fs.writeFileSync("rp.json", JSON.stringify(rpData, null, 2), "utf-8");

      api.sendMessage(`Anda telah berhasil mengubah ras karakter menjadi ${newRace}.`, event.threadID);
    } else {
      api.sendMessage("Karakter Anda harus mencapai level 5 dan memiliki minimal 100 uang untuk melakukan evolusi ras.", event.threadID);
    }
  }
  break;
    case "heal":
  if (!rpData[event.senderID]) {
    api.sendMessage("Anda harus membuat karakter terlebih dahulu.", event.threadID);
  } else {
    const characterData = rpData[event.senderID];

     if (characterData.money < 150) {
      api.sendMessage("Anda tidak memiliki cukup uang untuk melakukan 'heal'.", event.threadID);
    } else {
     
      characterData.health += 70;       characterData.strength += 50;   characterData.money -= 150; 
      fs.writeFileSync("rp.json", JSON.stringify(rpData, null, 2), "utf-8");

      api.sendMessage("Anda telah melakukan 'heal'. Kesehatan dan kekuatan telah pulih.", event.threadID);
    }
  }
  break;

    case "war":
  if (!rpData[event.senderID]) {
    api.sendMessage("Anda harus membuat karakter terlebih dahulu.", event.threadID);
  } else {
    const characterData = rpData[event.senderID];

    const lastWarTime = characterData.lastWarTime || 0;
    const currentTime = moment().valueOf(); 
    const timeDifference = currentTime - lastWarTime;

    if (timeDifference >= 24 * 60 * 60 * 1000) {
      const lostStrength = 50;
      const lostHealth = 30; 
      const gainedIntelligence = 10;   const gainedLevel = 2; 
      const gainedMoney = 150;

      characterData.strength -= lostStrength;
      characterData.health -= lostHealth;
      characterData.intelligence += gainedIntelligence;
      characterData.level += gainedLevel;
      characterData.money += gainedMoney;

      characterData.lastWarTime = currentTime;

      fs.writeFileSync("rp.json", JSON.stringify(rpData, null, 2), "utf-8");

      
      api.sendMessage(`Anda telah berperang dan kehilangan ${lostStrength} kekuatan dan ${lostHealth} kesehatan, tetapi mendapatkan ${gainedIntelligence} kecerdasan, ${gainedLevel} level, dan ${gainedMoney} uang.`, event.threadID);
    } else {
      
      const remainingTime = (24 * 60 * 60 * 1000 - timeDifference) / 1000; 
      const remainingHours = Math.floor(remainingTime / 3600); // Jam
      const remainingMinutes = Math.floor((remainingTime % 3600) / 60); // Menit
      api.sendMessage(`Anda harus menunggu ${remainingHours} jam ${remainingMinutes} menit sebelum bisa berperang lagi.`, event.threadID);
    }
  }
  break;
    case "rps":
  if (!rpData[event.senderID]) {
    api.sendMessage("Anda harus membuat karakter terlebih dahulu.", event.threadID);
  } else {
    const characterData = rpData[event.senderID];

    const lastRpsTime = characterData.lastRpsTime || 0;
    const currentTime = moment().valueOf(); 
    const timeDifference = currentTime - lastRpsTime;

    if (timeDifference >= cooldownTime) {
      const rpsOptions = ["✊", "✋", "✌️"];
      const randomChoice = rpsOptions[Math.floor(Math.random() * rpsOptions.length)];
      const playerChoice = rpsOptions[Math.floor(Math.random() * rpsOptions.length)];

      let resultMessage = "";
      if (playerChoice === randomChoice) {
        resultMessage = "Seri!";
      } else if (
        (playerChoice === "✊" && randomChoice === "✌️") ||
        (playerChoice === "✋" && randomChoice === "✊") ||
        (playerChoice === "✌️" && randomChoice === "✋")
      ) {
        resultMessage = "Anda MENANG! 💰";
        characterData.money += 60;
      } else {
        resultMessage = "Anda KALAH! 💸";
        characterData.money -= 60;
      }

      characterData.lastRpsTime = currentTime;

      fs.writeFileSync("rp.json", JSON.stringify(rpData, null, 2), "utf-8");

      api.sendMessage(`Anda memilih ${playerChoice}\nLawan memilih ${randomChoice}\n\nHasil: ${resultMessage}`, event.threadID);
    } else {
      const remainingTime = (cooldownTime - timeDifference) / 1000; 
      api.sendMessage(`Anda harus menunggu ${remainingTime} detik sebelum bisa memainkan RPS lagi.`, event.threadID);
    }
  }
  break;    
      case "eat":
  if (!rpData[event.senderID]) {
    api.sendMessage("Anda harus membuat karakter terlebih dahulu.", event.threadID);
  } else {
    const characterData = rpData[event.senderID];

    const foods = ["🍔", "🍕", "🥪", "🍝", "🍣", "🍦", "🍰", "🍩", "🍪"];

    const randomFood = foods[Math.floor(Math.random() * foods.length)];

    characterData.energy += 30;

    characterData.money -= 20;

    fs.writeFileSync("rp.json", JSON.stringify(rpData, null, 2), "utf-8");

    api.sendMessage(`Anda memberi makan karakter Anda ${randomFood}. Energi bertambah, uang berkurang.`, event.threadID);
  }
  break;
    case "play":
  if (!rpData[event.senderID]) {
    api.sendMessage("Anda harus membuat karakter terlebih dahulu.", event.threadID);
  } else {
    const characterData = rpData[event.senderID];
    const lastPlayTime = characterData.lastPlayTime || 0;
    const currentTime = moment().valueOf(); 
    const timeDifference = currentTime - lastPlayTime;

    if (timeDifference >= 12 * 60 * 60 * 1000) {
      const earnedMoney = 100; 
      const earnedEnergi = 50; 
      const earnedLevel = 1; 
      const earnedIntelligence = 20;   const earnedHealth = 30;

      characterData.money += earnedMoney;
      characterData.energy += earnedEnergi;
      characterData.level += earnedLevel;
      characterData.intelligence += earnedIntelligence;
      characterData.kesehatan += earnedHealth;
      characterData.lastPlayTime = currentTime;
      fs.writeFileSync("rp.json", JSON.stringify(rpData, null, 2), "utf-8");

      
      api.sendMessage(`Selamat! Anda mendapatkan ${earnedMoney} uang, ${earnedEnergi} energi, ${earnedLevel} level, ${earnedIntelligence} kecerdasan, dan ${earnedHealth} kesehatan dari bermain.`, event.threadID);
    } else {
      
      const remainingTime = (12 * 60 * 60 * 1000 - timeDifference) / 1000; 
      const remainingHours = Math.floor(remainingTime / 3600); 
      const remainingMinutes = Math.floor((remainingTime % 3600) / 60); 
      api.sendMessage(`Anda harus menunggu ${remainingHours} jam ${remainingMinutes} menit sebelum bisa bermain lagi.`, event.threadID);
    }
  }
  break;
      case "status":
        if (!rpData[event.senderID]) {
          api.sendMessage("Anda harus membuat karakter terlebih dahulu.", event.threadID);
        } else {
          const characterData = rpData[event.senderID];
          const statusMessage = `Nama Karakter: ${characterData.name}\nRas: ${characterData.race || "Belum disetel"}\nLevel: ${characterData.level || "1"}\nEnergi: ${characterData.energy || "0"}\nUang: ${characterData.money || "0"}\nKecerdasan: ${characterData.intelligence || "0"}\nKesehatan: ${characterData.health || "0"}\nKekuatan: ${characterData.strength || "0"}`;
          api.sendMessage(statusMessage, event.threadID);
        }
        break;

      default:
        api.sendMessage("Command yang Anda masukkan tidak valid. Gunakan /rp [create | ras | play | status | evo | war | heal | rps | eat | edit | reset]", event.threadID);
    }
  },
};
