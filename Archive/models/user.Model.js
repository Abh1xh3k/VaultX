const { default: mongoose } = require("mongoose");

const UserSchema = new mongoose.Schema({
    telegramId: { type: String, required: true, unique: true },
    walletAddress: { type: String, required: true },
    inactivityPeriod: { type: Number, required: true },
    nominee: { type: mongoose.Schema.Types.ObjectId, ref: 'Nominee' },
    isActive: { type: Boolean, default: true },
    balance: { type: Number, default: 0 },
    lastTxn : { type:Date, default:null}
  }, { timestamps: true });
  const User = mongoose.model('User', UserSchema);
  module.exports = User;