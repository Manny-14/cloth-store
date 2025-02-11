import Hero from "../components/Hero"
import LatestCollection from "../components/LatestCollection"
import BestSeller from "../components/BestSeller"
import OurPolicy from "../components/OurPolicy"
import NewsletterBox from "../components/NewsletterBox"
import { useAuth } from "../context/authContext"

const Home = () => {

  const authContext = useAuth();
  return (
    <div>
      {/* <Hero /> */}
      <LatestCollection />
      <BestSeller />
      <OurPolicy />
      <NewsletterBox />
    </div>
  )
}

export default Home