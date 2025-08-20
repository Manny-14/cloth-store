import Hero from "../components/Hero"
import LatestCollection from "../components/LatestCollection"
import OurPolicy from "../components/OurPolicy"
import NewsletterBox from "../components/NewsletterBox"
import { useAuth } from "../context/authContext"
import { useEffect, useState } from "react";
import { getAllProducts } from "../../firebase/products/getAllProducts";

const Home = () => {
  const authContext = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const data = await getAllProducts();
        // Sort by timestamp descending
        const sorted = data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setProducts(sorted);
        setError(null);
      } catch (err) {
        setError("Failed to fetch products");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // LatestCollection expects first 10 most recent products
  const latestProducts = products.slice(0, 10);

  return (
    <div>
      {/* <Hero /> */}
      <LatestCollection products={latestProducts} loading={loading} error={error} />
      {/* <BestSeller /> removed for now */}
      <OurPolicy />
      <NewsletterBox />
    </div>
  );
}

export default Home