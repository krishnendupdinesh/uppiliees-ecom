"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { type Collection, type PriceRange, productHref } from "@/data/products";
import { getDiscount } from "@/lib/format";
import CartControl from "./CartControl";
import ProductCard from "./ProductCard";

type ProductListingProps = {
  collection: Collection; // title, subtitle, products and price ranges for this page
};

const SORT_OPTIONS = ["Popularity", "Price: Low to High", "Price: High to Low", "Discount"];

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
        <div className="border-t border-gray-200 py-4">
          <p className="text-base font-bold text-[#063D27] mb-3">Category</p>
          <div className="space-y-2.5">
            {categories.map((category) => (
              <label key={category} className="flex items-center gap-3 text-[15px] font-normal cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(category)}
                  onChange={() => onToggleCategory(category)}
                  className="accent-[#07552F] w-4 h-4"
                />
                {category}
              </label>
            ))}
          </div>
        </div>

        {/* Price */}
        <div className="border-t border-gray-200 py-4">
          <p className="text-base font-bold text-[#063D27] mb-3">Price</p>
          <div className="space-y-2.5">
            {priceRanges.map((range, index) => (
              <label key={range.label} className="flex items-center gap-3 text-[15px] font-normal cursor-pointer">
                <input
                  type="radio"
                  name="price"
                  checked={selectedPriceRange === index}
                  onChange={() => onSelectPriceRange(index)}
                  className="accent-[#07552F] w-4 h-4"
                />
                {range.label}
              </label>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* LISTING PAGE                                                        */
/* ------------------------------------------------------------------ */
export default function UppilieesProductListing({ collection }: ProductListingProps) {
  const { title, subtitle, products, priceRanges } = collection;

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState(SORT_OPTIONS[0]);
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile drawer only
  const [cart, setCart] = useState<Record<number, number>>({}); // product id -> quantity

  // Unique category names, in the order they first appear
  const categories = useMemo(() => Array.from(new Set(products.map((p) => p.category))), [products]);

  // Filter, then sort
  const visibleProducts = useMemo(() => {
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

  const toggleCategory = (category: string) =>
    setSelectedCategories((current) =>
      current.includes(category) ? current.filter((c) => c !== category) : [...current, category]
    );

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedPriceRange(null);
  };

  const addToCart = (id: number) => setCart((current) => ({ ...current, [id]: (current[id] || 0) + 1 }));

  const removeFromCart = (id: number) =>
    setCart((current) => {
      const updated = { ...current, [id]: (current[id] || 0) - 1 };
      if (updated[id] <= 0) delete updated[id];
      return updated;
    });

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Heading */}
        <section className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#063D27]">{title}</h1>
          <p className="text-base font-normal text-gray-600 mt-1.5">{subtitle}</p>
          <p className="text-sm sm:text-base font-medium text-gray-500 mt-0.5">{visibleProducts.length} Products</p>
        </section>

        {/* Filter button (mobile) + sort */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden flex items-center gap-2 border rounded px-3 py-2 text-sm hover:border-black"
          >
            <SlidersHorizontal size={16} />
            Filters
          </button>

          <label className="flex items-center gap-2 border rounded px-3 py-2 text-sm ml-auto">
            <span className="text-gray-500">Sort by :</span>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="outline-none bg-transparent">
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
            onSelectPriceRange={setSelectedPriceRange}
            onClear={clearFilters}
          />

          {/* Products */}
          <section className="flex-1 min-w-0">
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
              {visibleProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  href={productHref(collection, product)}
                  footer={
                    <CartControl
                      quantity={cart[product.id] || 0}
                      onAdd={() => addToCart(product.id)}
                      onRemove={() => removeFromCart(product.id)}
                    />
                  }
                />
              ))}
            </div>

            {visibleProducts.length === 0 && (
              <div className="text-center py-20 text-gray-500">
                <p>No products match your filters.</p>
                <button onClick={clearFilters} className="mt-3 underline text-black">
                  Clear all filters
                </button>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}