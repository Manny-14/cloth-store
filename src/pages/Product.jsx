import React from "react";
import { ShopContext } from "../context/ShopContext";
import { useParams } from "react-router-dom";
import { assets } from "../assets/assets";
import RelatedProducts from "../components/RelatedProducts";
import { getProduct } from "../../firebase/products/getProduct";
import { toast } from "react-toastify";
import { NON_SIZED_KEY, hasSizeVariants } from "../helper/inventory";
import { supportTemplates } from "../helper/support";
const Product = () => {
  const { productId } = useParams();
  const {
    products,
    currency,
    theme,
    addToCart,
    navigate,
    getSizeQuantity,
    isSoldOut,
  } = React.useContext(ShopContext);
  const [productData, setProductData] = React.useState(null);
  const [image, setImage] = React.useState("");
  const [size, setSize] = React.useState("");
  const [isImageLoaded, setIsImageLoaded] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const normalizeProduct = React.useCallback(
    (product) => {
      if (!product) return null;

      const imageArray = Array.isArray(product.image)
        ? product.image
        : Array.isArray(product.images)
        ? product.images
        : product.image
        ? [product.image]
        : [];

      const derivedSizes = Array.isArray(product.sizes) && product.sizes.length
        ? product.sizes
        : [
            { key: "smallQuantity", label: "S" },
            { key: "mediumQuantity", label: "M" },
            { key: "largeQuantity", label: "L" },
            { key: "extraLargeQuantity", label: "XL" },
          ]
            .filter(({ key }) => Number(product[key]) > 0)
            .map(({ label }) => label);

      const hasSizes = hasSizeVariants(product);

      return {
        ...product,
        _id: product._id || product.id || product.productId || productId,
        name: product.name || product.productName || "Untitled Product",
        price: Number(
          product.price ?? product.sellingPrice ?? product.discountedPrice ?? 0
        ),
        description:
          product.description ||
          product.productDescription ||
          "No description provided.",
        category: product.category || "misc",
        subCategory: product.subCategory || product.type || "general",
        image: imageArray,
        hasSizes,
        sizes: hasSizes
          ? derivedSizes.length > 0
            ? derivedSizes
            : ["S", "M", "L", "XL"]
          : [NON_SIZED_KEY],
      };
    },
    [productId]
  );

  React.useEffect(() => {
    let isMounted = true;

    const fetchProductData = async () => {
      setLoading(true);
      setError("");

      try {
        let foundProduct = products.find((item) => item._id === productId);

        if (!foundProduct) {
          foundProduct = await getProduct(productId);
        }

        if (!isMounted) return;

        if (foundProduct) {
          const normalized = normalizeProduct(foundProduct);
          setProductData(normalized);
          setImage(normalized.image[0] || assets.hero_img);
        } else {
          setProductData(null);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error(err);
        setError("We couldn't load this product right now.");
        setProductData(null);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProductData();

    return () => {
      isMounted = false;
    };
  }, [productId, products, normalizeProduct]);

  const activeImage = React.useMemo(() => {
    if (!productData || !productData.image?.length) {
      return image || assets.hero_img;
    }
    return image || productData.image[0] || assets.hero_img;
  }, [image, productData]);

  const selectedSizeStock = React.useMemo(() => {
    if (!productData || !size) return 0;
    return getSizeQuantity(productData, size);
  }, [getSizeQuantity, productData, size]);

  React.useEffect(() => {
    if (!productData) return;
    if (productData.hasSizes === false) {
      setSize(NON_SIZED_KEY);
    }
  }, [productData]);

  const productSoldOut = React.useMemo(() => {
    if (!productData) return true;
    return isSoldOut(productData);
  }, [isSoldOut, productData]);

  React.useEffect(() => {
    if (!productData) return;
    setIsImageLoaded(false);
  }, [activeImage, productData]);

  const supportHref = React.useMemo(
    () =>
      supportTemplates.product({
        productName: productData?.name || "",
        productId,
      }),
    [productData?.name, productId]
  );

  const handleBuyNow = async () => {
    if (!productData || productSoldOut) return;

    const effectiveSize = productData.hasSizes === false ? NON_SIZED_KEY : size;

    if (!effectiveSize) {
      toast.error("Please select a size before checkout.");
      return;
    }

    const stock = getSizeQuantity(productData, effectiveSize);
    if (stock <= 0) {
      toast.error(
        productData.hasSizes === false
          ? "This product is sold out. Please choose another item."
          : "Selected size is sold out. Please choose another size."
      );
      return;
    }

    navigate("/place-order", {
      state: {
        buyNowItem: {
          productId: productData._id,
          size: effectiveSize,
          quantity: 1,
        },
      },
    });
  };

  if (loading) {
    return (
      <div className="text-xl flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col justify-center items-center text-center px-4 gap-4">
        <p className="text-xl">{error}</p>
        <p className="max-w-md text-sm text-slate-600 dark:text-slate-300">
          Please try browsing the collection again. If you were trying to buy a
          specific item, message vendor and include the product name.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/collection")}
            className="bg-black text-white dark:bg-white dark:text-black px-4 py-2 rounded text-sm"
          >
            Back to Collection
          </button>
          <a href={supportHref} className="border px-4 py-2 rounded text-sm">
            Message Vendor
          </a>
        </div>
      </div>
    );
  }

  if (!productData) {
    return (
      <div className="min-h-[60vh] flex flex-col justify-center items-center text-center px-4 gap-4">
        <p className="text-xl">We couldn't find this product.</p>
        <p className="max-w-md text-sm text-slate-600 dark:text-slate-300">
          It may have sold out or been removed. Browse the latest collection, or
          message vendor if you need help finding it.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/collection")}
            className="bg-black text-white dark:bg-white dark:text-black px-4 py-2 rounded text-sm"
          >
            Browse Collection
          </button>
          <a href={supportHref} className="border px-4 py-2 rounded text-sm">
            Message Vendor
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t-2 pt-10 transition-opacity ease-in duration-500 opacity-100">
      {/* Product Data */}
      <div className="flex gap-12 sm:gap-12 flex-col sm:flex-row">
        {/* Product Images */}
        <div className="flex-1 flex flex-col-reverse gap-3 sm:flex-row">
          <div className="flex sm:flex-col overflow-x-auto justify-between sm:justify-normal sm:w-[18.7%] w-full">
            {productData.image.map((item, index) => {
              const isActive = activeImage === item;

              return (
                <button
                  type="button"
                  key={index}
                  aria-label={`View product image ${index + 1}`}
                  onClick={() => setImage(item)}
                  className={`group relative w-[24%] sm:w-full sm:mb-3 flex-shrink-0 cursor-pointer overflow-hidden rounded-md transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-200 ${
                    isActive
                      ? "bg-slate-200/80 dark:bg-slate-700/50 shadow-inner shadow-slate-500/40"
                      : "bg-white/70 dark:bg-slate-900/40"
                  }`}
                >
                  <img
                    src={item}
                    alt="product thumbnail"
                    loading="lazy"
                    className={`w-full h-full object-cover transition-transform duration-200 ease-out ${
                      isActive ? "scale-100" : "group-hover:scale-[1.03] group-focus-visible:scale-[1.03]"
                    }`}
                  />
                  {isActive && (
                    <span className="pointer-events-none absolute inset-0 bg-slate-900/10 dark:bg-white/10" aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>
          <div className="w-full sm:w-[80%]">
            <img
              src={activeImage}
              onLoad={() => setIsImageLoaded(true)}
              className={`w-full h-auto object-cover transition-all duration-500 ease-out ${
                isImageLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95"
              }`}
              alt="product image"
            />
          </div>
        </div>
        {/* Product Details */}
        <div className="flex-1">
          <h1 className="font-medium text-2xl mt-2">{productData.name}</h1>
          <p className="mt-3 text-xl font-medium">
            {currency}
            {productData.price}
          </p>
          <p className="mt-3 md:w-4/5 text-sm sm:text-base leading-relaxed">{productData.description}</p>
          <div className="flex flex-col gap-4 my-6 sm:my-8">
            {productData.hasSizes !== false ? (
              <>
                <p className="text-sm font-medium">Select Size</p>
                <div className="flex flex-wrap gap-2">
                  {productData.sizes.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => setSize(item)}
                      className={`border min-w-[2.75rem] py-2.5 px-4 text-sm ${
                        item === size
                          ? theme === "dark"
                            ? "bg-slate-200 text-slate-900 border-slate-200"
                            : "bg-blue-950 text-white border-blue-950"
                          : theme === "dark"
                          ? "bg-slate-800 text-slate-100 border-slate-700"
                          : "bg-gray-100 text-black border-gray-200"
                      } rounded active:scale-95 transition-transform`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
                {size && (
                  <p
                    className={`text-sm ${
                      selectedSizeStock > 0 ? "text-green-600" : "text-red-500"
                    }`}
                  >
                    {selectedSizeStock > 0
                      ? `${selectedSizeStock} in stock`
                      : "Selected size is sold out"}
                  </p>
                )}
              </>
            ) : (
              <p
                className={`text-sm ${
                  selectedSizeStock > 0 ? "text-green-600" : "text-red-500"
                }`}
              >
                {selectedSizeStock > 0
                  ? `${selectedSizeStock} available`
                  : "This product is sold out"}
              </p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() =>
                addToCart(
                  productData._id,
                  productData.hasSizes === false ? NON_SIZED_KEY : size
                )
              }
              disabled={productSoldOut}
              className={`${
                theme === "light"
                  ? productSoldOut
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-black"
                  : productSoldOut
                  ? "bg-slate-600 cursor-not-allowed"
                  : "bg-blue-950"
              } text-white w-full sm:w-auto px-8 py-3 text-sm active:bg-gray-700 rounded active:scale-[0.98] transition-transform`}
            >
              {productSoldOut ? "Sold Out" : "Add To Cart"}
            </button>

            <button
              onClick={handleBuyNow}
              disabled={productSoldOut}
              className={`${
                theme === "light"
                  ? productSoldOut
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-white border border-black text-black"
                  : productSoldOut
                  ? "bg-slate-700 text-slate-300 cursor-not-allowed"
                  : "bg-slate-100 text-slate-950 border border-slate-300"
              } w-full sm:w-auto px-8 py-3 text-sm rounded active:scale-[0.98] transition-transform`}
            >
              Buy Now
            </button>
          </div>
          <hr className="mt-8 sm:w-4/5" />
          <div className="text-sm mt-5 flex flex-col gap-1">
            <p>100% Original Product.</p>
            <p>Secure checkout is available through Stripe.</p>
            <p>Easy return and exchange policy within 7 days.</p>
          </div>
        </div>
      </div>

      {/* Product Description & Reviews */}
      {/* <div className="mt-20">
        <div className="flex">
          <b className="border px-5 py-3 text-sm">Description</b>
          <p className="border px-5 py-3 text-sm">Reviews (122)</p>
        </div>
        <div className="flex flex-col gap-4 border px-6 py-6 text-sm">
          <p>
            An e-commerce website is an online platform that facilitates the
            buying and selling of products or services over the internet. it
            serves as a virtual marketplace where businesses and individuals can
            showcase their products, interact with customers and conduct
            transactions without the need for a physical presence. E-commerce
            websites have gained immense popularity due to their convenience,
            accessibility and the global reach they offer.
          </p>
          <p>
            E-commerce websites typically display products or services along
            with detailed descriptions, images, prices and any available
            variations(e.g. sizes, colors). Each product usually has it's own
            dedicated page with relevant information of that item.
          </p>
        </div>
      </div> */}

      {/* Related Products */}
      <RelatedProducts
        category={productData.category}
        subCategory={productData.subCategory}
      />
    </div>
  );
};

export default Product;
