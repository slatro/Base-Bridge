# Base Bridge Quest - Deployment Guide

This repository contains the smart contract and frontend code for a Web3 arcade game designed for Base Mainnet and Base Sepolia. The game features an onchain leaderboard, an offchain points economy, and a refer-to-earn viral loop.

## Smart Contract Deployment

The core smart contract logic is encapsulated in `contracts/LeaderboardReferral.sol`.

1. Use [Remix IDE](https://remix.ethereum.org/) or a local Hardhat/Foundry setup.
2. Compile `LeaderboardReferral.sol` with Solidity ^0.8.20.
3. Add the Base Sepolia network to your wallet:
   - Network Name: Base Sepolia
   - RPC URL: `https://sepolia.base.org`
   - Chain ID: `84532`
   - Currency: `ETH`
4. Deploy the compiled contract to **Base Sepolia**.
5. Copy the deployed contract address.
6. Open `js/web3.js` and update the `CONTRACT_ADDRESS` constant (line 2) with your newly deployed address.
7. The ABI is pre-configured in `js/web3.js`. If you modified the contract, remember to update the `CONTRACT_ABI` array.

## Frontend Deployment

The frontend is a purely static site built with HTML, CSS, and vanilla JS, meaning it can be hosted on any static hosting provider.

1. Create a GitHub repository and push these files (`index.html`, `css/`, `js/`, `contracts/`).
2. Go to [Vercel](https://vercel.com/) (or Netlify/GitHub Pages).
3. Import your repository and deploy. No build commands are required.
4. Once deployed, players can connect their wallets, switch to Base Sepolia, and play the game directly.

## Web3 Features

- **Wallet Connection:** Native integration using `ethers.js` via `window.ethereum` detection (MetaMask, Coinbase Wallet).
- **Network Switch:** Prompts the user to automatically switch to Base Sepolia (or adds it to their wallet if missing).
- **Refer-to-Earn:** Users can copy their referral link (e.g., `?ref=0xYourWalletAddress`). When new users submit a score while holding that referral, the referrer earns onchain points and referral counts tracking on the smart contract.
- **Gas-Efficient Leaderboard:** To save gas, scores are stored as `bestScore` per address, and `ScoreSubmitted` events are emitted on updates. The global leaderboard can be built efficiently offchain using indexers like The Graph or Goldsky.
# Base-Bridge
