module.exports = {
  // Channels
  gameChannelId: process.env.GAME_CHANNEL_ID?.trim() || null,
  matchesChannelId: process.env.MATCHES_CHANNEL_ID?.trim() || null,
  predictionsChannelId: process.env.PREDICTIONS_CHANNEL_ID?.trim() || null,

  // Economy
  starterCoins: 1000,
  dailyReward: 500,

  // Packs
  packSize: 5,
  packCooldownMs: 6 * 60 * 60 * 1000,

  // Daily
  dailyCooldownMs: 24 * 60 * 60 * 1000
};
