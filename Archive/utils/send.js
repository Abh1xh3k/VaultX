const TonWeb = require('tonweb');
const TonWebMnemonic = require('tonweb-mnemonic');
const BN = require('bn.js');

// Configure provider with custom error handling
class CustomProvider extends TonWeb.HttpProvider {
    async send(method, params) {
        try {
            const response = await super.send(method, params);
            if (response === 'Network not allowed') {
                throw new Error('Network permission denied. Please check your API key permissions.');
            }
            return response;
        } catch (error) {
            throw new Error(`Provider error: ${error.message}`);
        }
    }
}

const tonweb = new TonWeb(new CustomProvider('https://toncenter.com/api/v2/jsonRPC', {
    apiKey: '59ef54c62817a54155b71538c7766ca0e22239c7f14b2300b2a7ce3680d81faf',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
}));

const walletMnemonic = 'embody fish hidden round giggle give shadow burst siren guitar bronze liar fence broken ugly little march holiday left gaze humble flip strike exact';
const recipientAddress = 'UQArhOE1PKcsv020AS9UtaYAuh42oBJDMySkxC1b7ikS_nDP';
const amount = '0.5';

async function sendTon() {
    try {
        // Verify API connectivity first
        try {
            await tonweb.provider.getMethodsName();
        } catch (error) {
            if (error.message.includes('Network not allowed')) {
                throw new Error('API key does not have required permissions. Please check your TON Center API key settings.');
            }
            throw error;
        }

        // Convert mnemonic to key pair
        const keyPair = await TonWebMnemonic.mnemonicToKeyPair(walletMnemonic.split(' '));
        
        // Initialize wallet contract
        const WalletClass = tonweb.wallet.all.v4R2;
        const wallet = new WalletClass(tonweb.provider, {
            publicKey: keyPair.publicKey,
            wc: 0
        });
        
        // Get wallet address
        const walletAddress = await wallet.getAddress();
        console.log('✅ Your Wallet Address:', walletAddress.toString(true, true, true));
        
        // Check wallet balance with error handling
        let balance;
        try {
            balance = await tonweb.provider.getBalance(walletAddress);
            console.log('💰 Current balance:', TonWeb.utils.fromNano(balance), 'TON');
        } catch (error) {
            throw new Error(`Failed to fetch balance: ${error.message}`);
        }
        
        // Validate balance before conversion
        if (!balance || balance === '0') {
            throw new Error('Could not fetch wallet balance or balance is zero');
        }

        const amountInNano = TonWeb.utils.toNano(amount);
        if (new BN(balance).lt(new BN(amountInNano))) {
            throw new Error(`Insufficient balance. Have: ${TonWeb.utils.fromNano(balance)} TON, Need: ${amount} TON`);
        }
        
        // Get seqno with proper error handling
        let seqno;
        try {
            seqno = await wallet.methods.seqno().call();
            seqno = seqno || '0';
            console.log('ℹ️ Current seqno:', seqno);
        } catch (error) {
            throw new Error(`Failed to get seqno: ${error.message}`);
        }
        
        // Create transfer
        const transfer = wallet.methods.transfer({
            secretKey: keyPair.secretKey,
            toAddress: recipientAddress,
            amount: amountInNano.toString(),
            seqno: seqno,
            sendMode: 3,
            payload: '',
            bounce: true
        });
        
        // Estimate fees with error handling
        try {
            const fees = await transfer.estimateFee();
            console.log('💸 Estimated fees:', TonWeb.utils.fromNano(fees.toString()), 'TON');
        } catch (error) {
            throw new Error(`Failed to estimate fees: ${error.message}`);
        }
        
        // Send transaction
        console.log('🚀 Sending transaction...');
        const result = await transfer.send();
        console.log('🎉 Transaction sent:', result);
        
        // Monitor transaction
        let confirmed = false;
        const maxAttempts = 10;
        
        for (let i = 0; i < maxAttempts && !confirmed; i++) {
            await sleep(3000);
            try {
                const newSeqno = await wallet.methods.seqno().call();
                if (newSeqno > seqno) {
                    console.log('✅ Transaction confirmed!');
                    confirmed = true;
                    break;
                }
                console.log(`⏳ Checking confirmation (${i + 1}/${maxAttempts})...`);
            } catch (error) {
                console.log('⚠️ Error checking confirmation:', error.message);
            }
        }
        
        if (!confirmed) {
            console.log('⚠️ Transaction sent but confirmation not received. Please check your wallet.');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Execute the transaction
sendTon();