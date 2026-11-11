import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import ProductActions from "@/components/ProductActions";
import ProductCard from "@/components/ProductCard";
import ProductImage from "@/components/ProductImage";
import ProductTabs, { type ProductTab } from "@/components/ProductTabs";
import WishlistButton from "@/components/WishlistButton";

import {
  collections,
  findProductBySlug,
  productHref,
  type Collection,
  type Product,
} from "@/data/products";

import { formatPrice, getDiscount } from "@/lib/format";
import { api } from "@/lib/api";

export const instant = false;

type Params = Promise<{ slug: string }>;

type ProductGroup = "wellness" | "food" | "handloom";

type ProductInfo = {
  overview?: string;
  ingredients?: string[];
  highlights?: string[];
  benefits?: string[];
  usage?: string[];
  careInstructions?: string[];
};

// SEO headings and product categories from the UPPILIEES catalogue.
const seoProducts: Record<string, { heading: string; group: ProductGroup }> = {
  "changalam-paranda-pain-relief-oil": {
    heading: "Changalam Paranda Herbal Pain Relief Oil",
    group: "wellness",
  },
  "babyglow-baby-massage-oil": {
    heading: "BabyGlow Natural Baby Massage Oil",
    group: "wellness",
  },
  "pulari-herbal-hair-growth-oil": {
    heading: "PULARI Herbal Hair Growth Oil",
    group: "wellness",
  },
  "glow-plus-fairness-powder": {
    heading: "Glow Plus Herbal Fairness Powder",
    group: "wellness",
  },
  "glow-plus-skin-brightening-cream": {
    heading: "Glow Plus Skin Brightening Moisturizing Cream",
    group: "wellness",
  },
  "sankhu-puspam-face-wash": {
    heading: "Sankhu Puspam Herbal Face Wash",
    group: "wellness",
  },
  "glow-plus-lip-care-cream": {
    heading: "Glow Plus Lip Care Cream",
    group: "wellness",
  },
  "baby-glow-urukku-velichenna": {
    heading: "Homemade Baby Glow Virgin Coconut Oil",
    group: "wellness",
  },
  "painoplus-pain-relief-balm": {
    heading: "PainoPlus Changalam Paranda Pain Relief Balm",
    group: "wellness",
  },
  "stretch-ease-stretch-mark-cream": {
    heading: "Stretch Ease Stretch Mark Care Cream",
    group: "wellness",
  },
  "ojas-boost-herbal-powder": {
    heading: "Ojas Boost Herbal Wellness Powder",
    group: "wellness",
  },
  "ashwagandha-powder": {
    heading: "Natural Ashwagandha Herbal Powder",
    group: "wellness",
  },
  "naikuruna-powder": {
    heading: "Natural Naikuruna Herbal Powder",
    group: "wellness",
  },
  "kalonji-black-seed-oil": {
    heading: "Pure Kalonji Black Seed Oil for Hair Care",
    group: "wellness",
  },
  "mozi-out-herbal-mosquito-repellent": {
    heading: "MOZI OUT Herbal Mosquito Repellent",
    group: "wellness",
  },

  "kannan-kaya-powder": {
    heading: "Traditional Kerala Kannan Kaya Powder",
    group: "food",
  },
  "kannan-kaya-dried-chips": {
    heading: "Traditional Kannan Kaya Dried Banana Chips",
    group: "food",
  },
  "homemade-banana-powder": {
    heading: "Homemade Natural Banana Powder",
    group: "food",
  },
  "banana-dried-chips": {
    heading: "Traditional Kerala Dried Banana Chips",
    group: "food",
  },
  "ragi-powder": {
    heading: "Natural Ragi Finger Millet Powder",
    group: "food",
  },
  "homemade-sambar-powder": {
    heading: "Homemade Kerala Style Sambar Powder",
    group: "food",
  },
  "banana-figs": {
    heading: "Traditional Kerala Banana Figs",
    group: "food",
  },
  "homemade-prawns-pickle": {
    heading: "Homemade Kerala Style Prawns Pickle",
    group: "food",
  },
  "homemade-pure-cow-ghee": {
    heading: "Homemade Pure Cow Ghee",
    group: "food",
  },
  "homemade-pork-lard": {
    heading: "Homemade Pure Pork Lard",
    group: "food",
  },

  "kerala-handloom-sarees": {
    heading: "Traditional Kerala Handloom Sarees",
    group: "handloom",
  },
  "kerala-handloom-set-mundu": {
    heading: "Traditional Kerala Handloom Set Mundu",
    group: "handloom",
  },
  "kerala-handloom-dhotis": {
    heading: "Traditional Kerala Handloom Dhotis",
    group: "handloom",
  },
};

