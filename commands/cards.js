const { EmbedBuilder } = require("discord.js");

const players = require("../data/players.json");
const getUser = require("../utils/getOrCreateUser");

const byId = new Map(
    players.map(player => [player.id, player])
);

module.exports = {
    name: "بطاقاتي",
    aliases: ["كروتي"],

    async execute(message) {
        const user = await getUser(
            message.author.id,
            message.guild.id
        );

        if (!user.cards.length) {
            return message.reply(
                "ما عندك بطاقات بعد. اكتب **باك**."
            );
        }

        const cards = user.cards
            .map(card => {
                const player = byId.get(card.playerId);

                if (!player) {
                    return null;
                }

                return {
                    cardId: card._id,
                    obtainedAt: card.obtainedAt,
                    player
                };
            })
            .filter(Boolean)
            .sort((a, b) => {
                if (b.player.rating !== a.player.rating) {
                    return b.player.rating - a.player.rating;
                }

                return (
                    new Date(a.obtainedAt).getTime() -
                    new Date(b.obtainedAt).getTime()
                );
            });

        const visibleCards = cards.slice(0, 25);

        const text = visibleCards
            .map(
                (card, index) =>
                    `${index + 1}. **${card.player.name}** — ${card.player.rating} ${card.player.position}`
            )
            .join("\n");

        const embed = new EmbedBuilder()
            .setColor(0x2e86de)
            .setTitle(
                `🎴 بطاقات ${message.author.displayName}`
            )
            .setDescription(text)
            .setFooter({
                text:
                    user.cards.length > 25
                        ? `المجموع: ${user.cards.length} بطاقة — يتم عرض أول 25 بطاقة`
                        : `المجموع: ${user.cards.length} بطاقة`
            });

        await message.reply({
            embeds: [embed]
        });
    }
};
