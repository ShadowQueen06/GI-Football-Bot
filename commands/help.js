const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "مساعدة",
    aliases: ["الاوامر", "أوامر"],

    async execute(message) {
        const commands = [
            "**باك** — افتح باك مجاني كل 6 ساعات",
            "**بطاقاتي** — اعرض بطاقاتك وأرقامها",
            "**فريقي** — اعرض أفضل تشكيلة",
            "**يومي** — مكافأة يومية",
            "**رصيدي** — عرض الرصيد",
            "**بيع 3 5000** — اعرض البطاقة رقم 3 للبيع",
            "**السوق** — اعرض بطاقات اللاعبين المعروضة",
            "**شراء رقم_العرض** — اشترِ بطاقة من السوق",
            "**مساعدة** — عرض الأوامر"
        ];

        await message.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(0x5865f2)
                    .setTitle("⚽ GI Football")
                    .setDescription(commands.join("\n"))
            ]
        });
    }
};
