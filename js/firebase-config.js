// We are using a free, serverless Key-Value database (KVDB.io) 
// so you don't have to deal with Firebase configurations or CORS errors.

const KVDB_BUCKET = "3Bz5so9xQFGY6vAGb68Mfx";
const KVDB_URL = `https://kvdb.io/${KVDB_BUCKET}/leaderboard`;

window.fetchFirebaseLeaderboard = async function() {
    try {
        const timestamp = new Date().getTime();
        const response = await fetch(`${KVDB_URL}?t=${timestamp}`, { cache: 'no-store' });
        if (!response.ok) return [];
        const data = await response.json();
        if (!Array.isArray(data)) return [];
        
        return data;
    } catch (e) {
        console.error("Error fetching leaderboard: ", e);
        return [];
    }
}

window.submitScoreToFirebase = async function(score) {
    try {
        const username = localStorage.getItem('bb_v1_username') || "Player";
        
        // 1. Fetch current leaderboard
        let currentBoard = await window.fetchFirebaseLeaderboard();
        
        let myUUID = localStorage.getItem('bb_v1_uuid') || "unknown";
        let existingIndex = currentBoard.findIndex(e => e.uuid === myUUID || (e.addr === username && username !== "Player"));
        
        if (existingIndex >= 0) {
            if (score > currentBoard[existingIndex].score) {
                currentBoard[existingIndex].score = score;
                currentBoard[existingIndex].timestamp = new Date().getTime();
            }
            currentBoard[existingIndex].addr = username;
            currentBoard[existingIndex].uuid = myUUID;
        } else {
            currentBoard.push({
                uuid: myUUID,
                addr: username,
                score: score,
                timestamp: new Date().getTime()
            });
        }
        
        // 3. Sort descending and keep top 10
        currentBoard.sort((a,b) => b.score - a.score);
        currentBoard = currentBoard.slice(0, 10);
        
        // 4. Save back to KVDB
        await fetch(KVDB_URL, {
            method: 'POST',
            body: JSON.stringify(currentBoard)
        });
        
        if (typeof updateLeaderboardUI === 'function') {
            updateLeaderboardUI();
        }
        return true;
    } catch (e) {
        console.error("Error saving score: ", e);
        return false;
    }
}

// --- CLOUD PERSISTENCE ---

let syncTimeout = null;

window.syncDataToCloud = function() {
    if (typeof window.userAddress === 'undefined' || !window.userAddress) return;
    
    // Debounce to prevent spamming the KVDB api
    if (syncTimeout) clearTimeout(syncTimeout);
    
    syncTimeout = setTimeout(async () => {
        try {
            let state = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith('bb_v')) {
                    state[key] = localStorage.getItem(key);
                }
            }
            
            const userKey = `user_${window.userAddress.toLowerCase()}`;
            await fetch(`https://kvdb.io/${KVDB_BUCKET}/${userKey}`, {
                method: 'POST',
                body: JSON.stringify(state)
            });
            console.log("Game state synced to cloud for wallet:", window.userAddress);
        } catch(e) {
            console.error("Failed to sync game state to cloud:", e);
        }
    }, 1500); // Wait 1.5 seconds after last change
};

window.loadDataFromCloud = async function(walletAddress) {
    if (!walletAddress) return;
    try {
        const userKey = `user_${walletAddress.toLowerCase()}`;
        const timestamp = new Date().getTime();
        const res = await fetch(`https://kvdb.io/${KVDB_BUCKET}/${userKey}?t=${timestamp}`, { cache: 'no-store' });
        
        if (res.ok) {
            const data = await res.json();
            if (data && typeof data === 'object') {
                console.log("Cloud data found, restoring state...");
                for (let key in data) {
                    if (data.hasOwnProperty(key)) {
                        localStorage.setItem(key, data[key]);
                    }
                }
                return true; // Successfully loaded
            }
        } else {
            console.log("No cloud data found for this wallet. Uploading current local state...");
            window.syncDataToCloud(); // First time connecting, upload local data
        }
    } catch(e) {
        console.error("Failed to load cloud state:", e);
    }
    return false;
};
