import React from 'react'
import { useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import { doCreateUserWithEmailAndPassword } from '../../firebase/auth';
import { toast } from 'react-toastify';
const Signup = () => {

  const supportEmail = "dressitup1000@gmail.com";
    const [user, setUser] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const onChangeHandler = (e) => {
        const {name, value} = e.target;
        setUser((prev) => {
            return {
                ...prev,
                [name] : value
            }
        });
    };

    const { theme, navigate } = React.useContext(ShopContext);
    const inputClasses =
      theme === "dark"
        ? "bg-slate-900 border-gray-700 text-white placeholder:text-gray-400"
        : "bg-white border-gray-800 text-black placeholder:text-gray-500";
    const toggleTextColor = theme === "dark" ? "text-gray-300" : "text-gray-600";
    const dividerColor = theme === "dark" ? "bg-gray-200" : "bg-gray-800";
    
    const onSubmitHandler = async (e) => {
        e.preventDefault();
        try {
            if (user.password !== user.confirmPassword) {
                throw new Error("Passwords do not match. Please re-enter them.");
            }
            await doCreateUserWithEmailAndPassword(user.email, user.password, user.name);
            toast.success("Account created successfully.");
            navigate('/');
        } catch (error) {
            toast.error(error?.message || "We couldn't create your account right now. Please try again.");
        }
    };

  return (
    <div className="flex items-center justify-center h-screen">
      <form
        onSubmit={onSubmitHandler}
        className="flex flex-col items-center w-[90%] sm:max-w-96 gap-4"
      >
        <div className="inline-flex items-center gap-2 mb-2 mt-10">
          <p className="prata-regular text-lg">Sign up</p>
          <hr className={`border-none h-[1.5px] w-8 ${dividerColor}`} />
        </div>
        <input
            name='name'
            value={user.name}
            type="text"
            className={`w-full px-3 py-2 border ${inputClasses}`}
            placeholder="Full Name"
            onChange={onChangeHandler}
            required
        />
        <input
            name='email'
            value={user.email}
            type="email"
            className={`w-full px-3 py-2 border ${inputClasses}`}
            placeholder="Email Address"
            onChange={onChangeHandler}
            required
        />
        <div className="w-full relative">
          <input
            name='password'  
            type={showPassword ? "text" : "password"}
            value={user.password}
            className={`w-full px-3 py-2 border pr-12 ${inputClasses}`}
            placeholder="Password"
            onChange={onChangeHandler}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${toggleTextColor}`}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        <div className="w-full relative">
          <input
            name='confirmPassword'
            type={showConfirmPassword ? "text" : "password"}
            value={user.confirmPassword}
            className={`w-full px-3 py-2 border pr-12 ${inputClasses}`}
            placeholder="Confirm Password"
            onChange={onChangeHandler}
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${toggleTextColor}`}
          >
            {showConfirmPassword ? "Hide" : "Show"}
          </button>
        </div>
        <div className="w-full flex justify-between text-sm mt-[-10px]">
            <a
                href={`mailto:${supportEmail}?subject=${encodeURIComponent("Dress-It-Up account help")}`}
                className="cursor-pointer"
            >
                Need account help?
            </a>
            <p
                className="cursor-pointer"
                onClick={(e) => {
                    e.preventDefault();
                    navigate('/login')
            }}
            >
                Login here
            </p>
        </div>
        <button
          className={`${
            theme === 'light' ? 'bg-black text-white' : 'bg-white text-black'
          } font-light px-8 py-2 mt-4 rounded`}
        >
          Sign Up
        </button>
      </form>
    </div>
  )
}

export default Signup
