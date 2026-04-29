// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract LeaderboardReferral {
    // State variables
    mapping(address => uint256) public bestScores;
    mapping(address => address) public referredBy;
    mapping(address => uint256) public referralCount;
    mapping(address => uint256) public referralPoints;
    mapping(address => uint256) public lastSubmission;

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
        }
    }

    /**
     * @dev Simple getter for a player's best score.
     */
    function getPlayerScore(address player) external view returns (uint256) {
        return bestScores[player];
    }
}
