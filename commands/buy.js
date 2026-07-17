const mongoose = require("mongoose");
const players = require("../data/players.json");
const User = require("../database/models/User");
const Market = require("../database/models/Market");
const getUser = require("../utils/getOrCreateUser");

const playersById = new Map(players.map(player => [player.id, player]));

module.exports = {
    name: "شراء",
    aliases: ["buy"],

    async execute(message, args) {
        const listingId = args[0];

        if (!mongoose.isValidObjectId(listingId)) {
            return message.reply("❌ الاستخدام: `شراء رقم_العرض`\nخذ رقم العرض من أمر **السوق**.");
        }

        const session = await mongoose.startSession();
        let purchaseResult = null;

        try {
            await session.withTransaction(async () => {
                const listing = await Market.findOne({
                    _id: listingId,
                    guildId: message.guild.id,
                    status: "active"
                }).session(session);

                if (!listing) {
                    throw new Error("LISTING_NOT_FOUND");
                }

                if (listing.sellerId === message.author.id) {
                    throw new Error("OWN_LISTING");
                }

                const buyer = await getUser(message.author.id, message.guild.id);
                const buyerDoc = await User.findById(buyer._id).session(session);
                const seller = await User.findOne({
                    discordId: listing.sellerId,
                    guildId: message.guild.id
                }).session(session);

                if (!seller) {
                    throw new Error("SELLER_NOT_FOUND");
                }

                const card = seller.cards.id(listing.cardId);
                if (!card || card.playerId !== listing.playerId) {
                    throw new Error("CARD_NOT_FOUND");
                }

                if (buyerDoc.giPoints < listing.price) {
                    throw new Error("INSUFFICIENT_BALANCE");
                }

                buyerDoc.giPoints -= listing.price;
                seller.giPoints += listing.price;
                buyerDoc.cards.push({ playerId: card.playerId });
                seller.cards.pull(card._id);

                listing.status = "sold";
                listing.buyerId = message.author.id;
                listing.soldAt = new Date();

                await buyerDoc.save({ session });
                await seller.save({ session });
                await listing.save({ session });

                purchaseResult = {
                    playerId: listing.playerId,
                    price: listing.price,
                    balance: buyerDoc.giPoints,
                    sellerId: listing.sellerId
                };
            });
        } catch (error) {
            const messages = {
                LISTING_NOT_FOUND: "❌ العرض غير موجود أو تم شراؤه/إلغاؤه.",
                OWN_LISTING: "❌ لا يمكنك شراء عرضك الخاص.",
                SELLER_NOT_FOUND: "❌ حساب البائع غير موجود.",
                CARD_NOT_FOUND: "❌ البطاقة لم تعد موجودة عند البائع.",
                INSUFFICIENT_BALANCE: "❌ رصيدك غير كافٍ لشراء هذه البطاقة."
            };

            if (messages[error.message]) {
                return message.reply(messages[error.message]);
            }
            throw error;
        } finally {
            await session.endSession();
        }

        const player = playersById.get(purchaseResult.playerId);
        const playerName = player?.name || purchaseResult.playerId;

        await message.reply(
            `✅ اشتريت **${playerName}** من <@${purchaseResult.sellerId}> مقابل **${purchaseResult.price.toLocaleString("en-US")} GP**.\nرصيدك الحالي: **${purchaseResult.balance.toLocaleString("en-US")} GP**`
        );
    }
};
