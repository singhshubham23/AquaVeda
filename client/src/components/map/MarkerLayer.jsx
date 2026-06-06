import { Circle } from "react-leaflet";
import IssueMarker from "./IssueMarker.jsx";
import { getImpactRadius, getIssueCoordinates } from "../../data/mapInsights.js";

const severityFills = {
  LOW: "#22c55e",
  MEDIUM: "#f59e0b",
  HIGH: "#f97316",
  CRITICAL: "#dc2626",
};

export default function MarkerLayer({ issues, selectedIssueId, onSelectIssue }) {
  const visibleIssues = issues.filter((issue) => getIssueCoordinates(issue));

  return (
    <>
      {visibleIssues.map((issue) => {
        const severity = String(issue.severity || "LOW").toUpperCase();
        const coordinates = getIssueCoordinates(issue);

        if (!coordinates) return null;

        return (
          <Circle
            key={`zone-${issue.id || issue._id}`}
            center={coordinates}
            radius={getImpactRadius(severity)}
            pathOptions={{
              color: severityFills[severity] || "#2563eb",
              fillColor: severityFills[severity] || "#2563eb",
              fillOpacity: 0.08,
              weight: 1.25,
              opacity: 0.35,
            }}
          />
        );
      })}

      {visibleIssues.map((issue) => (
        <IssueMarker
          key={issue.id || issue._id}
          issue={issue}
          isSelected={selectedIssueId === (issue.id || issue._id)}
          onSelectIssue={onSelectIssue}
        />
      ))}
    </>
  );
}
