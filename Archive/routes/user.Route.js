const { Router } = require("express");

const userRouter = Router()

const User = require('../models/user.Model')

userRouter.get('/profile/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    // Validate user ID
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Find user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json(user);

  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({ error: error.message });
  }
});


userRouter.post('/register', async (req, res) => {
  try {
    const { telegramId, walletAddress, inactivityPeriod } = req.body;
    console.log(req.body);

    // Validate required fields
    if (!telegramId || !walletAddress || !inactivityPeriod) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ telegramId });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const user = new User({ 
      telegramId, 
      walletAddress, 
      inactivityPeriod,
    });

    await user.save();
    console.log("User created:", user);
    return res.status(201).json(user);

  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = userRouter;
