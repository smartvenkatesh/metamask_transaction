import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema({
  txHash: String,
  amount: String,
  validator: String,
  date: Date,
  lastScannedBlock: {
    type: Number,
    default: 0,
  },
  type: {
    type: String,
    enum: ["send", "withdraw", "deposit"],
  },
});

const stakeSchema = new mongoose.Schema({
  amount: Number,
  isActive: { type: Boolean, default: true },
  rewards: { type: Number, default: 0 },
});

const WalletSchema = new mongoose.Schema({
  address: { type: String, unique: true },
  // key: { type: String, unique: true },
  transactions: [TransactionSchema],
  stakes: [stakeSchema],
  lastScannedBlock: Number,
});

export default mongoose.model("Wallet", WalletSchema);

// 0xbf4bcef6dbe80cdbef229cbdabad54f065f3973c40d580fea96f4b8aa5b19f1c

// wallet address - 0x54d4f74829cef3bf1aa03e83190283c0979e3479

// 0x5ddf4aff5784477c9dd2d906b8a62479fc5001d96d5ff7a3467679daa11ec0e0

// if (window.ethereum) {
//   const provider = new BrowserProvider(window.ethereum);
//   const signer = new provider.getSigner();
//   console.log('signer',signer);
//   const selectedAccount = await signer.getAddress();
//   setAccount(selectedAccount);
//   console.log("Current account:", selectedAccount);
// }

// tackle deer tourist mom ripple spare giggle share assault wish shift error

// curl --url https://mainnet.infura.io/v3/1a91b5d9c415499e9ef832508938e497 \
// -X POST \
// -H "Content-Type: application/json" \
// -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

// {"jsonrpc":"2.0","id":1,"result":"0x15d0ea7"}
