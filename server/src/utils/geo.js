export const formatForMap = (issues) => {
  return issues.map((issue) => ({
    id: issue._id,
    title: issue.title,
    description: issue.description,
    severity: issue.severity,
    status: issue.status,
    region: issue.region || null,
    coordinates: issue.location.coordinates,
    images: issue.images || [],
    imageThumbnails: issue.imageThumbnails || [],
    timeline: issue.timeline || [],
    reportedBy: issue.reportedBy
      ? { id: issue.reportedBy._id?.toString?.() || "", name: issue.reportedBy.name || "" }
      : null,
    createdAt: issue.createdAt
  }));
};
