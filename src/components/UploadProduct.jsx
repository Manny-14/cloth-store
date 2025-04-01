import React, { useState } from 'react'
import { IoMdClose } from "react-icons/io";
import { CiImageOn } from "react-icons/ci";
import { ShopContext } from '../context/ShopContext';
import { toast } from 'react-toastify';

const UploadProduct = ({ closeUploadProduct }) => {

    const { theme } = React.useContext(ShopContext)
    const [productData, setProductData] = useState({
        productName : "",
        costPrice : "",
        sellingPrice : "",
        quantity : "",
        description : "",
        images : []
    })


    const handleOnChange = (e) => {
        const { name, value } = e.target;
        setProductData({ ...productData, [e.target.name]: e.target.value })
    }

    const [uploadedImages, setUploadedImages] = useState([])
    const uploadImage = (e) => {
        const files = Array.from(e.target.files)
        if (uploadedImages.length + files.length > 4) {
            toast.error("You can only uplaod a maximum of 4 images")
            return
        }
        const imageUrls = files.map(file => URL.createObjectURL(file))
        setUploadedImages(prev => [...prev, ...imageUrls])
    }

    const deleteImage = (index) => {
        console.log("Uploaded Images", uploadedImages)
        setUploadedImages((prev) => prev.filter((_, i) => i !== index))
    }

    const replaceImage = (index, e) => {
        const image = e.target.files[0]
        if (image) {
            setUploadedImages((prev) =>
                prev.map((img, i) => ( i === index ? URL.createObjectURL(image) : img))
            )
        }
    }

  return (
    <div className={`${theme === 'light' ? 'bg-slate-200' : 'bg-slate-800'} fixed bg-opacity-50 w-full h-full top-0 left-0 right-0 bottom-0 flex justify-center items-center`}>
        <div className={`${theme === 'light' ? 'bg-white' : 'bg-black'} p-5 w-full h-full max-w-2xl max-h-[80%] rounded shadow-sm overflow-y-auto`}>
            <div className='pb-5 flex justify-between items-center'>
                <h2 className='font-bold text-2xl'>Upload Product</h2>
                <IoMdClose className='text-3xl cursor-pointer' onClick={closeUploadProduct}/>
            </div>

            <form className='grid gap-2'>
                <label htmlFor='productName'>Product Name:</label>
                <input
                    type='text'
                    id='productName'
                    placeholder='enter product name'
                    name='productName'
                    value={productData.productName}
                    className={`${theme === 'light' ? 'bg-slate-50' : 'bg-slate-900'} border-dashed border-2 rounded p-2`}
                    required
                    onChange={handleOnChange}
                />

                <div className='grid grid-cols-2 grid-rows-1 gap-x-4'>
                    <label htmlFor='costPrice' className='col-start-1 row-start-1'>Cost Price</label>
                    <input 
                        type='number'
                        id='costPrice'
                        placeholder='0'
                        name='costPrice'
                        value={productData.costPrice}
                        className={`${theme === 'light' ? 'bg-slate-50' : 'bg-slate-900'} border-dashed border-2 rounded p-2 col-start-1 row-start-2 no-arrows`}
                        onChange={handleOnChange}
                    />

                    <label htmlFor='sellingPrice' className='col-start-2 row-start-1'>Selling Price</label>
                    <input 
                        type='number'
                        id='sellingPrice'
                        placeholder='0'
                        name='sellingPrice'
                        value={productData.sellingPrice}
                        className={`${theme === 'light' ? 'bg-slate-50' : 'bg-slate-900'} border-dashed border-2 rounded p-2 col-start-2 row-start-2 no-arrows`}
                        onChange={handleOnChange}
                    />
                </div>

                <label htmlFor='quantity'>Quantity Available</label>
                <input 
                    type='number'
                    id='quantity'
                    placeholder='0'
                    name='quantity'
                    value={productData.quantity}
                    className={`${theme === 'light' ? 'bg-slate-50' : 'bg-slate-900'} border-dashed border-2 rounded p-2 no-arrows`}
                    onChange={handleOnChange}
                />

                <label>Product Images</label>
                <div className={`${theme === 'light' ? 'bg-slate-50' : 'bg-slate-900'} border-2 border-dashed p-4 flex justify-normal gap-5 items-center`}>
                    <div className={`${theme === 'light' ? 'bg-slate-100' : 'bg-slate-800'} px-3 py-2 rounded-md border-2 flex-col items-center justify-center`}>
                        <label htmlFor='productImage' className='cursor-pointer'>
                            <input
                                type='file'
                                accept='image/*'
                                id='productImage'
                                name='productImage'
                                onChange={uploadImage}
                                multiple
                                className='hidden'
                            />
                            <div className='flex flex-col items-center justify-center'>
                                <span className='text-4xl text-slate-500'><CiImageOn /></span>
                                <p className='text-blue-600 underline'>Click to upload</p>
                            </div>
                        </label>
                    </div>
                    {
                        uploadedImages[0] ? (
                            <div className='flex gap-3 items-center'>
                                {
                                    uploadedImages.map((el, index) => {
                                        return (
                                            <div className='relative' key={index}>
                                                <img 
                                                    src={el}
                                                    alt={el} // probably put a better image description later
                                                    width={80} // I am not sure about this width or height dimensions especially since the images I upload just do whatever when I place it
                                                    height={80}
                                                    className='rounded-md object-cover'
                                                />
                                                <div className='absolute top-0 rounded-md w-full h-full bg-slate-500 opacity-0 hover:opacity-70 flex flex-col gap-2 items-center justify-center'>
                                                    <label className='px-2 bg-white text-black rounded-full text-sm  cursor-pointer hover:scale-105'>
                                                        <input
                                                            type='file'
                                                            accept='image/*'
                                                            onChange={(e) => replaceImage(index, e)}
                                                            className='hidden'
                                                        />    
                                                            Replace</label>
                                                    <button 
                                                        type='button'
                                                        className='px-2 bg-white text-black rounded-full text-sm cursor-pointer hover:scale-105' 
                                                        onClick={() => deleteImage(index)}>Remove</button>
                                                </div>
                                            </div>
                                        )
                                    })
                                }
                            </div>
                        ) : (
                            <div><span className='text-red-600'>*</span>Please Upload Product Image</div>
                        )
                    }
                </div>

                <label htmlFor='description'>Description:</label>
                <textarea
                    id='description'
                    placeholder='enter product description'
                    name='description'
                    value={productData.description}
                    className={`${theme === 'light' ? 'bg-slate-50' : 'bg-slate-900'} border-dashed border-2 rounded p-2 resize-none h-32`}
                    required
                    onChange={handleOnChange}
                />
            </form>
        </div>
    </div>
  )
}

export default UploadProduct