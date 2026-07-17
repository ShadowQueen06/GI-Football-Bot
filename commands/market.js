const { EmbedBuilder } = require("discord.js");
const players = require("../data/players.json");
const Market = require("../database/models/Market");

const playersById = new Map(players.map(player => [player.id, player]));

module.exports = {
    name: "السوق",
    aliases: ["market"],

    async execute(message) {
        const listings = await Market.find({
            guildId: message.guild.id,
            status: "active"
        })
            .sort({ createdAt: -1 })
            .limit(20)
            .lean();

        if (!listings.length) {
            return message.reply("🛒 السوق فارغ حاليًا.");
        }

        const lines = listings.map((listing, index) => {
            const player = playersById.get(listing.playerId);
            const name = player?.name || listing.playerId;
            const details = player
                ? `${player.rating} ${player.position}`
                : "بيانات اللاعب غير متوفرة";

            return [
                `**${index + 1}. ${name}** — ${details}`,
                `💰 ${listing.price.toLocaleString("en-US")} GP | البائع: <@${listing.sellerId}>`,
                `للشراء: \`شراء ${listing._id}\``
            ].join("\n");
        });

        const embed = new EmbedBuilder()
            .setColor(0x2ecc71)
            .setTitle("🛒 سوق اللاعبين")
            .setDescription(lines.join("\n\n"))
            .setFooter({ text: `عدد العروض الظاهرة: ${listings.length}` })
            .setTimestamp();

        await message.reply({
            embeds: [embed],
            allowedMentions: { parse: [] }
        });
    }
};
