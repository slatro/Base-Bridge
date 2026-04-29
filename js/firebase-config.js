// We are using a free, serverless Key-Value database (KVDB.io) 
// so you don't have to deal with Firebase configurations or CORS errors.

const KVDB_BUCKET = "3Bz5so9xQFGY6vAGb68Mfx";
const KVDB_URL = `https://kvdb.io/${KVDB_BUCKET}/leaderboard`;

window.fetchFirebaseLeaderboard = async function() {
    try {
        const response = await fetch(KVDB_URL);
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
        
        // 2. Add new score
        currentBoard.push({
            addr: username, // show username on the board
            score: score,
            timestamp: new Date().getTime()
        });
        
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
