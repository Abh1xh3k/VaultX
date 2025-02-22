const User = require('../models/user.Model');
const { getTransactions, getBalance} = require('../utils/crypto');

const router = require('express').Router()

router.get('/transactions', async (req, res) => {
    const address = req.query.address

   const result = await getTransactions(address);
   console.log(result?.result[0]?.utime);
   res.status(200).json({ status:true, data:result?.result[0]?.utime})
   
});

router.get('/balance', async (req, res) => {
    const address = req.query.address
    console.log(address)
    const result = await getBalance(address)
    res.status(200).json({ status:true, data:result?.result?.balance})
})

router.get("/update-activity", async (req, res) => {
    try {
    
    const users = await User.find();
    for (const user of users) {
        const address = user.address;
        const result = await getTransactions(address);
        console.log(result?.result[0]?.utime);
        res.status(200).json({ status:true, data:result?.result[0]?.utime})
    }
    res.status(200).json({ status: true, data: users });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  


module.exports = router