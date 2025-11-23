import React, { useEffect, useState } from "react";
import { assets } from "../assets/assets";
import Title from "../components/Title";
import ProductItem from "../components/ProductItem";
import { getAllProducts } from "../../firebase/products/getAllProducts";
import { ShopContext } from "../context/ShopContext";

const Collection = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [filterProducts, setFilterProducts] = useState([]);
  const [category, setCategory] = useState([]);
  const [type, setType] = useState([]);
  const [sortType, setSortType] = useState("relevant");
  useEffect(() => {
    async function fetchProducts() {
      try {
        const data = await getAllProducts();
        setProducts(data);
      } catch (err) {
        setProducts([]);
      }
    }
    fetchProducts();
  }, []);

  // TODO: Fix image rendering for different image sizes
  
  const toggleCategory = (e) => {
    const value = e.target.value;
    setCategory((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  };

  const toggleType = (e) => {
    const value = e.target.value;
    setType((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  };

  const { theme } = React.useContext(ShopContext);

  useEffect(() => {
    let filtered = [...products];
    if (showSearch && search) {
      filtered = filtered.filter((item) =>
        (item.productName || "").toLowerCase().includes(search.toLowerCase())
      );
    }
    if (category.length > 0) {
      filtered = filtered.filter((item) => category.includes(item.category));
    }
    if (type.length > 0) {
      filtered = filtered.filter((item) => type.includes(item.type));
    }
    // Sorting
    if (sortType === "low-high") {
      filtered = filtered.sort((a, b) => Number(a.sellingPrice) - Number(b.sellingPrice));
    } else if (sortType === "high-low") {
      filtered = filtered.sort((a, b) => Number(b.sellingPrice) - Number(a.sellingPrice));
    }
    setFilterProducts(filtered);
  }, [products, category, type, search, showSearch, sortType]);

  return (
    <div className="flex flex-col sm:flex-row gap-1 sm:gap-10 pt-10 border-t">
      {/* Left Side */}
      {/* Filter Options */}
      <div className="min-w-60">
        <p
          onClick={() => setShowFilter(!showFilter)}
          className="my-2 text-xl flex items-center cursor-pointer gap-2"
        >
          FILTERS
          <img
            src={assets.dropdown_icon}
            className={`h-3 sm:hidden ${showFilter ? "rotate-90" : ""}`}
            alt="dropdown icon"
          />
        </p>
        {/* Category Filter */}
        <div
          className={`border border-gray-300 pl-5 py-3 mt-6 ${
            showFilter ? "" : "hidden"
          } sm:block`}
        >
          <p className="mb-3 text-sm font-medium">CATEGORIES</p>
          <div className={`flex flex-col gap-2 text-sm font-light ${theme === "light" ? "text-gray-700" : "text-white"}`}>
            <p className="flex gap-2">
              <input
                type="checkbox"
                className="w-3"
                value={"men"}
                onChange={toggleCategory}
              />{" "}
              Men
            </p>
            <p className="flex gap-2">
              <input
                type="checkbox"
                className="w-3"
                value={"women"}
                onChange={toggleCategory}
              />{" "}
              Women
            </p>
            <p className="flex gap-2">
              <input
                type="checkbox"
                className="w-3"
                value={"kids"}
                onChange={toggleCategory}
              />{" "}
              Kids
            </p>
          </div>
        </div>

        {/* Type Filter */}
        <div
          className={`border border-gray-300 pl-5 py-3 my-5 ${
            showFilter ? "" : "hidden"
          } sm:block`}
        >
          <p className="mb-3 text-sm font-medium">TYPE</p>
          <div className={`flex flex-col gap-2 text-sm font-light ${theme === "light" ? "text-gray-700" : "text-white"}`}>
            <p className="flex gap-2">
              <input
                type="checkbox"
                className="w-3"
                value={"topwear"}
                onChange={toggleType}
              />
              Topwear
            </p>
            <p className="flex gap-2">
              <input
                type="checkbox"
                className="w-3"
                value={"bottomwear"}
                onChange={toggleType}
              />
              Bottomwear
            </p>
            <p className="flex gap-2">
              <input
                type="checkbox"
                className="w-3"
                value={"winterwear"}
                onChange={toggleType}
              />
              Winterwear
            </p>
          </div>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex-1">
        <div className="flex justify-between text-base sm:text-2xl mb-4">
          <Title text1={"ALL"} text2={"Collections"} />
          {/* Product Sort */}
          <select
            onChange={(e) => setSortType(e.target.value)}
            className="border-2 border-gray-300 text-sm px-2 text-black select-menu"
          >
            <option value="relevant">Sort by: Relevant</option>
            <option value="low-high">Sort by: Low-High</option>
            <option value="high-low">Sort by: High-Low</option>
          </select>
        </div>

        {/* Products Mapping */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-6">
          {filterProducts.map((item, index) => (
            <ProductItem
              key={item.id || index}
              id={item.id}
              image={item.images}
              name={item.productName}
              price={item.sellingPrice}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Collection;



