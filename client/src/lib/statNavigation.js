const destinationByScope = {
  profile: {
    "Issues Reported": "/explore#issue-panel",
    "Issues Resolved": "/explore#issue-panel",
    "Articles Submitted": "/learn#knowledge-hub",
    "Approved Articles": "/learn#knowledge-hub",
    "Projects Created": "/projects#project-catalog",
    "Projects Joined": "/projects#project-catalog",
    Comments: "/explore#issue-panel",
  },
  dashboard: {
    "Issues Reported": "/explore#issue-panel",
    "Issues Resolved": "/explore#issue-panel",
    "Wiki Articles": "/learn#knowledge-hub",
    "Approved Wiki": "/learn#knowledge-hub",
    "Projects Created": "/projects#project-catalog",
    "Projects Joined": "/projects#project-catalog",
    "Comments Posted": "/explore#issue-panel",
    "Resolution Rate": "/explore#issue-panel",
    "Total Users": "/leaderboard#leaderboard-list",
    "Total Issues": "/explore#issue-panel",
    "Total Projects": "/projects#project-catalog",
    "Pending Articles": "/learn#knowledge-hub",
  },
};

export function resolveStatDestination(label, scope = "profile") {
  return destinationByScope[scope]?.[label] || null;
}
