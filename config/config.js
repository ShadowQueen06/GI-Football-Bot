module.exports = {
  gameChannelId: process.env.GAME_CHANNEL_ID?.trim() || null,
  packCooldownMs: 6 * 60 * 60 * 1000,
  dailyCooldownMs: 24 * 60 * 60 * 1000,
  starterCoins: 1000,
  dailyReward: 500,
  packSize: 5
};
