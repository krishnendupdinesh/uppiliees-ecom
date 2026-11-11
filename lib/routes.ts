// Central routing configuration for UPPILIEES

export const PRODUCT_SLUGS = [
  "changalam-paranda-pain-relief-oil",
  "babyglow-baby-massage-oil",
  "pulari-herbal-hair-growth-oil",
  "glow-plus-fairness-powder",
  "glow-plus-skin-brightening-cream",
  "sankhu-puspam-face-wash",
  "glow-plus-lip-care-cream",
  "baby-glow-urukku-velichenna",
  "painoplus-pain-relief-balm",
  "stretch-ease-stretch-mark-cream",
  "ojas-boost-herbal-powder",
  "ashwagandha-powder",
  "naikuruna-powder",
  "kalonji-black-seed-oil",
  "mozi-out-herbal-mosquito-repellent",
  "kannan-kaya-powder",
  "kannan-kaya-dried-chips",
  "homemade-banana-powder",
  "banana-dried-chips",
  "ragi-powder",
  "homemade-sambar-powder",
  "banana-figs",
  "homemade-prawns-pickle",
  "homemade-pure-cow-ghee",
  "homemade-pork-lard",
  "kerala-handloom-sarees",
  "kerala-handloom-set-mundu",
  "kerala-handloom-dhotis",
] as const;

export type ProductSlug = (typeof PRODUCT_SLUGS)[number];

export const OLD_PRODUCT_ID_TO_SLUG: Record<string, ProductSlug> = {
  "product-1": "ashwagandha-powder",
  "product-2": "banana-dried-chips",
  "product-3": "kerala-handloom-set-mundu",
  "product-4": "sankhu-puspam-face-wash",
};

export const ROUTES = {
  home: "/",
  shop: "/shop",
  categories: {
    herbalBeauty: "/herbal-beauty",
    traditionalFoods: "/traditional-foods",
    handloom: "/handloom",
  },
  product: (slug: string) => `/products/${slug}`,
  cart: "/cart",
  checkout: "/checkout",
  orderSuccess: (orderId: string | number) => `/order-success/${orderId}`,
  account: "/account",
  login: "/login",
  register: "/register",
  wishlist: "/wishlist",
  about: "/about",
  contact: "/contact",
  shippingPolicy: "/shipping-policy",
  privacyPolicy: "/privacy-policy",
  termsConditions: "/terms-and-conditions",
  qualityStandards: "/quality-standards",
  trackOrder: "/track-order",
} as const;

