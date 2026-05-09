const mongoose = require("mongoose");

const statementSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    fileName: {
      type: String,
      required: [true, "File name is required"],
    },
    aiResponse: {
      type: Object,
      required: [true, "AI response is required"],
    },
    prompt: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

// Index to speed up queries by userId
statementSchema.index({ userId: 1 });

module.exports = mongoose.model("Statement", statementSchema);
