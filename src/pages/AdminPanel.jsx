import React, { useContext, useEffect, useState } from 'react'
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { ShopContext } from '../context/ShopContext';
import { assets } from '../assets/assets';
import { signOutUser } from '../../firebase/auth';
import { toast } from 'react-toastify';
import ThemeToggleButton from '../components/ThemeToggleButton';

const AdminPanel = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const { currentUser } = useAuth();
    useEffect(() => {
        if (currentUser?.role !== "ADMIN") {
            navigate("/")
        }
    }, [currentUser])

    // Derive active page from the current URL path
    const pathSegment = location.pathname.split('/').pop();
    const activePage = ['all-users', 'all-products', 'all-orders', 'system-health'].includes(pathSegment)
      ? pathSegment
      : 'all-users';

    // Mobile menu state
    const [menuOpen, setMenuOpen] = useState(false);

    const { theme } = useContext(ShopContext);

    // Dynamic classnames for theme
    const textColor = theme === "dark" ? "text-white" : "text-gray-700";
    const iconColor = theme === "dark" ? "filter invert" : "";
    const activeBorder = theme === "dark" ? "border-b-white" : "border-b-gray-700";

    const logoutHandler = async () => {
      try {
        await signOutUser();
        toast.success("Admin signed out");
        navigate('/login');
      } catch (error) {
        console.error("Error signing out:", error);
        toast.error("Failed to sign out");
      }
    };

    const navLinks = [
      { key: 'all-users', label: 'All Users', to: '/admin-panel/all-users' },
      { key: 'all-products', label: 'All Products', to: '/admin-panel/all-products' },
      { key: 'all-orders', label: 'All Orders', to: '/admin-panel/all-orders' },
      { key: 'system-health', label: 'System Health', to: '/admin-panel/system-health' },
    ];

  return (
    <div>
      {/* ─── Desktop nav ─── */}
      <nav className={`hidden md:flex items-center justify-between py-5 font-medium ${textColor}`}>

        {/* Admin identity */}
        <div className='flex items-center gap-4'>
          <img
            src={assets.profile_icon}
            className={`w-8 min-w-8 ${iconColor}`}
            alt="profile icon"
          />
          <div className='flex flex-col leading-tight'>
            <p className='font-semibold'>{currentUser.displayName}</p>
            <p className='text-xs uppercase tracking-wider opacity-70'>Admin</p>
          </div>
        </div>

        {/* Menu links */}
        <div className='flex items-center gap-6 text-sm'>
          {navLinks.map(({ key, label, to }) => (
            <Link
              key={key}
              to={to}
              className={`pb-1 transition-all ${
                activePage === key
                  ? `font-semibold border-b-2 ${activeBorder}`
                  : 'hover:opacity-80'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Theme + Logout */}
        <div className='flex items-center gap-4'>
          <ThemeToggleButton variant="icon" />
          <button
            onClick={logoutHandler}
            className='text-sm px-3 py-1.5 rounded border border-current hover:opacity-80 transition-opacity'
          >
            Logout
          </button>
        </div>
      </nav>

      {/* ─── Mobile nav ─── */}
      <nav className={`md:hidden py-4 font-medium ${textColor}`}>
        <div className='flex items-center justify-between'>
          {/* Admin identity (compact) */}
          <div className='flex items-center gap-3'>
            <img
              src={assets.profile_icon}
              className={`w-7 min-w-7 ${iconColor}`}
              alt="profile icon"
            />
            <div className='flex flex-col leading-tight'>
              <p className='font-semibold text-sm'>{currentUser.displayName}</p>
              <p className='text-[0.65rem] uppercase tracking-wider opacity-70'>Admin</p>
            </div>
          </div>

          {/* Right actions */}
          <div className='flex items-center gap-3'>
            <ThemeToggleButton variant="icon" />
            {/* Hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className='flex flex-col justify-center items-center w-7 h-7 gap-[5px]'
              aria-label='Toggle menu'
            >
              <span className={`block w-5 h-0.5 transition-all ${theme === 'dark' ? 'bg-white' : 'bg-gray-700'} ${menuOpen ? 'rotate-45 translate-y-[3.5px]' : ''}`} />
              <span className={`block w-5 h-0.5 transition-all ${theme === 'dark' ? 'bg-white' : 'bg-gray-700'} ${menuOpen ? '-rotate-45 -translate-y-[3.5px]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Dropdown menu */}
        {menuOpen && (
          <div className={`mt-3 rounded-lg border ${theme === 'dark' ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'} overflow-hidden`}>
            {navLinks.map(({ key, label, to }) => (
              <Link
                key={key}
                to={to}
                onClick={() => setMenuOpen(false)}
                className={`block px-4 py-3 text-sm border-b last:border-b-0 ${
                  theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                } ${
                  activePage === key
                    ? `font-semibold ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`
                    : 'hover:opacity-80'
                }`}
              >
                {label}
              </Link>
            ))}
            <button
              onClick={async () => { setMenuOpen(false); await logoutHandler(); }}
              className={`w-full text-left px-4 py-3 text-sm font-semibold text-red-500 ${
                theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-white'
              }`}
            >
              Logout
            </button>
          </div>
        )}
      </nav>

      <main>
        <Outlet />
      </main>
    </div>
  )
}

export default AdminPanel