const productInformation: Record<string, ProductInfo> = {
  // Herbal & Beauty
  "changalam-paranda-pain-relief-oil": {
    benefits: [
      "Rapid natural relief from joint, muscle, knee, and back pain.",
      "Traditional Kerala herbal formula infused with Changalam Paranda (Cissus quadrangularis).",
      "Improves blood circulation and relieves chronic stiffness and swelling.",
      "100% natural herbal ingredients with no harsh chemicals or artificial fragrances."
    ],
    highlights: ["100% Herbal & Ayurvedic", "Fast-acting relief", "Deep penetrating oil"],
    usage: ["Take a small amount, gently massage into the affected area for 5-10 minutes, and leave it on or apply mild warmth."]
  },
  "babyglow-baby-massage-oil": {
    benefits: [
      "Specially formulated with gentle, safe herbs to nourish delicate baby skin.",
      "Strengthens baby's bones and muscles through soothing daily massage.",
      "Prevents skin dryness, rashes, and maintains soft, supple baby texture.",
      "Toxin-free, chemical-free, and dermatologically mild formulation."
    ],
    highlights: ["Safe for newborns & toddlers", "Deeply nourishing", "100% pure & gentle"],
    usage: ["Warm a few drops between your palms and gently massage over the baby's body prior to bath time."]
  },
  "pulari-herbal-hair-growth-oil": {
    benefits: [
      "Stimulates active hair follicles and encourages healthy hair growth.",
      "Helps significantly reduce hair fall, breakage, and split ends.",
      "Cools the scalp, fights dandruff, and prevents premature graying.",
      "Nourishes hair strands from root to tip for noticeable shine and volume."
    ],
    highlights: ["Traditional Kerala formula", "Reduces hair fall", "Natural dandruff control"],
    usage: ["Apply generously to the scalp and hair roots. Massage gently with fingertips and leave for at least 30 minutes before washing."]
  },
  "glow-plus-fairness-powder": {
    benefits: [
      "Improves skin tone and natural glow with authentic botanical herbs.",
      "Gently exfoliates dead skin cells, clearing away impurities and unclogging pores.",
      "Helps reduce blemishes, pigmentation spots, and sun tanning.",
      "Natural and chemical-free alternative to harsh commercial face scrubs."
    ],
    highlights: ["Herbal skin rejuvenation", "Evens out skin tone", "Gentle herbal cleanser"],
    usage: ["Mix a spoonful with water, rose water, or milk to form a paste. Apply on face and neck, leave for 10-15 minutes, then rinse gently."]
  },
  "glow-plus-skin-brightening-cream": {
    benefits: [
      "Deeply hydrates and replenishes the skin barrier for all-day moisture.",
      "Brightens complexion and minimizes uneven tone and hyperpigmentation.",
      "Rich in natural skin-loving vitamins and antioxidants.",
      "Non-greasy, fast-absorbing texture suitable for daily use."
    ],
    highlights: ["Radiant healthy glow", "Non-greasy hydration", "Antioxidant rich"],
    usage: ["Dot evenly across cleansed face and neck every morning and night. Massage gently in upward circular motions."]
  },
  "sankhu-puspam-face-wash": {
    benefits: [
      "Infused with Shankhupushpam (Butterfly Pea) to calm and refresh stressed skin.",
      "Cleanses deep impurities and removes excess oil without stripping natural moisture.",
      "Antioxidant-rich botanical extracts protect skin from environmental pollution.",
      "Leaves skin feeling cool, revitalized, and crystal clear."
    ],
    highlights: ["Butterfly pea herbal extract", "Sulfate & Paraben free", "Gentle on sensitive skin"],
    usage: ["Splash face with lukewarm water, lather a coin-sized amount in hands, gently massage face, and rinse thoroughly."]
  },
  "glow-plus-lip-care-cream": {
    benefits: [
      "Heals chapped, dry, and cracked lips with intense herbal moisturization.",
      "Restores natural lip softness, suppleness, and a healthy rosy tint.",
      "Shields lips against harsh weather and environmental dehydration.",
      "Made with wholesome natural waxes, oils, and herbal infusions."
    ],
    highlights: ["Intense hydration", "Heals cracked lips", "Compact & travel friendly"],
    usage: ["Smooth a small amount over lips as often as needed throughout the day and before bedtime."]
  },
  "baby-glow-urukku-velichenna": {
    benefits: [
      "100% pure homemade Urukku Velichenna (hot-processed virgin coconut oil).",
      "Traditional Kerala secret for baby massage, cradle cap treatment, and skin nourishment.",
      "Loaded with natural lauric acid and antioxidants for unmatched antimicrobial protection.",
      "Edible grade, pure, aromatic, and free from any preservatives or adulterants."
    ],
    highlights: ["Authentic hot-processed oil", "Edible & baby-safe", "Traditional Kerala recipe"],
    usage: ["Apply gently on baby's skin and scalp before bath. Can also be applied as a natural soothing balm."]
  },
  "painoplus-pain-relief-balm": {
    benefits: [
      "Quick on-the-spot soothing action for headaches, muscle sprains, and joint pain.",
      "Infused with Changalam Paranda and warming aromatic herbs for fast penetration.",
      "Convenient balm format that is non-sticky and mess-free.",
      "Provides pleasant warming sensation followed by long-lasting comfort."
    ],
    highlights: ["Fast-acting balm", "Convenient travel size", "Relieves headaches & body aches"],
    usage: ["Rub gently on temples, neck, forehead, or affected joints and muscles. Avoid contact with eyes."]
  },
  "stretch-ease-stretch-mark-cream": {
    benefits: [
      "Boosts skin elasticity and collagen strength during and after pregnancy.",
      "Visibly softens the appearance of existing stretch marks and prevents new ones.",
      "Deeply hydrates itchy, stretching skin with rich herbal emollients.",
      "Safe, gentle, and nourishing for all skin types."
    ],
    highlights: ["Pregnancy & postpartum safe", "Improves elasticity", "Relieves dry itchy skin"],
    usage: ["Massage generously over abdomen, hips, thighs, and breasts twice daily in circular motions."]
  },
  "ojas-boost-herbal-powder": {
    benefits: [
      "Traditional Ayurvedic formulation designed to elevate core vitality and Ojas (inner energy).",
      "Supports immune defense, stamina, and overall physical endurance.",
      "Helps counter fatigue, stress, and sluggish metabolism naturally.",
      "Prepared from time-tested adaptogenic and restorative botanicals."
    ],
    highlights: ["Vitality & stamina booster", "Supports healthy immunity", "100% pure herbal blend"],
    usage: ["Mix 1 teaspoon with warm milk, warm water, or honey once or twice daily after meals."]
  },
  "ashwagandha-powder": {
    benefits: [
      "Premier Ayurvedic adaptogen that reduces cortisol levels, stress, and anxiety.",
      "Enhances physical strength, athletic stamina, and muscle recovery.",
      "Promotes restful and deep natural sleep cycles.",
      "Supports cognitive clarity, focus, and memory retention."
    ],
    highlights: ["Certified natural Ashwagandha", "Stress & sleep support", "Strength & vitality"],
    usage: ["Mix 1/2 to 1 teaspoon in warm milk or water with a hint of honey before bedtime."]
  },
  "naikuruna-powder": {
    benefits: [
      "Rich natural source of L-DOPA that supports nervous system health and dopamine balance.",
      "Enhances mood, mental energy, and overall physical stamina.",
      "Traditionally used in Ayurveda to enhance reproductive vitality and endurance.",
      "Pure, unadulterated botanical root powder processed under strict standards."
    ],
    highlights: ["Mucuna pruriens extract", "Supports nerve & mood health", "Ayurvedic vitality tonic"],
    usage: ["Consume 1/2 teaspoon with warm milk or honey once daily, or as advised by a wellness expert."]
  },
  "kalonji-black-seed-oil": {
    benefits: [
      "Pure cold-pressed Nigella Sativa oil rich in thymoquinone and healthy fatty acids.",
      "Strengthens hair roots, helps control premature thinning, and nourishes the scalp.",
      "Soothes dry, flaky, irritated skin with powerful natural anti-inflammatory qualities.",
      "A versatile ancient wellness remedy for holistic hair, scalp, and skin vitality."
    ],
    highlights: ["100% pure cold-pressed", "Thymoquinone rich", "Scalp & hair root strengthener"],
    usage: ["Massage into hair and scalp, or apply a few drops onto skin areas needing targeted nourishment."]
  },
  "mozi-out-herbal-mosquito-repellent": {
    benefits: [
      "Natural mosquito and insect defense powered by plant-based essential oils.",
      "100% DEET-free, non-toxic, and safe for family and children.",
      "Pleasant herbal aroma without pungent chemical odors.",
      "Long-lasting indoor and outdoor protection against mosquito bites."
    ],
    highlights: ["DEET-free & child safe", "Plant-based formula", "Pleasant herbal scent"],
    usage: ["Spray evenly on exposed skin or clothing from a distance of 15 cm. Reapply every 3-4 hours as needed."]
  },

  // Traditional Foods
  "kannan-kaya-powder": {
    benefits: [
      "Prepared from authentic raw Kerala Kannan bananas, renowned for easy baby digestion.",
      "Ideal first solid food for babies that promotes healthy weight gain and gut wellness.",
      "Rich in natural potassium, dietary fiber, and essential minerals.",
      "100% natural, preservative-free, sugar-free, and chemical-free."
    ],
    highlights: ["Traditional baby food", "Promotes healthy weight", "Rich in fiber & potassium"],
    usage: ["Cook 2 tablespoons with 1 cup of water or milk on low flame, stirring continuously until smooth porridge is formed."]
  },
  "kannan-kaya-dried-chips": {
    benefits: [
      "Sun-dried authentic Kannan raw banana slices ready for easy traditional cooking.",
      "Excellent traditional ingredient for nutritious porridge and baby foods.",
      "Contains no added salt, oil, or preservatives.",
      "Long shelf life and retains all natural micronutrients of raw Kannan bananas."
    ],
    highlights: ["Sun-dried raw banana", "Zero additives", "Great for homemade baby food"],
    usage: ["Powder in a dry grinder for fresh banana porridge, or use in traditional recipes."]
  },
  "homemade-banana-powder": {
    benefits: [
      "Wholesome baby porridge mix made from mature, sun-dried Kerala Nendran bananas.",
      "Gentle on tiny tummies while fueling active growth with natural complex carbs.",
      "Rich in dietary fiber and essential vitamins that support digestion.",
      "Traditional home-style preparation made with utmost hygiene."
    ],
    highlights: ["Nutritious Nendran banana", "Easy to digest", "Zero chemicals or sugar"],
    usage: ["Boil with milk or water for 5-7 minutes into a comforting, nutrient-dense porridge."]
  },
  "banana-dried-chips": {
    benefits: [
      "Crispy, golden Kerala banana chips fried to perfection in authentic pure coconut oil.",
      "Made from handpicked mature Kerala Nendran bananas.",
      "Mildly salted, crunch-packed traditional snack free from artificial food colorings.",
      "Authentic taste of God's Own Country in every bite."
    ],
    highlights: ["Fried in pure coconut oil", "Authentic Kerala crunch", "No artificial colors"],
    usage: ["Enjoy straight from the pack with hot tea, coffee, or as a crunchy side with Kerala meals."]
  },
  "ragi-powder": {
    benefits: [
      "High-calcium superfood grain that supports strong bones and teeth.",
      "Rich in iron and fiber, helping prevent anemia and supporting smooth digestion.",
      "Ideal wholesome porridge for growing children, diabetics, and fitness enthusiasts.",
      "Naturally gluten-free whole grain flour."
    ],
    highlights: ["High calcium & iron", "Naturally gluten-free", "Healthy meal for all ages"],
    usage: ["Cook with water or buttermilk with a pinch of salt, or prepare sweet ragi malt with milk and jaggery."]
  },
  "homemade-sambar-powder": {
    benefits: [
      "Authentic Kerala village recipe made by stone-grinding roasted whole spices.",
      "Imparts unmatched aroma, deep color, and rich traditional flavor to sambar.",
      "Free from preservatives, fillers, artificial flavor enhancers, or MSG.",
      "Handcrafted in small batches to preserve volatile spice oils and freshness."
    ],
    highlights: ["Roasted whole spices", "No preservatives or MSG", "Aromatic Kerala flavor"],
    usage: ["Add 1 to 2 tablespoons while cooking dal and vegetables to create rich, authentic Kerala sambar."]
  },
  "banana-figs": {
    benefits: [
      "Naturally sun-ripened, dehydrated Kadali bananas bursting with caramel-like sweetness.",
      "A healthy, fiber-loaded alternative to refined candies and processed sweets.",
      "Rich in instant energy, potassium, and natural digestive enzymes.",
      "Zero added sugar, zero sulfur, and zero preservatives."
    ],
    highlights: ["Sun-ripened Kadali bananas", "No added sugar", "Natural energy booster"],
    usage: ["Enjoy as a wholesome anytime snack, or dice into morning cereal, oatmeal, and trail mixes."]
  },
  "homemade-prawns-pickle": {
    benefits: [
      "Prepared with fresh succulent coastal prawns marinated in fiery Kerala spices.",
      "Cooked in pure sesame oil with fresh curry leaves, garlic, and tangy vinegar.",
      "Rich in protein and bursting with authentic malabar-style spicy punch.",
      "Made traditionally in small batches for homestyle preservation and peak flavor."
    ],
    highlights: ["Fresh coastal prawns", "Sesame oil & Kerala spices", "Authentic homestyle recipe"],
    usage: ["Pair a spoonful with steaming rice, kanji, parotta, or biryani for an explosion of coastal flavor."]
  },
  "homemade-pure-cow-ghee": {
    benefits: [
      "Crafted through traditional bilona churning of pure cow milk curd and slow heating.",
      "Rich granular texture with an irresistible traditional aroma.",
      "Loaded with butyric acid, fat-soluble vitamins A, D, E, and K for gut and heart health.",
      "Promotes glowing skin, digestive fire (Agni), and immune resilience."
    ],
    highlights: ["Traditional granular bilona ghee", "Rich aroma & taste", "Supports digestion & immunity"],
    usage: ["Drizzle a spoonful over warm rice, dosas, rotis, or use as a wholesome cooking and baking fat."]
  },
  "homemade-pork-lard": {
    benefits: [
      "Traditional rendered pure pork fat with a high smoke point perfect for cooking.",
      "Provides unmatched crispiness to roasted meats, pastries, and stir-fries.",
      "100% natural and unhydrogenated—free from industrial trans fats and chemical bleaches.",
      "Rich in monounsaturated fats (oleic acid) for wholesome traditional cooking."
    ],
    highlights: ["High smoke point", "Unhydrogenated & pure", "Superior texture for cooking"],
    usage: ["Ideal for searing, roasting, pan-frying, and baking flaky savory pie crusts and breads."]
  },

  // Handloom
  "kerala-handloom-sarees": {
    benefits: [
      "Woven by master Kerala artisans on traditional wooden shuttle looms.",
      "Breathable, lightweight 100% pure cotton fabric ideal for tropical climates.",
      "Accented with classic Kasavu borders for timeless elegance on auspicious occasions.",
      "Supports traditional handloom weaving communities and sustainable heritage fashion."
    ],
    highlights: ["100% handwoven cotton", "Authentic Kasavu border", "Lightweight & breathable"],
    usage: ["Drape with matching traditional blouse for festivals, weddings, temples, and cultural ceremonies."]
  },
  "kerala-handloom-set-mundu": {
    benefits: [
      "The quintessential traditional two-piece attire (Mundum Neriyathum) of Kerala women.",
      "Crafted from premium unbleached and bleached handwoven cotton with rich zari borders.",
      "Softens with every wash, offering unmatched comfort in hot and humid weather.",
      "Preserves ancient handloom craftsmanship passed down through generations."
    ],
    highlights: ["Authentic two-piece Mundum Neriyathum", "Pure handloom cotton", "Heritage Kasavu finish"],
    usage: ["Wear the lower mundu around the waist and drape the neriyathu gracefully over the shoulder."]
  },
  "kerala-handloom-dhotis": {
    benefits: [
      "Classic Kerala men's handloom dhoti (Mundu) featuring premium cotton weave.",
      "Distinctive golden or colored Kasavu border that looks regal and traditional.",
      "Supreme all-day breathability and comfort for weddings, festivals, and daily rituals.",
      "Durable natural weave that stands the test of time."
    ],
    highlights: ["Pure handloom cotton", "Regal Kasavu border", "Superior breathability & comfort"],
    usage: ["Wrap around the waist and pleat at the center according to traditional Kerala style."]
  }
};

