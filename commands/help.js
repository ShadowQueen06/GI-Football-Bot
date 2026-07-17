const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "مساعدة",
    aliases: ["help", "اوامر", "أوامر"],

    async execute(message) {
        const embed = new EmbedBuilder()
            .setColor(0x5865f2)
            .setTitle("⚽ GI Football")
            .setDescription(
                [
                    "🎁 **باك**",
                    "🗂️ **بطاقاتي**",
                    "⭐ **فريقي**",
                    "",
                    "💵 **يومي**",
                    "🏦 **رصيدي**",
                    "",
                    "🏪 **السوق**",
                    "📤 **بيع**",
                    "🛍️ **شراء**",
                    "",
                    "📖 **مساعدة**"
                ].join("\n")
            );

        await message.reply({
            embeds: [embed]
        });
    }
};
