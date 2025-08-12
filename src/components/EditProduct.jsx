import React, { useState } from "react";
import { IoMdClose } from "react-icons/io";
import { CiImageOn } from "react-icons/ci";
import { ShopContext } from "../context/ShopContext";
import { toast } from "react-toastify";
import uploadImage from "../helper/cloudinary";
import { editProduct } from "../../firebase/products/editProduct";
import { productCategory, productType } from "../helper/dropdowns";

const EditProduct = ({ product, closeEditProduct, onProductUpdated }) => {
  const { theme } = React.useContext(ShopContext);
  const [productData, setProductData] = useState({
    productName: product.productName || "",
    costPrice: product.costPrice || "",
    sellingPrice: product.sellingPrice || "",
    smallQuantity: product.smallQuantity || "",
    mediumQuantity: product.mediumQuantity || "",
    largeQuantity: product.largeQuantity || "",
    xlQuantity: product.xlQuantity || "",
    description: product.description || "",
    category: product.category || "",
    type: product.type || "",
    images: product.images ? [...product.images] : [],
  });

  const [uploadedImages, setUploadedImages] = useState(product.images ? [...product.images] : []);

  const handleOnChange = (e) => {
    setProductData({ ...productData, [e.target.name]: e.target.value });
  };

  const handleUploadImage = async (e) => {
    const files = Array.from(e.target.files);
    if (uploadedImages.length + files.length > 4) {
      toast.error("You can only upload a maximum of 4 images");
      return;
    }
    try {
      const uploadPromises = files.map((file) => uploadImage(file));
      const cloudinaryResponses = await Promise.all(uploadPromises);
      const imageURLS = cloudinaryResponses.map((result) => result.url);
      setUploadedImages((prev) => [...prev, ...imageURLS]);
    } catch (error) {
      toast.error("Image Upload Failed");
    }
  };

  const handleDeleteImage = (index) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
    // TODO: Optionally delete from cloudinary
  };

  const handleReplaceImage = async (index, e) => {
    const image = e.target.files[0];
    if (image) {
      try {
        const cloudinaryResponse = await uploadImage(image);
        const imageURL = cloudinaryResponse.url;
        setUploadedImages((prev) => prev.map((img, i) => (i === index ? imageURL : img)));
      } catch (error) {
        toast.error("Image replacement failed");
      }
    }
  };

  const handleOnSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...productData, images: [...uploadedImages] };
    try {
      await editProduct(product.id || product._id, payload);
      toast.success("Product Updated Successfully");
      if (onProductUpdated) onProductUpdated();
      closeEditProduct();
    } catch (error) {
      toast.error("Failed to update Product");
    }
  };

  return (
    <div
      className={`fixed w-full h-full top-0 left-0 right-0 bottom-0 flex justify-center items-center z-50 ${
        theme === "light"
          ? "bg-slate-200 bg-opacity-50"
          : "bg-slate-800 bg-opacity-70"
      }`}
    >
      <div
        className={`p-5 w-full h-full max-w-2xl max-h-[85%] rounded shadow-sm overflow-y-auto ${
          theme === "light" ? "bg-white" : "bg-black"
        }`}
      >
        <div className="pb-5 flex justify-between items-center">
          <h2 className="font-bold text-2xl">Edit Product</h2>
          <IoMdClose
            className="text-3xl cursor-pointer"
            onClick={closeEditProduct}
          />
        </div>
        <form className="grid gap-2" onSubmit={handleOnSubmit}>
          <label htmlFor="productName">Product Name:</label>
          <input
            type="text"
            id="productName"
            placeholder="enter product name"
            name="productName"
            value={productData.productName}
            className={`$ {
              theme === "light" ? "bg-slate-50" : "bg-slate-900"
            } border-dashed border-2 rounded p-2`}
            required
            onChange={handleOnChange}
          />
          <div className="grid grid-cols-2 grid-rows-1 gap-x-4">
            <label htmlFor="costPrice" className="col-start-1 row-start-1">
              Cost Price
            </label>
            <input
              type="number"
              id="costPrice"
              placeholder="0"
              min="0"
              name="costPrice"
              value={productData.costPrice}
              className={`$ {
                theme === "light" ? "bg-slate-50" : "bg-slate-900"
              } border-dashed border-2 rounded p-2 col-start-1 row-start-2 no-arrows`}
              onChange={handleOnChange}
            />
            <label htmlFor="sellingPrice" className="col-start-2 row-start-1">
              Selling Price
            </label>
            <input
              type="number"
              id="sellingPrice"
              placeholder="0"
              min="0"
              name="sellingPrice"
              value={productData.sellingPrice}
              className={`$ {
                theme === "light" ? "bg-slate-50" : "bg-slate-900"
              } border-dashed border-2 rounded p-2 col-start-2 row-start-2 no-arrows`}
              onChange={handleOnChange}
            />
          </div>
          <p className="text-center mt-1">Quantity Available</p>
          <div className="flex gap-2 justify-between">
            <div className="flex gap-1 items-center flex-1 min-w-0">
              <label htmlFor="smallQuantity">S</label>
              <input
                className={`$ {
                  theme === "light" ? "bg-slate-50" : "bg-slate-900"
                } border-dashed border-2 rounded w-full min-w-0 p-2`}
                type="number"
                id="smallQuantity"
                placeholder="0"
                min="0"
                name="smallQuantity"
                value={productData.smallQuantity}
                onChange={handleOnChange}
              />
            </div>
            <div className="flex gap-1 items-center flex-1 min-w-0">
              <label htmlFor="mediumQuantity">M</label>
              <input
                className={`$ {
                  theme === "light" ? "bg-slate-50" : "bg-slate-900"
                } border-dashed border-2 rounded w-full min-w-0 p-2`}
                type="number"
                id="mediumQuantity"
                placeholder="0"
                min="0"
                name="mediumQuantity"
                value={productData.mediumQuantity}
                onChange={handleOnChange}
              />
            </div>
            <div className="flex gap-1 items-center flex-1 min-w-0">
              <label htmlFor="largeQuantity">L</label>
              <input
                className={`$ {
                  theme === "light" ? "bg-slate-50" : "bg-slate-900"
                } border-dashed border-2 rounded w-full min-w-0 p-2`}
                type="number"
                id="largeQuantity"
                placeholder="0"
                min="0"
                name="largeQuantity"
                value={productData.largeQuantity}
                onChange={handleOnChange}
              />
            </div>
            <div className="flex gap-1 items-center flex-1 min-w-0">
              <label htmlFor="xlQuantity">XL</label>
              <input
                className={`$ {
                  theme === "light" ? "bg-slate-50" : "bg-slate-900"
                } border-dashed border-2 rounded w-full min-w-0 p-2`}
                type="number"
                id="xlQuantity"
                placeholder="0"
                min="0"
                name="xlQuantity"
                value={productData.xlQuantity}
                onChange={handleOnChange}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-4">
            <div className="flex flex-col">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                name="category"
                value={productData.category}
                onChange={handleOnChange}
                className={`$ {
                  theme === "light" ? "bg-slate-50" : "bg-slate-900"
                } border-dashed border-2 rounded p-2`}
                required
              >
                <option value="" disabled>
                  Select Category
                </option>
                {productCategory.map((category) => (
                  <option key={category.id} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label htmlFor="type">Type</label>
              <select
                id="type"
                name="type"
                value={productData.type}
                onChange={handleOnChange}
                className={`$ {
                  theme === "light" ? "bg-slate-50" : "bg-slate-900"
                } border-dashed border-2 rounded p-2`}
                required
              >
                <option value="" disabled>
                  Select Type
                </option>
                {productType.map((type) => (
                  <option key={type.id} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <label>Product Images</label>
          <div
            className={`$ {
              theme === "light" ? "bg-slate-50" : "bg-slate-900"
            } border-2 border-dashed p-4 flex justify-normal gap-5 items-center`}
          >
            <div
              className={`$ {
                theme === "light" ? "bg-slate-100" : "bg-slate-800"
              } px-3 py-2 rounded-md border-2 flex-col items-center justify-center`}
            >
              <label htmlFor="productImage" className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  id="productImage"
                  name="productImage"
                  onChange={handleUploadImage}
                  multiple
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center">
                  <span className="text-4xl text-slate-500">
                    <CiImageOn />
                  </span>
                  <p className="text-blue-600 underline">Click to upload</p>
                </div>
              </label>
            </div>
            {uploadedImages[0] ? (
              <div className="flex gap-3 items-center">
                {uploadedImages.map((el, index) => {
                  return (
                    <div className="relative" key={index}>
                      <img
                        src={el}
                        alt={el}
                        width={80}
                        height={80}
                        className="rounded-md object-cover w-20 h-20"
                      />
                      <div className="absolute top-0 rounded-md w-full h-full bg-slate-500 opacity-0 hover:opacity-70 flex flex-col gap-2 items-center justify-center">
                        <label className="px-2 bg-white text-black rounded-full text-sm  cursor-pointer hover:scale-105">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleReplaceImage(index, e)}
                            className="hidden"
                          />
                          Replace
                        </label>
                        <button
                          type="button"
                          className="px-2 bg-white text-black rounded-full text-sm cursor-pointer hover:scale-105"
                          onClick={() => handleDeleteImage(index)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div>
                <span className="text-red-600">*</span>Please Upload Product Image
              </div>
            )}
          </div>
          <label htmlFor="description">Description:</label>
          <textarea
            id="description"
            placeholder="enter product description"
            name="description"
            value={productData.description}
            className={`$ {
              theme === "light" ? "bg-slate-50" : "bg-slate-900"
            } border-dashed border-2 rounded p-2 resize-none h-32`}
            required
            onChange={handleOnChange}
          />
          <button
            type="submit"
            className={`p-2 w-fit mx-auto mt-4 rounded-md ${
              theme === "light" ? "bg-black text-white" : "bg-white text-black"
            }`}
          >
            Update Product
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditProduct;
