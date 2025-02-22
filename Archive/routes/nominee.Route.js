const { Router } = require("express");
const Nominee = require('../models/nominee.Model')
const nomineeRouter = Router()

nomineeRouter.post('/add', async (req, res) => {
  try {
    const { userId, telegramId, walletAddress } = req.body;
    const nominee = new Nominee({ userId, telegramId, walletAddress });
    await nominee.save();
    res.status(201).json(nominee);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = nomineeRouter;