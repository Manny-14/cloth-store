import React from "react";
import PropTypes from "prop-types";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { getAllProducts } from "../../firebase/products/getAllProducts";
import { products as seedProducts } from "../assets/assets";

export const ShopContext = React.createContext();

const ShopContextProvider = (props) => {
  const parseNumber = React.useCallback((value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }, []);

  const currency = "$";
  const delivery_fee = 10;
  const [products, setProducts] = React.useState(() =>
    seedProducts.map((product) => ({
      ...product,
      id: product._id,
      images: product.image,
      sellingPrice: product.price,
      productName: product.name,
      totalQuantity: Number.MAX_SAFE_INTEGER,
      isSoldOut: false,
    }))
  );
  const [productsLoading, setProductsLoading] = React.useState(false);
  const [productsError, setProductsError] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [showSearch, setShowSearch] = React.useState(false);
  const [cartItems, setCartItems] = React.useState(
    JSON.parse(localStorage.getItem("cartItems")) || {}
  );

  React.useEffect(() => {
    if (cartItems !== JSON.parse(localStorage.getItem("cartItems"))) {
      localStorage.setItem("cartItems", JSON.stringify(cartItems));
    }
  }, [cartItems]);

  const navigate = useNavigate();

  const addToCart = async (itemId, size) => {
    if (!size) {
      toast.error("Please select the product size");
      return;
    }

    const productExists = products.some(
      (product) => product._id === itemId || product.id === itemId
    );

    if (!productExists) {
      toast.error("Product unavailable. Please refresh and try again.");
      return;
    }

    let cartData = structuredClone(cartItems);
    if (cartData[itemId]) {
      if (cartData[itemId][size]) {
        cartData[itemId][size] += 1;
      } else {
        cartData[itemId][size] = 1;
      }
    } else {
      cartData[itemId] = {};
      cartData[itemId][size] = 1;
    }
    setCartItems(cartData);
    localStorage.setItem("cartItems", JSON.stringify(cartData));
  };

  const getCartCount = () => {
    return Object.values(cartItems).reduce((totalCount, item) => {
      return (
        totalCount +
        Object.values(item).reduce(
          (sum, count) => sum + (count > 0 ? count : 0),
          0
        )
      );
    }, 0);
  };

  const updateQuantity = async (itemId, size, quantity) => {
    let cartData = structuredClone(cartItems);

    cartData[itemId][size] = quantity;

    setCartItems(cartData);
  };

  const getCartTotal = () => {
    let totalAmount = 0;

    for (const items in cartItems) {
      let itemInfo = products.find(
        (product) => product._id === items || product.id === items
      );

      for (const item in cartItems[items]) {
        if (cartItems[items][item] > 0 && itemInfo) {
          totalAmount +=
            (itemInfo.price || itemInfo.sellingPrice || 0) *
            cartItems[items][item];
        }
      }
    }
    return totalAmount;
  };

  const normalizeProduct = React.useCallback(
    (product) => {
      if (!product) return null;

      const imageList = Array.isArray(product.images)
        ? product.images
        : Array.isArray(product.image)
        ? product.image
        : product.images
        ? [product.images]
        : product.image
        ? [product.image]
        : [];

      const smallQuantity = parseNumber(
        product.smallQuantity ?? product?.sizes?.S
      );
      const mediumQuantity = parseNumber(
        product.mediumQuantity ?? product?.sizes?.M
      );
      const largeQuantity = parseNumber(
        product.largeQuantity ?? product?.sizes?.L
      );
      const xlQuantity = parseNumber(product.xlQuantity ?? product?.sizes?.XL);

      const totalQuantity =
        smallQuantity + mediumQuantity + largeQuantity + xlQuantity;

      const resolvedId =
        product.id ||
        product._id ||
        product.productId ||
        product.slug ||
        product.sku ||
        product.firebaseId ||
        `${product.productName || product.name || "product"}-${
          product.timestamp || Date.now()
        }`;

      const normalized = {
        ...product,
        id: resolvedId,
        _id: resolvedId,
        name: product.name || product.productName || "Untitled Product",
        productName: product.productName || product.name || "Untitled Product",
        description: product.description || product.productDescription || "",
        price: parseNumber(product.price ?? product.sellingPrice ?? 0),
        sellingPrice: parseNumber(product.sellingPrice ?? product.price ?? 0),
        costPrice: parseNumber(product.costPrice ?? product.price ?? 0),
        images: imageList,
        image: imageList,
        category: product.category || "general",
        subCategory: product.subCategory || product.type || "general",
        type: product.type || product.subCategory || "general",
        smallQuantity,
        mediumQuantity,
        largeQuantity,
        xlQuantity,
        totalQuantity,
        status: product.status || (totalQuantity > 0 ? "active" : "sold-out"),
        isSoldOut:
          product.status === "sold-out" || product.status === "inactive"
            ? true
            : totalQuantity <= 0,
      };

      return normalized;
    },
    [parseNumber]
  );

  const refreshProducts = React.useCallback(async () => {
    setProductsLoading(true);
    try {
      const productList = await getAllProducts();
      const normalized = productList
        .map(normalizeProduct)
        .filter(Boolean);
      setProducts(normalized);
      setProductsError("");
    } catch (error) {
      console.error("Failed to fetch products", error);
      setProductsError("Failed to load products. Please try again later.");
    } finally {
      setProductsLoading(false);
    }
  }, [normalizeProduct]);

  React.useEffect(() => {
    refreshProducts();
  }, [refreshProducts]);

  const isSoldOut = React.useCallback(
    (product) => {
      if (!product) return true;
      if (typeof product.isSoldOut === "boolean") {
        return product.isSoldOut;
      }
      const total =
        product.totalQuantity ??
        parseNumber(product.smallQuantity) +
          parseNumber(product.mediumQuantity) +
          parseNumber(product.largeQuantity) +
          parseNumber(product.xlQuantity);
      return total <= 0;
    },
    [parseNumber]
  );

  const [theme, setTheme] = React.useState(
    localStorage.getItem("theme") || "light"
  );

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  React.useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    body.classList.remove("light", "dark");
    body.classList.add(theme);
  }, [theme]);

  const value = {
  products,
  productsLoading,
  productsError,
  refreshProducts,
  isSoldOut,
    currency,
    delivery_fee,
    theme,
    toggleTheme,
    search,
    setSearch,
    showSearch,
    setShowSearch,
    cartItems,
    addToCart,
    getCartCount,
    updateQuantity,
    getCartTotal,
    navigate,
  };

  ShopContextProvider.propTypes = {
    children: PropTypes.node.isRequired,
  };

  return (
    <ShopContext.Provider value={value}>{props.children}</ShopContext.Provider>
  );
};

export default ShopContextProvider;
