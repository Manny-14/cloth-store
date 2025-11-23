import React from 'react'
import Title from '../components/Title'
import { ShopContext } from '../context/ShopContext'

const AllOrders = () => {
  const { theme } = React.useContext(ShopContext)
  return (
    <div className="p-4">
      <div className="text-xl">
        <Title text1="ALL" text2="Orders" />
      </div>
      <p className={`mt-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
        Orders dashboard is coming soon.
      </p>
    </div>
  )
}

export default AllOrders