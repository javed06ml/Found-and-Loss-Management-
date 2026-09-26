const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    category: { type: String, required: true },
    location: { type: String, required: true },
    date: { type: String, required: true },

    description: {
      type: String,
      default: ""
    },

    type: {
      type: String,
      enum: ["Lost", "Found"],
      required: true
    },

    contactName: {
      type: String,
      required: true
    },

    contactNumber: {
      type: String,
      required: true
    },

    image: {
      type: String,
      default: ""
    },

    status: {
      type: String,
      default: "Reported"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Item", itemSchema);