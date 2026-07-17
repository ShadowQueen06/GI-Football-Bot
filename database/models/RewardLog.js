const mongoose = require("mongoose");

const rewardLogSchema = new mongoose.Schema(
  {
    fixtureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Fixture",
      required: true
    },

    userId: {
      type: String,
      required: true
    },

    position: {
      type: Number,
      enum: [1, 2, 3],
      required: true
    },

    amount: {
      type: Number,
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports =
  mongoose.models.RewardLog ||
  mongoose.model("RewardLog", rewardLogSchema);
