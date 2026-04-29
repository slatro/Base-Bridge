// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract LeaderboardReferral {
    struct ScoreEntry {
        address player;
        uint256 score;
    }

    // State variables
    mapping(address => uint256) public bestScores;
    mapping(address => address) public referredBy;
    mapping(address => uint256) public referralCount;
    mapping(address => uint256) public referralPoints;
    mapping(address => uint256) public lastSubmission;

    ScoreEntry[10] public topScores;

    uint256 public constant SUBMISSION_COOLDOWN = 10 seconds;
    uint256 public constant POINTS_PER_REFERRAL = 100;

    // Events
    event ScoreSubmitted(address indexed player, uint256 score);
    event ReferralRegistered(address indexed referrer, address indexed referee);

    // Errors
    error CooldownActive();
    error SelfReferralNotAllowed();

    /**
     * @dev Submits a new score. Only updates bestScore if higher.
     * Enforces a cooldown between submissions to prevent spam.
     * Optionally registers a referrer if provided and not already referred.
     */
    function submitScore(uint256 score, address referrer) external {
        if (block.timestamp < lastSubmission[msg.sender] + SUBMISSION_COOLDOWN) {
            revert CooldownActive();
        }
        lastSubmission[msg.sender] = block.timestamp;

        // Handle referral registration
        if (referrer != address(0) && referrer != msg.sender && referredBy[msg.sender] == address(0)) {
            referredBy[msg.sender] = referrer;
            referralCount[referrer] += 1;
            referralPoints[referrer] += POINTS_PER_REFERRAL;
            emit ReferralRegistered(referrer, msg.sender);
        }

        // Handle score
        if (score > bestScores[msg.sender]) {
            bestScores[msg.sender] = score;
            emit ScoreSubmitted(msg.sender, score);
            _updateLeaderboard(msg.sender, score);
        }
    }

    function _updateLeaderboard(address player, uint256 score) internal {
        // Find where to insert
        uint256 insertIndex = 10;
        for (uint256 i = 0; i < 10; i++) {
            if (score > topScores[i].score) {
                insertIndex = i;
                break;
            }
        }

        if (insertIndex < 10) {
            // Check if player is already in leaderboard to avoid duplicates
            uint256 existingIndex = 10;
            for (uint256 i = 0; i < 10; i++) {
                if (topScores[i].player == player) {
                    existingIndex = i;
                    break;
                }
            }

            // If player exists and is already ranked higher, do nothing
            if (existingIndex < insertIndex) {
                return;
            }

            // Shift elements down
            // If player was already in the list below the insert index, shift down to their old position
            uint256 shiftEnd = existingIndex < 10 ? existingIndex : 9;
            
            for (uint256 i = shiftEnd; i > insertIndex; i--) {
                topScores[i] = topScores[i - 1];
            }

            // Insert new score
            topScores[insertIndex] = ScoreEntry(player, score);
        }
    }

    /**
     * @dev Simple getter for a player's best score.
     */
    function getPlayerScore(address player) external view returns (uint256) {
        return bestScores[player];
    }

    /**
     * @dev Returns the top 10 scores
     */
    function getTopScores() external view returns (ScoreEntry[10] memory) {
        return topScores;
    }
}