const groupNames: Record<ProductGroup, string> = {
  wellness: "Herbal, Beauty & Wellness",
  food: "Traditional Kerala Food",
  handloom: "Traditional Handloom",
};

export function generateStaticParams() {
  return collections.flatMap((collection) =>
    collection.products.map((product) => ({
      slug: product.slug,
    }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  let name = "";
  let description = "";

  try {
    const apiProduct = await api<any>(`/products/${slug}`);
    if (apiProduct) {
      name = apiProduct.name;
      description = apiProduct.description || "";
    }
  } catch {
    const found = findProductBySlug(slug);
    if (found) {
      name = found.product.name;
      description = found.product.description || "";
    }
  }

  if (!name) {
    return { title: "Product Not Found" };
  }

  const seo = seoProducts[slug];

  return {
    title: seo?.heading ?? name,
    description: description || `Explore ${name} at UPPILIEES.`,
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;

  let product: Product | null = null;
  let collection: Collection | null = null;

  try {
    const apiProduct = await api<any>(`/products/${slug}`);
    if (apiProduct) {
      const catSlug = apiProduct.category_slug || "products";
      product = {
        id: apiProduct.id,
        name: apiProduct.name,
        slug: apiProduct.slug,
        category: apiProduct.category_name || apiProduct.category || "General",
        price: Number(apiProduct.price),
        mrp: Number(apiProduct.mrp),
        description: apiProduct.description || undefined,
        collectionSlug: catSlug,
      };
      (product as any).image = apiProduct.image;
      collection =
        collections.find((c) => c.slug === catSlug) || {
          slug: catSlug,
          title: apiProduct.category_name || "Products",
          subtitle: "",
          products: [product],
          priceRanges: [],
        };
    }
  } catch {
    // fall back to static data
  }

  if (!product || !collection) {
    const found = findProductBySlug(slug);
    if (!found) notFound();
    collection = found.collection;
    product = found.product;
  }

  const discount = getDiscount(product);
  const seo = seoProducts[slug];

  const group: ProductGroup =
    seo?.group ??
    (collection.slug.includes("handloom")
      ? "handloom"
      : collection.slug.includes("food")
        ? "food"
        : "wellness");

  const info = productInformation[slug] ?? {};

  // Related products
  let others: Product[] = [];
  try {
    const relatedRes = await api<{ products: any[] }>(
      `/products?category=${encodeURIComponent(collection.slug)}&limit=10`
    );
    if (relatedRes?.products) {
      others = relatedRes.products
        .filter((item) => String(item.id) !== String(product!.id))
        .map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          category: p.category_name || p.category || "General",
          price: Number(p.price),
          mrp: Number(p.mrp),
          description: p.description || undefined,
          collectionSlug: p.category_slug || collection!.slug,
          image: p.image,
        }));
    }
  } catch {
    others = collection.products.filter((item) => item.id !== product!.id);
  }

  const related = others.slice(0, 8);

  const benefitsList = info.benefits?.length
    ? info.benefits
    : info.highlights?.length
      ? info.highlights
      : [
          `Authentic and pure traditional quality from UPPILIEES.`,
          `Carefully crafted following traditional Kerala methods.`,
          `No harmful chemicals or artificial preservatives.`
        ];

  const tabs: ProductTab[] = [
    {
      id: "benefits",
      label: "Benefits",
      paragraphs: benefitsList,
    },
    {
      id: "how",
      label: "How to Use",
      paragraphs: info.usage?.length
        ? info.usage
        : ["Please refer to the product packaging for directions of use."],
    },
    group === "handloom"
      ? {
          id: "care",
          label: "Care",
          paragraphs: info.careInstructions?.length
            ? info.careInstructions
            : ["Please refer to the fabric and product care instructions."],
        }
      : {
          id: "ingredients",
          label: "Ingredients",
          paragraphs: info.ingredients?.length
            ? [info.ingredients.join(", ")]
            : [
                "Please refer to the product packaging for verified ingredients and composition.",
              ],
        },
    {
      id: "returns",
      label: "Return Policy",
      paragraphs: [
        "We accept returns and replacements within 7 days of delivery for damaged or defective items. Please contact our support team with order details."
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 pb-20 sm:pb-8">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mb-8">
          <Link href="/" className="hover:text-[#07552F]">
            Home
          </Link>
          <span>/</span>
          <Link href={`/${collection.slug}`} className="hover:text-[#07552F]">
            {groupNames[group]}
          </Link>
          <span>/</span>
          <span className="text-[#063D27] font-medium">{product.name}</span>
        </nav>

        {/* Main Product */}
        <section className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Image */}
          <div className="relative h-fit">
            <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
              <ProductImage product={product} />

              {discount > 0 && (
                <span className="absolute top-4 left-4 bg-[#C7E900] text-[#063D27] font-bold text-sm px-3 py-2 rounded">
                  {discount}% OFF
                </span>
              )}

              <div className="absolute top-4 right-4 z-10">
                <WishlistButton
                  item={{
                    id: product.id,
                    name: product.name,
                    description: product.description,
                    price: product.price,
                    originalPrice:
                      product.mrp > product.price ? product.mrp : undefined,
                    image:
                      (product as any).image || `/products/${product.slug}.jpg`,
                    alt: product.name,
                    href: productHref(collection, product),
                  }}
                  size={24}
                />
              </div>
            </div>
          </div>

          {/* Product Information */}
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-[#4D9A18]">
              {groupNames[group]}
            </p>

            <h1 className="text-3xl sm:text-4xl font-bold text-[#063D27] mt-3 leading-tight">
              {seo?.heading ?? product.name}
            </h1>

            {(info.overview || product.description) && (
              <p className="text-gray-600 leading-relaxed mt-5">
                {info.overview || product.description}
              </p>
            )}

            {/* Price */}
            <div className="flex items-center flex-wrap gap-3 mt-6">
              <span className="text-3xl sm:text-4xl font-bold text-[#063D27]">
                {formatPrice(product.price)}
              </span>

              {product.mrp > product.price && (
                <span className="text-lg text-gray-400 line-through">
                  {formatPrice(product.mrp)}
                </span>
              )}

              {discount > 0 && (
                <span className="text-sm font-bold text-green-800 bg-green-100 px-3 py-1 rounded-full">
                  {discount}% OFF
                </span>
              )}
            </div>

            {discount > 0 && (
              <p className="text-sm font-semibold text-[#4D9A18] mt-2">
                You save {formatPrice(product.mrp - product.price)}
              </p>
            )}

            <p className="text-sm text-gray-500 mt-2">
              Inclusive of applicable taxes
            </p>

            {/* Key Benefits Bullet Section */}
            {benefitsList.length > 0 && (
              <div className="mt-6 p-4 rounded-xl bg-[#F4F8F1] border border-[#E6EFE3]">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#063D27] mb-2.5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#4D9A18]" />
                  Key Benefits
                </h3>
                <ul className="space-y-2">
                  {benefitsList.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-[#183629]">
                      <svg
                        className="w-4 h-4 text-[#4D9A18] shrink-0 mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="mt-8">
              <ProductActions
                product={product}
                href={productHref(collection, product)}
                showBuyNow={true}
              />
            </div>

            {/* Tabs */}
            <ProductTabs tabs={tabs} />
          </div>
        </section>

        {/* Related Products */}
        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#063D27] mb-6">
              You May Also Like
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {related.map((item) => (
                <ProductCard
                  key={item.id}
                  product={item}
                  href={productHref(collection, item)}
                  showBuyNow={false}
                />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
