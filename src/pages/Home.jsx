import LatestCollection from "../components/LatestCollection";
import React from "react";
import { ShopContext } from "../context/ShopContext";

const Home = () => {
  const { theme } = React.useContext(ShopContext);
  const textColor = theme === "dark" ? "text-gray-100" : "text-gray-900";

  return (
    <div className={`space-y-10 transition-colors border-t pt-10 ${textColor}`}>
      <LatestCollection />
      {/* <BestSeller /> removed for now */}
    </div>
  );
};

export default Home;