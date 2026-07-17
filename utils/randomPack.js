const players = require('../data/players.json');

const weights = {
  Common: 70,
  Rare: 20,
  Epic: 7,
  Legendary: 2.5,
  Icon: 0.5
};

function rarity() {
  const roll = Math.random() * 100;
  let total = 0;

  for (const [rarity, weight] of Object.entries(weights)) {
    total += weight;
    if (roll <= total) return rarity;
  }

  return 'Common';
}

module.exports = function (size = 5) {
  return Array.from({ length: size }, () => {
    const selectedRarity = rarity();
    const pool = players.filter(player => player.rarity === selectedRarity);

    return pool[Math.floor(Math.random() * pool.length)];
  });
};
