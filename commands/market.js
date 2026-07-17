const players = require('../data/players.json');

function getPrice(player) {
  const rarityMultiplier = {
    Common: 1,
    Rare: 1.5,
    Epic: 2.5,
    Legendary: 4,
    Icon: 8
  };

  const multiplier = rarityMultiplier[player.rarity] || 1;

  return Math.round(player.rating * 100 * multiplier);
}

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

function generateMarket(size = 5) {
  return shuffle(players)
    .slice(0, size)
    .map(player => ({
      ...player,
      price: getPrice(player)
    }));
}

module.exports = {
  getPrice,
  generateMarket
};
