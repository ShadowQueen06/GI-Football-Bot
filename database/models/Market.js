const mongoose = require("mongoose");

const marketSchema = new mongoose.Schema(
    {
        guildId: {
            type: String,
            required: true,
            index: true
        },

        sellerId: {
            type: String,
            required: true,
            index: true
        },

        playerId: {
            type: String,
            required: true
        },

        cardId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },

        price: {
            type: Number,
            required: true,
            min: 1
        },

        status: {
            type: String,
            enum: ["active", "sold", "cancelled"],
            default: "active",
            index: true
        },

        buyerId: {
            type: String,
            default: null
        },

        soldAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

marketSchema.index({
    guildId: 1,
    status: 1,
    createdAt: -1
});

marketSchema.index(
    {
        guildId: 1,
        cardId: 1,
        status: 1
    },
    {
        unique: true,
        partialFilterExpression: {
            status: "active"
        }
    }
);

module.exports = mongoose.model("Market", marketSchema);
