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

const eventTypeFilters = [
  { value: "all", label: "All error types", prefixes: [] },
  { value: "auth", label: "Auth", prefixes: ["auth."] },
  { value: "checkout", label: "Checkout", prefixes: ["checkout."] },
  { value: "order", label: "Orders", prefixes: ["order.", "orders.", "admin.order"] },
  { value: "product", label: "Products", prefixes: ["product.", "products.", "admin.product"] },
];

const desktopMediaQuery = "(min-width: 1024px)";

const getIsDesktop = () => {
  if (typeof window === "undefined") return true;
  return window.matchMedia(desktopMediaQuery).matches;
};

const AdminLogs = () => {
  const { theme } = React.useContext(ShopContext);
  const [logs, setLogs] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [severityFilter, setSeverityFilter] = React.useState("all");
  const [eventTypeFilter, setEventTypeFilter] = React.useState("all");
  const [isDesktop, setIsDesktop] = React.useState(getIsDesktop);

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
    } catch {
      setError("Unable to load logs right now.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(desktopMediaQuery);
    const handleChange = (event) => setIsDesktop(event.matches);

    setIsDesktop(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  React.useEffect(() => {
    if (isDesktop) {
      loadLogs();
      return;
    }

    setLoading(false);
    setError("");
  }, [isDesktop, loadLogs]);

  const filteredLogs = React.useMemo(() => {
    const selectedEventType = eventTypeFilters.find(({ value }) => value === eventTypeFilter);

    return logs.filter((log) => {
      const eventName = String(log.event || "").toLowerCase();
      const matchesSeverity =
        severityFilter === "all" || String(log.severity).toLowerCase() === severityFilter;
      const matchesEventType =
        !selectedEventType?.prefixes.length ||
        selectedEventType.prefixes.some((prefix) => eventName.startsWith(prefix));

      return matchesSeverity && matchesEventType;
    });
  }, [logs, severityFilter, eventTypeFilter]);

  if (!isDesktop) {
    return (
      <div className="p-4 flex flex-col gap-4">
        <Title text1="ADMIN" text2="LOGS" />
        <div className="border rounded-lg p-5 border-gray-200 dark:border-gray-800">
          <p className="text-sm font-semibold">Admin Logs are available on desktop only.</p>
          <p className={`mt-1 text-sm ${mutedText}`}>
            Use a laptop or desktop screen to review platform errors and warnings.
          </p>
        </div>
      </div>
    );
  }

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
            value={eventTypeFilter}
            onChange={(event) => setEventTypeFilter(event.target.value)}
            className={`border rounded px-3 py-1 text-sm ${inputClasses}`}
          >
            {eventTypeFilters.map((eventType) => (
              <option key={eventType.value} value={eventType.value}>
                {eventType.label}
              </option>
            ))}
          </select>
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
              <pre className={`text-xs rounded bg-slate-100 dark:bg-slate-900 p-2 overflow-x-auto ${mutedText}`}>
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
