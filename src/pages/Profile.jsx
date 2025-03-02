import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/authContext';
import { useNavigate } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import { MdOutlineCancel } from "react-icons/md";
import { updateDisplayName } from '../../firebase/user/updateDisplayName';
import { toast } from 'react-toastify';

const Profile = () => {
    const { currentUser } = useAuth();
    console.log("currentUser", currentUser);
    const { theme } = React.useContext(ShopContext)
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
                        <hr className="border-none h-[1.5px] w-8 bg-gray-800" />
                    </div>
                    <div className='w-full px-3 md:text-lg text-black grid grid-cols-2 md:gap-y-4'>
                        <p>Display Name:</p>
                        <p>{currentUser?.displayName}</p>
                        <p>Email:</p>
                        <p>{currentUser?.email}</p>
                    </div>
                    {/* <div className="w-full px-3 text-black flex gap-4">
                        <p>Display Name:</p>
                        <p>{currentUser?.displayName}</p>
                    </div>
                    <div className="w-full px-3 text-black flex gap-4">
                        <p>Email:</p>
                        <p>{currentUser?.email}</p>
                    </div> */}
                    <div className='flex gap-6 text-sm'>
                    <button
                    className={`${
                        theme === 'light' ? 'bg-black text-white' : 'bg-white text-black'
                    } flex-1 font-light px-3 py-2 mt-4 rounded`}
                    onClick={() => setOpenUpdateDisplayName(true)}
                    >
                        Update Display Name
                    </button>

                    {/** TODO: CREATE CHANGE PASSWORD FUNCTIONALITY */}
                    <button
                    className={`${
                        theme === 'light' ? 'bg-black text-white' : 'bg-white text-black'
                    } flex-1 font-light px-4 py-2 mt-4 rounded`}
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
                                className="w-full px-3 py-2 border border-gray-800 text-black"
                                placeholder="Display Name"
                                required
                                onChange={onChangeHandler}
                            />
                            <MdOutlineCancel 
                                className='absolute -right-2 -top-2 text-lg cursor-pointer'
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