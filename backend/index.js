import express from "express";
import mongoose, { get } from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import Wallet from "./models/wallet.js";
import cron from "node-cron";
import Web3 from "web3";
import http from "http";
import { Server } from "socket.io";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});
app.use(cors());
app.use(express.json());

mongoose
  .connect("mongodb://localhost:27017/wallet", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

const web3 = new Web3(
  new Web3.providers.HttpProvider(
    "https://sepolia.infura.io/v3/1a91b5d9c415499e9ef832508938e497"
  )
);

io.on("connection", (socket) => {
  console.log("socket connected:", socket.id);
});

app.post("/api/wallet", async (req, res) => {
  const { address } = req.body;
  console.log("above");

  const wallet = await Wallet.findOneAndUpdate(
    { address },
    { address },
    { upsert: true, new: true }
  );

  res.json(wallet);
});

app.post("/api/transaction", async (req, res) => {
  const { address, waddress, txHash, amount, type } = req.body;
  const wallet = await Wallet.findOne({ address });
  const withdraw = await Wallet.findOne({ address: waddress });
  if (wallet) {
    console.log("waddress", waddress);
    console.log("withdraw", withdraw);
    wallet.transactions.push({ txHash, amount, date: new Date(), type });
    withdraw.transactions.push({ txHash, amount, date: new Date(), type });
    await wallet.save();
    await withdraw.save();
    res.json(wallet);
    io.emit("New_Transaction", txHash);
  } else {
    res.status(404).json({ message: "Wallet not found" });
  }
});

app.post("/api/stake", async (req, res) => {
  const { address, amount } = req.body;
  try {
    const wallet = await Wallet.findOne({ address });
    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    wallet.stakes.push({
      amount,
      isActive: true,
    });

    await wallet.save();
    res.json({ message: "Stake added successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "server error" });
  }
});

app.get("/api/transaction/:address", async (req, res) => {
  const { address } = req.params;
  const wallet = await Wallet.findOne({ address });
  if (wallet) {
    const txData = wallet.transactions.map((tx) => ({
      txHash: tx.txHash,
      date: tx.date,
      amount: tx.amount,
      type: tx.type,
      validator: tx.validator,
    }));
    const txStack = wallet.stakes.map((tx) => ({
      stackAmount: tx.amount,
    }));
    console.log("txStack", txStack);

    console.log("txData", txData);

    res.json(txData);
  } else {
    res.json([]);
  }
});

app.get("/api/wallet", async (req, res) => {
  try {
    const getWallet = await Wallet.find({}, { address: 1 });
    res.status(200).json(getWallet);
  } catch (err) {
    console.log(err);
  }
});

app.get("/api/wallet/:address", async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ address: req.params.address });
    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }
    console.log("wallet", wallet);

    res.json(wallet);
  } catch (err) {
    console.error("Error fetching wallet:", err);
    res.status(500).json({ message: "Server error" });
  }
});

cron.schedule("*/2 * * * *", async () => {
  console.log("Checking for new transactions...");

  try {
    const wallets = await Wallet.find({});

    const latestBlock = Number(await web3.eth.getBlockNumber());
    console.log("latestBlock", latestBlock);

    for (let wallet of wallets) {
      const address = wallet.address.toLowerCase();
      console.log("address", address);

      let startBlock = latestBlock - 20;
      let endBlock = latestBlock;

      for (let i = startBlock + 1; i <= endBlock; i++) {
        const block = await web3.eth.getBlock(i, true);

        if (block && block.transactions.length > 0) {
          for (let tx of block.transactions) {
            if (
              tx &&
              (tx.from?.toLowerCase() === address ||
                tx.to?.toLowerCase() === address)
            ) {
              const exists = wallet.transactions.some(
                (t) => t.txHash === tx.hash
              );
              if (!exists) {
                try {
                  console.log(
                    "New transaction found for",
                    address,
                    "Hash:",
                    tx.hash
                  );

                  const allWallets = await Wallet.find(
                    {
                      address: { $ne: wallet.address },
                      "stakes.amount": { $gte: 32 },
                    },
                    { address: 1 }
                  );
                  console.log("allWallets", allWallets);

                  let validatorAddress = "no-validator";
                  if (allWallets.length > 0) {
                    const randomIndex = Math.floor(
                      Math.random() * allWallets.length
                    );
                    validatorAddress = allWallets[randomIndex].address;
                  }

                  wallet.transactions.push({
                    txHash: tx.hash,
                    amount: web3.utils.fromWei(tx.value, "ether"),
                    date: new Date(),
                    validator: validatorAddress,
                  });

                  await wallet.save();
                  io.emit("New_Transaction");
                } catch (err) {
                  console.log(err);
                }
              } else {
                console.log("Transaction already exists");
              }
            }
          }
        }
      }

      wallet.lastScannedBlock = endBlock;
      await wallet.save();
    }
  } catch (err) {
    console.log("Cron job error:", err);
  }
});

server.listen(5000, () => console.log("Server running on port 5000"));
