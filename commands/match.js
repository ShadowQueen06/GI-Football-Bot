const {
    PermissionFlagsBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const Fixture = require("../database/models/Fixture");
const config = require("../config/config");

module.exports = {
    name: "مباراة",
    aliases: ["اضافة-مباراة", "مباراه"],

    async execute(message, args) {
        if (
            !message.member.permissions.has(
                PermissionFlagsBits.Administrator
            )
        ) {
            return message.reply("❌ هذا الأمر للإدارة فقط.");
        }

        if (message.channel.id !== config.predictionsChannelId) {
            return message.reply(
                "❌ استخدم الأمر في قناة التوقعات فقط."
            );
        }

        const input = args
            .join(" ")
            .split("|")
            .map(value => value.trim());

        if (input.length !== 3) {
            return message.reply(
                "❌ الاستخدام:\n`مباراة ريال مدريد | برشلونة | 2026-07-20 21:00`"
            );
        }

        const [homeTeam, awayTeam, dateText] = input;
        const kickoffAt = new Date(dateText);

        if (
            !homeTeam ||
            !awayTeam ||
            Number.isNaN(kickoffAt.getTime())
        ) {
            return message.reply(
                "❌ تأكد من أسماء الفرق والتاريخ."
            );
        }

        if (kickoffAt <= new Date()) {
            return message.reply(
                "❌ موعد المباراة يجب أن يكون في المستقبل."
            );
        }

        const fixture = await Fixture.create({
            guildId: message.guild.id,
            homeTeam,
            awayTeam,
            kickoffAt,
            channelId: message.channel.id,
            createdBy: message.author.id
        });

        const unixTime = Math.floor(
            kickoffAt.getTime() / 1000
        );

        const embed = new EmbedBuilder()
            .setColor(0x2ecc71)
            .setTitle("⚽ مباراة جديدة")
            .setDescription(
                `**${homeTeam} ضد ${awayTeam}**`
            )
            .addFields(
                {
                    name: "موعد المباراة",
                    value: `<t:${unixTime}:F>\n<t:${unixTime}:R>`
                },
                {
                    name: "حالة التوقعات",
                    value: "🟢 مفتوحة"
                }
            )
            .setFooter({
                text: "اضغط الزر حتى ترسل توقعك"
            })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`predict:${fixture._id}`)
                .setLabel("توقع النتيجة")
                .setEmoji("🔮")
                .setStyle(ButtonStyle.Primary)
        );

        const sentMessage = await message.channel.send({
            content: "@everyone",
            embeds: [embed],
            components: [row],
            allowedMentions: {
                parse: ["everyone"]
            }
        });

        fixture.messageId = sentMessage.id;
        await fixture.save();

        await message.delete().catch(() => null);
    }
};
