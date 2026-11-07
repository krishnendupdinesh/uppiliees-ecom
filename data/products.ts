/* ------------------------------------------------------------------ */
/* PRODUCT DATA                                                        */
/* One place for every collection. The listing pages and the product   */
/* detail pages both read from here.                                   */
/* Images go in /public/products/<slug>.jpg (prices are dummy values)  */
/* ------------------------------------------------------------------ */

export type Product = {
  id: number;
  name: string;
  slug: string; // image file name AND the last part of the product URL
  category: string; // sub-category shown on the card (e.g. "Hair Care")
  price: number; // selling price in INR (dummy)
  mrp: number; // original price in INR (dummy)
  description?: string; // optional - shown on the product page when present
  collectionSlug?: string; // optional - overrides collection.slug when listed in allProducts
};

export type PriceRange = {
  label: string;
  min: number;
  max: number;
};

export type Collection = {
  slug: string; // must match the folder name in /app (e.g. "herbal-beauty")
  title: string; // the H1 of the listing page
  subtitle: string;
  products: Product[];
  priceRanges: PriceRange[];
};

/* ---------------------------- Handloom ---------------------------- */
export const handloom: Collection = {
  slug: "handloom",
  title: "Traditional Handloom Products",
  subtitle: "Authentic Kerala handloom, woven with care",
  products: [
    { id: 1, slug: "kerala-handloom-sarees", name: "Traditional Kerala Handloom Sarees", category: "Sarees", price: 2499, mrp: 3199 },
    { id: 2, slug: "kerala-handloom-set-mundu", name: "Traditional Kerala Handloom Set Mundu", category: "Set Mundu", price: 1899, mrp: 2399 },
    { id: 3, slug: "kerala-handloom-dhotis", name: "Traditional Kerala Handloom Dhotis", category: "Dhotis", price: 999, mrp: 1299 },
  ],
  priceRanges: [
    { label: "Under ₹1,000", min: 0, max: 999 },
    { label: "₹1,000 - ₹2,000", min: 1000, max: 2000 },
    { label: "Above ₹2,000", min: 2001, max: Infinity },
  ],
};

/* ------------------------- Herbal & Beauty ------------------------- */
export const herbalBeauty: Collection = {
  slug: "herbal-beauty",
  title: "Herbal, Beauty & Wellness Products",
  subtitle: "Pure Nature. Pure Goodness.",
  products: [
    { id: 1, slug: "changalam-paranda-pain-relief-oil", name: "Changalam Paranda Herbal Pain Relief Oil", category: "Pain Relief", price: 249, mrp: 320 },
    { id: 2, slug: "babyglow-baby-massage-oil", name: "BabyGlow Natural Baby Massage Oil", category: "Baby Care", price: 199, mrp: 250 },
    { id: 3, slug: "pulari-herbal-hair-growth-oil", name: "PULARI Herbal Hair Growth Oil", category: "Hair Care", price: 349, mrp: 450 },
    { id: 4, slug: "glow-plus-fairness-powder", name: "Glow Plus Herbal Fairness Powder", category: "Skin Care", price: 179, mrp: 230 },
    { id: 5, slug: "glow-plus-skin-brightening-cream", name: "Glow Plus Skin Brightening Moisturizing Cream", category: "Skin Care", price: 279, mrp: 350 },
    { id: 6, slug: "sankhu-puspam-face-wash", name: "Sankhu Puspam Herbal Face Wash", category: "Skin Care", price: 159, mrp: 199 },
    { id: 7, slug: "glow-plus-lip-care-cream", name: "Glow Plus Lip Care Cream", category: "Skin Care", price: 99, mrp: 130 },
    { id: 8, slug: "baby-glow-urukku-velichenna", name: "Homemade Baby Glow Virgin Coconut Oil", category: "Baby Care", price: 229, mrp: 280 },
    { id: 9, slug: "painoplus-pain-relief-balm", name: "PainoPlus Changalam Paranda Pain Relief Balm", category: "Pain Relief", price: 149, mrp: 190 },
    { id: 10, slug: "stretch-ease-stretch-mark-cream", name: "Stretch Ease Stretch Mark Care Cream", category: "Skin Care", price: 399, mrp: 520 },
    { id: 11, slug: "ojas-boost-herbal-powder", name: "Ojas Boost Herbal Wellness Powder", category: "Wellness Powders", price: 299, mrp: 380 },
    { id: 12, slug: "ashwagandha-powder", name: "Natural Ashwagandha Herbal Powder", category: "Wellness Powders", price: 199, mrp: 260 },
    { id: 13, slug: "naikuruna-powder", name: "Natural Naikuruna Herbal Powder", category: "Wellness Powders", price: 179, mrp: 220 },
    { id: 14, slug: "kalonji-black-seed-oil", name: "Pure Kalonji Black Seed Oil for Hair Care", category: "Hair Care", price: 269, mrp: 340 },
    { id: 15, slug: "mozi-out-herbal-mosquito-repellent", name: "MOZI OUT Herbal Mosquito Repellent", category: "Home Care", price: 129, mrp: 160 },
  ],
  priceRanges: [
    { label: "Under ₹150", min: 0, max: 149 },
    { label: "₹150 - ₹250", min: 150, max: 250 },
    { label: "₹250 - ₹350", min: 251, max: 350 },
    { label: "Above ₹350", min: 351, max: Infinity },
  ],
};

