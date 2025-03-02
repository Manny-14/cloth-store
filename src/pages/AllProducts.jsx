import React from 'react'
import Title from '../components/Title'
import { IoMdAddCircleOutline } from "react-icons/io";

const AllProducts = () => {
  return (
    <div className='p-4 h-[85vh] relative'>
      <div className='text-xl'>
        <Title text1={"ALL"} text2={"Products"}/>
      </div>

      <IoMdAddCircleOutline  className='text-6xl absolute right-0 bottom-10'/>
    </div>
  )
}

export default AllProducts