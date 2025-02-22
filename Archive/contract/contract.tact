import "@stdlib/deploy";

message TransferMessage {
    recipient: Address;
    amount: Int as coins;
}

contract TelegramTonTransfer {
    owner: Address;
    minAmount: Int as coins;
    maxAmount: Int as coins;
    
    init(owner: Address) {
        self.owner = owner;
        self.minAmount = ton("0.1");
        self.maxAmount = ton("10");
    }

    receive(msg: TransferMessage) {
        require(msg.amount >= self.minAmount, "Amount too small");
        require(msg.amount <= self.maxAmount, "Amount too large");
        
        // Forward TON to recipient
        send(SendParameters{
            to: msg.recipient,
            value: msg.amount,
            mode: SendRemainingValue + SendIgnoreErrors,
            body: "Transfer successful".asComment()
        });
    }

    get fun balance(): Int {
        return myBalance();
    }
}