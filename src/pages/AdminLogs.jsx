import React from "react";
import Title from "../components/Title";
import { ShopContext } from "../context/ShopContext";
import { getAdminLogs } from "../../firebase/logs/getAdminLogs";

const formatTimestamp = (timestamp) => {
  if (!timestamp) return "-";
  try {
    const dateValue =
      typeof timestamp.toDate === "function" ? timestamp.toDate() : new Date(timestamp);
    return dateValue.toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
};

const severityStyles = {
  info: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200",
  critical: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200",
};

const AdminLogs = () => {
  const { theme } = React.useContext(ShopContext);
  const [logs, setLogs] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [severityFilter, setSeverityFilter] = React.useState("all");

  const mutedText = theme === "dark" ? "text-gray-400" : "text-gray-500";
  const inputClasses =
    theme === "dark"
      ? "bg-gray-900 border-gray-700 text-slate-100"
      : "bg-white border-gray-300 text-gray-800";

  const loadLogs = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getAdminLogs({ max: 150 });
      setLogs(result);
    } catch (err) {
      setError("Unable to load logs right now.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const filteredLogs = React.useMemo(() => {
    if (severityFilter === "all") return logs;
    return logs.filter((log) => String(log.severity).toLowerCase() === severityFilter);
  }, [logs, severityFilter]);

  return (
    <div className="p-4 flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Title text1="ADMIN" text2="LOGS" />
          <p className={`text-sm ${mutedText}`}>
            Recent platform errors and warnings (no customer PII stored).
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            value={severityFilter}
            onChange={(event) => setSeverityFilter(event.target.value)}
            className={`border rounded px-3 py-1 text-sm ${inputClasses}`}
          >
            <option value="all">All severities</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>
          <button
            type="button"
            onClick={loadLogs}
            className={`px-4 py-1.5 rounded text-sm border ${inputClasses}`}
          >
            Refresh
          </button>
        </div>
      </div>

      {loading && <p className={`text-sm ${mutedText}`}>Loading logs...</p>}
      {!loading && error && <p className="text-sm text-red-500">{error}</p>}
      {!loading && !error && filteredLogs.length === 0 && (
        <p className={`text-sm ${mutedText}`}>No logs found for this filter.</p>
      )}

      <div className="flex flex-col gap-3">
        {filteredLogs.map((log) => (
          <div
            key={log.id}
            className="border rounded-lg p-4 flex flex-col gap-2 border-gray-200 dark:border-gray-800"
          >
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span
                className={`px-2 py-0.5 rounded-full font-semibold uppercase ${
                  severityStyles[log.severity] || severityStyles.info
                }`}
              >
                {log.severity || "info"}
              </span>
              <span className={`uppercase tracking-wide ${mutedText}`}>
                {log.source || "client"}
              </span>
              <span className={mutedText}>{formatTimestamp(log.createdAt)}</span>
            </div>
            <div>
              <p className="text-sm font-semibold">{log.event || "Unknown event"}</p>
              {log.message && <p className={`text-sm ${mutedText}`}>{log.message}</p>}
            </div>
            {log.context && (
              <pre className={`text-xs rounded bg-slate-100 dark:bg-slate-900 p-2 ${mutedText}`}>
{JSON.stringify(log.context, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminLogs;
