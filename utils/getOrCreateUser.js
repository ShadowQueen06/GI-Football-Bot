const User = require('../database/models/User');
const config = require('../config/config');

module.exports = async function getOrCreateUser(discordId, guildId) {
  let user = await User.findOne({
    discordId,
    guildId
  });

  if (!user) {
    user = await User.create({
      discordId,
      guildId,
      giPoints: config.starterPoints
    });

    return user;
  }

  // ينقل رصيد coins القديم إلى GI Points حتى ما يضيع
  if (typeof user.giPoints !== 'number') {
    user.giPoints =
      typeof user.coins === 'number'
        ? user.coins
        : config.starterPoints;

    await user.save();
  }

  return user;
};
