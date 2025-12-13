import React from "react";

const BackendHealthCards = ({ healthChecks = [] }) => {
  if (!healthChecks.length) {
    return (
      <div className="rounded border border-dashed border-gray-300 p-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
        Health checks have not run yet.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {healthChecks.map((check) => (
        <div
          key={check.key}
          className={`p-4 rounded border ${
            check.status === "healthy"
              ? "border-green-400 bg-green-400/10"
              : "border-red-400 bg-red-400/10"
          }`}
        >
          <p className="text-sm font-semibold">{check.label}</p>
          <p className="text-xs mt-1">{check.description}</p>
          <p className="text-xs mt-2">
            Status: <strong>{check.status}</strong> ({check.duration}ms)
          </p>
          {check.details?.count !== undefined && (
            <p className="text-xs mt-1">Documents: {check.details.count}</p>
          )}
          {check.details?.skipped && (
            <p className="text-xs mt-1">Skipped: {check.details.reason}</p>
          )}
          {check.error && (
            <p className="text-xs mt-1 text-red-600">{check.error}</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default BackendHealthCards;