/* ------------------------- Traditional Foods ------------------------ */
export const traditionalFoods: Collection = {
  slug: "traditional-foods",
  title: "Traditional Kerala Food Products",
  subtitle: "Homemade and traditional, straight from Kerala kitchens",
  products: [
    // Powders
    { id: 1, slug: "kannan-kaya-powder", name: "Traditional Kerala Kannan Kaya Powder", category: "Powders", price: 199, mrp: 240 },
    { id: 2, slug: "homemade-banana-powder", name: "Homemade Natural Banana Powder", category: "Powders", price: 189, mrp: 230 },
    { id: 3, slug: "ragi-powder", name: "Natural Ragi Finger Millet Powder", category: "Powders", price: 149, mrp: 180 },
    { id: 4, slug: "homemade-sambar-powder", name: "Homemade Kerala Style Sambar Powder", category: "Powders", price: 129, mrp: 160 },

    // Chips and sweets
    { id: 5, slug: "kannan-kaya-dried-chips", name: "Traditional Kannan Kaya Dried Banana Chips", category: "Chips & Sweets", price: 179, mrp: 210 },
    { id: 6, slug: "banana-dried-chips", name: "Traditional Kerala Dried Banana Chips", category: "Chips & Sweets", price: 159, mrp: 199 },
    { id: 7, slug: "banana-figs", name: "Traditional Kerala Banana Figs", category: "Chips & Sweets", price: 249, mrp: 299 },

    // Pickle, ghee and lard
    { id: 8, slug: "homemade-prawns-pickle", name: "Homemade Kerala Style Prawns Pickle", category: "Pickle, Ghee & Lard", price: 299, mrp: 380 },
    { id: 9, slug: "homemade-pure-cow-ghee", name: "Homemade Pure Cow Ghee", category: "Pickle, Ghee & Lard", price: 699, mrp: 850 },
    { id: 10, slug: "homemade-pork-lard", name: "Homemade Pure Pork Lard", category: "Pickle, Ghee & Lard", price: 349, mrp: 420 },

    // Dried foods
    { id: 11, slug: "dried-vegetables", name: "Homemade Sun-Dried Vegetables", category: "Dried Foods", price: 219, mrp: 270 },
    { id: 12, slug: "dried-meat", name: "Traditional Kerala Dried Meat", category: "Dried Foods", price: 549, mrp: 650 },
    { id: 13, slug: "dried-fish", name: "Traditional Kerala Dried Fish", category: "Dried Foods", price: 399, mrp: 480 },
  ],
  priceRanges: [
    { label: "Under ₹150", min: 0, max: 149 },
    { label: "₹150 - ₹250", min: 150, max: 250 },
    { label: "₹250 - ₹500", min: 251, max: 500 },
    { label: "Above ₹500", min: 501, max: Infinity },
  ],
};

/* ------------------------------------------------------------------ */
/* ALL PRODUCTS COLLECTION                                             */
/* ------------------------------------------------------------------ */
export const allProducts: Collection = {
  slug: "products",
  title: "All Products",
  subtitle: "Explore our complete range of herbal wellness, traditional Kerala foods, and handloom",
  products: [
    ...herbalBeauty.products.map((p, idx) => ({
      ...p,
      id: 100 + idx + 1,
      collectionSlug: herbalBeauty.slug,
    })),
    ...traditionalFoods.products.map((p, idx) => ({
      ...p,
      id: 200 + idx + 1,
      collectionSlug: traditionalFoods.slug,
    })),
    ...handloom.products.map((p, idx) => ({
      ...p,
      id: 300 + idx + 1,
      collectionSlug: handloom.slug,
    })),
  ],
  priceRanges: [
    { label: "Under ₹150", min: 0, max: 149 },
    { label: "₹150 - ₹250", min: 150, max: 250 },
    { label: "₹250 - ₹500", min: 251, max: 500 },
    { label: "Above ₹500", min: 501, max: Infinity },
  ],
};

