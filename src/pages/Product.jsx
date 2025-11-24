import React from "react";
import { ShopContext } from "../context/ShopContext";
import { useParams } from "react-router-dom";
import { assets } from "../assets/assets";
import RelatedProducts from "../components/RelatedProducts";
import { getProduct } from "../../firebase/products/getProduct";
const Product = () => {
  const { productId } = useParams();
  const {
    products,
    currency,
    theme,
    addToCart,
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
        sizes:
          derivedSizes.length > 0
            ? derivedSizes
            : ["S", "M", "L", "XL"],
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
        setError("We couldn't load this product. Please try again later.");
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

  const productSoldOut = React.useMemo(() => {
    if (!productData) return true;
    return isSoldOut(productData);
  }, [isSoldOut, productData]);

  React.useEffect(() => {
    if (!productData) return;
    setIsImageLoaded(false);
  }, [activeImage, productData]);

  if (loading) {
    return (
      <div className="text-xl flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-xl flex justify-center items-center h-screen text-center px-4">
        {error}
      </div>
    );
  }

  if (!productData) {
    return (
      <div className="text-xl flex justify-center items-center h-screen text-center px-4">
        We couldn't find this product.
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
          <div className="flex items-center gap-1 mt-2">
            <img src={assets.star_icon} alt="star icon" className="w-3.5" />
            <img src={assets.star_icon} alt="star icon" className="w-3.5" />
            <img src={assets.star_icon} alt="star icon" className="w-3.5" />
            <img src={assets.star_icon} alt="star icon" className="w-3.5" />
            <img
              src={assets.star_dull_icon}
              alt="star icon"
              className="w-3.5"
            />
            <p className="pl-2">(122)</p>
          </div>
          <p className="mt-3 text-xl font-medium">
            {currency}
            {productData.price}
          </p>
          <p className="mt-3 md:w-4/5 text-xl">{productData.description}</p>
          <div className="flex flex-col gap-4 my-8">
            <p>Select Size</p>
            <div className="flex gap-2">
              {productData.sizes.map((item, index) => (
                <button
                  key={index}
                  onClick={() => setSize(item)}
                  className={`border py-2 px-4  text-black ${
                    item === size
                      ? "bg-blue-950 text-white"
                      : "bg-gray-100 text-black"
                  } rounded`}
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
          </div>
          <button
            onClick={() => addToCart(productData._id, size)}
            disabled={productSoldOut}
            className={`${
              theme === "light"
                ? productSoldOut
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-black"
                : productSoldOut
                ? "bg-slate-600 cursor-not-allowed"
                : "bg-blue-950"
            } text-white px-8 py-3 text-sm active:bg-gray-700 rounded`}
          >
            {productSoldOut ? "Sold Out" : "Add To Cart"}
          </button>
          <hr className="mt-8 sm:w-4/5" />
          <div className="text-sm mt-5 flex flex-col gap-1">
            <p>100% Original Product.</p>
            <p>Cash on delivery is available on this product.</p>
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
