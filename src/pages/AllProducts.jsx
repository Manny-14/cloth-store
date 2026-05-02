import React, { useState } from "react";
import Title from "../components/Title";
import { IoMdAddCircleOutline } from "react-icons/io";
import UploadProduct from "../components/UploadProduct";
import ProductCard from "../components/ProductCard";
import EditProduct from "../components/EditProduct";
import { ShopContext } from "../context/ShopContext";
import { deleteProduct } from "../../firebase/products/deleteProduct";
import { toast } from "react-toastify";
import { createAdminLog } from "../../firebase/logs/createAdminLog";

const AllProducts = () => {
  const [openUploadProduct, setOpenUploadProduct] = useState(false);
  const [openEditProduct, setOpenEditProduct] = useState(false);
  const [editProductData, setEditProductData] = useState(null);
  const {
    products,
    productsLoading,
    productsError,
    refreshProducts,
    theme,
    isSoldOut,
  } = React.useContext(ShopContext);
  const isDark = theme === "dark";
  const mutedText = isDark ? "text-gray-400" : "text-gray-500";

  const handleEdit = (product) => {
    setEditProductData(product);
    setOpenEditProduct(true);
  };
  const handleDelete = async (product) => {
    const productId = product.id || product._id;
    if (!productId) {
      toast.error("Missing product ID");
      return;
    }

    const confirmed = window.confirm(
      `Archive "${product.productName || product.name}"? Customers won't be able to purchase it.`
    );

    if (!confirmed) return;

    try {
      await deleteProduct(productId);
      toast.success("Product archived");
      refreshProducts();
    } catch (error) {
      console.error(error);
      createAdminLog({
        event: "admin.product_archive_failed",
        severity: "warning",
        source: "admin",
        message: "Admin failed to archive a product.",
        context: {
          productId,
        },
      });
      toast.error("Failed to delete product");
    }
  };
  const closeUploadProduct = () => setOpenUploadProduct(false);
  const closeEditProduct = () => {
    setOpenEditProduct(false);
    setEditProductData(null);
  };
  return (
  <div className="min-h-[85vh] px-2 py-4 sm:p-4 relative transition-colors duration-300">
      {/* Static header and controls */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="text-xl">
          <Title text1={"ALL"} text2={"Products"} />
        </div>
      </div>

      {openUploadProduct && (
        <UploadProduct closeUploadProduct={closeUploadProduct} />
      )}
      {openEditProduct && editProductData && (
        <EditProduct
          product={editProductData}
          closeEditProduct={closeEditProduct}
          onProductUpdated={refreshProducts}
        />
      )}

      <div className="my-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 pb-24">
        {productsLoading ? (
          <div className={`col-span-full text-center ${mutedText} text-lg py-10`}>
            Loading...
          </div>
        ) : productsError ? (
          <div className="col-span-full text-center text-red-500 text-lg py-10">{productsError}</div>
        ) : products && products.length > 0 ? (
          products.map((product) => (
            <ProductCard
              key={product._id || product.id}
              product={product}
              onEdit={handleEdit}
              onDelete={handleDelete}
              theme={theme}
              isSoldOut={isSoldOut(product)}
            />
          ))
        ) : (
          <div className={`col-span-full text-center ${mutedText} text-lg py-10`}>
            No products found.
          </div>
        )}
      </div>

      {/* Fixed upload button */}
      <IoMdAddCircleOutline
        className={`text-5xl sm:text-6xl fixed right-5 sm:right-8 bottom-5 sm:bottom-8 z-50 hover:scale-110 cursor-pointer drop-shadow ${
          isDark ? "text-white" : "text-gray-900"
        }`}
        onClick={() => setOpenUploadProduct(true)}
      />
    </div>
  );
}

export default AllProducts;
