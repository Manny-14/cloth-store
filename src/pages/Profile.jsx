import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/authContext';
import { useNavigate } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import { MdOutlineCancel } from "react-icons/md";
import { updateDisplayName } from '../../firebase/user/updateDisplayName';
import { toast } from 'react-toastify';


const Profile = () => {
    const { currentUser } = useAuth();
    const { theme } = React.useContext(ShopContext)
    const inputClasses =
        theme === "dark"
            ? "bg-slate-900 border-gray-700 text-white placeholder:text-gray-400"
            : "bg-white border-gray-800 text-black placeholder:text-gray-500";
    const iconColor = theme === "dark" ? "text-gray-300" : "text-gray-700";
    // update display name opens the input field to update the display name
    const [ openUpdateDisplayName, setOpenUpdateDisplayName ] = useState(false);
    // display name holds the state of the input field
    const [ displayName, setDisplayName ] = useState(currentUser?.displayName || '');

    // use effect to ensure the toast notification shows after the page is rendered
    useEffect(() => {
        if (localStorage.getItem('displayNameUpdated') === 'true') {
            toast.success("Display Name updated successfully");
            localStorage.removeItem('displayNameUpdated');
        }
    }, []);

    const onChangeHandler = (e) => {
        const { value } = e.target;
        setDisplayName(value);
    }

    const onSubmitHandler = async(e) => {
        e.preventDefault();
        if (displayName === currentUser?.displayName) {
            setOpenUpdateDisplayName(false);
            return;
        }
        try {
            await updateDisplayName(displayName);
            // Refreshing the page to make sure changes show after user updates name and use local storage to ensure user views the succcess message after refresh
            localStorage.setItem('displayNameUpdated', 'true');
            window.location.reload();
        } catch (error) {
            toast.error("Error updating display name");
        }
    }
  return (
    <div className="flex items-center justify-center h-screen">
        {
            !openUpdateDisplayName ? ( // if openUpdateDisplayName is false, show the user profile
                <div className="flex flex-col items-center w-[90%] sm:max-w-96 gap-4">
                    <div className="inline-flex items-center gap-2 mb-2 mt-10">
                        <p className="prata-regular text-lg">User Profile</p>
                        <hr className={`border-none h-[1.5px] w-8 ${theme === 'dark' ? 'bg-white' : 'bg-gray-800'}`} />
                    </div>
                    <div className={`w-full px-3 text-sm sm:text-base grid grid-cols-1 sm:grid-cols-2 gap-y-3 sm:gap-y-4 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                        <p className="font-medium">Display Name:</p>
                        <p className="break-words">{currentUser?.displayName}</p>
                        <p className="font-medium">Email:</p>
                        <p className="break-words">{currentUser?.email}</p>
                    </div>
                    {/* <div className="w-full px-3 text-black flex gap-4">
                        <p>Display Name:</p>
                        <p>{currentUser?.displayName}</p>
                    </div>
                    <div className="w-full px-3 text-black flex gap-4">
                        <p>Email:</p>
                        <p>{currentUser?.email}</p>
                    </div> */}
                    <div className='flex flex-col sm:flex-row gap-3 w-full px-3 mt-2 text-sm'>
                    <button
                    className={`${
                        theme === 'light' ? 'bg-black text-white' : 'bg-white text-black'
                    } flex-1 font-light px-4 py-2.5 rounded active:scale-[0.98] transition-transform`}
                    onClick={() => setOpenUpdateDisplayName(true)}
                    >
                        Update Display Name
                    </button>

                    {/** TODO: CREATE CHANGE PASSWORD FUNCTIONALITY */}
                    <button
                    className={`${
                        theme === 'light' ? 'bg-black text-white' : 'bg-white text-black'
                    } flex-1 font-light px-4 py-2.5 rounded active:scale-[0.98] transition-transform`}
                    >
                        Change Password
                    </button>
                    </div>
                </div> 
            ) : ( // if openUpdateDisplayName is true, show the input field to update the display name
                <div className="flex items-center justify-center h-screen">
                    <form
                        onSubmit={onSubmitHandler}
                        className="flex flex-col items-center w-[90%] sm:max-w-96 gap-4"
                    >
                        <div className='relative w-full'>
                            <input
                                name='name'
                                value={displayName}
                                type="text"
                                className={`w-full px-3 py-2 border ${inputClasses}`}
                                placeholder="Display Name"
                                required
                                onChange={onChangeHandler}
                            />
                            <MdOutlineCancel 
                                className={`absolute -right-2 -top-2 text-lg cursor-pointer ${iconColor}`}
                                onClick={()=>setOpenUpdateDisplayName(false)} />
                        </div>
                        <button
                        className={`${
                            theme === 'light' ? 'bg-black text-white' : 'bg-white text-black'
                        } font-light px-8 py-2 mt-4 rounded`}
                        >
                        Update
                        </button>
                    </form>
                    </div>
            )
        }
    </div>
  )
}

export default Profile