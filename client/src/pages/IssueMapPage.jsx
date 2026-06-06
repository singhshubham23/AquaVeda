import { useEffect, useMemo, useState } from "react";
import IssueMap from "../components/IssueMap.jsx";
import MapInsightsBar from "../components/map/MapInsightsBar.jsx";
import { getIssueMapData, getIssueRecommendations } from "../services/api.js";

const severityOptions = ["", "LOW", "MEDIUM", "HIGH", "CRITICAL"];
const statusOptions = ["", "OPEN", "IN_PROGRESS", "RESOLVED"];

const buildQuery = (filters) => {
  const query = new URLSearchParams();

  if (filters.severity) {
    query.set("severity", filters.severity);
  }

  if (filters.status) {
    query.set("status", filters.status);
  }

  return query.toString();
};

export default function IssueMapPage() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadingIssueId, setLoadingIssueId] = useState("");
  const [recommendationsByIssue, setRecommendationsByIssue] = useState({});
  const [filters, setFilters] = useState({ severity: "", status: "" });

  const queryString = useMemo(() => buildQuery(filters), [filters]);

  useEffect(() => {
    const fetchIssues = async () => {
      setLoading(true);
      setError("");

      try {
        const payload = await getIssueMapData(filters);
        setIssues(payload.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchIssues();
  }, [filters, queryString]);

  const handleGetSuggestions = async (issueId) => {
    setLoadingIssueId(issueId);

    try {
      const payload = await getIssueRecommendations(issueId);
      setRecommendationsByIssue((current) => ({
        ...current,
        [issueId]: payload.data || []
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingIssueId("");
    }
  };

  return (
    <main className="map-page">
      <header className="map-header">
        <h1>Water Response Map</h1>
        <p>Track report clusters, response zones, and priority work areas instead of viewing a plain map.</p>
      </header>

      <MapInsightsBar issues={issues} />

      <section className="map-filters">
        <label>
          Severity
          <select
            value={filters.severity}
            onChange={(event) => {
              setFilters((current) => ({
                ...current,
                severity: event.target.value
              }));
            }}
          >
            {severityOptions.map((value) => (
              <option key={value || "all"} value={value}>
                {value || "All"}
              </option>
            ))}
          </select>
        </label>

        <label>
          Status
          <select
            value={filters.status}
            onChange={(event) => {
              setFilters((current) => ({
                ...current,
                status: event.target.value
              }));
            }}
          >
            {statusOptions.map((value) => (
              <option key={value || "all"} value={value}>
                {value || "All"}
              </option>
            ))}
          </select>
        </label>
      </section>

      {loading && <p>Loading map data...</p>}
      {error && <p className="error-text">{error}</p>}
      {!loading && !error && (
        <IssueMap
          issues={issues}
          onGetSuggestions={handleGetSuggestions}
          recommendationsByIssue={recommendationsByIssue}
          loadingIssueId={loadingIssueId}
        />
      )}
    </main>
  );
}
