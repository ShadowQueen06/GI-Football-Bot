const {
    PermissionFlagsBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const Fixture = require("../database/models/Fixture");
const Prediction = require("../database/models/Prediction");
const RewardLog = require("../database/models/RewardLog");
const Economy = require("../database/models/Economy");
const config = require("../config/config");

const rewards = [
    {
        position: 1,
        amount: 2000,
        medal: "🥇"
    },
    {
        position: 2,
        amount: 1000,
        medal: "🥈"
    },
    {
        position: 3,
        amount: 500,
        medal: "🥉"
    }
];

module.exports = {
    name: "نتيجة",
    aliases: ["النتيجة", "result"],

    async execute(message, args) {
        if (
            !message.member.permissions.has(
                PermissionFlagsBits.Administrator
            )
        ) {
            return message.reply("❌ هذا الأمر للإدارة فقط.");
        }

        if (
            config.predictionsChannelId &&
            message.channel.id !== config.predictionsChannelId
        ) {
            return message.reply(
                "❌ استخدم هذا الأمر داخل قناة التوقعات فقط."
            );
        }

        /*
         * الاستخدام:
         * نتيجة 4 2
         * أو:
         * نتيجة 4 | 2
         */
        const scoreText = args
            .join(" ")
            .replace(/\|/g, " ")
            .trim();

        const scoreParts = scoreText
            .split(/\s+/)
            .filter(Boolean);

        if (scoreParts.length !== 2) {
            return message.reply(
                "❌ الاستخدام الصحيح:\n`نتيجة 4 2`"
            );
        }

        const [homeScoreText, awayScoreText] = scoreParts;

        if (
            !/^\d+$/.test(homeScoreText) ||
            !/^\d+$/.test(awayScoreText)
        ) {
            return message.reply(
                "❌ يجب كتابة النتيجة بالأرقام فقط.\nمثال: `نتيجة 4 2`"
            );
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
            return message.reply(
                "❌ يجب أن تكون نتيجة كل فريق بين 0 و99."
            );
        }

        /*
         * إذا تم الرد على رسالة مباراة، نبحث عنها أولًا.
         * وإذا لم يتم الرد، نختار آخر مباراة مفتوحة.
         */
        let fixture = null;

        if (message.reference?.messageId) {
            fixture = await Fixture.findOne({
                guildId: message.guild.id,
                messageId: message.reference.messageId,
                status: {
                    $ne: "finished"
                },
                rewardsDistributed: false
            });
        }

        if (!fixture) {
            fixture = await Fixture.findOne({
                guildId: message.guild.id,
                status: {
                    $in: ["open", "closed"]
                },
                rewardsDistributed: false
            }).sort({
                createdAt: -1
            });
        }

        if (!fixture) {
            return message.reply(
                "❌ لا توجد مباراة مفتوحة أو بانتظار تسجيل النتيجة."
            );
        }

        /*
         * نحجز المباراة لمنع تنفيذ أمر النتيجة عليها مرتين.
         */
        const lockedFixture = await Fixture.findOneAndUpdate(
            {
                _id: fixture._id,
                rewardsDistributed: false,
                status: {
                    $ne: "finished"
                }
            },
            {
                $set: {
                    status: "closed"
                }
            },
            {
                new: true
            }
        );

        if (!lockedFixture) {
            return message.reply(
                "❌ تتم معالجة نتيجة هذه المباراة حاليًا أو تم تسجيلها مسبقًا."
            );
        }

        fixture = lockedFixture;

        try {
            /*
             * جلب أول ثلاثة أعضاء توقعوا النتيجة الصحيحة،
             * بترتيب أسبقية إرسال التوقع.
             */
            const correctPredictions = await Prediction.find({
                guildId: message.guild.id,
                fixtureId: fixture._id,
                homeScore,
                awayScore
            })
                .sort({
                    createdAt: 1,
                    _id: 1
                })
                .limit(3);

            const winners = [];

            for (
                let index = 0;
                index < correctPredictions.length;
                index++
            ) {
                const prediction = correctPredictions[index];
                const reward = rewards[index];

                /*
                 * يمنع إعطاء الجائزة نفسها مرتين.
                 */
                const existingReward = await RewardLog.findOne({
                    fixtureId: fixture._id,
                    userId: prediction.userId
                });

                if (existingReward) {
                    continue;
                }

                await Economy.findOneAndUpdate(
                    {
                        guildId: message.guild.id,
                        userId: prediction.userId
                    },
                    {
                        $inc: {
                            balance: reward.amount
                        },
                        $set: {
                            lastRewardAt: new Date()
                        }
                    },
                    {
                        upsert: true,
                        new: true,
                        setDefaultsOnInsert: true
                    }
                );

                await RewardLog.create({
                    fixtureId: fixture._id,
                    userId: prediction.userId,
                    position: reward.position,
                    amount: reward.amount
                });

                winners.push({
                    userId: prediction.userId,
                    position: reward.position,
                    amount: reward.amount,
                    medal: reward.medal
                });
            }

            fixture.homeScore = homeScore;
            fixture.awayScore = awayScore;
            fixture.status = "finished";
            fixture.rewardsDistributed = true;

            await fixture.save();

            /*
             * تحديث رسالة المباراة وإغلاق زر التوقع.
             */
            const finishedEmbed = new EmbedBuilder()
                .setColor(0xe74c3c)
                .setTitle("🏁 انتهت المباراة")
                .setDescription(
                    `**${fixture.homeTeam} ${homeScore} - ${awayScore} ${fixture.awayTeam}**`
                )
                .addFields(
                    {
                        name: "حالة التوقعات",
                        value: "🔴 مغلقة"
                    },
                    {
                        name: "عدد الفائزين",
                        value: String(winners.length),
                        inline: true
                    }
                )
                .setFooter({
                    text: "تم تسجيل النتيجة النهائية"
                })
                .setTimestamp();

            const disabledRow =
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`predict:${fixture._id}`)
                        .setLabel("انتهى وقت التوقع")
                        .setEmoji("🔒")
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true)
                );

            const fixtureChannel =
                message.guild.channels.cache.get(
                    fixture.channelId
                );

            if (
                fixtureChannel?.isTextBased() &&
                fixture.messageId
            ) {
                const fixtureMessage =
                    await fixtureChannel.messages
                        .fetch(fixture.messageId)
                        .catch(() => null);

                if (fixtureMessage) {
                    await fixtureMessage
                        .edit({
                            content: null,
                            embeds: [finishedEmbed],
                            components: [disabledRow]
                        })
                        .catch(() => null);
                }
            }

            /*
             * إنشاء نص الفائزين.
             */
            const winnersText = winners.length
                ? winners
                      .map(
                          winner =>
                              `${winner.medal} <@${winner.userId}> — **${winner.amount.toLocaleString(
                                  "en-US"
                              )} عملة**`
                      )
                      .join("\n")
                : "لم يتوقع أي عضو النتيجة الصحيحة.";

            /*
             * إعلان النتيجة والفائزين في قناة المباريات/الإحصائيات.
             */
            const resultEmbed = new EmbedBuilder()
                .setColor(0xf1c40f)
                .setTitle("🏆 نتائج مسابقة التوقعات")
                .setDescription(
                    `انتهت مباراة **${fixture.homeTeam} ضد ${fixture.awayTeam}**`
                )
                .addFields(
                    {
                        name: "النتيجة النهائية",
                        value: `**${fixture.homeTeam} ${homeScore} - ${awayScore} ${fixture.awayTeam}**`
                    },
                    {
                        name: "الفائزون",
                        value: winnersText
                    }
                )
                .setFooter({
                    text: "يتم ترتيب الفائزين حسب أسبقية إرسال التوقع"
                })
                .setTimestamp();

            const statisticsChannel =
                message.guild.channels.cache.get(
                    config.matchesChannelId
                );

            if (statisticsChannel?.isTextBased()) {
                await statisticsChannel.send({
                    embeds: [resultEmbed],
                    allowedMentions: {
                        users: winners.map(
                            winner => winner.userId
                        )
                    }
                });
            } else {
                await message.channel.send({
                    embeds: [resultEmbed],
                    allowedMentions: {
                        users: winners.map(
                            winner => winner.userId
                        )
                    }
                });
            }

            await message.reply(
                `✅ تم تسجيل النتيجة وتوزيع الجوائز بنجاح.\nعدد الفائزين: **${winners.length}**`
            );
        } catch (error) {
            console.error("Result command error:", error);

            await Fixture.findByIdAndUpdate(
                fixture._id,
                {
                    $set: {
                        status: "closed"
                    }
                }
            ).catch(() => null);

            return message.reply(
                "❌ حدث خطأ أثناء تسجيل النتيجة أو توزيع الجوائز."
            );
        }
    }
};
