const Discord = require('discord.js');
const chnlVids = require('./utils/chnlVids.js');

const client = Discord.Client();

client.on('ready', () => {
    console.log('bot is ready');
});

chnlVids.videos("https://www.youtube.com/channel/UCXTpFs_3PqI41qX2d9tL2Rw", (callback) => {
    console.log(callback);
});


