export const ROLES = {
  ADMIN: "ADMIN",
  MEMBER: "MEMBER",
  VIEWER: "VIEWER",
};

export const PERMISSIONS = {
  ISSUE_READ: "issue:read",
  USER_DASHBOARD_READ: "dashboard:user:read",
  LEADERBOARD_READ: "dashboard:leaderboard:read",
  ADMIN_DASHBOARD_READ: "dashboard:admin:read",
  MODERATION_QUEUE_READ: "dashboard:moderation:read",
  PROJECT_READ: "project:read",
  COMMUNITY_READ: "community:read",
  COMMUNITY_CONTRIBUTE: "community:contribute",
  COMMENT_READ: "comment:read",
  MODERATION_REVIEW: "moderation:review",
  WIKI_CREATE: "wiki:create",
  WIKI_READ: "wiki:read",
  WIKI_UPDATE_OWN: "wiki:update:own",
  WIKI_MODERATE: "wiki:moderate",
  ISSUE_CREATE: "issue:create",
  ISSUE_VERIFY: "issue:verify",
  ISSUE_DELETE_OWN: "issue:delete:own",
  ISSUE_DELETE_ANY: "issue:delete:any",
  PROJECT_CREATE: "project:create",
  PROJECT_JOIN: "project:join",
  PROJECT_UPDATE_PROGRESS_OWN: "project:update:own-progress",
  COMMENT_CREATE: "comment:create",
  COMMENT_UPDATE_OWN: "comment:update:own",
  COMMENT_DELETE_OWN: "comment:delete:own",
  COMMENT_DELETE_ANY: "comment:delete:any",
  COMMENT_FLAG: "comment:flag",
  COMMENT_VOTE: "comment:vote",
  COMMENT_ACCEPT: "comment:accept",
  REPORT_CREATE: "report:create",
  REPORT_REVIEW: "report:review",
  AI_CLASSIFY: "ai:classify",
  AI_DUPLICATES: "ai:duplicates",
  AI_RECOMMEND: "ai:recommend",
};

const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS),
  [ROLES.MEMBER]: [
    PERMISSIONS.ISSUE_READ,
    PERMISSIONS.USER_DASHBOARD_READ,
    PERMISSIONS.LEADERBOARD_READ,
    PERMISSIONS.PROJECT_READ,
    PERMISSIONS.COMMUNITY_READ,
    PERMISSIONS.COMMUNITY_CONTRIBUTE,
    PERMISSIONS.COMMENT_READ,
    PERMISSIONS.WIKI_CREATE,
    PERMISSIONS.WIKI_READ,
    PERMISSIONS.WIKI_UPDATE_OWN,
    PERMISSIONS.ISSUE_CREATE,
    PERMISSIONS.ISSUE_VERIFY,
    PERMISSIONS.ISSUE_DELETE_OWN,
    PERMISSIONS.PROJECT_CREATE,
    PERMISSIONS.PROJECT_JOIN,
    PERMISSIONS.PROJECT_UPDATE_PROGRESS_OWN,
    PERMISSIONS.COMMENT_CREATE,
    PERMISSIONS.COMMENT_UPDATE_OWN,
    PERMISSIONS.COMMENT_DELETE_OWN,
    PERMISSIONS.COMMENT_FLAG,
    PERMISSIONS.COMMENT_VOTE,
    PERMISSIONS.COMMENT_ACCEPT,
    PERMISSIONS.REPORT_CREATE,
    PERMISSIONS.AI_CLASSIFY,
    PERMISSIONS.AI_DUPLICATES,
    PERMISSIONS.AI_RECOMMEND,
  ],
  [ROLES.VIEWER]: [
    PERMISSIONS.ISSUE_READ,
    PERMISSIONS.USER_DASHBOARD_READ,
    PERMISSIONS.LEADERBOARD_READ,
    PERMISSIONS.PROJECT_READ,
    PERMISSIONS.COMMUNITY_READ,
    PERMISSIONS.COMMUNITY_CONTRIBUTE,
    PERMISSIONS.COMMENT_READ,
    PERMISSIONS.WIKI_CREATE,
    PERMISSIONS.WIKI_READ,
    PERMISSIONS.WIKI_UPDATE_OWN,
    PERMISSIONS.ISSUE_CREATE,
    PERMISSIONS.ISSUE_VERIFY,
    PERMISSIONS.ISSUE_DELETE_OWN,
    PERMISSIONS.PROJECT_CREATE,
    PERMISSIONS.PROJECT_JOIN,
    PERMISSIONS.PROJECT_UPDATE_PROGRESS_OWN,
    PERMISSIONS.COMMENT_CREATE,
    PERMISSIONS.COMMENT_UPDATE_OWN,
    PERMISSIONS.COMMENT_DELETE_OWN,
    PERMISSIONS.COMMENT_FLAG,
    PERMISSIONS.COMMENT_VOTE,
    PERMISSIONS.COMMENT_ACCEPT,
    PERMISSIONS.REPORT_CREATE,
    PERMISSIONS.AI_CLASSIFY,
    PERMISSIONS.AI_DUPLICATES,
    PERMISSIONS.AI_RECOMMEND,
  ],
};

export const normalizeRole = (role) => {
  const normalized = String(role || ROLES.MEMBER).trim().toUpperCase();
  if (normalized === "USER" || normalized === "EXPERT" || normalized === "VIEWER") return ROLES.MEMBER;
  return Object.values(ROLES).includes(normalized) ? normalized : ROLES.MEMBER;
};

export const getPermissionsForRole = (role) => {
  const normalizedRole = normalizeRole(role);
  return ROLE_PERMISSIONS[normalizedRole] || ROLE_PERMISSIONS[ROLES.MEMBER];
};

export const hasPermission = (user, permission) => {
  if (!user) return false;
  const permissions = Array.isArray(user.permissions)
    ? user.permissions
    : getPermissionsForRole(user.role);
  return permissions.includes(permission);
};

export const isAdmin = (user) => normalizeRole(user?.role) === ROLES.ADMIN;
