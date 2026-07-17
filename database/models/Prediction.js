const mongoose = require("mongoose");

const predictionSchema = new mongoose.Schema(
  {
    guildId: {
      type: String,
      required: true
    },

    fixtureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Fixture",
      required: true
    },

    userId: {
      type: String,
      required: true
    },

    homeScore: {
      type: Number,
      required: true
    },

    awayScore: {
      type: Number,
      required: true
    }
  },
  {
    timestamps: true
  }
);

predictionSchema.index(
  {
    fixtureId: 1,
    userId: 1
  },
  {
    unique: true
  }
);

module.exports =
  mongoose.models.Prediction ||
  mongoose.model("Prediction", predictionSchema);
