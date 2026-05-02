import React, { useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import { toast } from 'react-toastify';
import { FcGoogle } from "react-icons/fc";
import { doSignInWithEmailAndPassword, doSignInWithGoogle } from '../../firebase/auth';
import { logGoogleSignInFailure } from '../helper/authLogging';

const Login = () => {
  const [user, setUser] = useState({
      email: '',
      password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

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
  const googleButtonClasses =
    theme === "dark"
      ? "border-gray-700 bg-slate-900 text-white hover:bg-slate-800"
      : "border-gray-300 bg-white text-black hover:bg-gray-50";

  const onSubmitHandler = async(e) => {
    e.preventDefault();
    try {
      await doSignInWithEmailAndPassword(user.email, user.password);
      toast.success("Signed in successfully.");
      navigate('/');
    } catch (error) {
      toast.error(error?.message || "We couldn't sign you in right now. Please try again.");
    }
  };

  const onGoogleSignIn = async () => {
    try {
      const result = await doSignInWithGoogle();
      if (result?.redirecting) {
        toast.info("Redirecting to Google sign-in...");
        return;
      }
      toast.success("Signed in with Google.");
      navigate('/');
    } catch (error) {
      if (error?.message === "Google sign-in was canceled.") {
        toast.info(error.message);
        return;
      }
      logGoogleSignInFailure(error, { page: "login" });
      toast.error(error?.message || "We couldn't sign you in with Google right now.");
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center py-10">
      <form
        onSubmit={onSubmitHandler}
        className="flex flex-col items-center w-[90%] sm:max-w-96 gap-4"
      >
        <div className="inline-flex items-center gap-2 mb-2 mt-10">
          <p className="prata-regular text-lg">Login</p>
          <hr className={`border-none h-[1.5px] w-8 ${dividerColor}`} />
        </div>
        <input
          name='email'
          value={user.email}
          type="email"
          className={`w-full px-3 py-2 border ${inputClasses}`}
          placeholder="Email Address"
          required
          onChange={onChangeHandler}
        />
        <div className="w-full relative">
          <input
            name='password'
            value={user.password}
            type={showPassword ? "text" : "password"}
            className={`w-full px-3 py-2 border pr-12 ${inputClasses}`}
            placeholder="Password"
            required
            onChange={onChangeHandler}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${toggleTextColor}`}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        <div className="w-full flex justify-between text-sm mt-[-10px]">
          <button
            type="button"
            onClick={() =>
              navigate('/forgot-password', {
                state: { email: user.email.trim() },
              })
            }
            className="cursor-pointer"
          >
            Forgot password?
          </button>
            <p
              onClick={(e) => {
                e.preventDefault();
                navigate('/signup');
              }}
              className="cursor-pointer"
            >
              Create account
          </p>
        </div>
        <button
          className={`${
            theme === 'light' ? 'bg-black text-white' : 'bg-white text-black'
          } font-light px-8 py-2 mt-4 rounded`}
        >
          Sign In
        </button>
        <div className={`flex w-full items-center gap-3 text-xs ${toggleTextColor}`}>
          <span className="h-px flex-1 bg-current opacity-30" />
          <span>or</span>
          <span className="h-px flex-1 bg-current opacity-30" />
        </div>
        <button
          type="button"
          onClick={onGoogleSignIn}
          className={`flex w-full items-center justify-center gap-2 rounded border px-4 py-2 text-sm transition-colors ${googleButtonClasses}`}
        >
          <FcGoogle className="text-lg" aria-hidden="true" />
          Continue with Google
        </button>
      </form>
    </div>
  );
};

export default Login;
