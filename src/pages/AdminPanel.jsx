import React, { useContext, useEffect, useState } from 'react'
import { Link, Outlet, Routes, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { ShopContext } from '../context/ShopContext';
import { assets } from '../assets/assets';
import { RxDividerVertical } from 'react-icons/rx';
import { IoReturnUpBack } from 'react-icons/io5';
import ThemeToggleButton from '../components/ThemeToggleButton';

const AdminPanel = () => {
    const navigate = useNavigate();

    const { currentUser } = useAuth();
    useEffect(() => {
        if (currentUser?.role !== "ADMIN") {
            navigate("/")
        }
    }, [currentUser])

    // Set styling mode for active menu option
    // TODO: back button does not set active page well, fix
    const [ activePage, setActivePage ] = useState("all-users")

    const { theme } = useContext(ShopContext);
    
      // Dynamic classnames for theme
    const textColor = theme === "dark" ? "text-white" : "text-gray-700";
    const iconColor = theme === "dark" ? "filter invert" : "";
  return (
    <div>
      <nav className={`flex items-center justify-between py-5 font-medium ${textColor}`}>

        {/* Admin Information */}
        <div className='flex items-center justify-center gap-5'>
          <img
            src={assets.profile_icon}
            className={`w-8 min-w-8 ${iconColor}`}
            alt="profile icon"
          />

          <div className='flex-col'>
            <p>{currentUser.displayName}</p>
            <p>ADMIN</p>
          </div>
        </div>

        {/** Admin menu */}
        <div className='flex items-center justify-center text-lg gap-2'>
          {
            activePage !== 'all-users' ? (
              <Link to={"/admin-panel/all-users"}
                onClick={() => setActivePage("all-users")}>All Users</Link>
            ) : (
              <Link to={"/admin-panel/all-users"} className='scale-110 border-b-2 border-b-gray-700'>All Users</Link>
            )
          }
          <RxDividerVertical />
          {
            activePage !== 'all-products' ? (
              <Link to={"/admin-panel/all-products"}
                onClick={() => setActivePage("all-products")}>All Products</Link>
            ) : (
              <Link to={"/admin-panel/all-products"} className='scale-110 border-b-2 border-b-gray-700'>All Products</Link>
            )
          }
          <RxDividerVertical />
          {
            activePage !== 'all-orders' ? (
              <Link to={"/admin-panel/all-orders"}
                onClick={() => setActivePage("all-orders")}>All Orders</Link>
            ) : (
              <Link to={"/admin-panel/all-orders"} className='scale-110 border-b-2 border-b-gray-700'>All Orders</Link>
            )
          }
        </div>

        {/** Exit Admin panel + Theme toggle */}
        <div className='flex items-center gap-4'>
          <ThemeToggleButton />
          <Link to="/" className='text-3xl font-bold'>
            <IoReturnUpBack />
          </Link>
        </div>
      </nav>

      <main>
        <Outlet />
      </main>
    </div>
  )
}

export default AdminPanel