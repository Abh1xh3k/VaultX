const { default: mongoose } = require("mongoose");

const NomineeSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    telegramId: { type: String, required: true },
    walletAddress: { type: String, required: true },
  }, { timestamps: true });
  const Nominee = mongoose.model('Nominee', NomineeSchema);
  module.exports = Nominee;