/* ------------------------------------------------------------------ */
/* LOOKUP HELPERS                                                      */
/* ------------------------------------------------------------------ */
export const collections: Collection[] = [handloom, herbalBeauty, traditionalFoods];

/** URL of a product's detail page, e.g. /herbal-beauty/ashwagandha-powder */
export const productHref = (collection: Collection, product: Product) =>
  `/${product.collectionSlug ?? collection.slug}/${product.slug}`;

/** Finds a product from the two URL segments. Returns undefined if either is unknown. */
export function findProduct(collectionSlug: string, productSlug: string) {
  const collection = collections.find((c) => c.slug === collectionSlug);
  const product = collection?.products.find((p) => p.slug === productSlug);
  return collection && product ? { collection, product } : undefined;
}

/* ------------------------------------------------------------------ */
/* NAVBAR & SEARCH PRODUCT CATALOG                                     */
/* ------------------------------------------------------------------ */
export type NavProduct = {
  id: string;
  name: string;
  category: string;
  slug: string;
  href: string;
};

export const PRODUCTS: NavProduct[] = [
  // 1. Dried Foods (Part of Kerala Food Products)
  {
    id: "dp-1",
    name: "Dried Vegetables",
    category: "Kerala Food Products",
    slug: "dried-vegetables",
    href: "/traditional-foods/dried-vegetables",
  },
  {
    id: "dp-2",
    name: "Dried Meat",
    category: "Kerala Food Products",
    slug: "dried-meat",
    href: "/traditional-foods/dried-meat",
  },
  {
    id: "dp-3",
    name: "Dried Fish",
    category: "Kerala Food Products",
    slug: "dried-fish",
    href: "/traditional-foods/dried-fish",
  },

  // 2. Herbal & Wellness
  {
    id: "hw-1",
    name: "Changalam Paranda Pain Relief Oil",
    category: "Herbal & Wellness",
    slug: "changalam-paranda-pain-relief-oil",
    href: "/herbal-beauty/changalam-paranda-pain-relief-oil",
  },
  {
    id: "hw-2",
    name: "BabyGlow – Baby Massage Oil",
    category: "Herbal & Wellness",
    slug: "babyglow-baby-massage-oil",
    href: "/herbal-beauty/babyglow-baby-massage-oil",
  },
  {
    id: "hw-3",
    name: "PULARI Herbal Hair Growth Oil",
    category: "Herbal & Wellness",
    slug: "pulari-herbal-hair-growth-oil",
    href: "/herbal-beauty/pulari-herbal-hair-growth-oil",
  },
  {
    id: "hw-4",
    name: "Glow Plus Fairness Powder",
    category: "Herbal & Wellness",
    slug: "glow-plus-fairness-powder",
    href: "/herbal-beauty/glow-plus-fairness-powder",
  },
  {
    id: "hw-5",
    name: "Glow Plus Skin Brightening Moisturizing Cream",
    category: "Herbal & Wellness",
    slug: "glow-plus-skin-brightening-cream",
    href: "/herbal-beauty/glow-plus-skin-brightening-cream",
  },
  {
    id: "hw-6",
    name: "Sankhu Puspam Face Wash",
    category: "Herbal & Wellness",
    slug: "sankhu-puspam-face-wash",
    href: "/herbal-beauty/sankhu-puspam-face-wash",
  },
  {
    id: "hw-7",
    name: "Glow Plus Lip Care Cream",
    category: "Herbal & Wellness",
    slug: "glow-plus-lip-care-cream",
    href: "/herbal-beauty/glow-plus-lip-care-cream",
  },
  {
    id: "hw-8",
    name: "Homemade Baby Glow Urukku Velichenna (Virgin Coconut Oil)",
    category: "Herbal & Wellness",
    slug: "baby-glow-urukku-velichenna",
    href: "/herbal-beauty/baby-glow-urukku-velichenna",
  },
  {
    id: "hw-9",
    name: "PainoPlus Pain Relief Balm (Changalam Paranda Balm)",
    category: "Herbal & Wellness",
    slug: "painoplus-pain-relief-balm",
    href: "/herbal-beauty/painoplus-pain-relief-balm",
  },
  {
    id: "hw-10",
    name: "Stretch Ease – Stretch Mark Cream",
    category: "Herbal & Wellness",
    slug: "stretch-ease-stretch-mark-cream",
    href: "/herbal-beauty/stretch-ease-stretch-mark-cream",
  },
  {
    id: "hw-11",
    name: "Ojas Boost – Ojus Enhancing Powder",
    category: "Herbal & Wellness",
    slug: "ojas-boost-herbal-powder",
    href: "/herbal-beauty/ojas-boost-herbal-powder",
  },
  {
    id: "hw-12",
    name: "Ashwagandha Powder",
    category: "Herbal & Wellness",
    slug: "ashwagandha-powder",
    href: "/herbal-beauty/ashwagandha-powder",
  },
  {
    id: "hw-13",
    name: "Naikuruna Powder",
    category: "Herbal & Wellness",
    slug: "naikuruna-powder",
    href: "/herbal-beauty/naikuruna-powder",
  },
  {
    id: "hw-14",
    name: "Kalonji Oil – Pure Black Seed Oil",
    category: "Herbal & Wellness",
    slug: "kalonji-black-seed-oil",
    href: "/herbal-beauty/kalonji-black-seed-oil",
  },
  {
    id: "hw-15",
    name: "MOZI OUT – Herbal Mosquito Repellent",
    category: "Herbal & Wellness",
    slug: "mozi-out-herbal-mosquito-repellent",
    href: "/herbal-beauty/mozi-out-herbal-mosquito-repellent",
  },

  // 3. Kerala Food Products
  {
    id: "kf-1",
    name: "Kannan Kaya Powder",
    category: "Kerala Food Products",
    slug: "kannan-kaya-powder",
    href: "/traditional-foods/kannan-kaya-powder",
  },
  {
    id: "kf-2",
    name: "Kannan Kaya Dried Chips",
    category: "Kerala Food Products",
    slug: "kannan-kaya-dried-chips",
    href: "/traditional-foods/kannan-kaya-dried-chips",
  },
  {
    id: "kf-3",
    name: "Banana Powder",
    category: "Kerala Food Products",
    slug: "homemade-banana-powder",
    href: "/traditional-foods/homemade-banana-powder",
  },
  {
    id: "kf-4",
    name: "Banana Dried Chips",
    category: "Kerala Food Products",
    slug: "banana-dried-chips",
    href: "/traditional-foods/banana-dried-chips",
  },
  {
    id: "kf-5",
    name: "Ragi Powder",
    category: "Kerala Food Products",
    slug: "ragi-powder",
    href: "/traditional-foods/ragi-powder",
  },
  {
    id: "kf-6",
    name: "Homemade Sambar Powder",
    category: "Kerala Food Products",
    slug: "homemade-sambar-powder",
    href: "/traditional-foods/homemade-sambar-powder",
  },
  {
    id: "kf-7",
    name: "Banana Figs",
    category: "Kerala Food Products",
    slug: "banana-figs",
    href: "/traditional-foods/banana-figs",
  },
  {
    id: "kf-8",
    name: "Prawns Pickle",
    category: "Kerala Food Products",
    slug: "homemade-prawns-pickle",
    href: "/traditional-foods/homemade-prawns-pickle",
  },
  {
    id: "kf-9",
    name: "Homemade Cow Ghee",
    category: "Kerala Food Products",
    slug: "homemade-pure-cow-ghee",
    href: "/traditional-foods/homemade-pure-cow-ghee",
  },
  {
    id: "kf-10",
    name: "Homemade Pure Pork Lard",
    category: "Kerala Food Products",
    slug: "homemade-pork-lard",
    href: "/traditional-foods/homemade-pork-lard",
  },

  // 4. Handloom
  {
    id: "hl-1",
    name: "Sarees",
    category: "Handloom",
    slug: "kerala-handloom-sarees",
    href: "/handloom/kerala-handloom-sarees",
  },
  {
    id: "hl-2",
    name: "Set Mundu",
    category: "Handloom",
    slug: "kerala-handloom-set-mundu",
    href: "/handloom/kerala-handloom-set-mundu",
  },
  {
    id: "hl-3",
    name: "Dhotis",
    category: "Handloom",
    slug: "kerala-handloom-dhotis",
    href: "/handloom/kerala-handloom-dhotis",
  },
];

export function getProductsByCategory(categoryName: string): NavProduct[] {
  if (categoryName === "All Products") return PRODUCTS;
  return PRODUCTS.filter((item) => item.category === categoryName);
}