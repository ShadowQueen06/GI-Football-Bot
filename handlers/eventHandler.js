const fs = require('node:fs');
const path = require('node:path');
module.exports = function loadEvents(client) {
  const dir = path.join(__dirname, '..', 'events');
  for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.js'))) {
    const event = require(path.join(dir, file));
    if (!event?.name || typeof event.execute !== 'function') continue;
    event.once ? client.once(event.name, (...args) => event.execute(...args, client)) : client.on(event.name, (...args) => event.execute(...args, client));
  }
};
