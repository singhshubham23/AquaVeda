import { useState } from "react";
import { CircleMarker, Popup, Tooltip } from "react-leaflet";
import { getIssueCoordinates, getMarkerRadius } from "../../data/mapInsights.js";

const severityColors = {
  LOW: "#22c55e",
  MEDIUM: "#f59e0b",
  HIGH: "#f97316",
  CRITICAL: "#dc2626",
};

const statusLabels = {
  OPEN: "Open",
  ACKNOWLEDGED: "Acknowledged",
  IN_PROGRESS: "In progress",
  RESOLVED: "Resolved",
  VERIFIED: "Verified",
};

export default function IssueMarker({ issue, isSelected, onSelectIssue, showPopup = true }) {
  const [hovered, setHovered] = useState(false);
  const coordinates = getIssueCoordinates(issue);

  if (!coordinates) {
    return null;
  }

  const severity = String(issue.severity || "LOW").toUpperCase();
  const status = String(issue.status || "OPEN").toUpperCase();
  const markerRadius = getMarkerRadius(severity, isSelected);

  return (
    <CircleMarker
      center={coordinates}
      radius={markerRadius}
      pathOptions={{
        color: isSelected ? "#0f766e" : severityColors[severity] || "#2563eb",
        fillColor: severityColors[severity] || "#2563eb",
        fillOpacity: isSelected ? 0.95 : hovered ? 0.9 : 0.8,
        weight: isSelected ? 3 : hovered ? 2.5 : 2,
        className: `issue-marker severity-${severity.toLowerCase()} ${isSelected ? "selected" : ""}`,
      }}
      eventHandlers={{
        click: () => onSelectIssue(issue),
        mouseover: () => setHovered(true),
        mouseout: () => setHovered(false),
      }}
    >
      <Tooltip direction="top" offset={[0, -8]} opacity={0.95}>
        {issue.title}
      </Tooltip>
      {showPopup ? (
        <Popup>
          <div className="space-y-2 min-w-[220px]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Issue</p>
              <p className="text-sm font-extrabold text-slate-800 leading-5">{issue.title}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-700">{statusLabels[status] || status}</span>
              <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-700">{severity}</span>
            </div>
            <p className="text-sm text-slate-600 leading-6">{issue.description || "No description provided."}</p>
            <div className="text-xs text-slate-500">
              <span className="font-bold text-slate-700">Region: </span>
              {issue.region || "Unknown"}
            </div>
            {issue.priority ? (
              <div className="rounded-xl bg-teal-50 border border-teal-100 px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-teal-600">Priority action</p>
                <p className="text-sm font-semibold text-teal-900 mt-1">{issue.priority}</p>
              </div>
            ) : null}
          </div>
        </Popup>
      ) : null}
    </CircleMarker>
  );
}
