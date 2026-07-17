module.exports = {
  // Channels
  gameChannelId: process.env.GAME_CHANNEL_ID?.trim() || null,
  matchesChannelId: process.env.MATCHES_CHANNEL_ID?.trim() || null,
  predictionsChannelId: process.env.PREDICTIONS_CHANNEL_ID?.trim() || null,

  // Economy
  starterPoints: 250,
  dailyReward: 500,

  // Packs
  packSize: 5,
  packCooldownMs: 6 * 60 * 60 * 1000,

  // Market
  marketSize: 5,
  marketRefreshMs: 12 * 60 * 60 * 1000,

  // Daily
  dailyCooldownMs: 24 * 60 * 60 * 1000
};
