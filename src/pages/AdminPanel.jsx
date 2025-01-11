import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';

const AdminPanel = () => {
    const navigate = useNavigate();

    const { currentUser } = useAuth();
    console.log(currentUser?.role !== "ADMIN")
    useEffect(() => {
        if (currentUser?.role !== "ADMIN") {
            navigate("/")
        }
    }, [currentUser])
  return (
    <div>AdminPanel</div>
  )
}

export default AdminPanel