"use client";

import { useEffect, useMemo, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { SlidersHorizontal, X, ChevronLeft, ChevronRight } from "lucide-react";
import { type Collection, type PriceRange, type Product, productHref } from "@/data/products";
import { getDiscount } from "@/lib/format";
import { addToCart as addCartItem, getCart, updateCartItemQty, CART_EVENT } from "@/lib/cart";
import { api } from "@/lib/api";
import ProductCard from "./ProductCard";

type ProductListingProps = {
  collection: Collection; // title, subtitle, products and price ranges for this page
};

const SORT_OPTIONS = ["Popularity", "Price: Low to High", "Price: High to Low", "Discount"];
const PRODUCTS_PER_PAGE = 10;

/* ------------------------------------------------------------------ */
/* FILTER SIDEBAR (slide-in drawer on mobile, fixed column on desktop) */
/* ------------------------------------------------------------------ */
type SidebarProps = {
  open: boolean; // only controls the mobile drawer
  onClose: () => void;
  categories: string[];
  selectedCategories: string[];
  onToggleCategory: (category: string) => void;
  priceRanges: PriceRange[];
  selectedPriceRange: number | null;
  onSelectPriceRange: (index: number) => void;
  onClear: () => void;
};

function FilterSidebar(props: SidebarProps) {
  const { open, onClose, categories, selectedCategories, onToggleCategory } = props;
  const { priceRanges, selectedPriceRange, onSelectPriceRange, onClear } = props;

  return (
    <>
      {/* Dark overlay behind the drawer (mobile only) */}
      {open && <div onClick={onClose} className="fixed inset-0 bg-black/40 z-30 lg:hidden" />}

      <aside
        className={`bg-white z-40 overflow-y-auto p-4
          fixed inset-y-0 left-0 w-72 transition-transform duration-300
          lg:static lg:w-60 lg:shrink-0 lg:p-0 lg:overflow-visible lg:translate-x-0
          ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between pb-4">
          <h2 className="text-lg font-bold text-[#063D27]">Filters</h2>
          <div className="flex items-center gap-4">
            <button onClick={onClear} className="text-sm font-medium text-gray-600 hover:text-black">
              Clear All
            </button>
            <button onClick={onClose} className="lg:hidden" aria-label="Close filters">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Category */}
        {categories.length > 1 && (
          <div className="border-t py-4">
            <h3 className="text-sm font-bold text-[#063D27] uppercase tracking-wider mb-3">Category</h3>
            <ul className="space-y-2">
              {categories.map((category) => (
                <li key={category}>
                  <label className="flex items-center gap-2.5 text-sm text-gray-700 hover:text-[#063D27] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category)}
                      onChange={() => onToggleCategory(category)}
                      className="accent-[#07552F] w-4 h-4 rounded"
                    />
                    <span>{category}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Price Range */}
        {priceRanges.length > 0 && (
          <div className="border-t py-4">
            <h3 className="text-sm font-bold text-[#063D27] uppercase tracking-wider mb-3">Price</h3>
            <ul className="space-y-2">
              {priceRanges.map((range, index) => (
                <li key={range.label}>
                  <label className="flex items-center gap-2.5 text-sm text-gray-700 hover:text-[#063D27] cursor-pointer">
                    <input
                      type="radio"
                      name="priceRange"
                      checked={selectedPriceRange === index}
                      onChange={() => onSelectPriceRange(index)}
                      className="accent-[#07552F] w-4 h-4"
                    />
                    <span>{range.label}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* LISTING PAGE COMPONENT                                              */
/* ------------------------------------------------------------------ */
function ProductListingContent({ collection }: ProductListingProps) {
  const { title, subtitle, priceRanges } = collection;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const gridTopRef = useRef<HTMLDivElement>(null);

  const [products, setProducts] = useState<Product[]>(collection.products);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState(SORT_OPTIONS[0]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cart, setCart] = useState<Record<string | number, number>>({});

  // Sync products with API if available
  useEffect(() => {
    const isAll = collection.slug === "products" || collection.slug === "shop";
    const endpoint = isAll ? "/products?limit=100" : `/products?category=${encodeURIComponent(collection.slug)}&limit=100`;

    api<{ products: any[] }>(endpoint)
      .then((data) => {
        if (data?.products && data.products.length > 0) {
          const mapped: Product[] = data.products.map((p) => {
            const catSlug = p.category_slug || (p.category_name ? p.category_name.toLowerCase().replace(/\s+/g, "-") : collection.slug);
            return {
              id: p.id,
              name: p.name,
              slug: p.slug,
              category: p.category_name || p.category || (isAll ? catSlug : title),
              price: Number(p.price),
              mrp: Number(p.mrp),
              description: p.description || undefined,
              collectionSlug: catSlug,
            };
          });
          setProducts(mapped);
        }
      })
      .catch(() => {
        // Fall back to initial products
      });
  }, [collection.slug, title]);

  useEffect(() => {
    const syncCart = () => {
      const currentItems = getCart();
      const map: Record<string | number, number> = {};
      currentItems.forEach((i) => {
        map[i.id] = i.qty;
      });
      setCart(map);
    };

    syncCart();
    window.addEventListener(CART_EVENT, syncCart);
    window.addEventListener("storage", syncCart);
    return () => {
      window.removeEventListener(CART_EVENT, syncCart);
      window.removeEventListener("storage", syncCart);
    };
  }, []);

  const categories = useMemo(() => Array.from(new Set(products.map((p) => p.category))), [products]);

  // Filter, then sort
  const filteredProducts = useMemo(() => {
    const range = selectedPriceRange !== null ? priceRanges[selectedPriceRange] : null;

    let list = products.filter((p) => {
      if (selectedCategories.length > 0 && !selectedCategories.includes(p.category)) return false;
      if (range && (p.price < range.min || p.price > range.max)) return false;
      return true;
    });

    if (sortBy === "Price: Low to High") list = [...list].sort((a, b) => a.price - b.price);
    if (sortBy === "Price: High to Low") list = [...list].sort((a, b) => b.price - a.price);
    if (sortBy === "Discount") list = [...list].sort((a, b) => getDiscount(b) - getDiscount(a));

    return list;
  }, [products, priceRanges, selectedCategories, selectedPriceRange, sortBy]);

  // Pagination calculation
  const totalProducts = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalProducts / PRODUCTS_PER_PAGE));

  const pageQuery = searchParams.get("page");
  let currentPage = pageQuery ? parseInt(pageQuery, 10) : 1;
  if (isNaN(currentPage) || currentPage < 1) {
    currentPage = 1;
  }

  // Redirect invalid page numbers (e.g. ?page=99) to last valid page
  useEffect(() => {
    if (pageQuery) {
      const parsed = parseInt(pageQuery, 10);
      if (isNaN(parsed) || parsed < 1) {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("page");
        router.replace(`${pathname}${params.toString() ? `?${params.toString()}` : ""}`);
      } else if (parsed > totalPages) {
        const params = new URLSearchParams(searchParams.toString());
        if (totalPages > 1) {
          params.set("page", String(totalPages));
        } else {
          params.delete("page");
        }
        router.replace(`${pathname}${params.toString() ? `?${params.toString()}` : ""}`);
      }
    }
  }, [pageQuery, totalPages, pathname, router, searchParams]);

  const activePage = Math.min(currentPage, totalPages);

  const paginatedProducts = useMemo(() => {
    const start = (activePage - 1) * PRODUCTS_PER_PAGE;
    return filteredProducts.slice(start, start + PRODUCTS_PER_PAGE);
  }, [filteredProducts, activePage]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newPage <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(newPage));
    }
    router.push(`${pathname}${params.toString() ? `?${params.toString()}` : ""}`);

    if (gridTopRef.current) {
      gridTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories((current) =>
      current.includes(category) ? current.filter((c) => c !== category) : [...current, category]
    );
    handlePageChange(1);
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedPriceRange(null);
    handlePageChange(1);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-8">
        {/* Heading */}
        <section className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#063D27]">{title}</h1>
          <p className="text-base font-normal text-gray-600 mt-1.5">{subtitle}</p>
          <p className="text-sm sm:text-base font-medium text-gray-500 mt-0.5">
            {totalProducts} Products
          </p>
        </section>

        {/* Filter button (mobile) + sort */}
        <div ref={gridTopRef} className="flex flex-wrap items-center justify-between gap-2.5 mb-6 scroll-mt-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden flex items-center gap-1.5 border border-gray-300 rounded-md px-3 py-2 text-xs sm:text-sm font-semibold text-[#07552F] hover:border-[#07552F] active:bg-[#F4F8F1]"
          >
            <SlidersHorizontal size={15} />
            Filters
          </button>

          <label className="flex items-center gap-1.5 border border-gray-300 rounded-md px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm ml-auto">
            <span className="text-gray-500 font-medium whitespace-nowrap">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="outline-none bg-transparent cursor-pointer font-medium text-xs sm:text-sm text-[#07552F]"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex gap-8">
          <FilterSidebar
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            categories={categories}
            selectedCategories={selectedCategories}
            onToggleCategory={toggleCategory}
            priceRanges={priceRanges}
            selectedPriceRange={selectedPriceRange}
            onSelectPriceRange={(idx) => {
              setSelectedPriceRange(idx);
              handlePageChange(1);
            }}
            onClear={clearFilters}
          />

          {/* Products Grid: Mobile 2 columns, tablet 3 columns, desktop 5 columns */}
          <section className="flex-1 min-w-0">
            <div className="grid gap-2.5 sm:gap-4 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
              {paginatedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  href={productHref(collection, product)}
                  showBuyNow={true}
                />
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-20 text-gray-500">
                <p>No products match your filters.</p>
                <button onClick={clearFilters} className="mt-3 underline text-black">
                  Clear all filters
                </button>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <nav aria-label="Pagination" className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
                {/* Previous */}
                <button
                  type="button"
                  onClick={() => handlePageChange(activePage - 1)}
                  disabled={activePage <= 1}
                  className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-2 rounded-md border border-gray-300 text-xs sm:text-sm font-semibold text-[#07552F] hover:bg-[#F4F8F1] transition disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Previous page"
                >
                  <ChevronLeft size={16} />
                  <span className="hidden xs:inline sm:inline">Prev</span>
                </button>

                {/* Page numbers */}
                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => {
                  const isCurrent = pageNum === activePage;
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => handlePageChange(pageNum)}
                      className={`min-w-[2rem] sm:min-w-[2.25rem] h-8 sm:h-9 px-2 sm:px-3 rounded-md text-xs sm:text-sm font-bold transition ${
                        isCurrent
                          ? "bg-[#07552F] text-white shadow-sm"
                          : "border border-gray-200 text-gray-700 hover:bg-[#F4F8F1] hover:text-[#07552F]"
                      }`}
                      aria-current={isCurrent ? "page" : undefined}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                {/* Next */}
                <button
                  type="button"
                  onClick={() => handlePageChange(activePage + 1)}
                  disabled={activePage >= totalPages}
                  className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-2 rounded-md border border-gray-300 text-xs sm:text-sm font-semibold text-[#07552F] hover:bg-[#F4F8F1] transition disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Next page"
                >
                  <span className="hidden xs:inline sm:inline">Next</span>
                  <ChevronRight size={16} />
                </button>
              </nav>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default function UppilieesProductListing({ collection }: ProductListingProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <ProductListingContent collection={collection} />
    </Suspense>
  );
}
