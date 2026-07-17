const mongoose = require("mongoose");
const players = require("../data/players.json");
const User = require("../database/models/User");
const Market = require("../database/models/Market");
const getUser = require("../utils/getOrCreateUser");

const playersById = new Map(players.map(player => [player.id, player]));

function sortedOwnedCards(user) {
    return user.cards
        .map(card => ({ card, player: playersById.get(card.playerId) }))
        .filter(item => item.player)
        .sort((a, b) => {
            if (b.player.rating !== a.player.rating) {
                return b.player.rating - a.player.rating;
            }
            return new Date(a.card.obtainedAt) - new Date(b.card.obtainedAt);
        });
}

module.exports = {
    name: "بيع",
    aliases: ["sell"],

    async execute(message, args) {
        const cardNumber = Number(args[0]);
        const price = Number(args[1]);

        if (!Number.isInteger(cardNumber) || cardNumber < 1 ||
            !Number.isSafeInteger(price) || price < 1) {
            return message.reply(
                "❌ الاستخدام: `بيع رقم_البطاقة السعر`\nمثال: `بيع 3 5000`"
            );
        }

        const user = await getUser(message.author.id, message.guild.id);
        const cards = sortedOwnedCards(user);
        const selected = cards[cardNumber - 1];

        if (!selected) {
            return message.reply("❌ رقم البطاقة غير موجود. استخدم **بطاقاتي** أولًا.");
        }

        const activeListing = await Market.findOne({
            guildId: message.guild.id,
            sellerId: message.author.id,
            cardId: selected.card._id,
            status: "active"
        });

        if (activeListing) {
            return message.reply("❌ هذه البطاقة معروضة في السوق أصلًا.");
        }

        try {
            const listing = await Market.create({
                guildId: message.guild.id,
                sellerId: message.author.id,
                playerId: selected.card.playerId,
                cardId: new mongoose.Types.ObjectId(selected.card._id),
                price
            });

            return message.reply(
                `✅ عرضت **${selected.player.name}** (${selected.player.rating}) في السوق بسعر **${price.toLocaleString("en-US")} GP**.\nرقم العرض: **${listing._id}**`
            );
        } catch (error) {
            if (error?.code === 11000) {
                return message.reply("❌ هذه البطاقة معروضة في السوق أصلًا.");
            }
            throw error;
        }
    }
};
