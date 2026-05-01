import React, { useEffect } from "react";
import { assets } from "../assets/assets.js";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import { signOutUser } from "../../firebase/auth.js";
import { toast } from "react-toastify";
import { useAuth } from "../context/authContext"
import ThemeToggleButton from "./ThemeToggleButton";

const Navbar = () => {

  const { currentUser, userLoggedIn } = useAuth();

  const location = useLocation();

  // Excluding the admin panel from renering the general nav bar
  if (location.pathname.startsWith('/admin-panel')) {
    return null;
  }

  const navigate = useNavigate();
  const logoutHandler = async() => {
    try {
      await signOutUser();
      toast.success("User signed out successfully");
      navigate('/login');
    } catch (error) {
      console.log("error while signing out:", error);
      toast.error("An error occured while signing out");
    }
  }

  const closeMenuAndNavigate = (path) => {
    setVisible(false);
    navigate(path);
  };

  const handleProfileClick = () => {
    if(!userLoggedIn) {
      navigate('/login');
    }
  }
  const [visible, setVisible] = React.useState(false);
  const { theme, setShowSearch, showSearch, getCartCount } = React.useContext(ShopContext);

  // Dynamic classnames for theme
  const textColor = theme === "dark" ? "text-white" : "text-gray-700";
  const iconColor = theme === "dark" ? "filter invert" : "";
  const dropdownItemHover = theme === "dark" ? "hover:text-white" : "hover:text-black";

  // Close sidebar on route change
  useEffect(() => {
    setVisible(false);
  }, [location.pathname]);

  return (
    <div
      className={`flex items-center justify-between py-5 font-medium ${textColor}`}
    >
      <NavLink
        to="/"
        className="flex flex-col items-center gap-1"
      >
        <div className="leading-none text-center select-none">
          <p className="text-[1.2rem] sm:text-[1.3rem] font-black italic tracking-[0.08em]">
            Dress
          </p>
          <p className="text-[0.65rem] sm:text-[0.72rem] font-medium tracking-[0.22em] mt-0.5">
            ✦ IT UP ✦
          </p>
        </div>
      </NavLink>

      <ul className="hidden sm:flex gap-5 text-sm">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 ${textColor} ${
              isActive ? "underline" : ""
            }`
          }
        >
          <p>HOME</p>
        </NavLink>
        <NavLink
          to="/collection"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 ${textColor} ${
              isActive ? "underline" : ""
            }`
          }
        >
          <p>COLLECTION</p>
        </NavLink>
        <NavLink
          to="/contact"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 ${textColor} ${
              isActive ? "underline" : ""
            }`
          }
        >
          <p>CONTACT</p>
        </NavLink>
      </ul>

      <div className="flex items-center gap-3 sm:gap-6">
        {location.pathname === "/collection" && (
          <img
            src={assets.search_icon}
            className={`w-5 min-w-5 cursor-pointer ${iconColor}`}
            onClick={() => setShowSearch(!showSearch)}
            alt="search icon"
          />
        )}
        {
          userLoggedIn && (
            <div  className="hidden md:block">
              Hello, <br/>{currentUser?.displayName}
            </div>
          )
        }
        <div className="group relative">
          <button onClick={handleProfileClick}>
            <img
              src={assets.profile_icon}
              className={`w-5 min-w-5 cursor-pointer ${iconColor}`}
              alt="profile icon"
            />
          </button>
          <div className="group-hover:block hidden absolute dropdown-menu right-0 pt-4">
            {
              userLoggedIn && (
                <div
                  className={`flex flex-col items-center gap-2 w-36 py-2 rounded ${
                    theme === "dark"
                      ? "bg-gray-800 text-gray-300"
                      : "bg-slate-100 text-gray-500"
                  }`}
                >
                  <Link to="/profile"><p className={`cursor-pointer ${dropdownItemHover}`}>My Account</p></Link>
                  <Link to="/orders"><p className={`cursor-pointer ${dropdownItemHover}`}>Orders</p></Link>
                  {
                    currentUser?.role === "ADMIN" && (
                      <Link to="/admin-panel/all-users"><p className={`cursor-pointer hidden md:block ${dropdownItemHover}`}>Admin Panel</p></Link>
                    )
                  }
                  <Link onClick={logoutHandler} to="/login"><p className={`cursor-pointer ${dropdownItemHover}`}>Logout</p></Link>
                </div>
              )
            }
          </div>
        </div>

        <Link to="/cart" className="relative">
          <img
            src={assets.cart_icon}
            className={`w-5 min-w-5 cursor-pointer ${iconColor}`}
            alt="cart icon"
          />
          <p
            className={`absolute right-[-0.313rem] bottom-[-0.313rem] w-4 text-center leading-4 aspect-square rounded-full text-[0.5rem] ${
              theme === "dark"
                ? "bg-white text-black"
                : "bg-black text-white"
            }`}
          >
            {getCartCount()}
          </p>
        </Link>
        <div className="hidden sm:block">
          <ThemeToggleButton variant="icon" />
        </div>

        <img
          onClick={() => setVisible(true)}
          src={assets.menu_icon}
          className={`w-5 min-w-5 cursor-pointer sm:hidden ${iconColor}`}
          alt="menu icon"
        />
      </div>

      {/* ─── Mobile sidebar overlay ─── */}
      {visible && (
        <div
          className="fixed inset-0 bg-black/40 z-40 sm:hidden"
          onClick={() => setVisible(false)}
        />
      )}

      {/* ─── Mobile sidebar ─── */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-50 w-[75%] max-w-[300px] overflow-y-auto transition-transform duration-300 ease-in-out sm:hidden ${
          visible ? "translate-x-0" : "translate-x-full"
        } ${theme === "dark" ? "bg-gray-900" : "bg-white"} shadow-2xl`}
      >
        <div className={`flex flex-col h-full ${textColor}`}>
          {/* Sidebar header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            {userLoggedIn ? (
              <div className="flex items-center gap-3">
                <img
                  src={assets.profile_icon}
                  className={`w-6 ${iconColor}`}
                  alt="profile"
                />
                <div className="leading-tight">
                  <p className="text-sm font-semibold">{currentUser?.displayName}</p>
                  <p className="text-[0.65rem] opacity-60 truncate max-w-[140px]">{currentUser?.email}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm font-semibold">Menu</p>
            )}
            <button
              onClick={() => setVisible(false)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Close menu"
            >
              <img
                src={assets.cross_icon}
                className={`w-3 ${iconColor}`}
                alt="close"
              />
            </button>
          </div>

          {/* Navigation links */}
          <nav className="flex-1 py-2">
            <p className="px-4 pt-3 pb-1 text-[0.65rem] uppercase tracking-widest opacity-50 font-semibold">Navigate</p>
            {[
              { to: "/", label: "Home" },
              { to: "/collection", label: "Collection" },
              { to: "/contact", label: "Contact" },
            ].map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setVisible(false)}
                className={({ isActive }) =>
                  `block px-4 py-3 text-sm transition-colors ${
                    isActive
                      ? `font-semibold ${theme === "dark" ? "bg-gray-800" : "bg-gray-50"}`
                      : "hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`
                }
              >
                {label}
              </NavLink>
            ))}

            {userLoggedIn && (
              <>
                <p className="px-4 pt-5 pb-1 text-[0.65rem] uppercase tracking-widest opacity-50 font-semibold">Account</p>
                <button
                  type="button"
                  onClick={() => closeMenuAndNavigate("/profile")}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  My Account
                </button>
                <button
                  type="button"
                  onClick={() => closeMenuAndNavigate("/orders")}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Orders
                </button>
                <button
                  type="button"
                  onClick={() => closeMenuAndNavigate("/cart")}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cart
                  {getCartCount() > 0 && (
                    <span className={`ml-2 inline-flex items-center justify-center w-5 h-5 text-[0.6rem] rounded-full ${
                      theme === "dark" ? "bg-white text-black" : "bg-black text-white"
                    }`}>
                      {getCartCount()}
                    </span>
                  )}
                </button>
                {String(currentUser?.role || "").toUpperCase() === "ADMIN" && (
                  <button
                    type="button"
                    onClick={() => closeMenuAndNavigate("/admin-panel/all-users")}
                    className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Admin Panel
                  </button>
                )}
              </>
            )}
          </nav>

          {/* Sidebar footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs opacity-60">Theme</span>
              <ThemeToggleButton variant="icon" />
            </div>
            {!userLoggedIn ? (
              <button
                type="button"
                onClick={() => closeMenuAndNavigate("/login")}
                className={`w-full py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  theme === "dark"
                    ? "bg-white text-black hover:bg-gray-200"
                    : "bg-black text-white hover:bg-gray-800"
                }`}
              >
                Sign In
              </button>
            ) : (
              <button
                type="button"
                onClick={async () => {
                  setVisible(false);
                  await logoutHandler();
                }}
                className="w-full py-2.5 text-sm font-medium rounded-lg text-red-500 border border-red-300 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                Sign Out
              </button>
            )}
          </div>        </div>
      </div>
    </div>
  );
};

export default Navbar;