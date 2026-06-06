export const defaultMapCenter = [23.5, 87.3];

export const demoWaterResponseZones = [
  {
    id: "demo-zone-1",
    isDemo: true,
    title: "Pipeline Pressure Loss",
    description: "Recurring low-pressure reports and leak sightings across a dense residential belt.",
    severity: "CRITICAL",
    status: "OPEN",
    region: "Central Supply Corridor",
    coordinates: [77.215, 28.626],
    impact: 7200,
    priority: "Immediate pipe inspection",
  },
  {
    id: "demo-zone-2",
    isDemo: true,
    title: "Greywater Overflow Cluster",
    description: "Drainage overflow and waterlogging around mixed-use blocks during peak load hours.",
    severity: "HIGH",
    status: "IN_PROGRESS",
    region: "Riverfront Ward",
    coordinates: [77.244, 28.602],
    impact: 5200,
    priority: "Drainage redirection and cleanup",
  },
  {
    id: "demo-zone-3",
    isDemo: true,
    title: "Community Water Savings Zone",
    description: "Resolved conservation drive showing a measurable reduction in complaints and wastage.",
    severity: "LOW",
    status: "RESOLVED",
    region: "North Garden District",
    coordinates: [77.191, 28.654],
    impact: 3600,
    priority: "Monitor and sustain",
  },
  {
    id: "demo-zone-4",
    isDemo: true,
    title: "Public Tap Contamination Watch",
    description: "Field reports indicate water quality checks are needed around public standpipes.",
    severity: "MEDIUM",
    status: "ACKNOWLEDGED",
    region: "Outer Belt",
    coordinates: [77.268, 28.618],
    impact: 4500,
    priority: "Sample and test",
  },
];

const severityOrder = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export function getIssueId(issue) {
  return issue?.id || issue?._id || "";
}

export function getIssueCoordinates(issue) {
  const rawCoordinates =
    issue?.coordinates ||
    issue?.location?.coordinates ||
    issue?.position?.coordinates ||
    issue?.location?.coords ||
    [];

  if (!Array.isArray(rawCoordinates) || rawCoordinates.length !== 2) {
    return null;
  }

  const [lng, lat] = rawCoordinates.map((value) => Number(value));
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
    return null;
  }

  return [lat, lng];
}

export function getImpactRadius(severity) {
  const key = String(severity || "LOW").toUpperCase();
  switch (key) {
    case "CRITICAL":
      return 9000;
    case "HIGH":
      return 6500;
    case "MEDIUM":
      return 4200;
    default:
      return 2800;
  }
}

export function getMarkerRadius(severity, selected = false) {
  const key = String(severity || "LOW").toUpperCase();
  const base = selected ? 12 : 9;
  const offset = severityOrder.indexOf(key);
  return base + Math.max(0, offset);
}

export function getMapSummary(issues = []) {
  const summary = {
    total: issues.length,
    open: 0,
    inProgress: 0,
    resolved: 0,
    critical: 0,
  };

  for (const issue of issues) {
    const status = String(issue?.status || "").toUpperCase();
    const severity = String(issue?.severity || "").toUpperCase();

    if (status === "OPEN") summary.open += 1;
    if (status === "IN_PROGRESS" || status === "ACKNOWLEDGED") summary.inProgress += 1;
    if (status === "RESOLVED" || status === "VERIFIED") summary.resolved += 1;
    if (severity === "CRITICAL") summary.critical += 1;
  }

  return summary;
}

export function getMapInsights(issues = []) {
  const summary = getMapSummary(issues);

  return [
    { label: "Total reports", value: summary.total },
    { label: "Critical zones", value: summary.critical },
    { label: "Active response", value: summary.inProgress },
  ];
}
