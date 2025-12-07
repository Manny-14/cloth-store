import React from "react";
import PropTypes from "prop-types";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { getAllProducts } from "../../firebase/products/getAllProducts";
import { products as seedProducts } from "../assets/assets";
import {
  DEFAULT_SIZE_ORDER,
  normalizeSizeLabel as normalizeSizeLabelBase,
  resolveSizeFieldKey,
} from "../helper/inventory";

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
  const canonicalSizeOrder = React.useMemo(() => DEFAULT_SIZE_ORDER, []);
  const normalizeSizeLabel = React.useCallback(
    (size) => normalizeSizeLabelBase(size),
    []
  );
  const resolveSizeField = React.useCallback(
    (size) => resolveSizeFieldKey(size),
    []
  );

  React.useEffect(() => {
    if (cartItems !== JSON.parse(localStorage.getItem("cartItems"))) {
      localStorage.setItem("cartItems", JSON.stringify(cartItems));
    }
  }, [cartItems]);

  const navigate = useNavigate();

  const sanitizeCartData = React.useCallback((cartData) => {
    const sanitized = {};
    Object.entries(cartData || {}).forEach(([productId, sizes]) => {
      const filteredSizes = Object.entries(sizes || {}).reduce(
        (acc, [size, quantity]) => {
          const parsed = parseNumber(quantity);
          if (parsed > 0) {
            acc[size] = parsed;
          }
          return acc;
        },
        {}
      );

      if (Object.keys(filteredSizes).length > 0) {
        sanitized[productId] = filteredSizes;
      }
    });

    return sanitized;
  }, [parseNumber]);

  const commitCartData = React.useCallback(
    (cartData) => {
      const sanitized = sanitizeCartData(cartData);
      setCartItems(sanitized);
      localStorage.setItem("cartItems", JSON.stringify(sanitized));
    },
    [sanitizeCartData]
  );

  const clearCart = React.useCallback(() => {
    setCartItems({});
    localStorage.setItem("cartItems", JSON.stringify({}));
  }, []);

  const findProductById = React.useCallback(
    (itemId) =>
      products.find((product) => product._id === itemId || product.id === itemId) || null,
    [products]
  );

  const getSizeQuantity = React.useCallback(
    (product, size) => {
      if (!product) return 0;
      const normalizedSize = normalizeSizeLabel(size);
      const sizeField = resolveSizeField(size);

      if (sizeField) {
        const value = product[sizeField];
        if (value !== undefined && value !== null) {
          return parseNumber(value);
        }
      }

      if (
        product?.sizes &&
        !Array.isArray(product.sizes) &&
        product.sizes[normalizedSize] !== undefined
      ) {
        return parseNumber(product.sizes[normalizedSize]);
      }

      if (normalizedSize === "XL" && product.extraLargeQuantity !== undefined) {
        return parseNumber(product.extraLargeQuantity);
      }

      if (normalizedSize === "XS" && product.extraSmallQuantity !== undefined) {
        return parseNumber(product.extraSmallQuantity);
      }

      if (!normalizedSize) {
        return parseNumber(product.totalQuantity ?? product.quantity ?? 0);
      }

      return 0;
    },
    [normalizeSizeLabel, resolveSizeField, parseNumber]
  );

  const getAvailableSizes = React.useCallback(
    (product, { includeCurrentSize } = {}) => {
      if (!product) return [];
      const normalizedCurrent = normalizeSizeLabel(includeCurrentSize);
      const baseSizes =
        Array.isArray(product.sizes) && product.sizes.length
          ? product.sizes
          : canonicalSizeOrder;
      const seen = new Set();
      return baseSizes
        .map((size) => normalizeSizeLabel(size))
        .filter((size) => {
          if (!size || seen.has(size)) {
            return false;
          }
          seen.add(size);
          const qty = getSizeQuantity(product, size);
          if (qty > 0) {
            return true;
          }
          return normalizedCurrent && normalizedCurrent === size;
        });
    },
    [canonicalSizeOrder, getSizeQuantity, normalizeSizeLabel]
  );

  const addToCart = async (itemId, size) => {
    const normalizedSize = normalizeSizeLabel(size);
    if (!normalizedSize) {
      toast.error("Please select the product size");
      return;
    }

    const product = findProductById(itemId);

    if (!product) {
      toast.error("Product unavailable. Please refresh and try again.");
      return;
    }

    if (isSoldOut(product)) {
      toast.error("This product is sold out.");
      return;
    }

    const sizeStock = getSizeQuantity(product, normalizedSize);

    if (sizeStock <= 0) {
      toast.error(`Size ${normalizedSize} is sold out.`);
      return;
    }

    const currentQuantity = cartItems[itemId]?.[normalizedSize] || 0;

    if (currentQuantity >= sizeStock) {
      toast.info(
        `You've reached the limit for size ${normalizedSize}. Available stock: ${sizeStock}.`
      );
      return;
    }

    const updatedCart = structuredClone(cartItems);

    if (!updatedCart[itemId]) {
      updatedCart[itemId] = {};
    }

    updatedCart[itemId][normalizedSize] = currentQuantity + 1;

    commitCartData(updatedCart);
    toast.success("Added to cart");
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
    const normalizedSize = normalizeSizeLabel(size);
    const requestedQuantity = parseNumber(quantity);
    const product = findProductById(itemId);

    if (!product) {
      // Remove orphaned cart entries silently
      const nextCart = structuredClone(cartItems);
      delete nextCart[itemId];
      commitCartData(nextCart);
      toast.warn("Product no longer available and was removed from your cart.");
      return;
    }

    const sizeStock = getSizeQuantity(product, normalizedSize);

    if (sizeStock <= 0) {
      const nextCart = structuredClone(cartItems);
      if (nextCart[itemId]) {
        delete nextCart[itemId][normalizedSize];
      }
      commitCartData(nextCart);
      toast.error(`Size ${normalizedSize} is sold out and was removed from your cart.`);
      return;
    }

    const safeQuantity = Math.max(0, Math.min(requestedQuantity, sizeStock));

    const nextCart = structuredClone(cartItems);
    if (!nextCart[itemId]) {
      nextCart[itemId] = {};
    }

    if (safeQuantity === 0) {
      delete nextCart[itemId][normalizedSize];
    } else {
      nextCart[itemId][normalizedSize] = safeQuantity;
    }

    commitCartData(nextCart);

    if (requestedQuantity > sizeStock) {
      toast.info(`Only ${sizeStock} units available for size ${normalizedSize}.`);
    }
  };

  const changeCartItemSize = async (itemId, oldSize, newSize) => {
    const normalizedOld = normalizeSizeLabel(oldSize);
    const normalizedNew = normalizeSizeLabel(newSize);

    if (!normalizedOld || !normalizedNew) {
      toast.error("Select a valid size");
      return;
    }

    if (normalizedOld === normalizedNew) {
      return;
    }

    const product = findProductById(itemId);

    if (!product) {
      const nextCart = structuredClone(cartItems);
      delete nextCart[itemId];
      commitCartData(nextCart);
      toast.warn("Product no longer available and was removed from your cart.");
      return;
    }

    const newSizeStock = getSizeQuantity(product, normalizedNew);

    if (newSizeStock <= 0) {
      toast.error(`Size ${normalizedNew} is sold out.`);
      return;
    }

    const currentQuantity = cartItems[itemId]?.[normalizedOld] || 0;
    if (currentQuantity <= 0) {
      toast.warn("No quantity to move for this size.");
      return;
    }

    const existingNewQuantity = cartItems[itemId]?.[normalizedNew] || 0;
    const maxAdditional = Math.max(0, newSizeStock - existingNewQuantity);

    if (maxAdditional <= 0) {
      toast.info(`All available stock for size ${normalizedNew} is already in your cart.`);
      return;
    }

    const transferQuantity = Math.min(currentQuantity, maxAdditional);
    const leftoverQuantity = currentQuantity - transferQuantity;

    const nextCart = structuredClone(cartItems);
    if (!nextCart[itemId]) {
      nextCart[itemId] = {};
    }

    nextCart[itemId][normalizedNew] =
      (nextCart[itemId][normalizedNew] || 0) + transferQuantity;

    if (leftoverQuantity > 0) {
      nextCart[itemId][normalizedOld] = leftoverQuantity;
    } else {
      delete nextCart[itemId][normalizedOld];
    }

    if (Object.keys(nextCart[itemId]).length === 0) {
      delete nextCart[itemId];
    }

    commitCartData(nextCart);

    if (transferQuantity < currentQuantity) {
      toast.info(
        `Only ${transferQuantity} items moved due to stock limits for size ${normalizedNew}.`
      );
    } else {
      toast.success(`Updated size to ${normalizedNew}.`);
    }
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
    getSizeQuantity,
    getAvailableSizes,
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
    changeCartItemSize,
    clearCart,
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
