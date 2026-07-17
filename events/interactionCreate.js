const {
    Events,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    EmbedBuilder
} = require("discord.js");

const Fixture = require("../database/models/Fixture");
const Prediction = require("../database/models/Prediction");
const config = require("../config/config");

module.exports = {
    name: Events.InteractionCreate,

    async execute(interaction) {
        try {
            if (interaction.isButton()) {
                if (!interaction.customId.startsWith("predict:")) return;

                const fixtureId = interaction.customId.split(":")[1];

                const fixture = await Fixture.findById(fixtureId);

                if (!fixture) {
                    return interaction.reply({
                        content: "❌ لم يتم العثور على المباراة.",
                        ephemeral: true
                    });
                }

                if (fixture.status !== "open") {
                    return interaction.reply({
                        content: "🔒 التوقعات لهذه المباراة مغلقة.",
                        ephemeral: true
                    });
                }

                if (new Date() >= fixture.kickoffAt) {
                    fixture.status = "closed";
                    await fixture.save();

                    return interaction.reply({
                        content: "🔒 انتهى وقت التوقع لهذه المباراة.",
                        ephemeral: true
                    });
                }

                const existingPrediction = await Prediction.findOne({
                    fixtureId: fixture._id,
                    userId: interaction.user.id
                });

                if (existingPrediction) {
                    return interaction.reply({
                        content: "❌ لقد أرسلت توقعك لهذه المباراة مسبقًا، ولا يمكنك تعديله.",
                        ephemeral: true
                    });
                }

                const modal = new ModalBuilder()
                    .setCustomId(`predictionModal:${fixture._id}`)
                    .setTitle(`${fixture.homeTeam} ضد ${fixture.awayTeam}`);

                const homeScoreInput = new TextInputBuilder()
                    .setCustomId("homeScore")
                    .setLabel(`أهداف ${fixture.homeTeam}`)
                    .setPlaceholder("مثال: 2")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                    .setMinLength(1)
                    .setMaxLength(2);

                const awayScoreInput = new TextInputBuilder()
                    .setCustomId("awayScore")
                    .setLabel(`أهداف ${fixture.awayTeam}`)
                    .setPlaceholder("مثال: 1")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                    .setMinLength(1)
                    .setMaxLength(2);

                modal.addComponents(
                    new ActionRowBuilder().addComponents(homeScoreInput),
                    new ActionRowBuilder().addComponents(awayScoreInput)
                );

                return interaction.showModal(modal);
            }

            if (interaction.isModalSubmit()) {
                if (!interaction.customId.startsWith("predictionModal:")) {
                    return;
                }

                const fixtureId = interaction.customId.split(":")[1];

                const fixture = await Fixture.findById(fixtureId);

                if (!fixture) {
                    return interaction.reply({
                        content: "❌ لم يتم العثور على المباراة.",
                        ephemeral: true
                    });
                }

                if (fixture.status !== "open" || new Date() >= fixture.kickoffAt) {
                    if (fixture.status === "open") {
                        fixture.status = "closed";
                        await fixture.save();
                    }

                    return interaction.reply({
                        content: "🔒 انتهى وقت التوقع لهذه المباراة.",
                        ephemeral: true
                    });
                }

                const homeScoreText =
                    interaction.fields.getTextInputValue("homeScore").trim();

                const awayScoreText =
                    interaction.fields.getTextInputValue("awayScore").trim();

                if (
                    !/^\d+$/.test(homeScoreText) ||
                    !/^\d+$/.test(awayScoreText)
                ) {
                    return interaction.reply({
                        content: "❌ يجب إدخال أرقام صحيحة فقط.",
                        ephemeral: true
                    });
                }

                const homeScore = Number(homeScoreText);
                const awayScore = Number(awayScoreText);

                if (
                    !Number.isInteger(homeScore) ||
                    !Number.isInteger(awayScore) ||
                    homeScore < 0 ||
                    awayScore < 0 ||
                    homeScore > 99 ||
                    awayScore > 99
                ) {
                    return interaction.reply({
                        content: "❌ النتيجة يجب أن تكون بين 0 و99.",
                        ephemeral: true
                    });
                }

                const existingPrediction = await Prediction.findOne({
                    fixtureId: fixture._id,
                    userId: interaction.user.id
                });

                if (existingPrediction) {
                    return interaction.reply({
                        content: "❌ لقد أرسلت توقعك مسبقًا، ولا يمكنك تعديله.",
                        ephemeral: true
                    });
                }

                await Prediction.create({
                    guildId: interaction.guild.id,
                    fixtureId: fixture._id,
                    userId: interaction.user.id,
                    homeScore,
                    awayScore
                });

                await interaction.reply({
                    content: "✅ تم تسجيل توقعك بنجاح.",
                    ephemeral: true
                });

                const predictionsChannel =
                    interaction.guild.channels.cache.get(
                        config.predictionsChannelId
                    );

                if (predictionsChannel?.isTextBased()) {
                    const predictionEmbed = new EmbedBuilder()
                        .setColor(0x3498db)
                        .setTitle("🔮 توقع جديد")
                        .setDescription(
                            `<@${interaction.user.id}> توقع نتيجة المباراة`
                        )
                        .addFields(
                            {
                                name: "المباراة",
                                value: `**${fixture.homeTeam} ضد ${fixture.awayTeam}**`
                            },
                            {
                                name: "التوقع",
                                value: `**${fixture.homeTeam} ${homeScore} - ${awayScore} ${fixture.awayTeam}**`
                            }
                        )
                        .setThumbnail(
                            interaction.user.displayAvatarURL({
                                extension: "png",
                                size: 256
                            })
                        )
                        .setTimestamp();

                    await predictionsChannel.send({
                        embeds: [predictionEmbed],
                        allowedMentions: {
                            users: [interaction.user.id]
                        }
                    });
                }
            }
        } catch (error) {
            console.error("Interaction error:", error);

            const errorMessage = {
                content: "❌ صار خطأ غير متوقع، جرّب مرة ثانية.",
                ephemeral: true
            };

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorMessage).catch(() => null);
            } else {
                await interaction.reply(errorMessage).catch(() => null);
            }
        }
    }
};
