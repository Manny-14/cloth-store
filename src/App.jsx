import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Collection from "./pages/Collection";
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
import CheckoutSuccess from "./pages/CheckoutSuccess";
import CheckoutCancel from "./pages/CheckoutCancel";
import { ShopContext } from "./context/ShopContext";
import { useAuth } from "./context/authContext";


const App = () => {
  const { theme } = React.useContext(ShopContext);
  const { currentUser, userLoggedIn, isResolvingRole } = useAuth();
  const isAdmin = userLoggedIn && String(currentUser?.role || "").toUpperCase() === "ADMIN";

  // Show a minimal loading screen while the user role is being fetched
  // to prevent flashing the wrong route tree (e.g. Home for admins)
  if (isResolvingRole) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center transition-colors duration-300 bg-white dark:bg-slate-950`}
      >
        <div className="animate-pulse text-gray-400 dark:text-gray-500 text-sm">Loading…</div>
      </div>
    );
  }

  if (isAdmin) {
    return (
      <div
        className={`min-h-screen px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw] transition-colors duration-300 bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100`}
      >
        <ToastContainer position="top-center" autoClose={2800} theme={theme} />
        <Routes>
          <Route path="/admin-panel" element={<AdminPanel />} >
            <Route path="all-users" element={<AllUsers />} />
            <Route path="all-products" element={<AllProducts />} />
            <Route path="all-orders" element={<AllOrders />} />
          </Route>
          <Route path="*" element={<Navigate to="/admin-panel/all-users" replace />} />
        </Routes>
      </div>
    );
  }

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
        <Route path="/contact" element={<Contact />} />
        <Route path="/product/:productId" element={<Product />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/place-order" element={<PlaceOrder />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/checkout/success" element={<CheckoutSuccess />} />
        <Route path="/checkout/cancel" element={<CheckoutCancel />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin-panel/*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
    </div>
  );
};

export default App;
