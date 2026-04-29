// TODO: Replace with your Firebase config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

let db;

try {
    if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
    } else {
        console.warn("Firebase is not configured yet. Please update js/firebase-config.js with your credentials.");
    }
} catch (e) {
    console.error("Firebase initialization failed:", e);
}

window.fetchFirebaseLeaderboard = async function() {
    if (!db) return [];
    try {
        const querySnapshot = await db.collection("leaderboard")
            .orderBy("score", "desc")
            .limit(10)
            .get();
        
        let formattedScores = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            formattedScores.push({
                addr: data.username || data.address || "Guest",
                score: data.score
            });
        });
        return formattedScores;
    } catch (e) {
        console.error("Error fetching leaderboard: ", e);
        return [];
    }
}

window.submitScoreToFirebase = async function(score) {
    if (!db) return false;
    try {
        const username = localStorage.getItem('bb_v1_username') || "Player";
        const address = window.userAddress || "Guest";
        
        await db.collection("leaderboard").add({
            username: username,
            address: address,
            score: score,
            timestamp: new Date().getTime()
        });
        
        if (typeof updateLeaderboardUI === 'function') {
            updateLeaderboardUI();
        }
        return true;
    } catch (e) {
        console.error("Error adding document: ", e);
        return false;
    }
}
