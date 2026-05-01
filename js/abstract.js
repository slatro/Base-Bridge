import { createAbstractClient } from '@abstract-foundation/agw-client';
import { abstractTestnet } from 'viem/chains';
import { custom } from 'viem';

let abstractClient = null;
let abstractAccount = null;

export async function loginWithAbstract() {
    try {
        console.log("Attempting AGW Login...");
        
        if (!window.ethereum) {
            alert("Please install a wallet (like MetaMask) to use Abstract Global Wallet signer, or use the WalletConnect option.");
            return;
        }

        const [address] = await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        abstractClient = await createAbstractClient({
            chain: abstractTestnet,
            signer: window.ethereum,
        });

        abstractAccount = abstractClient.account;
        console.log("AGW Connected:", abstractAccount.address);
        
        // Sync with global window.userAddress for existing game logic
        window.userAddress = abstractAccount.address;
        
        // Trigger global UI updates (like the profile area in the menu)
        if (window.onWalletConnected) window.onWalletConnected(abstractAccount.address);
        
    } catch (err) {
        console.error("AGW Login Failed:", err);
    }
}

export function logoutWithAbstract() {
    abstractAccount = null;
    abstractClient = null;
    window.userAddress = null;
}

// Global exposure for non-module scripts
window.loginWithAbstract = loginWithAbstract;
window.logoutWithAbstract = logoutWithAbstract;

console.log("Abstract Integration Module Loaded");
