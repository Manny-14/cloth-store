import React from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "./Title";
import ProductItem from "./ProductItem";

const LatestCollection = () => {
  const { products, theme } = React.useContext(ShopContext);
  const latestProducts = React.useMemo(() => {
    return products.slice(0, 10);
  }, [products]);
  const descriptionColor = theme === "dark" ? "text-gray-300" : "text-gray-600";

  return (
    <div className="my-10">
      <div className="text-center py-8 text-3xl">
        <Title text1={"LATEST"} text2={"COLLECTION"} />
        <p
          className={`w-3/4 m-auto text-xs sm:text-sm md:text-base ${descriptionColor}`}
        >
          Take a look at our latest products.
        </p>
      </div>

      {/* Rendering Products */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6">
        {latestProducts.map((item, index) => (
          <ProductItem
            key={index}
            id={item._id}
            image={item.image}
            name={item.name}
            price={item.price}
          />
        ))}
      </div>
    </div>
  );
};

export default LatestCollection;
