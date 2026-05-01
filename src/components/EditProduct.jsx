import React, { useState } from "react";
import { IoMdClose } from "react-icons/io";
import { CiImageOn } from "react-icons/ci";
import { ShopContext } from "../context/ShopContext";
import { toast } from "react-toastify";
import uploadImage from "../helper/cloudinary";
import { editProduct } from "../../firebase/products/editProduct";
import { productFilterOptions } from "../helper/dropdowns";
import { hasSizeVariants } from "../helper/inventory";
import { createAdminLog } from "../../firebase/logs/createAdminLog";

const EditProduct = ({ product, closeEditProduct, onProductUpdated }) => {
  const { theme, refreshProducts } = React.useContext(ShopContext);
  const initialHasSizes = hasSizeVariants(product);
  const [productData, setProductData] = useState({
    productName: product.productName || "",
    costPrice: product.costPrice || "",
    sellingPrice: product.sellingPrice || "",
    hasSizes: initialHasSizes,
    stockQuantity: product.stockQuantity || "",
    smallQuantity: product.smallQuantity || "",
    mediumQuantity: product.mediumQuantity || "",
    largeQuantity: product.largeQuantity || "",
    xlQuantity: product.xlQuantity || "",
    description: product.description || "",
    type: product.type || product.category || "",
    images: product.images ? [...product.images] : [],
  });

  const [uploadedImages, setUploadedImages] = useState(product.images ? [...product.images] : []);

  const overlayBg =
    theme === "light" ? "bg-slate-200 bg-opacity-50" : "bg-slate-800 bg-opacity-70";
  const modalBg = theme === "light" ? "bg-white" : "bg-black";
  const inputBg = theme === "light" ? "bg-slate-50" : "bg-slate-900";
  const dropzoneBg = theme === "light" ? "bg-slate-100" : "bg-slate-800";
  const overlayActionClasses =
    theme === "dark"
      ? "bg-slate-900 text-slate-100 border border-slate-700"
      : "bg-white text-black border border-slate-200";

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

  const toNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const handleOnSubmit = async (e) => {
    e.preventDefault();
    const hasSizes = Boolean(productData.hasSizes);
    const payload = {
      ...productData,
      category: productData.type,
      type: productData.type,
      costPrice: toNumber(productData.costPrice),
      sellingPrice: toNumber(productData.sellingPrice),
      hasSizes,
      stockQuantity: hasSizes
        ? toNumber(productData.smallQuantity) +
          toNumber(productData.mediumQuantity) +
          toNumber(productData.largeQuantity) +
          toNumber(productData.xlQuantity)
        : toNumber(productData.stockQuantity),
      smallQuantity: hasSizes ? toNumber(productData.smallQuantity) : 0,
      mediumQuantity: hasSizes ? toNumber(productData.mediumQuantity) : 0,
      largeQuantity: hasSizes ? toNumber(productData.largeQuantity) : 0,
      xlQuantity: hasSizes ? toNumber(productData.xlQuantity) : 0,
      sizes: hasSizes ? ["S", "M", "L", "XL"] : ["ONE_SIZE"],
      images: [...uploadedImages],
    };
    try {
      await editProduct(product.id || product._id, payload);
      toast.success("Product Updated Successfully");
      if (onProductUpdated) onProductUpdated();
      refreshProducts();
      closeEditProduct();
    } catch (error) {
      createAdminLog({
        event: "admin.product_update_failed",
        severity: "warning",
        source: "admin",
        message: "Admin product update failed.",
        context: {
          productId: product.id || product._id,
          productType: productData.type,
        },
      });
      toast.error("Failed to update Product");
    }
  };

  return (
    <div
      className={`fixed w-full h-full top-0 left-0 right-0 bottom-0 flex justify-center items-center z-50 ${overlayBg}`}
    >
      <div
        className={`p-5 w-full h-full max-w-2xl max-h-[85%] rounded shadow-sm overflow-y-auto ${modalBg}`}
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
            placeholder="enter product name (include size info if needed, e.g. 'Embroidered Towel Set 27x54')"
            name="productName"
            value={productData.productName}
            className={`${inputBg} border-dashed border-2 rounded p-2`}
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
              className={`${inputBg} border-dashed border-2 rounded p-2 col-start-1 row-start-2 no-arrows`}
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
              className={`${inputBg} border-dashed border-2 rounded p-2 col-start-2 row-start-2 no-arrows`}
              onChange={handleOnChange}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="hasSizes"
                checked={Boolean(productData.hasSizes)}
                onChange={() =>
                  setProductData((prev) => ({ ...prev, hasSizes: true, stockQuantity: "" }))
                }
              />
              Product has sizes
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="hasSizes"
                checked={!Boolean(productData.hasSizes)}
                onChange={() =>
                  setProductData((prev) => ({
                    ...prev,
                    hasSizes: false,
                    smallQuantity: "",
                    mediumQuantity: "",
                    largeQuantity: "",
                    xlQuantity: "",
                  }))
                }
              />
              Product is non-sized
            </label>
          </div>

          {Boolean(productData.hasSizes) ? (
            <>
              <p className="text-center mt-1">Quantity Available by Size</p>
              <div className="flex gap-2 justify-between">
                <div className="flex gap-1 items-center flex-1 min-w-0">
                  <label htmlFor="smallQuantity">S</label>
                  <input
                    className={`${inputBg} border-dashed border-2 rounded w-full min-w-0 p-2`}
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
                    className={`${inputBg} border-dashed border-2 rounded w-full min-w-0 p-2`}
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
                    className={`${inputBg} border-dashed border-2 rounded w-full min-w-0 p-2`}
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
                    className={`${inputBg} border-dashed border-2 rounded w-full min-w-0 p-2`}
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
            </>
          ) : (
            <div className="grid grid-cols-1 gap-2 mt-1">
              <label htmlFor="stockQuantity">Stock Quantity</label>
              <input
                className={`${inputBg} border-dashed border-2 rounded p-2`}
                type="number"
                id="stockQuantity"
                placeholder="0"
                min="0"
                name="stockQuantity"
                value={productData.stockQuantity}
                onChange={handleOnChange}
                required={!Boolean(productData.hasSizes)}
              />
            </div>
          )}
          <div className="grid grid-cols-1 gap-x-4">
            <div className="flex flex-col">
              <label htmlFor="type">Product Type</label>
              <select
                id="type"
                name="type"
                value={productData.type}
                onChange={handleOnChange}
                className={`${inputBg} border-dashed border-2 rounded p-2`}
                required
              >
                <option value="" disabled>
                  Select Product Type
                </option>
                {productFilterOptions.map((entry) => (
                  <option key={entry.id} value={entry.value}>
                    {entry.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <label>Product Images</label>
          <div
            className={`${inputBg} border-2 border-dashed p-4 flex justify-normal gap-5 items-center`}
          >
            <div
              className={`${dropzoneBg} px-3 py-2 rounded-md border-2 flex-col items-center justify-center`}
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
                        <label className={`px-2 rounded-full text-sm cursor-pointer hover:scale-105 ${overlayActionClasses}`}>
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
                          className={`px-2 rounded-full text-sm cursor-pointer hover:scale-105 ${overlayActionClasses}`}
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
            className={`${inputBg} border-dashed border-2 rounded p-2 resize-none h-32`}
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
