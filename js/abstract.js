import { createAbstractClient } from '@abstract-foundation/agw-client';
import { abstractTestnet } from 'viem/chains';
import { custom } from 'viem';

let abstractClient = null;
let abstractAccount = null;

const btnLogin = document.getElementById('btn-agw-login');
const statusBadge = document.getElementById('agw-status-badge');
const addressText = document.getElementById('agw-address-text');

export async function loginWithAbstract() {
    try {
        console.log("Attempting AGW Login...");
        
        // Ensure window.ethereum exists or similar for the signer
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
        
        updateUI(abstractAccount.address);
        
        // Sync with global window.userAddress for existing game logic
        window.userAddress = abstractAccount.address;
        if (window.onWalletConnected) window.onWalletConnected(abstractAccount.address);
        
    } catch (err) {
        console.error("AGW Login Failed:", err);
    }
}

export function logoutWithAbstract() {
    abstractAccount = null;
    abstractClient = null;
    window.userAddress = null;
    updateUI(null);
}

function updateUI(address) {
    if (address) {
        btnLogin.classList.add('hidden');
        statusBadge.classList.remove('hidden');
        addressText.innerText = address.slice(0, 6) + '...' + address.slice(-4);
    } else {
        btnLogin.classList.remove('hidden');
        statusBadge.classList.add('hidden');
    }
}

// Global exposure for non-module scripts
window.loginWithAbstract = loginWithAbstract;
window.logoutWithAbstract = logoutWithAbstract;

// Auto-login check if already connected (optional)
btnLogin?.addEventListener('click', loginWithAbstract);
statusBadge?.addEventListener('click', () => {
    if (confirm("Do you want to disconnect Abstract Global Wallet?")) {
        logoutWithAbstract();
    }
});

console.log("Abstract Integration Module Loaded");
