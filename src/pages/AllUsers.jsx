import React, { useEffect, useState } from 'react'
import { getAllUsers } from '../../firebase/user/getAllUsers'
import Title from '../components/Title'
import { toast } from 'react-toastify';
import { use } from 'react';

const AllUsers = () => {
  const [users, setUsers] = useState([]);
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
      <div>
        <table>
          <thead>
            <tr>
              <th>S/N</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr key={user.id}>
                <td>{index + 1}</td>
                <td>{user.displayName}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AllUsers