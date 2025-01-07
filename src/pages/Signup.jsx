import React from 'react'
import { useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import { doCreateUserWithEmailAndPassword } from '../../firebase/auth';
import { useAuth } from '../context/authContext';
import { toast } from 'react-toastify';
const Signup = () => {

    const [user, setUser] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

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
    
    const onSubmitHandler = async (e) => {
        e.preventDefault();
        try {
            if (user.password !== user.confirmPassword) {
                throw new Error("Passwords do not match");
            }
            await doCreateUserWithEmailAndPassword(user.email, user.password, user.name);
            toast.success("User created successfully");
            navigate('/');
        } catch (error) {
            toast.error(error.message);
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
          <hr className="border-none h-[1.5px] w-8 bg-gray-800" />
        </div>
        <input
            name='name'
            value={user.name}
            type="text"
            className="w-full px-3 py-2 border border-gray-800 text-black"
            placeholder="Full Name"
            onChange={onChangeHandler}
            required
        />
        <input
            name='email'
            value={user.email}
            type="email"
            className="w-full px-3 py-2 border border-gray-800 text-black"
            placeholder="Email Address"
            onChange={onChangeHandler}
            required
        />
        <input
          name='password'  
          type="password"
          value={user.password}
          className="w-full px-3 py-2 border border-gray-800 text-black"
          placeholder="Password"
          onChange={onChangeHandler}
          required
        />
        <input
          name='confirmPassword'
          type="password"
          value={user.confirmPassword}
          className="w-full px-3 py-2 border border-gray-800 text-black"
          placeholder="Confirm Password"
          onChange={onChangeHandler}
          required
        />
        <div className="w-full flex justify-between text-sm mt-[-10px]">
            <p className="cursor-pointer">Forgot your password?</p>
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
          'Sign Up'
        </button>
      </form>
    </div>
  )
}

export default Signup