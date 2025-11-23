import React, { useState, useEffect } from "react";
import Title from "../components/Title";
import { IoMdAddCircleOutline } from "react-icons/io";
import UploadProduct from "../components/UploadProduct";
import ProductCard from "../components/ProductCard";
import EditProduct from "../components/EditProduct";
import { getAllProducts } from "../../firebase/products/getAllProducts";
import { ShopContext } from "../context/ShopContext";

const AllProducts = () => {
  const [openUploadProduct, setOpenUploadProduct] = useState(false);
  const [openEditProduct, setOpenEditProduct] = useState(false);
  const [editProductData, setEditProductData] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { theme } = React.useContext(ShopContext);
  const isDark = theme === "dark";
  const mutedText = isDark ? "text-gray-400" : "text-gray-500";

  const handleEdit = (product) => {
    setEditProductData(product);
    setOpenEditProduct(true);
  };
  const handleDelete = (product) => {
    // TODO: Implement delete functionality
    // e.g., show confirmation and remove product
  };
  const closeUploadProduct = () => setOpenUploadProduct(false);
  const closeEditProduct = () => {
    setOpenEditProduct(false);
    setEditProductData(null);
  };
  const refreshProducts = async () => {
    setLoading(true);
    try {
      const data = await getAllProducts();
      setProducts(data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshProducts();
  }, []);

  return (
  <div className="p-4 h-[85vh] relative transition-colors duration-300">
      {/* Static header and controls */}
      <div className="flex items-center justify-between mb-4">
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

      <div className="my-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {loading ? (
          <div className={`col-span-full text-center ${mutedText} text-lg py-10`}>
            Loading...
          </div>
        ) : error ? (
          <div className="col-span-full text-center text-red-500 text-lg py-10">{error}</div>
        ) : products && products.length > 0 ? (
          products.map((product) => (
            <ProductCard
              key={product._id || product.id}
              product={product}
              onEdit={handleEdit}
              onDelete={handleDelete}
              theme={theme}
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
        className={`text-6xl fixed right-8 bottom-8 z-50 hover:scale-110 cursor-pointer ${
          isDark ? "text-white" : "text-gray-900"
        }`}
        onClick={() => setOpenUploadProduct(true)}
      />
    </div>
  );
}

export default AllProducts;
