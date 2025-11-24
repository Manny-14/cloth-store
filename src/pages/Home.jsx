import LatestCollection from "../components/LatestCollection";
import OurPolicy from "../components/OurPolicy";
import NewsletterBox from "../components/NewsletterBox";
import React from "react";
import { ShopContext } from "../context/ShopContext";

const Home = () => {
  const { theme } = React.useContext(ShopContext);
  const textColor = theme === "dark" ? "text-gray-100" : "text-gray-900";

  return (
    <div className={`space-y-10 transition-colors ${textColor}`}>
      <LatestCollection />
      {/* <BestSeller /> removed for now */}
      <OurPolicy />
      <NewsletterBox />
    </div>
  );
};

export default Home;