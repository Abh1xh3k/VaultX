const { TonClient } = require("ton");
const { mnemonicToWalletKey, mnemonicNew } = require("ton-crypto");
const { WalletContractV4 } = require("ton");
const TelegramBot = require("node-telegram-bot-api");
const { Address, toNano, fromNano } = require("ton-core");
const axios = require("axios");

require('dotenv').config();

if (!process.env.BOT_TOKEN || !process.env.TON_API_KEY) {
    throw new Error("BOT_TOKEN and TON_API_KEY are required in .env file");
}

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const userWallets = new Map();

// Initialize TON client with a stable endpoint
let client = null;

async function initClient() {
    const API_ENDPOINT = "https://toncenter.com/api/v2/jsonRPC"; 
    if (client) return client;
    
    // client = new TonClient({ endpoint: "https://tonapi.io/v2/jsonRPC" });

    // // client = new TonClient({ endpoit: "https://testnet.toncenter.com/api/v2/jsonRPC" });
    // return client;

    client = new TonClient({
        endpoint: API_ENDPOINT,
        apiKey: process.env.TON_API_KEY,
    });

    return client;

}

// Create and deploy a wallet
async function createWallet() {
    try {
        await initClient();
        const mnemonics = await mnemonicNew();
        const key = await mnemonicToWalletKey(mnemonics);
        const wallet = WalletContractV4.create({ publicKey: key.publicKey, workchain: 0 });

        const walletContract = client.open(wallet);
        const seqno = await walletContract.getSeqno();

        // Deploy if seqno is 0
        if (seqno === 0) {
            console.log("Deploying wallet...");

            await walletContract.sendTransfer({
                secretKey: key.secretKey,
                seqno: seqno,
                messages: []
            });

            console.log("✅ Wallet deployed successfully!");
        }

        return { wallet, key, mnemonics };
    } catch (error) {
        console.error("Error creating wallet:", error);
        throw error;
    }
}

// Telegram bot commands
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 
        "Welcome to TON TestNet Bot!\n\n" +
        "Commands:\n" +
        "/wallet - Create or show your wallet\n" +
        "/balance - Check your balance\n" +
        "/send @username amount - Send TON\n" +
        "/faucet - Get TestNet TON"
    );
});

bot.onText(/\/wallet/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    try {
        await initClient();
        let userWallet = userWallets.get(userId);

        if (!userWallet) {
            const { wallet, key, mnemonics } = await createWallet();
            userWallet = { address: wallet.address, key, mnemonics };
            userWallets.set(userId, userWallet);

            await bot.sendMessage(chatId, 
                `✅ New TestNet wallet created!\n\n` +
                `Address: ${userWallet.address.toString()}\n\n` +
                `⚠️ Save your seed phrase (sent in next message)!`
            );

            await bot.sendMessage(chatId, 
                `🔐 Your seed phrase:\n\n${userWallet.mnemonics.join(' ')}\n\n` +
                `Keep this safe and NEVER share it!`
            );
        } else {
            await bot.sendMessage(chatId, 
                `Your TestNet wallet:\n\n` +
                `Address: ${userWallet.address.toString()}`
            );
        }
    } catch (error) {
        console.error("Wallet creation error:", error);
        await bot.sendMessage(chatId, "❌ Error creating wallet. Please try again.");
    }
});

bot.onText(/\/balance/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    try {
        const userWallet = userWallets.get(userId);
        if (!userWallet) {
            await bot.sendMessage(chatId, "Please create a wallet first using /wallet");
            return;
        }

        // Fetch balance from TON API
        const { data } = await axios.get(`https://testnet.toncenter.com/api/v2/getAddressBalance`, {
            params: { address: userWallet.address.toString(), api_key: process.env.TON_API_KEY }
        });

        await bot.sendMessage(chatId, 
            `💰 Balance: ${fromNano(data.result)} TestNet TON\n` +
            `Address: ${userWallet.address.toString()}`
        );
    } catch (error) {
        console.error("Balance check error:", error);
        await bot.sendMessage(chatId, "❌ Error checking balance. Please try again.");
    }
});

bot.onText(/\/faucet/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 
        "To get TestNet TON:\n\n" +
        "1. Go to @testgiver_ton_bot\n" +
        "2. Send your wallet address\n" +
        "3. Wait for test TON\n\n" +
        "Use /wallet to see your address"
    );
});

bot.onText(/\/send @(\w+) (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const recipientUsername = match[1];
    const amount = parseFloat(match[2]);

    try {
        const senderWallet = userWallets.get(userId);
        if (!senderWallet) {
            await bot.sendMessage(chatId, "Please create a wallet first using /wallet");
            return;
        }

        if (isNaN(amount) || amount <= 0) {
            await bot.sendMessage(chatId, "Please specify a valid amount");
            return;
        }

        const { data } = await axios.get(`https://testnet.toncenter.com/api/v2/getAddressBalance`, {
            params: { address: senderWallet.address.toString(), api_key: process.env.TON_API_KEY }
        });

        if (fromNano(data.result) < amount) {
            await bot.sendMessage(chatId, 
                `Insufficient balance. You have ${fromNano(data.result)} TestNet TON\n` +
                "Need more? Use /faucet"
            );
            return;
        }

        const walletContract = client.open(senderWallet.wallet);

        await walletContract.sendTransfer({
            secretKey: senderWallet.key.secretKey,
            messages: [{
                to: senderWallet.address,
                value: toNano(amount.toString()),
                bounce: false
            }],
            seqno: await walletContract.getSeqno()
        });

        await bot.sendMessage(chatId, `✅ Sent ${amount} TestNet TON`);

    } catch (error) {
        console.error("Transfer error:", error);
        await bot.sendMessage(chatId, "❌ Transfer failed. Please try again.");
    }
});

// Start bot
initClient()
    .then(() => console.log('Bot started successfully! Running on TestNet.'))
    .catch((error) => {
        console.error('Failed to start bot:', error);
        process.exit(1);
    });
