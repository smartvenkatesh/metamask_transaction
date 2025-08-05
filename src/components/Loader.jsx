import React, { useState, useEffect } from "react";
import Web3 from "web3";
import axios from "axios";
import { IoMdCloseCircle } from "react-icons/io";
import { io } from "socket.io-client";
import { FaEthereum } from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";
import "../App.css";

const socket = io("http://localhost:5000");

const ConnectButton = () => {
  const [account, setAccount] = useState("");
  const [newAccount, setNewAccount] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [privateKey, setPrivateKey] = useState("");
  const [balance, setBalance] = useState("");
  const [dbAddresses, setDbAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [withdrawFrom, setWithdrawFrom] = useState("");
  const [depositAmount, setDepositAmount] = useState("");

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const Create = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        console.log("create", Create);
        const web3 = new Web3(window.ethereum);
        const accounts = await web3.eth.getAccounts();
        const selectedAccount = accounts[0];
        console.log("selectedAccount", selectedAccount);

        setAccount(selectedAccount);

        await axios.post("http://localhost:5000/api/wallet", {
          address: selectedAccount,
        });
      } catch (err) {
        console.log("Wallet connection error:", err);
      }
    } else {
      alert("Please install MetaMask");
    }
  };

  const withdrawAmount = async (toAddress, amountETH) => {
    if (!withdrawFrom) {
      toast.error("Please select an account to withdraw from.");
      return;
    }
    console.log("withdrawFrom", withdrawFrom);
    try {
      const res = await axios.get(
        `http://localhost:5000/api/wallet/${withdrawFrom}`
      );
      const str1 = "0x";
      const privateKey = str1 + res.data.key;
      console.log("privateKey", privateKey);

      const web3 = new Web3(
        "https://sepolia.infura.io/v3/1a91b5d9c415499e9ef832508938e497"
      );

      const fromAccount = web3.eth.accounts.privateKeyToAccount(privateKey);
      console.log("fromAccount", fromAccount);
      const nonce = await web3.eth.getTransactionCount(withdrawFrom, "latest");
      console.log("nonce", nonce);

      const tx = {
        from: withdrawFrom,
        to: account,
        value: web3.utils.toWei(amountETH, "ether"),
        gas: 21000,
        gasPrice: await web3.eth.getGasPrice(),
        nonce: nonce,
      };
      console.log("tx from withdraw", tx);
      const signedTx = await fromAccount.signTransaction(tx);
      console.log("signedTx", signedTx);
      const receipt = await web3.eth.sendSignedTransaction(
        signedTx.rawTransaction
      );
      console.log("receipt", receipt);

      console.log("Withdrawal transaction hash:", receipt.transactionHash);

      await axios.post("http://localhost:5000/api/transaction", {
        address: withdrawFrom,
        waddress: account,
        txHash: receipt.transactionHash,
        amount: amountETH,
        type: "withdraw",
      });

      toast.success(`Withdrawal of ${amountETH} ETH successful.`);
      handleSelectAddress(newAccount);
    } catch (err) {
      console.log("Withdrawal error:", err);
      toast.error("Withdrawal failed.");
    }
  };

  const getDetails = async (txHash) => {
    const web3 = new Web3(window.ethereum);
    try {
      const transaction = await web3.eth.getTransaction(txHash);
      console.log("transaction", transaction);

      return transaction;
    } catch (error) {
      console.log("Error:", error);
      return null;
    }
  };

  const sendTransaction = async () => {
    if (!account) return;

    const web3 = new Web3(window.ethereum);

    try {
      const tx = await web3.eth.sendTransaction({
        from: account,
        to: "0x78eA6Cfb4128515A52847142639b999D5fC49c57",
        value: web3.utils.toWei("0.001", "ether"),
      });

      console.log("Transaction hash:", tx.transactionHash);

      await axios.post("http://localhost:5000/api/transaction", {
        address: account,
        txHash: tx.transactionHash,
        amount: "0.001",
        type: "send",
      });

      const res = await axios.get(
        `http://localhost:5000/api/transaction/${account}`
      );
      const transactionDetails = await getDetails(txHash);
      console.log("txHash", txHash);
      console.log("Transaction Details:", transactionDetails);
      console.log("res.data", res.data);

      getDetails(txHash);
      setTransactions(res.data);
    } catch (err) {
      console.log("Transaction error:", err);
      toast.error(err);
    }
  };

  const createAccounts = async () => {
    const web3 = new Web3();
    const newAccount = web3.eth.accounts.create();
    console.log("New account:", newAccount);
    console.log("Private Key:", newAccount.privateKey);
    setAccount(newAccount.address);
    setPrivateKey(newAccount.privateKey);
    const signature = newAccount.sign("Hello, Web3.js!");
    console.log("Signature:", signature);

    await axios.post("http://localhost:5000/api/wallet", {
      address: newAccount.address,
      key: newAccount.privateKey,
    });
    const res = await axios.get(
      `http://localhost:5000/api/transaction/${newAccount.address}`
    );
    setTransactions(res.data);
  };

  const disConnect = () => {
    setAccount("");
    setBalance("");
    setTransactions([]);
  };
  useEffect(() => {
    socket.on("New_Transaction", (txHash) => {
      handleSelectAddress(newAccount);
    });

    const fetchDBAddresses = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/wallet");
        setDbAddresses(res.data);
        console.log("DB Addresses:", res.data);
      } catch (err) {
        console.log("Error fetching DB addresses:", err);
      }
    };

    fetchDBAddresses();
    return () => {
      socket.off("New_Transaction");
    };
  }, []);
  const notify = () =>
    toast("Selected Transaction History.", {
      duration: 4000,
      position: "top-center",

      // Styling
      style: {
        backgroundColor: "violet",
        color: "white",
      },
      className: "",
      // Custom Icon
      icon: "👏",

      // Change colors of success/error/loading icon
      iconTheme: {
        primary: "#000",
        secondary: "#fff",
      },

      // Aria
      ariaProps: {
        role: "status",
        "aria-live": "polite",
      },

      // Additional Configuration
      removeDelay: 1000,
    });

  const handleSelectAddress = async (selectedAddress) => {
    if (!selectedAddress) {
      setAccount("");
      setBalance("");
      setTransactions([]);
      return;
    }
    setLoading(true);
    setAccount(selectedAddress);
    setNewAccount(selectedAddress);

    const web3 = new Web3(window.ethereum);

    try {
      const balanceWei = await web3.eth.getBalance(selectedAddress);
      console.log("balanceWei", selectedAddress);
      const balanceETH = web3.utils.fromWei(balanceWei, "ether");
      console.log("balanceETH", balanceETH);
      setBalance(balanceETH.slice(0, 6));
    } catch (err) {
      console.log("Error fetching balance:", err);
      setBalance("");
    }

    try {
      const res = await axios.get(
        `http://localhost:5000/api/transaction/${selectedAddress}`
      );

      console.log("Transaction API response:", res.data);

      const txDetails = [];
      for (let i = 0; i < res.data.length; i++) {
        const txObj = res.data[i];
        if (!txObj.txHash) {
          console.log("Skipping transaction with undefined txHash:", txObj);
          continue;
        }

        const details = await getDetails(txObj.txHash);
        const allDate = txObj.date;

        if (details) {
          txDetails.push({
            ...details,
            date: new Date(allDate).toLocaleString("en-GB"),
            amount: txObj.amount,
            type: txObj.type,
            validator: txObj.validator,
          });
        }
      }

      console.log("Final transaction details:", txDetails);
      setTransactions(txDetails);
    } catch (err) {
      console.log("Error fetching transactions:", err);
      setTransactions([]);
    } finally {
      notify();
      setLoading(false);
    }
  };

  const depositToAccount = () => {
    axios
      .post("http://localhost:5000/api/stake", {
        address: newAccount,
        amount: depositAmount,
      })
      .then((res) => {
        toast.success(res.data.message);
      });
    setDepositAmount("");
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-md space-y-6">
      <h2 className="text-2xl font-bold text-center">MetaMask Wallet</h2>
      <span
        style={{
          position: "relative",
          top: "-50px",
          left: "480px",
          fontSize: "30px",
          color: "red",
        }}
      >
        <IoMdCloseCircle onClick={disConnect} />
      </span>

      <select
        className="w-full px-4 py-2 border rounded"
        onChange={(e) => handleSelectAddress(e.target.value)}
        value={account}
      >
        <option value="">Select Address</option>
        {dbAddresses.map((addr, idx) => (
          <option key={idx} value={addr.address}>
            {addr.address}
          </option>
        ))}
      </select>

      <div className="deposit">
        <input
          type="text"
          value={depositAmount}
          onChange={(e) => setDepositAmount(e.target.value)}
          id="deposit-input"
        />
        <button
          onClick={depositToAccount}
          className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
        >
          Add deposite
        </button>
      </div>

      <button
        onClick={connectWallet}
        className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
      >
        Connect Wallet
      </button>

      <button
        onClick={sendTransaction}
        disabled={!account}
        className={`w-full px-4 py-2 rounded transition ${
          account
            ? "bg-green-600 text-white hover:bg-green-700"
            : "bg-gray-400 text-gray-200 cursor-not-allowed"
        }`}
      >
        Send 0.001 ETH
      </button>

      <button
        onClick={createAccounts}
        className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
      >
        Create Offline Account
      </button>
      <select
        className="w-full px-4 py-2 border rounded"
        onChange={(e) => setWithdrawFrom(e.target.value)}
        value={withdrawFrom}
      >
        <option value="">Select Withdraw Account</option>
        {dbAddresses
          .filter((addr) => addr.address !== account)
          .map((addr, idx) => (
            <option key={idx} value={addr.address}>
              {addr.address}
            </option>
          ))}
      </select>

      <button
        onClick={() => withdrawAmount(withdrawFrom, "0.0001")}
        disabled={!withdrawFrom}
        className={`w-full px-4 py-2 rounded transition ${
          withdrawFrom
            ? "bg-yellow-600 text-white hover:bg-yellow-700"
            : "bg-gray-400 text-gray-200 cursor-not-allowed"
        }`}
      >
        Withdraw 0.0001 ETH
      </button>

      {loading && (
        <div className="flex flex-col items-center py-4">
          <FaEthereum className="animate-spin text-indigo-600 text-4xl" />
          <p className="mt-2 text-indigo-600 font-medium">Loading data...</p>
        </div>
      )}

      <div className="p-3 bg-gray-100 rounded hover:bg-gray-200 transition text-sm">
        <div>
          <h2 className="break-all text-center">
            <b>Address</b> : {account}
          </h2>
        </div>
        <div className="break-all text-center">
          <h2>
            <b>Balance</b> : {balance} ETH
          </h2>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Transaction History</h3>
        {transactions.length === 0 ? (
          <p className="text-gray-500">No transactions found.</p>
        ) : (
          <ul className="space-y-2 max-h-74 overflow-y-auto">
            {transactions.map((tx, idx) => {
              const isSent = tx.from?.toLowerCase() === account?.toLowerCase();
              const isWithdraw = tx.type === "withdraw";

              let bgColor = "bg-green-100";
              let textColor = "text-green-600";
              if (isWithdraw) {
                bgColor = "bg-yellow-100";
                textColor = "text-yellow-600";
              } else if (isSent) {
                bgColor = "bg-red-100";
                textColor = "text-red-600";
              }

              return (
                <li
                  key={idx}
                  className={`p-3 rounded transition text-sm ${bgColor}`}
                >
                  <p className="break-all">
                    <strong>Hash:</strong> {tx.hash}
                  </p>
                  <p>
                    <strong>Sender:</strong> {tx.from}
                  </p>
                  <p>
                    <strong>Receiver:</strong> {tx.to}
                  </p>
                  <p>
                    <strong>Validator:</strong>
                    {tx.validator}
                  </p>
                  <p>
                    <strong>Value:</strong>{" "}
                    {tx.value
                      ? Web3.utils.fromWei(tx.value, "ether") + " ETH"
                      : "0 ETH"}
                  </p>
                  <p>
                    <strong>Time & Date:</strong> {tx.date}
                  </p>
                  <p>
                    <strong>Type:</strong>{" "}
                    <span className={textColor}>
                      {tx.type ? tx.type : isSent ? "Send" : "Receive"}
                    </span>
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <Toaster />
    </div>
  );
};

export default ConnectButton;
