const axios = require('axios');
const canvas = require('canvas');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
    config: {
        name: "dog",
        aliases: ["dogs", "kutta"],
        version: "3.0.0",
        hasPermission: 0,
        credits: "xalman",
        description: "মেনশন, রিপ্লাই বা UID দিয়ে কাউকে কুকুর বানানো",
        commandCategory: "fun",
        usages: "[@mention / reply / UID]",
        cooldowns: 5
    },

    onStart: async function ({ api, event, args }) {
        const { threadID, messageID, mentions, type, messageReply, senderID } = event;

        let targetID;
        if (type === "message_reply") {
            targetID = messageReply.senderID;
        } 
        else if (Object.keys(mentions).length > 0) {
            targetID = Object.keys(mentions)[0];
        } 
        else if (args.length > 0 && !isNaN(args[0])) {
            targetID = args[0];
        } 
        else {
            targetID = senderID;
        }

        try {
            const userInfo = await api.getUserInfo(targetID);
            if (!userInfo[targetID]) throw new Error("User not found");
            const name = userInfo[targetID].name;

            api.sendMessage(`একটু দাড়া ${name}, তোরে কুকুর সাজিয়ে দিচ্ছি... 🐕`, threadID, messageID);

            const dogImgUrl = "https://i.ibb.co/DDMySDsS/a5f597724c71.jpg"; 
            const avatarUrl = `https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

            const [dogImg, avatarImg] = await Promise.all([
                canvas.loadImage(dogImgUrl),
                canvas.loadImage(avatarUrl)
            ]);

            const canvasObj = canvas.createCanvas(dogImg.width, dogImg.height);
            const ctx = canvasObj.getContext('2d');

            ctx.drawImage(dogImg, 0, 0, canvasObj.width, canvasObj.height);
            const x = 290; 
            const y = 50;  
            const size = 100; 

            ctx.save();
            ctx.beginPath();
            ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(avatarImg, x, y, size, size);
            ctx.restore();

            const pathImg = path.join(__dirname, 'cache', `dog_${targetID}.png`);
            if (!fs.existsSync(path.join(__dirname, 'cache'))) fs.mkdirSync(path.join(__dirname, 'cache'));
            
            const buffer = canvasObj.toBuffer();
            fs.writeFileSync(pathImg, buffer);

            return api.sendMessage({
                body: `${name}, তোর আসল রূপ🐕`,
                attachment: fs.createReadStream(pathImg)
            }, threadID, () => {
                if (fs.existsSync(pathImg)) fs.unlinkSync(pathImg);
            }, messageID);

        } catch (e) {
            console.error(e);
            return api.sendMessage("error❌।", threadID, messageID);
        }
    }
};
