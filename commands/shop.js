const { EmbedBuilder } = require('discord.js');
const config = require('../config/config');
const { generateMarket } = require('../utils/market');

let currentMarket = [];
let marketCreatedAt = 0;

function getMarket() {
  const now = Date.now();

  if (
    currentMarket.length === 0 ||
    now - marketCreatedAt >= config.marketRefreshMs
  ) {
    currentMarket = generateMarket(config.marketSize);
    marketCreatedAt = now;
  }

  return currentMarket;
}

module.exports = {
  name: 'السوق',
  aliases: ['ماركت', 'market'],

  async execute(message) {
    const market = getMarket();

    const list = market
      .map(
        (player, index) =>
          `${index + 1}. **${player.name}**\n` +
          `⭐ ${player.rating} | ${player.position} | ${player.rarity}\n` +
          `💰 ${player.price.toLocaleString()} GP`
      )
      .join('\n\n');

    const refreshAt = marketCreatedAt + config.marketRefreshMs;
    const remainingMs = Math.max(0, refreshAt - Date.now());

    const hours = Math.floor(remainingMs / (60 * 60 * 1000));
    const minutes = Math.floor(
      (remainingMs % (60 * 60 * 1000)) / (60 * 1000)
    );

    const embed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle('🛒 سوق GI Football')
      .setDescription(list)
      .setFooter({
        text: `يتجدد السوق بعد ${hours} ساعة و ${minutes} دقيقة`
      });

    await message.reply({ embeds: [embed] });
  },

  getMarket
};
