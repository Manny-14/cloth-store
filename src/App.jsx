import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Collection from "./pages/Collection";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Product from "./pages/Product";
import Cart from "./pages/Cart";
import Login from "./pages/Login";
import PlaceOrder from "./pages/PlaceOrder";
import Orders from "./pages/Orders";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Searchbar from "./components/Searchbar";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import AdminPanel from "./pages/AdminPanel";
import AllUsers from "./pages/AllUsers";
import AllProducts from "./pages/AllProducts";
import AllOrders from "./pages/AllOrders";
import SystemHealth from "./pages/SystemHealth";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import CheckoutCancel from "./pages/CheckoutCancel";
import { ShopContext } from "./context/ShopContext";


const App = () => {
  const { theme } = React.useContext(ShopContext);
  return (
    <div
      className={`min-h-screen px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw] transition-colors duration-300 bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100`}
    >
      <ToastContainer position="top-center" autoClose={2800} theme={theme} />
      <Navbar />
      <Searchbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/collection" element={<Collection />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/product/:productId" element={<Product />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/place-order" element={<PlaceOrder />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/checkout/success" element={<CheckoutSuccess />} />
        <Route path="/checkout/cancel" element={<CheckoutCancel />} />
        <Route path="profile" element={<Profile />} />
        <Route path="/admin-panel" element={<AdminPanel />} >
          <Route path="all-users" element={<AllUsers />} />
          <Route path="all-products" element={<AllProducts />} />
          <Route path="all-orders" element={<AllOrders />} />
          <Route path="system-health" element={<SystemHealth />} />
        </Route>
      </Routes>
      <Footer />
    </div>
  );
};

export default App;
