import React from "react";
import Title from "../components/Title";
import BackendHealthCards from "../components/BackendHealthCards";
import { ShopContext } from "../context/ShopContext";
import { useBackendHealth } from "../hooks/useBackendHealth";

const SystemHealth = () => {
  const { theme } = React.useContext(ShopContext);
  const { healthChecks, healthLoading, runHealth } = useBackendHealth();

  const mutedText = theme === "dark" ? "text-gray-400" : "text-gray-500";

  return (
    <div className="p-4 flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Title text1="SYSTEM" text2="HEALTH" />
          <p className={`text-sm ${mutedText}`}>
            Run backend diagnostics anytime—no need to leave the admin hub.
          </p>
        </div>
        <button
          type="button"
          onClick={runHealth}
          className={`px-4 py-2 rounded text-sm border ${
            theme === "dark"
              ? "border-gray-700 bg-gray-900 hover:bg-gray-800"
              : "border-gray-300 bg-white hover:bg-gray-100"
          }`}
        >
          {healthLoading ? "Running Checks..." : "Run Health Checks"}
        </button>
      </div>

      <BackendHealthCards healthChecks={healthChecks} />
    </div>
  );
};

export default SystemHealth;
