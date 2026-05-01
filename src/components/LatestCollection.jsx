import React from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "./Title";
import ProductItem from "./ProductItem";

const LatestCollection = () => {
  const { products, productsLoading, productsError, theme, isSoldOut } =
    React.useContext(ShopContext);

  const latestProducts = React.useMemo(() => {
    return products.filter((item) => !isSoldOut(item)).slice(0, 10);
  }, [products, isSoldOut]);

  const descriptionColor =
    theme === "dark" ? "text-gray-300" : "text-gray-600";
  const loadingColor = theme === "dark" ? "text-gray-400" : "text-gray-500";

  return (
    <div className="my-10">
      <div className="text-center py-8 text-3xl">
        <Title text1={"LATEST"} text2={"COLLECTION"} />
        <p
          className={`w-3/4 m-auto text-xs sm:text-sm md:text-base ${descriptionColor}`}
        >
          Explore beaded jewelry, embroidered tees, towel sets, and handmade accessories.
        </p>
      </div>
      {productsLoading ? (
        <div className={`text-center text-sm ${loadingColor}`}>Loading products...</div>
      ) : productsError ? (
        <div className="text-center text-red-500 text-sm">{productsError}</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6">
          {latestProducts.map((item) => (
            <ProductItem
              key={item._id || item.id}
              id={item._id || item.id}
              image={item.images || item.image}
              name={item.productName || item.name}
              price={item.sellingPrice || item.price}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default LatestCollection;
