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

  console.log("All users here", users)
  return (
    <div className='p-4 h-[85vh]'>
      <div className='text-xl'>
        <Title text1={"ALL"} text2={"Users"}/>
      </div>

      {/** All Users table */}
      <div className='w-full flex justify-center'>
        <table className='w-full'>
          <thead className={`${theme === 'light' ? 'bg-black text-white' : 'bg-white text-black'}`}>
            <tr>
              <th className='text-left py-1 px-4'>S/N</th>
              <th className='text-left py-1 px-4'>Name</th>
              <th className='text-left py-1 px-4'>Email</th>
              <th className='text-left py-1 px-4'>Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr key={user.id}>
                <td className={`border-l border-y px-4 py-2 ${borderColor} ${textColor}`}>{index + 1}</td>
                <td className={`border-y px-4 py-2 ${borderColor} ${textColor}`}>{user.displayName}</td>
                <td className={`border-y px-4 py-2 ${borderColor} ${textColor}`}>{user.email}</td>
                <td className={`border-y border-r px-4 py-2 ${borderColor} ${textColor}`}>{user.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AllUsers