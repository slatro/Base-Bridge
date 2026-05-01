import { createAbstractClient } from '@abstract-foundation/agw-client';
import { abstractTestnet } from 'viem/chains';

let abstractClient = null;
let abstractAccount = null;
let agwProvider = null;

// EIP-6963 Discovery for specific Abstract Global Wallet
function initDiscovery() {
    window.addEventListener("eip6963:announceProvider", (event) => {
        const { info, provider } = event.detail;
        console.log("Found provider:", info.name, info.rdns);
        // Abstract Global Wallet RDNS is usually xyz.abs.agw
        if (info.rdns === "xyz.abs.agw" || info.name.toLowerCase().includes("abstract")) {
            agwProvider = provider;
            console.log("AGW Provider specifically matched and saved.");
        }
    });
    window.dispatchEvent(new Event("eip6963:requestProvider"));
}

initDiscovery();

export async function loginWithAbstract() {
    try {
        console.log("Attempting AGW Login (Extension or Universal)...");
        
        let signer = agwProvider;
        
        // If not found via EIP-6963, try window.abstract (Legacy)
        if (!signer && window.abstract) signer = window.abstract;
        
        // If still not found, DO NOT use window.ethereum directly as it triggers Rabby
        if (!signer) {
            console.log("Specific AGW provider not found. Redirecting to WalletConnect for Universal Login.");
            if (window.connectWallet) {
                // Show a brief info modal instead of alert for better UX
                if (window.showInfoModal) {
                    window.showInfoModal("Connecting to Abstract", "Abstract extension not detected. Opening WalletConnect for social/email login...");
                }
                setTimeout(() => {
                    window.connectWallet('walletconnect');
                    window.closeModals();
                }, 1000);
            }
            return;
        }

        console.log("Using specific AGW signer to bypass Rabby.");
        const accounts = await signer.request({ method: 'eth_requestAccounts' });
        const address = accounts[0];
        
        abstractClient = await createAbstractClient({
            chain: abstractTestnet,
            signer: signer,
        });

        abstractAccount = abstractClient.account;
        window.userAddress = abstractAccount.address;
        
        if (window.onWalletConnected) window.onWalletConnected(abstractAccount.address);
        window.closeModals();
        
    } catch (err) {
        console.error("AGW Login Failed:", err);
        if (err.message && err.message.includes("rejected")) {
            console.log("User rejected the connection.");
        }
    }
}

export function logoutWithAbstract() {
    abstractAccount = null;
    abstractClient = null;
    window.userAddress = null;
}

window.loginWithAbstract = loginWithAbstract;
window.logoutWithAbstract = logoutWithAbstract;

console.log("Abstract Integration V2 (Rabby Bypass) Loaded");
