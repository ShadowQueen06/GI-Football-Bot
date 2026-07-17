const mongoose = require("mongoose");

const fixtureSchema = new mongoose.Schema(
  {
    guildId: {
      type: String,
      required: true
    },

    homeTeam: {
      type: String,
      required: true,
      trim: true
    },

    awayTeam: {
      type: String,
      required: true,
      trim: true
    },

    kickoffAt: {
      type: Date,
      required: true
    },

    status: {
      type: String,
      enum: ["open", "closed", "finished"],
      default: "open"
    },

    channelId: {
      type: String,
      required: true
    },

    messageId: {
      type: String,
      default: null
    },

    homeScore: {
      type: Number,
      default: null
    },

    awayScore: {
      type: Number,
      default: null
    },

    createdBy: {
      type: String,
      required: true
    },

    rewardsDistributed: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

fixtureSchema.index({
  guildId: 1,
  status: 1,
  kickoffAt: 1
});

module.exports =
  mongoose.models.Fixture ||
  mongoose.model("Fixture", fixtureSchema);
