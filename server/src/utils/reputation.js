import User from "../modules/users/user.model.js";

/**
 * Reputation scoring weights.
 * Adjust these to tune the contribution score algorithm.
 */
const WEIGHTS = {
  ISSUE_REPORTED: 5,
  ISSUE_RESOLVED: 15,
  ISSUE_VERIFIED: 10,
  COMMENT_ADDED: 2,
  WIKI_PUBLISHED: 20,
  PROJECT_CREATED: 10,
  PROJECT_CONTRIBUTED: 5,
  HELPFUL_ANSWER: 10,
  BEST_ANSWER: 25
};

/**
 * Award reputation points to a user.
 * @param {string} userId
 * @param {keyof typeof WEIGHTS} action
 */
export const awardReputation = async (userId, action) => {
  const points = WEIGHTS[action];
  if (!points) return;

  await User.findByIdAndUpdate(userId, {
    $inc: { reputation: points }
  });
};

/**
 * Badge definitions.
 * A user earns a badge when they cross the threshold for a given metric.
 */
export const BADGES = {
  FIRST_REPORT: { name: "First Report", description: "Reported your first issue", threshold: 1, metric: "issuesReported" },
  COMMUNITY_VOICE: { name: "Community Voice", description: "Posted 10 comments", threshold: 10, metric: "commentsPosted" },
  WATER_GUARDIAN: { name: "Water Guardian", description: "Resolved 5 issues", threshold: 5, metric: "issuesResolved" },
  KNOWLEDGE_SHARER: { name: "Knowledge Sharer", description: "Published 3 wiki articles", threshold: 3, metric: "wikiPublished" },
  TEAM_PLAYER: { name: "Team Player", description: "Contributed to 3 projects", threshold: 3, metric: "projectsContributed" }
};

/**
 * Check and award badges to a user based on their current stats.
 * @param {string} userId
 * @param {object} stats — { issuesReported, commentsPosted, issuesResolved, wikiPublished, projectsContributed }
 */
export const checkBadges = async (userId, stats) => {
  const earned = [];

  for (const [key, badge] of Object.entries(BADGES)) {
    if ((stats[badge.metric] || 0) >= badge.threshold) {
      earned.push(key);
    }
  }

  if (earned.length > 0) {
    await User.findByIdAndUpdate(userId, {
      $addToSet: { badges: { $each: earned } }
    });
  }

  return earned;
};

export { WEIGHTS };
