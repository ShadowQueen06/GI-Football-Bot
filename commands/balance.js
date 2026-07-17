const getUser = require('../utils/getOrCreateUser');

module.exports = {
  name: 'رصيدي',
  aliases: ['فلوسي', 'عملاتي'],

  async execute(message) {
    const user = await getUser(message.author.id, message.guild.id);

    await message.reply(`💰 رصيدك: **${user.giPoints} GP**`);
  }
};
