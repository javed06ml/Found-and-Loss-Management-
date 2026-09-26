const mongoose = require("mongoose");

const claimSchema = new mongoose.Schema(
  {
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true
    },

    reason: {
      type: String,
      required: true
    },

    enrollmentNo: {
      type: String,
      required: true
    },

    department: {
      type: String,
      required: true
    },

    status: {
      type: String,
      enum: ["Under Review", "Approved", "Rejected", "Handed Over"],
      default: "Under Review"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Claim", claimSchema);