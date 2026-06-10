import { Fragment, useEffect, useState } from "react";
import { Circle, CircleMarker, MapContainer, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { createComment, getComments, updateIssueStatus, createIssue } from "../services/api.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import { hasPermission, PERMISSIONS } from "../lib/accessControl.js";
import { latLngBounds } from "leaflet";
import {
  defaultMapCenter,
  demoWaterResponseZones,
  getImpactRadius,
  getIssueCoordinates,
} from "../data/mapInsights.js";
import "leaflet/dist/leaflet.css";

const severityColors = {
  LOW: "#22c55e",
  MEDIUM: "#f59e0b",
  HIGH: "#ef4444",
  CRITICAL: "#991b1b"
};

function IssuePopupContent({ issue, onGetSuggestions, recommendationsByIssue, loadingIssueId }) {
  const { user } = useAuth();
  const issueId = issue._id || issue.id;
  const isDemoIssue = Boolean(issue.isDemo);
  const [showComments, setShowComments] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState("");
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [activeReplyTo, setActiveReplyTo] = useState("");
  const [replyText, setReplyText] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [localStatus, setLocalStatus] = useState(issue.status);

  const loadComments = async () => {
    setCommentsLoading(true);
    setCommentsError("");

    try {
      const payload = await getComments("ISSUE", issueId);
      setComments(payload.data || []);
    } catch (err) {
      setCommentsError(err.message);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleToggleComments = async () => {
    if (isDemoIssue) {
      return;
    }
    const next = !showComments;
    setShowComments(next);

    if (next) {
      await loadComments();
    }
  };

  const handleAddComment = async () => {
    if (isDemoIssue) {
      return;
    }
    if (!newComment.trim()) {
      return;
    }

    setCommentsError("");

    try {
      const token = localStorage.getItem("token");
      await createComment(
        {
          refType: "ISSUE",
          refId: issueId,
          content: newComment.trim()
        },
        token
      );

      setNewComment("");
      await loadComments();
    } catch (err) {
      setCommentsError(err.message);
    }
  };

  const handleAddReply = async (parentCommentId) => {
    if (isDemoIssue) {
      return;
    }
    if (!replyText.trim()) {
      return;
    }

    setCommentsError("");

    try {
      const token = localStorage.getItem("token");
      await createComment(
        {
          refType: "ISSUE",
          refId: issueId,
          content: replyText.trim(),
          parentComment: parentCommentId
        },
        token
      );

      setReplyText("");
      setActiveReplyTo("");
      await loadComments();
    } catch (err) {
      setCommentsError(err.message);
    }
  };

  const handleVerify = async () => {
    if (isDemoIssue) {
      return;
    }
    setVerifying(true);
    try {
      await updateIssueStatus(issueId, "VERIFIED");
      setLocalStatus("VERIFIED");
    } catch (err) {
      console.error("Failed to verify:", err);
      alert("Verification failed. " + err.message);
    } finally {
      setVerifying(false);
    }
  };

  const topLevel = comments.filter((item) => !item.parentComment);
  const repliesByParent = comments.reduce((acc, item) => {
    if (item.parentComment) {
      const key = String(item.parentComment);
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
    }
    return acc;
  }, {});

  const canVerify =
    !isDemoIssue &&
    hasPermission(user, PERMISSIONS.ISSUE_VERIFY) &&
    localStatus !== "VERIFIED" &&
    issue.reportedBy?.id !== user?.id;

  return (
    <>
      <strong>{issue.title}</strong>
      <br />
      Severity: {issue.severity}
      <br />
      Status: {localStatus}
      <br />
      {isDemoIssue ? (
        <div style={{ marginTop: "6px", marginBottom: "6px", fontSize: "12px", color: "#0f766e" }}>
          Sample hotspot shown until live reports load.
        </div>
      ) : null}
      
      <div style={{ display: "flex", gap: "5px", marginTop: "5px", marginBottom: "5px" }}>
        <button
          className="suggest-btn"
          onClick={() => onGetSuggestions(issueId)}
          disabled={loadingIssueId === issueId || isDemoIssue}
        >
          {loadingIssueId === issueId ? "Loading..." : isDemoIssue ? "Sample Zone" : "Get Suggestions"}
        </button>
        
        {canVerify && (
          <button 
            className="suggest-btn" 
            style={{ backgroundColor: "#22c55e" }}
            onClick={handleVerify}
            disabled={verifying}
          >
            {verifying ? "..." : "Verify Issue (Earn Points)"}
          </button>
        )}
      </div>

      {!isDemoIssue && Array.isArray(recommendationsByIssue[issueId]) && (
        <ul className="suggest-list">
          {recommendationsByIssue[issueId].map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}

      {!isDemoIssue ? (
        <button className="comment-toggle-btn" onClick={handleToggleComments}>
          {showComments ? "Hide Comments" : "View Comments"}
        </button>
      ) : null}

      {showComments && !isDemoIssue && (
        <div className="comments-panel">
          {commentsLoading && <p>Loading comments...</p>}
          {commentsError && <p className="comment-error">{commentsError}</p>}

          {topLevel.map((item) => (
            <div key={item._id} className="comment-item">
              <p className="comment-meta">{item.user?.name || "User"}</p>
              <p>{item.content}</p>
              <button
                className="reply-btn"
                onClick={() => {
                  setActiveReplyTo(activeReplyTo === item._id ? "" : item._id);
                  setReplyText("");
                }}
              >
                {activeReplyTo === item._id ? "Cancel" : "Reply"}
              </button>

              {activeReplyTo === item._id && (
                <div className="reply-box">
                  <textarea
                    rows={2}
                    value={replyText}
                    onChange={(event) => setReplyText(event.target.value)}
                    placeholder="Write a reply"
                  />
                  <button className="reply-btn" onClick={() => handleAddReply(item._id)}>
                    Post Reply
                  </button>
                </div>
              )}

              {(repliesByParent[item._id] || []).map((reply) => (
                <div key={reply._id} className="comment-reply-item">
                  <p className="comment-meta">{reply.user?.name || "User"}</p>
                  <p>{reply.content}</p>
                </div>
              ))}
            </div>
          ))}

          <div className="comment-editor">
            <textarea
              rows={2}
              value={newComment}
              onChange={(event) => setNewComment(event.target.value)}
              placeholder="Add a comment"
            />
            <button className="suggest-btn" onClick={handleAddComment}>
              Post Comment
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function MapEventsHandler({ setReportCoords }) {
  useMapEvents({
    click(e) {
      setReportCoords([e.latlng.lat, e.latlng.lng]);
    }
  });
  return null;
}

export default function IssueMap({
  issues,
  onGetSuggestions,
  recommendationsByIssue,
  loadingIssueId
}) {
  const [reportCoords, setReportCoords] = useState(null);
  const [reportTitle, setReportTitle] = useState("");
  const [reportDesc, setReportDesc] = useState("");
  const [reportSeverity, setReportSeverity] = useState("LOW");
  const [reportImages, setReportImages] = useState([]);
  const [reporting, setReporting] = useState(false);

  const handleReportSubmit = async () => {
    if (!reportTitle.trim() || !reportDesc.trim()) {
      alert("Please provide a title and description");
      return;
    }
    const selectedImages = Array.from(reportImages || []);
    if (selectedImages.length < 1 || selectedImages.length > 3) {
      alert("Please upload at least 1 and at most 3 images.");
      return;
    }

    setReporting(true);
    try {
      const formData = new FormData();
      formData.append("title", reportTitle);
      formData.append("description", reportDesc);
      formData.append("severity", reportSeverity);
      formData.append("location", JSON.stringify({
        type: "Point",
        coordinates: [reportCoords[1], reportCoords[0]]
      }));
      
      // Append images
      selectedImages.slice(0, 3).forEach((file) => {
        formData.append("images", file);
      });

      const token = localStorage.getItem("token");
      const res = await fetch("/api/v1/issues", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create issue");
      }

      alert("Issue reported successfully! Refresh to see it on the map.");
      setReportCoords(null);
      setReportTitle("");
      setReportDesc("");
      setReportImages([]);
    } catch (err) {
      alert("Failed to report issue: " + err.message);
    } finally {
      setReporting(false);
    }
  };

  return (
    <MapContainer 
      center={defaultMapCenter} 
      zoom={10} 
      className="issue-map w-full h-full z-0 min-h-[400px] rounded-2xl"
      scrollWheelZoom={false}
      tap={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapEventsHandler setReportCoords={setReportCoords} />
      <IssueMapViewport issues={issues} />

      <MarkerClusterGroup
        chunkedLoading
        maxClusterRadius={60}
        spiderfyOnMaxZoom
        showCoverageOnHover={false}
      >
        {(issues.length > 0 ? issues : demoWaterResponseZones).map((issue) => {
          const coordinates = getIssueCoordinates(issue);
          if (!coordinates) return null;
          const severity = String(issue.severity || "LOW").toUpperCase();

          return (
            <Fragment key={issue.id}>
              <Circle
                center={coordinates}
                radius={getImpactRadius(severity)}
                pathOptions={{
                  color: severityColors[severity] || "#0f766e",
                  fillColor: severityColors[severity] || "#0f766e",
                  fillOpacity: 0.08,
                  weight: 1.25,
                }}
              />
              <CircleMarker
                key={issue.id}
                center={coordinates}
                radius={8}
                pathOptions={{
                  color: severityColors[severity] || "#0f766e",
                  fillOpacity: 0.8
                }}
              >
                <Popup>
                  <IssuePopupContent
                    issue={issue}
                    onGetSuggestions={onGetSuggestions}
                    recommendationsByIssue={recommendationsByIssue}
                    loadingIssueId={loadingIssueId}
                  />
                </Popup>
              </CircleMarker>
            </Fragment>
          );
        })}
      </MarkerClusterGroup>

      {reportCoords && (
        <Popup position={reportCoords} onClose={() => setReportCoords(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", minWidth: "200px" }}>
            <h3 style={{ margin: "0", fontSize: "16px" }}>Report New Issue</h3>
            <input
              type="text"
              placeholder="Issue Title"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              style={{ padding: "4px" }}
            />
            <textarea
              placeholder="Describe the issue"
              rows={3}
              value={reportDesc}
              onChange={(e) => setReportDesc(e.target.value)}
              style={{ padding: "4px", resize: "vertical" }}
            />
            <select
              value={reportSeverity}
              onChange={(e) => setReportSeverity(e.target.value)}
              style={{ padding: "4px" }}
            >
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
            <input
              type="file"
              multiple
              required
              accept="image/*"
              onChange={(e) => setReportImages(Array.from(e.target.files || []).slice(0, 3))}
              style={{ padding: "4px", fontSize: "12px" }}
            />
            <button
              onClick={handleReportSubmit}
              disabled={reporting}
              style={{
                padding: "6px",
                backgroundColor: "#2563eb",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              {reporting ? "Analyzing via AI..." : "Submit Report"}
            </button>
          </div>
        </Popup>
      )}
    </MapContainer>
  );
}

function IssueMapViewport({ issues }) {
  const map = useMap();

  useEffect(() => {
    const points = issues.map((issue) => getIssueCoordinates(issue)).filter(Boolean);

    if (points.length === 0) {
      map.setView(defaultMapCenter, 10);
      return;
    }

    if (points.length === 1) {
      map.setView(points[0], 12);
      return;
    }

    map.fitBounds(latLngBounds(points).pad(0.2), { animate: true, maxZoom: 13 });
  }, [issues, map]);

  return null;
}
