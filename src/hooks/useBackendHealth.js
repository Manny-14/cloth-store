import React from "react";
import { runBackendHealthChecks } from "../helper/backendHealth";
import { useAuth } from "../context/authContext";

export const useBackendHealth = ({ autoRun = true } = {}) => {
  const { currentUser } = useAuth();
  const [healthChecks, setHealthChecks] = React.useState([]);
  const [healthLoading, setHealthLoading] = React.useState(false);

  const runHealth = React.useCallback(async () => {
    setHealthLoading(true);
    try {
      const results = await runBackendHealthChecks(currentUser?.uid);
      setHealthChecks(results);
    } catch (err) {
      console.error("Health checks failed", err);
      setHealthChecks([
        {
          key: "health",
          label: "Diagnostics",
          status: "unhealthy",
          error: err.message || "Health checks failed",
          duration: 0,
        },
      ]);
    } finally {
      setHealthLoading(false);
    }
  }, [currentUser?.uid]);

  React.useEffect(() => {
    if (autoRun) {
      runHealth();
    }
  }, [autoRun, runHealth]);

  return { healthChecks, healthLoading, runHealth };
};
