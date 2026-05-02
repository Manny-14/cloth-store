import React, { useEffect, useState } from 'react'
import { getAllUsers } from '../../firebase/user/getAllUsers'
import Title from '../components/Title'
import { toast } from 'react-toastify';
import { ShopContext } from '../context/ShopContext';

const AllUsers = () => {
  const [users, setUsers] = useState([]);
  const { theme } = React.useContext(ShopContext)
  const borderColor = theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
  const textColor = theme === 'dark' ? 'text-gray-100' : 'text-gray-800'
  const panelBg = theme === 'dark' ? 'bg-gray-900' : 'bg-white'
  const mutedText = theme === 'dark' ? 'text-gray-400' : 'text-gray-500'

  useEffect(()=>{
    const fetchUsers = async () => {
      try {
        const allUsers = await getAllUsers();
        setUsers(allUsers);
      } catch (error) {
        toast.error("Error retrieving users");
      }
    }

    fetchUsers();
  },[])

  return (
    <div className='p-4 h-[85vh] overflow-hidden'>
      <div className='text-xl'>
        <Title text1={"ALL"} text2={"Users"}/>
      </div>

      {/** All Users table */}
      <div className={`mt-4 rounded-lg border ${borderColor} ${panelBg} overflow-hidden`}>
        <div className="w-full overflow-x-auto">
          <table className='w-full min-w-[640px] text-sm'>
            <thead className={`${theme === 'light' ? 'bg-black text-white' : 'bg-gray-900 text-white'}`}>
              <tr>
                <th className='text-left py-3 px-4 whitespace-nowrap'>S/N</th>
                <th className='text-left py-3 px-4 min-w-40'>Name</th>
                <th className='text-left py-3 px-4 min-w-64'>Email</th>
                <th className='text-left py-3 px-4 whitespace-nowrap'>Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr key={user.id}>
                  <td className={`border-t px-4 py-3 whitespace-nowrap ${borderColor} ${textColor}`}>{index + 1}</td>
                  <td className={`border-t px-4 py-3 ${borderColor} ${textColor}`}>{user.displayName || "No name"}</td>
                  <td className={`border-t px-4 py-3 break-all ${borderColor} ${textColor}`}>{user.email || "No email"}</td>
                  <td className={`border-t px-4 py-3 whitespace-nowrap ${borderColor} ${textColor}`}>{user.role || "GENERAL"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={`px-4 py-3 text-xs sm:hidden ${mutedText}`}>
          Swipe sideways to see all user details.
        </p>
      </div>
    </div>
  )
}

export default AllUsers
