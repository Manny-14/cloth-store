import React, { useState } from 'react'
import Title from '../components/Title'
import { IoMdAddCircleOutline } from "react-icons/io";
import UploadProduct from '../components/UploadProduct';

const AllProducts = () => {

  const [openUploadProduct, setOpenUploadProduct] = useState(false)
  const closeUploadProduct = () => {
    setOpenUploadProduct(false)
  }
  return (
    <div className='p-4 h-[85vh] relative'>
      <div className='text-xl'>
        <Title text1={"ALL"} text2={"Products"}/>
      </div>

      {
        openUploadProduct && (
          <UploadProduct closeUploadProduct={closeUploadProduct}/>
        )
      }
      <IoMdAddCircleOutline  className='text-6xl absolute right-0 bottom-10 hover:scale-110 cursor-pointer' onClick={()=>setOpenUploadProduct(true)}/>
    </div>
  )
}

export default AllProducts