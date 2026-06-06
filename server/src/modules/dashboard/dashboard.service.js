import Issue from "../issues/issue.model.js";
import Project from "../projects/project.model.js";
import User from "../users/user.model.js";
import Wiki from "../wiki/wiki.model.js";
import Comment from "../comments/comment.model.js";

export const getUserDashboardStats = async (userId, tenantId) => {
  const [
    issuesReported,
    resolvedIssues,
    wikiArticles,
    approvedWikiArticles,
    projectsCreated,
    projectsContributing,
    commentsPosted,
    wikiQuestions,
    wikiContributions,
    user,
    recentIssues,
    recentWiki,
    recentComments,
    recentProjects,
  ] = await Promise.all([
    Issue.countDocuments({ tenantId, reportedBy: userId }),
    Issue.countDocuments({ tenantId, reportedBy: userId, status: "RESOLVED" }),
    Wiki.countDocuments({ tenantId, author: userId }),
    Wiki.countDocuments({ tenantId, author: userId, status: "APPROVED" }),
    Project.countDocuments({ tenantId, createdBy: userId }),
    Project.countDocuments({ tenantId, contributors: userId }),
    Comment.countDocuments({ tenantId, user: userId }),
    Wiki.countDocuments({ tenantId, author: userId, type: "QUESTION" }),
    Wiki.countDocuments({ tenantId, author: userId, type: "ARTICLE" }),
    User.findOne({ _id: userId, tenantId }).select(
      "name email role reputation verified",
    ),
    Issue.find({ tenantId, reportedBy: userId })
      .sort({ createdAt: -1 })
      .limit(6)
      .select("title severity status region createdAt")
      .lean(),
    Wiki.find({ tenantId, author: userId })
      .sort({ createdAt: -1 })
      .limit(8)
      .select("title type status region tags createdAt")
      .lean(),
    Comment.find({ tenantId, user: userId })
      .sort({ createdAt: -1 })
      .limit(8)
      .select("content refType refId isAccepted createdAt")
      .lean(),
    Project.find({
      tenantId,
      $or: [{ createdBy: userId }, { contributors: userId }],
    })
      .sort({ createdAt: -1 })
      .limit(6)
      .select("title status progress createdBy createdAt")
      .lean(),
  ]);

  const issueRefIds = recentComments
    .filter((comment) => comment.refType === "ISSUE")
    .map((comment) => comment.refId);
  const wikiRefIds = recentComments
    .filter((comment) => comment.refType === "WIKI")
    .map((comment) => comment.refId);

  const [commentIssues, commentWiki] = await Promise.all([
    issueRefIds.length
      ? Issue.find({ tenantId, _id: { $in: issueRefIds } }).select("title").lean()
      : [],
    wikiRefIds.length
      ? Wiki.find({ tenantId, _id: { $in: wikiRefIds } }).select("title type").lean()
      : [],
  ]);

  const issueTitleById = new Map(
    commentIssues.map((issue) => [issue._id.toString(), issue.title]),
  );
  const wikiMetaById = new Map(
    commentWiki.map((wiki) => [
      wiki._id.toString(),
      { title: wiki.title, type: wiki.type },
    ]),
  );

  return {
    profile: user,
    stats: {
      issuesReported,
      resolvedIssues,
      wikiArticles,
      approvedWikiArticles,
      wikiQuestions,
      wikiContributions,
      projectsCreated,
      projectsContributing,
      commentsPosted,
    },
    recentActivity: {
      issues: recentIssues,
      wiki: recentWiki,
      comments: recentComments.map((comment) => {
        const refId = comment.refId?.toString();
        const wikiMeta = comment.refType === "WIKI" ? wikiMetaById.get(refId) : null;

        return {
          ...comment,
          targetTitle:
            comment.refType === "ISSUE"
              ? issueTitleById.get(refId) || "Issue discussion"
              : wikiMeta?.title || "Knowledge discussion",
          targetType: wikiMeta?.type || comment.refType,
        };
      }),
      projects: recentProjects.map((project) => ({
        ...project,
        relation:
          project.createdBy?.toString() === String(userId) ? "CREATED" : "JOINED",
      })),
    },
  };
};

export const getAdminDashboardStats = async (tenantId) => {
  const [
    totalUsers,
    totalIssues,
    pendingWikiArticles,
    totalProjects,
    roleSplit,
    issueStatus,
    projectStatus,
    regionalMetrics,
    recentIssues,
    recentProjects,
  ] = await Promise.all([
    User.countDocuments({ tenantId }),
    Issue.countDocuments({ tenantId }),
    Wiki.countDocuments({ tenantId, status: "PENDING" }),
    Project.countDocuments({ tenantId }),
    User.aggregate([
      { $match: { tenantId } },
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
        },
      },
    ]),
    Issue.aggregate([
      { $match: { tenantId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]),
    Project.aggregate([
      { $match: { tenantId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]),
    Issue.aggregate([
      { $match: { tenantId } },
      {
        $group: {
          _id: { $ifNull: ["$region", "Unknown"] },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]),
    Issue.find({ tenantId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title severity status createdAt")
      .populate("reportedBy", "name"),
    Project.find({ tenantId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title status progress createdAt")
      .populate("createdBy", "name"),
  ]);

  return {
    users: totalUsers,
    issues: totalIssues,
    projects: totalProjects,
    pendingArticles: pendingWikiArticles,
    roleSplit,
    issueStatus,
    projectStatus,
    regionalMetrics,
    recent: {
      issues: recentIssues,
      projects: recentProjects,
    },
  };
};

export const getLeaderboardStats = async (tenantId) => {
  const topUsers = await User.find({ tenantId })
    .sort({ reputation: -1 })
    .limit(10)
    .select("name email role reputation badges verified")
    .lean();

  const counts = await Promise.all(
    topUsers.map(async (user) => {
      const [
        issuesReported,
        approvedArticles,
        commentsPosted,
        projectsContributed,
      ] = await Promise.all([
        Issue.countDocuments({ tenantId, reportedBy: user._id }),
        Wiki.countDocuments({ tenantId, author: user._id, status: "APPROVED" }),
        Comment.countDocuments({ tenantId, user: user._id }),
        Project.countDocuments({ tenantId, contributors: user._id }),
      ]);
      return {
        ...user,
        issuesReported,
        approvedArticles,
        commentsPosted,
        projectsContributed,
      };
    }),
  );

  return {
    topContributors: counts,
    totalLeaders: topUsers.length,
  };
};

export const getModerationQueue = async (tenantId) => {
  const [flaggedComments, spamIssues] = await Promise.all([
    Comment.find({ tenantId, flagged: true })
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean(),
    Issue.find({ tenantId, isSpam: true })
      .populate("reportedBy", "name email")
      .sort({ createdAt: -1 })
      .limit(20)
      .select("title description severity reportedBy createdAt")
      .lean(),
  ]);

  return { flaggedComments, spamIssues };
};
