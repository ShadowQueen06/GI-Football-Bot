const mongoose = require("mongoose");

const economySchema = new mongoose.Schema(
    {
        guildId: {
            type: String,
            required: true
        },

        userId: {
            type: String,
            required: true
        },

        balance: {
            type: Number,
            default: 0,
            min: 0
        },

        lastRewardAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

economySchema.index(
    {
        guildId: 1,
        userId: 1
    },
    {
        unique: true
    }
);

module.exports =
    mongoose.models.Economy ||
    mongoose.model("Economy", economySchema);
