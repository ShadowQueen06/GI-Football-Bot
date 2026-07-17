const config = require('../config/config');
const getUser = require('../utils/getOrCreateUser');
const { getRemaining, formatRemaining } = require('../utils/cooldown');

module.exports = {
  name: 'يومي',
  aliases: ['راتب'],

  async execute(message) {
    const user = await getUser(message.author.id, message.guild.id);

    const left = getRemaining(user.lastDailyAt, config.dailyCooldownMs);

    if (left > 0) {
      return message.reply(`⏳ ارجع بعد **${formatRemaining(left)}**.`);
    }

    user.giPoints += config.dailyReward;
    user.lastDailyAt = new Date();

    await user.save();

    await message.reply(
      `💰 حصلت على **${config.dailyReward} GP**!\nرصيدك الحالي: **${user.giPoints} GP**`
    );
  }
};
