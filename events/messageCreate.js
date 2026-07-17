const { Events } = require('discord.js');
const handleCommand = require('../handlers/commandHandler');
const config = require('../config/config');

module.exports = {
    name: Events.MessageCreate,

    async execute(message) {
        if (!message.guild || message.author.bot) return;

        const allowedChannels = [
            config.gameChannelId,
            config.matchesChannelId,
            config.predictionsChannelId
        ].filter(Boolean);

        if (allowedChannels.length && !allowedChannels.includes(message.channel.id)) {
            return;
        }

        try {
            await handleCommand(message);
        } catch (error) {
            console.error(error);
            await message.reply('صار خطأ غير متوقع، جرّب مرة ثانية.');
        }
    }
};
