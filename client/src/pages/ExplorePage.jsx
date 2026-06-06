import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import FilterPanel from "../components/filters/FilterPanel.jsx";
import IssuePanel from "../components/issues/IssuePanel.jsx";
import MapCanvas from "../components/map/MapCanvas.jsx";
import MapInsightsBar from "../components/map/MapInsightsBar.jsx";
import { getIssueMapData } from "../services/api.js";
import useScrollToHash from "../hooks/useScrollToHash.js";

const getIssueId = (issue) => issue?._id || issue?.id || "";

export default function ExplorePage() {
  const navigate = useNavigate();
  useScrollToHash([navigate]);
  const [filters, setFilters] = useState({
    severity: "",
    status: "",
    region: ""
  });
  const [issues, setIssues] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadIssues = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await getIssueMapData(filters);
        const nextIssues = response.data || [];

        setIssues(nextIssues);

        if (!nextIssues.some((issue) => issue.id === selectedIssue?.id)) {
          setSelectedIssue(nextIssues[0] || null);
        }
      } catch (err) {
        setError(err.message || "Failed to load issues");
      } finally {
        setLoading(false);
      }
    };

    loadIssues();
  }, [filters]);

  return (
    <section className="min-h-[calc(100vh-130px)] flex flex-col gap-6">
      <MapInsightsBar issues={issues} />

      <div className="flex flex-col lg:flex-row gap-8 items-start">
      {/* Sidebar Filters */}
      <aside className="w-full lg:w-[22rem] xl:w-[24rem] flex-shrink-0 lg:h-full overflow-y-auto pr-2 pb-4 hidden lg:block space-y-6">
          <FilterPanel filters={filters} onChange={setFilters} issues={issues} />
        </aside>

        <main className="explore-map relative flex-1 min-w-0 rounded-3xl overflow-hidden border border-white/60 shadow-sm bg-white/30" aria-label="Map workspace" id="issue-map">
          {loading ? <p className="panel-empty map-message">Loading map data...</p> : null}
          {error ? <p className="error-text">{error}</p> : null}
          {!loading && !error ? (
            <>
              {issues.length === 0 ? (
                <div className="absolute top-4 left-4 z-[500] rounded-2xl border border-teal-200 bg-white/90 backdrop-blur px-4 py-3 shadow-sm max-w-[320px]">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-600">Demo overlay</p>
                  <p className="text-sm text-slate-600 mt-1 leading-6">
                    No live reports were returned, so the map shows sample response zones to demonstrate how issues will be visualized.
                  </p>
                </div>
              ) : null}
              <MapCanvas
                issues={issues}
                selectedIssueId={getIssueId(selectedIssue)}
                onSelectIssue={setSelectedIssue}
              />
              <div className={`map-focus-overlay ${selectedIssue ? "active" : ""}`} aria-hidden="true" />
            </>
          ) : null}
        </main>

        <section className="explore-panel w-full lg:w-[430px] xl:w-[490px] flex-shrink-0" id="issue-panel">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={getIssueId(selectedIssue) || "empty"}
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
            >
              <IssuePanel issue={selectedIssue} />
            </motion.div>
          </AnimatePresence>
        </section>
      </div>
    </section>
  );
}
