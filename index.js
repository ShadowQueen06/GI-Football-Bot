require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const connectDatabase = require('./database/connect');
const loadEvents = require('./handlers/eventHandler');

const token = process.env.DISCORD_TOKEN?.trim();
const mongoUri = process.env.MONGO_URI?.trim();
if (!token) throw new Error('DISCORD_TOKEN مفقود');
if (!mongoUri) throw new Error('MONGO_URI مفقود');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers],
  partials: [Partials.Channel, Partials.Message]
});

process.on('unhandledRejection', console.error);
process.on('uncaughtException', console.error);

async function loginWithRetry() {
  while (true) {
    try { await client.login(token); break; }
    catch (error) {
      console.error('فشل تسجيل الدخول:', error.message);
      await new Promise(r => setTimeout(r, 15000));
    }
  }
}

(async () => {
  await connectDatabase(mongoUri);
  loadEvents(client);
  await loginWithRetry();
})();
