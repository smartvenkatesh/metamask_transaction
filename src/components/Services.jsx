import React from 'react'

const Services = () => {
  const getTransactionDetails = async (address) => {
    const web3 = new Web3(window.ethereum);
    const balance = await web3.eth.getTransaction(transactionHash,(error,transaction)=> {  
      if (error) {  
          console.log('Error:', error);  
      } else {  
          console.log('Transaction Details:', transaction);  
      }  
      });
    console.log('balance',balance);
    return balance;
  };

   const getBalance = async (address) => {
    const web3 = new Web3(window.ethereum);
    const balance = await web3.eth.getBalance(address);
    const balanceEth = web3.utils.fromWei(balance, "ether");
    console.log('balance',balance);
    console.log("Balance:", balanceEth);
    return balanceEth;
  };

  const addTokenToMetaMask = async () => {
  const tokenAddress = account;
  const tokenSymbol = 'SYM';
  const tokenDecimals = 18;
  const tokenImage = 'https://www.freepik.com/premium-vector/vector-illustration-flat-style-gold-coin-with-bitcoin-sign-cash-money_17392812.htm#from_element=cross_selling__vector';

  if (window.ethereum) {
    try {
      const wasAdded = await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20', // or 'ERC721' / 'ERC1155'
          options: {
            address: tokenAddress,
            symbol: tokenSymbol,
            decimals: tokenDecimals,
            image: tokenImage,
          },
        },
      });

      if (wasAdded) {
        console.log('Token added to MetaMask successfully!');
      } else {
        console.log('Token addition rejected.');
      }
    } catch (error) {
      console.log('Error adding token:', error);
    }
  } else {
    alert('MetaMask is not installed.');
  }
};


const getTransactionsFromEtherscan = async (address) => {
  const apiKey = "YOUR_ETHERSCAN_API_KEY"; // Replace with your key
  const url = `https://api.etherscan.io/api
    ?module=account
    &action=txlist
    &address=${address}
    &startblock=0
    &endblock=99999999
    &sort=desc
    &apikey=${apiKey}`;

  try {
    const response = await axios.get(url);
    const txs = response.data.result;
    console.log("Fetched transactions:", txs);
    return txs;
  } catch (err) {
    console.error("Etherscan fetch error:", err);
    return [];
  }
};

{/*
  
for (let i = latestBlock - 100; i <= latestBlock; i++) {
  const block = await web3.eth.getBlock(i, true);
  console.log("Checking block number:", i);
  console.log("Block data:", block);

  if (block && block.transactions && block.transactions.length > 0) {
    for (let txHash of block.transactions) {
      const tx = await web3.eth.getTransaction(txHash);
      console.log("Transaction details:", tx);

      if (tx && (tx.from?.toLowerCase() === address || tx.to?.toLowerCase() === address)) {
        const exists = wallet.transactions.some(t => t.txHash === tx.hash);
        if (!exists) {
          console.log("New transaction found for", address, "Hash:", tx.hash);

          wallet.transactions.push({
            txHash: tx.hash,
            amount: web3.utils.fromWei(tx.value, "ether"),
            date: new Date()
          });
          await wallet.save();
        }
      }
    }
  }
}
*/}



  return (
    <div>Services</div>
  )
}

export default Services