const path = require("path");
const mysql = require("mysql2/promise");
const dotenv = require("dotenv");

// Load environment variables from .env.local and .env (current folder and sibling folders)
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

function getTargetDatabase() {
  const raw = (process.env.TIDB_DATABASE || "uppiliees").trim();
  if (!raw || raw.toLowerCase() === "sys") {
    return "uppiliees";
  }
  return raw;
}

const CATEGORIES = [
  {
    name: "Herbal & Beauty",
    slug: "herbal-beauty",
    subtitle: "Pure Nature. Pure Goodness.",
  },
  {
    name: "Traditional Food",
    slug: "traditional-foods",
    subtitle: "Homemade and traditional, straight from Kerala kitchens",
  },
  {
    name: "Handloom",
    slug: "handloom",
    subtitle: "Authentic Kerala handloom, woven with care",
  },
];

// All 31 products collected from the 3 listing pages, detail page, and shared data files
const PRODUCTS = [
  // ==================== 1. HERBAL & BEAUTY (15 Products) ====================
  {
    slug: "changalam-paranda-pain-relief-oil",
    name: "Changalam Paranda Herbal Pain Relief Oil",
    categorySlug: "herbal-beauty",
    subcategory: "Pain Relief",
    display_order: 1,
    price: 249,
    mrp: 320,
    stock: 25,
    in_stock: true,
    is_active: true,
    featured: false,
    tags: "100% Herbal & Ayurvedic, Fast-acting relief, Deep penetrating oil",
    description:
      "Traditional Kerala herbal pain relief oil infused with Changalam Paranda (Cissus quadrangularis) for joint, muscle, knee, and back pain relief.",
    benefits: [
      "Rapid natural relief from joint, muscle, knee, and back pain.",
      "Traditional Kerala herbal formula infused with Changalam Paranda (Cissus quadrangularis).",
      "Improves blood circulation and relieves chronic stiffness and swelling.",
      "100% natural herbal ingredients with no harsh chemicals or artificial fragrances.",
    ].join("\n"),
    how_to_use:
      "Take a small amount, gently massage into the affected area for 5-10 minutes, and leave it on or apply mild warmth.",
    ingredients:
      "Changalam Paranda (Cissus quadrangularis), pure Kerala coconut/sesame oil base, and traditional Ayurvedic pain-relieving herbs.",
    return_policy:
      "We accept returns and replacements within 7 days of delivery for damaged or defective items. Please contact our support team with order details.",
    sizes: [],
  },
  {
    slug: "babyglow-baby-massage-oil",
    name: "BabyGlow Natural Baby Massage Oil",
    categorySlug: "herbal-beauty",
    subcategory: "Baby Care",
    display_order: 2,
    price: 199,
    mrp: 250,
    stock: 25,
    in_stock: true,
    is_active: true,
    featured: false,
    tags: "Safe for newborns & toddlers, Deeply nourishing, 100% pure & gentle",
    description:
      "Specially formulated with gentle, safe herbs to nourish delicate baby skin and strengthen bones and muscles through daily massage.",
    benefits: [
      "Specially formulated with gentle, safe herbs to nourish delicate baby skin.",
      "Strengthens baby's bones and muscles through soothing daily massage.",
      "Prevents skin dryness, rashes, and maintains soft, supple baby texture.",
      "Toxin-free, chemical-free, and dermatologically mild formulation.",
    ].join("\n"),
    how_to_use:
      "Warm a few drops between your palms and gently massage over the baby's body prior to bath time.",
    ingredients:
      "Pure virgin coconut oil infused with gentle baby-safe Kerala botanical herbs.",
    return_policy:
      "We accept returns and replacements within 7 days of delivery for damaged or defective items. Please contact our support team with order details.",
    sizes: [],
  },
  {
    slug: "pulari-herbal-hair-growth-oil",
    name: "PULARI Herbal Hair Growth Oil",
    categorySlug: "herbal-beauty",
    subcategory: "Hair Care",
    display_order: 3,
    price: 349,
    mrp: 450,
    stock: 25,
    in_stock: true,
    is_active: true,
    featured: false,
    tags: "Traditional Kerala formula, Reduces hair fall, Natural dandruff control",
    description:
      "Traditional Kerala herbal hair oil that stimulates active hair follicles, controls dandruff, and reduces hair fall naturally.",
    benefits: [
      "Stimulates active hair follicles and encourages healthy hair growth.",
      "Helps significantly reduce hair fall, breakage, and split ends.",
      "Cools the scalp, fights dandruff, and prevents premature graying.",
      "Nourishes hair strands from root to tip for noticeable shine and volume.",
    ].join("\n"),
    how_to_use:
      "Apply generously to the scalp and hair roots. Massage gently with fingertips and leave for at least 30 minutes before washing.",
    ingredients:
      "Pure Kerala coconut oil, Bhringraj, Hibiscus, Amla, Neelini, Brahmi, and traditional hair-nourishing botanicals.",
    return_policy:
      "We accept returns and replacements within 7 days of delivery for damaged or defective items. Please contact our support team with order details.",
    sizes: [],
  },
  {
    slug: "glow-plus-fairness-powder",
    name: "Glow Plus Herbal Fairness Powder",
    categorySlug: "herbal-beauty",
    subcategory: "Skin Care",
    display_order: 4,
    price: 179,
    mrp: 230,
    stock: 25,
    in_stock: true,
    is_active: true,
    featured: false,
    tags: "Herbal skin rejuvenation, Evens out skin tone, Gentle herbal cleanser",
    description:
      "Botanical herbal face pack and scrub powder that gently exfoliates dead skin cells and brightens skin tone naturally.",
    benefits: [
      "Improves skin tone and natural glow with authentic botanical herbs.",
      "Gently exfoliates dead skin cells, clearing away impurities and unclogging pores.",
      "Helps reduce blemishes, pigmentation spots, and sun tanning.",
      "Natural and chemical-free alternative to harsh commercial face scrubs.",
    ].join("\n"),
    how_to_use:
      "Mix a spoonful with water, rose water, or milk to form a paste. Apply on face and neck, leave for 10-15 minutes, then rinse gently.",
    ingredients:
      "Wild turmeric (Kasthuri Manjal), sandalwood, vetiver, green gram, rose petals, and skin-brightening herbs.",
    return_policy:
      "We accept returns and replacements within 7 days of delivery for damaged or defective items. Please contact our support team with order details.",
    sizes: [],
  },
  {
    slug: "glow-plus-skin-brightening-cream",
    name: "Glow Plus Skin Brightening Moisturizing Cream",
    categorySlug: "herbal-beauty",
    subcategory: "Skin Care",
    display_order: 5,
    price: 279,
    mrp: 350,
    stock: 25,
    in_stock: true,
    is_active: true,
    featured: false,
    tags: "Radiant healthy glow, Non-greasy hydration, Antioxidant rich",
    description:
      "Deeply hydrating botanical cream that brightens complexion, replenishes the skin barrier, and minimizes uneven skin tone.",
    benefits: [
      "Deeply hydrates and replenishes the skin barrier for all-day moisture.",
      "Brightens complexion and minimizes uneven tone and hyperpigmentation.",
      "Rich in natural skin-loving vitamins and antioxidants.",
      "Non-greasy, fast-absorbing texture suitable for daily use.",
    ].join("\n"),
    how_to_use:
      "Dot evenly across cleansed face and neck every morning and night. Massage gently in upward circular motions.",
    ingredients:
      "Aloe vera, saffron extract, licorice, vitamin E, and natural botanical emollients.",
    return_policy:
      "We accept returns and replacements within 7 days of delivery for damaged or defective items. Please contact our support team with order details.",
    sizes: [],
  },
  {
    slug: "sankhu-puspam-face-wash",
    name: "Sankhu Puspam Herbal Face Wash",
    categorySlug: "herbal-beauty",
    subcategory: "Skin Care",
    display_order: 6,
    price: 159,
    mrp: 199,
    stock: 25,
    in_stock: true,
    is_active: true,
    featured: true,
    tags: "Butterfly pea herbal extract, Sulfate & Paraben free, Gentle on sensitive skin",
    description:
      "Refreshing herbal face wash infused with Shankhupushpam (Butterfly Pea) to calm, cleanse, and refresh stressed skin.",
    benefits: [
      "Infused with Shankhupushpam (Butterfly Pea) to calm and refresh stressed skin.",
      "Cleanses deep impurities and removes excess oil without stripping natural moisture.",
      "Antioxidant-rich botanical extracts protect skin from environmental pollution.",
      "Leaves skin feeling cool, revitalized, and crystal clear.",
    ].join("\n"),
    how_to_use:
      "Splash face with lukewarm water, lather a coin-sized amount in hands, gently massage face, and rinse thoroughly.",
    ingredients:
      "Shankhupushpam (Clitoria ternatea) flower extract, aloe vera gel, natural plant cleansers, and essential oils.",
    return_policy:
      "We accept returns and replacements within 7 days of delivery for damaged or defective items. Please contact our support team with order details.",
    sizes: [],
  },
  {
    slug: "glow-plus-lip-care-cream",
    name: "Glow Plus Lip Care Cream",
    categorySlug: "herbal-beauty",
    subcategory: "Skin Care",
    display_order: 7,
    price: 99,
    mrp: 130,
    stock: 25,
    in_stock: true,
    is_active: true,
    featured: false,
    tags: "Intense hydration, Heals cracked lips, Compact & travel friendly",
    description:
      "Nourishing herbal lip care cream that heals chapped, dry, and cracked lips while restoring natural softness.",
    benefits: [
      "Heals chapped, dry, and cracked lips with intense herbal moisturization.",
      "Restores natural lip softness, suppleness, and a healthy rosy tint.",
      "Shields lips against harsh weather and environmental dehydration.",
      "Made with wholesome natural waxes, oils, and herbal infusions.",
    ].join("\n"),
    how_to_use:
      "Smooth a small amount over lips as often as needed throughout the day and before bedtime.",
    ingredients:
      "Natural beeswax, virgin coconut oil, shea butter, beetroot & rose petal infusion, and vitamin E.",
    return_policy:
      "We accept returns and replacements within 7 days of delivery for damaged or defective items. Please contact our support team with order details.",
    sizes: [],
  },
  {
    slug: "baby-glow-urukku-velichenna",
    name: "Homemade Baby Glow Virgin Coconut Oil",
    categorySlug: "herbal-beauty",
    subcategory: "Baby Care",
    display_order: 8,
    price: 229,
    mrp: 280,
    stock: 25,
    in_stock: true,
    is_active: true,
    featured: false,
    tags: "Authentic hot-processed oil, Edible & baby-safe, Traditional Kerala recipe",
    description:
      "100% pure homemade Urukku Velichenna (hot-processed virgin coconut oil) made from fresh Kerala coconut milk for baby massage and skin nourishment.",
    benefits: [
      "100% pure homemade Urukku Velichenna (hot-processed virgin coconut oil).",
      "Traditional Kerala secret for baby massage, cradle cap treatment, and skin nourishment.",
      "Loaded with natural lauric acid and antioxidants for unmatched antimicrobial protection.",
      "Edible grade, pure, aromatic, and free from any preservatives or adulterants.",
    ].join("\n"),
    how_to_use:
      "Apply gently on baby's skin and scalp before bath. Can also be applied as a natural soothing balm.",
    ingredients:
      "100% pure first-extract Kerala coconut milk, traditionally slow-cooked (Urukku Velichenna).",
    return_policy:
      "We accept returns and replacements within 7 days of delivery for damaged or defective items. Please contact our support team with order details.",
    sizes: [],
  },
  {
    slug: "painoplus-pain-relief-balm",
    name: "PainoPlus Changalam Paranda Pain Relief Balm",
    categorySlug: "herbal-beauty",
    subcategory: "Pain Relief",
    display_order: 9,
    price: 149,
    mrp: 190,
    stock: 25,
    in_stock: true,
    is_active: true,
    featured: false,
    tags: "Fast-acting balm, Convenient travel size, Relieves headaches & body aches",
    description:
      "Quick on-the-spot soothing balm infused with Changalam Paranda and warming aromatic herbs for headaches, muscle sprains, and joint pain.",
    benefits: [
      "Quick on-the-spot soothing action for headaches, muscle sprains, and joint pain.",
      "Infused with Changalam Paranda and warming aromatic herbs for fast penetration.",
      "Convenient balm format that is non-sticky and mess-free.",
      "Provides pleasant warming sensation followed by long-lasting comfort.",
    ].join("\n"),
    how_to_use:
      "Rub gently on temples, neck, forehead, or affected joints and muscles. Avoid contact with eyes.",
    ingredients:
      "Changalam Paranda extract, wintergreen oil, eucalyptus oil, menthol, camphor, and natural beeswax base.",
    return_policy:
      "We accept returns and replacements within 7 days of delivery for damaged or defective items. Please contact our support team with order details.",
    sizes: [],
  },
  {
    slug: "stretch-ease-stretch-mark-cream",
    name: "Stretch Ease Stretch Mark Care Cream",
    categorySlug: "herbal-beauty",
    subcategory: "Skin Care",
    display_order: 10,
    price: 399,
    mrp: 520,
    stock: 25,
    in_stock: true,
    is_active: true,
    featured: false,
    tags: "Pregnancy & postpartum safe, Improves elasticity, Relieves dry itchy skin",
    description:
      "Herbal stretch mark care cream that boosts skin elasticity and collagen strength during and after pregnancy.",
    benefits: [
      "Boosts skin elasticity and collagen strength during and after pregnancy.",
      "Visibly softens the appearance of existing stretch marks and prevents new ones.",
      "Deeply hydrates itchy, stretching skin with rich herbal emollients.",
      "Safe, gentle, and nourishing for all skin types.",
    ].join("\n"),
    how_to_use:
      "Massage generously over abdomen, hips, thighs, and breasts twice daily in circular motions.",
    ingredients:
      "Cocoa butter, shea butter, virgin coconut oil, gotu kola (Centella asiatica), almond oil, and vitamin E.",
    return_policy:
      "We accept returns and replacements within 7 days of delivery for damaged or defective items. Please contact our support team with order details.",
    sizes: [],
  },
  {
    slug: "ojas-boost-herbal-powder",
    name: "Ojas Boost Herbal Wellness Powder",
    categorySlug: "herbal-beauty",
    subcategory: "Wellness Powders",
    display_order: 11,
    price: 299,
    mrp: 380,
    stock: 25,
    in_stock: true,
    is_active: true,
    featured: false,
    tags: "Vitality & stamina booster, Supports healthy immunity, 100% pure herbal blend",
    description:
      "Traditional Ayurvedic formulation designed to elevate core vitality, Ojas (inner energy), immunity, and physical endurance.",
    benefits: [
      "Traditional Ayurvedic formulation designed to elevate core vitality and Ojas (inner energy).",
      "Supports immune defense, stamina, and overall physical endurance.",
      "Helps counter fatigue, stress, and sluggish metabolism naturally.",
      "Prepared from time-tested adaptogenic and restorative botanicals.",
    ].join("\n"),
    how_to_use:
      "Mix 1 teaspoon with warm milk, warm water, or honey once or twice daily after meals.",
    ingredients:
      "Ashwagandha, Shatavari, Safed Musli, Gokshura, Amla, and rejuvenating Ayurvedic herbs.",
    return_policy:
      "We accept returns and replacements within 7 days of delivery for damaged or defective items. Please contact our support team with order details.",
    sizes: [],
  },
  {
    slug: "ashwagandha-powder",
    name: "Natural Ashwagandha Herbal Powder",
    categorySlug: "herbal-beauty",
    subcategory: "Wellness Powders",
    display_order: 12,
    price: 199,
    mrp: 260,
    stock: 25,
    in_stock: true,
    is_active: true,
    featured: true,
    tags: "Certified natural Ashwagandha, Stress & sleep support, Strength & vitality",
    description:
      "Premier Ayurvedic adaptogen root powder that reduces stress and anxiety, enhances strength, and promotes restful sleep.",
    benefits: [
      "Premier Ayurvedic adaptogen that reduces cortisol levels, stress, and anxiety.",
      "Enhances physical strength, athletic stamina, and muscle recovery.",
      "Promotes restful and deep natural sleep cycles.",
      "Supports cognitive clarity, focus, and memory retention.",
    ].join("\n"),
    how_to_use:
      "Mix 1/2 to 1 teaspoon in warm milk or water with a hint of honey before bedtime.",
    ingredients: "100% pure sun-dried Ashwagandha (Withania somnifera) root powder.",
    return_policy:
      "We accept returns and replacements within 7 days of delivery for damaged or defective items. Please contact our support team with order details.",
    sizes: [],
  },
  {
    slug: "naikuruna-powder",
    name: "Natural Naikuruna Herbal Powder",
    categorySlug: "herbal-beauty",
    subcategory: "Wellness Powders",
    display_order: 13,
    price: 179,
    mrp: 220,
    stock: 25,
    in_stock: true,
    is_active: true,
    featured: false,
    tags: "Mucuna pruriens extract, Supports nerve & mood health, Ayurvedic vitality tonic",
    description:
      "Pure Mucuna pruriens (Naikuruna) botanical seed/root powder rich in natural L-DOPA to support nervous system health and stamina.",
    benefits: [
      "Rich natural source of L-DOPA that supports nervous system health and dopamine balance.",
      "Enhances mood, mental energy, and overall physical stamina.",
      "Traditionally used in Ayurveda to enhance reproductive vitality and endurance.",
      "Pure, unadulterated botanical root powder processed under strict standards.",
    ].join("\n"),
    how_to_use:
      "Consume 1/2 teaspoon with warm milk or honey once daily, or as advised by a wellness expert.",
    ingredients: "100% pure purified Naikuruna (Mucuna pruriens) powder.",
    return_policy:
      "We accept returns and replacements within 7 days of delivery for damaged or defective items. Please contact our support team with order details.",
    sizes: [],
  },
  {
    slug: "kalonji-black-seed-oil",
    name: "Pure Kalonji Black Seed Oil for Hair Care",
    categorySlug: "herbal-beauty",
    subcategory: "Hair Care",
    display_order: 14,
    price: 269,
    mrp: 340,
    stock: 25,
    in_stock: true,
    is_active: true,
    featured: false,
    tags: "100% pure cold-pressed, Thymoquinone rich, Scalp & hair root strengthener",
    description:
      "Pure cold-pressed Nigella Sativa (Kalonji) black seed oil rich in thymoquinone and fatty acids to strengthen hair roots and soothe scalp.",
    benefits: [
      "Pure cold-pressed Nigella Sativa oil rich in thymoquinone and healthy fatty acids.",
      "Strengthens hair roots, helps control premature thinning, and nourishes the scalp.",
      "Soothes dry, flaky, irritated skin with powerful natural anti-inflammatory qualities.",
      "A versatile ancient wellness remedy for holistic hair, scalp, and skin vitality.",
    ].join("\n"),
    how_to_use:
      "Massage into hair and scalp, or apply a few drops onto skin areas needing targeted nourishment.",
    ingredients: "100% pure cold-pressed Kalonji (Nigella sativa) black seed oil.",
    return_policy:
      "We accept returns and replacements within 7 days of delivery for damaged or defective items. Please contact our support team with order details.",
    sizes: [],
  },
  {
    slug: "mozi-out-herbal-mosquito-repellent",
    name: "MOZI OUT Herbal Mosquito Repellent",
    categorySlug: "herbal-beauty",
    subcategory: "Home Care",
    display_order: 15,
    price: 129,
    mrp: 160,
    stock: 25,
    in_stock: true,
    is_active: true,
    featured: false,
    tags: "DEET-free & child safe, Plant-based formula, Pleasant herbal scent",
    description:
      "Natural mosquito and insect defense spray powered by plant-based essential oils, 100% DEET-free and safe for children and family.",
    benefits: [
      "Natural mosquito and insect defense powered by plant-based essential oils.",
      "100% DEET-free, non-toxic, and safe for family and children.",
      "Pleasant herbal aroma without pungent chemical odors.",
      "Long-lasting indoor and outdoor protection against mosquito bites.",
    ].join("\n"),
    how_to_use:
      "Spray evenly on exposed skin or clothing from a distance of 15 cm. Reapply every 3-4 hours as needed.",
    ingredients:
      "Citronella oil, lemongrass oil, eucalyptus oil, neem extract, and natural aqua base.",
    return_policy:
      "We accept returns and replacements within 7 days of delivery for damaged or defective items. Please contact our support team with order details.",
    sizes: [],
  },

  // ==================== 2. TRADITIONAL FOOD (13 Products) ====================
  {
    slug: "kannan-kaya-powder",
    name: "Traditional Kerala Kannan Kaya Powder",
    categorySlug: "traditional-foods",
    subcategory: "Powders",
    display_order: 1,
    price: 199,
    mrp: 240,
    stock: 25,
    in_stock: true,
    is_active: true,
    featured: false,
    tags: "Traditional baby food, Promotes healthy weight, Rich in fiber & potassium",
    description:
      "Prepared from authentic raw Kerala Kannan bananas, renowned for easy digestion and wholesome nourishment for babies and families.",
    benefits: [
      "Prepared from authentic raw Kerala Kannan bananas, renowned for easy baby digestion.",
      "Ideal first solid food for babies that promotes healthy weight gain and gut wellness.",
      "Rich in natural potassium, dietary fiber, and essential minerals.",
      "100% natural, preservative-free, sugar-free, and chemical-free.",
    ].join("\n"),
    how_to_use:
      "Cook 2 tablespoons with 1 cup of water or milk on low flame, stirring continuously until smooth porridge is formed.",
    ingredients: "100% sun-dried raw Kerala Kannan banana (Kannan Kaya).",
    return_policy:
      "We accept returns and replacements within 7 days of delivery for damaged or defective items. Please contact our support team with order details.",
    sizes: [],
  },
  {
    slug: "homemade-banana-powder",
    name: "Homemade Natural Banana Powder",
    categorySlug: "traditional-foods",
    subcategory: "Powders",
    display_order: 2,
    price: 189,
    mrp: 230,
    stock: 25,
    in_stock: true,
    is_active: true,
    featured: false,
    tags: "Nutritious Nendran banana, Easy to digest, Zero chemicals or sugar",
    description:
      "Wholesome baby and family porridge mix made from mature, sun-dried Kerala Nendran bananas with zero additives.",
    benefits: [
      "Wholesome baby porridge mix made from mature, sun-dried Kerala Nendran bananas.",
      "Gentle on tiny tummies while fueling active growth with natural complex carbs.",
      "Rich in dietary fiber and essential vitamins that support digestion.",
      "Traditional home-style preparation made with utmost hygiene.",
    ].join("\n"),
    how_to_use:
      "Boil with milk or water for 5-7 minutes into a comforting, nutrient-dense porridge.",
    ingredients: "100% pure sun-dried raw Kerala Nendran banana.",
    return_policy:
      "We accept returns and replacements within 7 days of delivery for damaged or defective items. Please contact our support team with order details.",
    sizes: [],
  },
  {
    slug: "ragi-powder",
    name: "Natural Ragi Finger Millet Powder",
    categorySlug: "traditional-foods",
    subcategory: "Powders",
    display_order: 3,
    price: 149,
    mrp: 180,
    stock: 25,
    in_stock: true,
    is_active: true,
    featured: false,
    tags: "High calcium & iron, Naturally gluten-free, Healthy meal for all ages",
    description:
      "High-calcium sprouted finger millet (Ragi) flour that supports strong bones, teeth, and smooth digestion for all ages.",
    benefits: [
      "High-calcium superfood grain that supports strong bones and teeth.",
      "Rich in iron and fiber, helping prevent anemia and supporting smooth digestion.",
      "Ideal wholesome porridge for growing children, diabetics, and fitness enthusiasts.",
      "Naturally gluten-free whole grain flour.",
    ].join("\n"),
    how_to_use:
      "Cook with water or buttermilk with a pinch of salt, or prepare sweet ragi malt with milk and jaggery.",
    ingredients: "100% natural cleaned, sprouted, and finely milled Ragi (Finger Millet).",
    return_policy:
      "We accept returns and replacements within 7 days of delivery for damaged or defective items. Please contact our support team with order details.",
    sizes: [],
  },
  {
    slug: "homemade-sambar-powder",
    name: "Homemade Kerala Style Sambar Powder",
    categorySlug: "traditional-foods",
    subcategory: "Powders",
    display_order: 4,
    price: 129,
    mrp: 160,
    stock: 25,
    in_stock: true,
    is_active: true,
    featured: false,
    tags: "Roasted whole spices, No preservatives or MSG, Aromatic Kerala flavor",
    description:
      "Authentic Kerala village recipe made by stone-grinding freshly roasted whole spices for rich aroma and traditional sambar flavor.",
    benefits: [
      "Authentic Kerala village recipe made by stone-grinding roasted whole spices.",
      "Imparts unmatched aroma, deep color, and rich traditional flavor to sambar.",
      "Free from preservatives, fillers, artificial flavor enhancers, or MSG.",
      "Handcrafted in small batches to preserve volatile spice oils and freshness.",
    ].join("\n"),
    how_to_use:
      "Add 1 to 2 tablespoons while cooking dal and vegetables to create rich, authentic Kerala sambar.",
    ingredients:
      "Coriander seeds, Kashmiri & Guntur red chilies, fenugreek, cumin, black pepper, turmeric, curry leaves, and compounded asafoetida (hing).",
    return_policy:
      "We accept returns and replacements within 7 days of delivery for damaged or defective items. Please contact our support team with order details.",
    sizes: [],
  },
  {
    slug: "kannan-kaya-dried-chips",
    name: "Traditional Kannan Kaya Dried Banana Chips",
    categorySlug: "traditional-foods",
    subcategory: "Chips & Sweets",
    display_order: 5,
    price: 179,
    mrp: 210,
    stock: 25,
    in_stock: true,
    is_active: true,
    featured: false,
    tags: "Sun-dried raw banana, Zero additives, Great for homemade baby food",
    description:
      "Sun-dried authentic Kannan raw banana slices with zero additives, ready for grinding into fresh baby food porridge or traditional cooking.",
    benefits: [
      "Sun-dried authentic Kannan raw banana slices ready for easy traditional cooking.",
      "Excellent traditional ingredient for nutritious porridge and baby foods.",
      "Contains no added salt, oil, or preservatives.",
      "Long shelf life and retains all natural micronutrients of raw Kannan bananas.",
    ].join("\n"),
    how_to_use:
      "Powder in a dry grinder for fresh banana porridge, or use in traditional recipes.",
    ingredients: "100% raw Kerala Kannan bananas, Peeled, sliced, and naturally sun-dried.",
    return_policy:
      "We accept returns and replacements within 7 days of delivery for damaged or defective items. Please contact our support team with order details.",
    sizes: [],
  },
  {
    slug: "banana-dried-chips",
    name: "Traditional Kerala Dried Banana Chips",
    categorySlug: "traditional-foods",
    subcategory: "Chips & Sweets",
    display_order: 6,
    price: 159,
    mrp: 199,
    stock: 25,
    in_stock: true,
    is_active: true,
    featured: true,
    tags: "Fried in pure coconut oil, Authentic Kerala crunch, No artificial colors",
    description:
      "Crispy, golden Kerala banana chips made from handpicked Nendran bananas and fried to perfection in pure coconut oil.",
    benefits: [
      "Crispy, golden Kerala banana chips fried to perfection in authentic pure coconut oil.",
      "Made from handpicked mature Kerala Nendran bananas.",
      "Mildly salted, crunch-packed traditional snack free from artificial food colorings.",
      "Authentic taste of God's Own Country in every bite.",
    ].join("\n"),
    how_to_use:
      "Enjoy straight from the pack with hot tea, coffee, or as a crunchy side with Kerala meals.",
    ingredients:
      "Mature Kerala Nendran bananas, pure Kerala coconut oil, natural turmeric, and rock salt.",
    return_policy:
      "We accept returns and replacements within 7 days of delivery for damaged or defective items. Please contact our support team with order details.",
    sizes: [],
  },
  {
    slug: "banana-figs",
    name: "Traditional Kerala Banana Figs",
    categorySlug: "traditional-foods",
    subcategory: "Chips & Sweets",
    display_order: 7,
    price: 249,
    mrp: 299,
    stock: 25,
    in_stock: true,
    is_active: true,
    featured: false,
    tags: "Sun-ripened Kadali bananas, No added sugar, Natural energy booster",
    description:
      "Naturally sun-ripened, dehydrated Kerala bananas bursting with caramel-like sweetness, dietary fiber, and instant natural energy.",
    benefits: [
      "Naturally sun-ripened, dehydrated Kadali bananas bursting with caramel-like sweetness.",
      "A healthy, fiber-loaded alternative to refined candies and processed sweets.",
      "Rich in instant energy, potassium, and natural digestive enzymes.",
      "Zero added sugar, zero sulfur, and zero preservatives.",
    ].join("\n"),
    how_to_use:
      "Enjoy as a wholesome anytime snack, or dice into morning cereal, oatmeal, and trail mixes.",
    ingredients: "100% ripe Kerala bananas, naturally dehydrated without added sugar.",
    return_policy:
      "We accept returns and replacements within 7 days of delivery for damaged or defective items. Please contact our support team with order details.",
    sizes: [],
  },
  {
    slug: "homemade-prawns-pickle",
    name: "Homemade Kerala Style Prawns Pickle",
    categorySlug: "traditional-foods",
    subcategory: "Pickle, Ghee & Lard",
    display_order: 8,
    price: 299,
    mrp: 380,
    stock: 25,
    in_stock: true,
    is_active: true,
    featured: false,
    tags: "Fresh coastal prawns, Sesame oil & Kerala spices, Authentic homestyle recipe",
    description:
      "Prepared with fresh succulent coastal prawns marinated in fiery Kerala spices and slow-cooked in pure sesame oil with curry leaves.",
    benefits: [
      "Prepared with fresh succulent coastal prawns marinated in fiery Kerala spices.",
      "Cooked in pure sesame oil with fresh curry leaves, garlic, and tangy vinegar.",
      "Rich in protein and bursting with authentic malabar-style spicy punch.",
      "Made traditionally in small batches for homestyle preservation and peak flavor.",
    ].join("\n"),
    how_to_use:
      "Pair a spoonful with steaming rice, kanji, parotta, or biryani for an explosion of coastal flavor.",
    ingredients:
      "Cleaned coastal prawns, gingelly (sesame) oil, garlic, ginger, green chilies, curry leaves, red chili powder, turmeric, fenugreek, mustard seeds, natural vinegar, and salt.",
    return_policy:
      "We accept returns and replacements within 7 days of delivery for damaged or defective items. Please contact our support team with order details.",
    sizes: [],
  },
  {
    slug: "homemade-pure-cow-ghee",
    name: "Homemade Pure Cow Ghee",
    categorySlug: "traditional-foods",
    subcategory: "Pickle, Ghee & Lard",
    display_order: 9,
    price: 699,
    mrp: 850,
    stock: 25,
    in_stock: true,
    is_active: true,
    featured: false,
    tags: "Traditional granular bilona ghee, Rich aroma & taste, Supports digestion & immunity",
    description:
      "Crafted through traditional bilona churning of pure cow milk curd and slow heating for a rich granular texture and irresistible aroma.",
    benefits: [
      "Crafted through traditional bilona churning of pure cow milk curd and slow heating.",
      "Rich granular texture with an irresistible traditional aroma.",
      "Loaded with butyric acid, fat-soluble vitamins A, D, E, and K for gut and heart health.",
      "Promotes glowing skin, digestive fire (Agni), and immune resilience.",
    ].join("\n"),
    how_to_use:
      "Drizzle a spoonful over warm rice, dosas, rotis, or use as a wholesome cooking and baking fat.",
    ingredients: "100% pure clarified butter churned from cultured cow milk curd.",
    return_policy:
      "We accept returns and replacements within 7 days of delivery for damaged or defective items. Please contact our support team with order details.",
    sizes: [],
  },
  {
    slug: "homemade-pork-lard",
    name: "Homemade Pure Pork Lard",
    categorySlug: "traditional-foods",
    subcategory: "Pickle, Ghee & Lard",
    display_order: 10,
    price: 349,
    mrp: 420,
    stock: 25,
    in_stock: true,
    is_active: true,
    featured: false,
    tags: "High smoke point, Unhydrogenated & pure, Superior texture for cooking",
    description:
      "Traditional rendered pure pork fat with a high smoke point, 100% natural and unhydrogenated for crispy roasts, stir-fries, and baking.",
    benefits: [
      "Traditional rendered pure pork fat with a high smoke point perfect for cooking.",
      "Provides unmatched crispiness to roasted meats, pastries, and stir-fries.",
      "100% natural and unhydrogenated—free from industrial trans fats and chemical bleaches.",
      "Rich in monounsaturated fats (oleic acid) for wholesome traditional cooking.",
    ].join("\n"),
    how_to_use:
      "Ideal for searing, roasting, pan-frying, and baking flaky savory pie crusts and breads.",
    ingredients: "100% pure slow-rendered homestead pork fat.",
    return_policy:
      "We accept returns and replacements within 7 days of delivery for damaged or defective items. Please contact our support team with order details.",
    sizes: [],
  },
  {
    slug: "dried-vegetables",
    name: "Homemade Sun-Dried Vegetables",
    categorySlug: "traditional-foods",
    subcategory: "Dried Foods",
    display_order: 11,
    price: 219,
    mrp: 270,
    stock: 25,
    in_stock: true,
    is_active: true,
    featured: false,
    tags: "Homestead sun-dried, Zero chemical preservatives, Traditional Kerala Kondattam",
    description:
      "Traditionally sun-dried homestead Kerala vegetables preserved naturally without chemicals for curries and crispy kondattam fry dishes.",
    benefits: [
      "Sun-dried naturally in clean Kerala homestead kitchens.",
      "Preserves seasonal vegetables with zero chemical preservatives.",
      "Retains natural dietary fiber and minerals with a long shelf life.",
      "Ready to fry or cook in traditional Kerala curries and kondattam recipes.",
    ].join("\n"),
    how_to_use:
      "Soak briefly in warm water for curries, or fry directly in coconut oil for crispy kondattam.",
    ingredients: "Farm-fresh Kerala seasonal vegetables, natural rock salt, and sun-dried care.",
    return_policy:
      "We accept returns and replacements within 7 days of delivery for damaged or defective items. Please contact our support team with order details.",
    sizes: [],
  },
  {
    slug: "dried-meat",
    name: "Traditional Kerala Dried Meat",
    categorySlug: "traditional-foods",
    subcategory: "Dried Foods",
    display_order: 12,
    price: 549,
    mrp: 650,
    stock: 25,
    in_stock: true,
    is_active: true,
    featured: false,
    tags: "Authentic Kerala Idi Erachi, Marinated in Kerala spices, High protein delicacy",
    description:
      "Authentic Kerala style spiced and sun-dried meat (Idi Erachi), rich in protein and smoky traditional homestead flavor.",
    benefits: [
      "Prepared with lean meat marinated in traditional Kerala spices.",
      "Naturally sun-dried for rich flavor and long shelf life.",
      "High-protein delicacy ideal for authentic Kerala idi erachi roast.",
      "100% free from artificial nitrates, curing chemicals, or preservatives.",
    ].join("\n"),
    how_to_use:
      "Soak in warm water, crush lightly, and roast with shallots, curry leaves, and chili flakes in coconut oil.",
    ingredients:
      "Lean tender meat, turmeric, black pepper, coriander, garlic, ginger, and rock salt.",
    return_policy:
      "We accept returns and replacements within 7 days of delivery for damaged or defective items. Please contact our support team with order details.",
    sizes: [],
  },
  {
    slug: "dried-fish",
    name: "Traditional Kerala Dried Fish",
    categorySlug: "traditional-foods",
    subcategory: "Dried Foods",
    display_order: 13,
    price: 399,
    mrp: 480,
    stock: 25,
    in_stock: true,
    is_active: true,
    featured: false,
    tags: "Coastal Kerala Unakka Meen, Hygienically sun-dried, No chemical curing",
    description:
      "Hygienically sun-dried coastal Kerala fish (Unakka Meen), lightly salted and bursting with authentic coastal flavor.",
    benefits: [
      "Sourced from fresh coastal catch and sun-dried hygienically.",
      "No chemical preservatives, formalin, or artificial curing agents.",
      "Rich in natural marine protein, calcium, and omega fatty acids.",
      "Classic accompaniment for Kerala kanji, matta rice, and tapioca meals.",
    ].join("\n"),
    how_to_use:
      "Rinse and soak in water for 10 minutes to remove excess salt, then shallow fry in coconut oil with chili and curry leaves.",
    ingredients: "Fresh coastal Kerala fish and natural sea salt, hygienically sun-dried.",
    return_policy:
      "We accept returns and replacements within 7 days of delivery for damaged or defective items. Please contact our support team with order details.",
    sizes: [],
  },

  // ==================== 3. HANDLOOM (3 Products) ====================
  {
    slug: "kerala-handloom-sarees",
    name: "Traditional Kerala Handloom Sarees",
    categorySlug: "handloom",
    subcategory: "Sarees",
    display_order: 1,
    price: 2499,
    mrp: 3199,
    stock: 25,
    in_stock: true,
    is_active: true,
    featured: false,
    tags: "100% handwoven cotton, Authentic Kasavu border, Lightweight & breathable",
    description:
      "Authentic 100% pure cotton Kerala Kasavu handloom saree woven by master artisans on traditional wooden shuttle looms.",
    benefits: [
      "Woven by master Kerala artisans on traditional wooden shuttle looms.",
      "Breathable, lightweight 100% pure cotton fabric ideal for tropical climates.",
      "Accented with classic Kasavu borders for timeless elegance on auspicious occasions.",
      "Supports traditional handloom weaving communities and sustainable heritage fashion.",
    ].join("\n"),
    how_to_use:
      "Drape with matching traditional blouse for festivals, weddings, temples, and cultural ceremonies.",
    ingredients:
      "100% pure handwoven Kerala cotton with traditional Kasavu zari border. Hand wash gently in cold water and dry in shade.",
    return_policy:
      "We accept returns and replacements within 7 days of delivery for damaged or defective items. Please contact our support team with order details.",
    sizes: [{ size: "Standard with Blouse (6.25m)", price: 2499, mrp: 3199, stock: 25 }],
  },
  {
    slug: "kerala-handloom-set-mundu",
    name: "Traditional Kerala Handloom Set Mundu",
    categorySlug: "handloom",
    subcategory: "Set Mundu",
    display_order: 2,
    price: 1899,
    mrp: 2399,
    stock: 25,
    in_stock: true,
    is_active: true,
    featured: true,
    tags: "Authentic two-piece Mundum Neriyathum, Pure handloom cotton, Heritage Kasavu finish",
    description:
      "The quintessential traditional two-piece attire (Mundum Neriyathum) of Kerala women, handwoven from pure cotton with rich zari borders.",
    benefits: [
      "The quintessential traditional two-piece attire (Mundum Neriyathum) of Kerala women.",
      "Crafted from premium unbleached and bleached handwoven cotton with rich zari borders.",
      "Softens with every wash, offering unmatched comfort in hot and humid weather.",
      "Preserves ancient handloom craftsmanship passed down through generations.",
    ].join("\n"),
    how_to_use:
      "Wear the lower mundu around the waist and drape the neriyathu gracefully over the shoulder.",
    ingredients:
      "100% pure handloom cotton with Kasavu zari border. Hand wash gently in cold water with mild detergent and dry in shade.",
    return_policy:
      "We accept returns and replacements within 7 days of delivery for damaged or defective items. Please contact our support team with order details.",
    sizes: [
      { size: "Standard (2.0m x 2.8m)", price: 1899, mrp: 2399, stock: 15 },
      { size: "Double Kasavu", price: 2099, mrp: 2599, stock: 10 },
    ],
  },
  {
    slug: "kerala-handloom-dhotis",
    name: "Traditional Kerala Handloom Dhotis",
    categorySlug: "handloom",
    subcategory: "Dhotis",
    display_order: 3,
    price: 999,
    mrp: 1299,
    stock: 25,
    in_stock: true,
    is_active: true,
    featured: false,
    tags: "Pure handloom cotton, Regal Kasavu border, Superior breathability & comfort",
    description:
      "Classic Kerala men's handloom cotton dhoti (Mundu) featuring a regal Kasavu border for weddings, festivals, and traditional rituals.",
    benefits: [
      "Classic Kerala men's handloom dhoti (Mundu) featuring premium cotton weave.",
      "Distinctive golden or colored Kasavu border that looks regal and traditional.",
      "Supreme all-day breathability and comfort for weddings, festivals, and daily rituals.",
      "Durable natural weave that stands the test of time.",
    ].join("\n"),
    how_to_use:
      "Wrap around the waist and pleat at the center according to traditional Kerala style.",
    ingredients:
      "100% pure handloom cotton weave with Kasavu border. Hand wash separately in cold water and dry in shade.",
    return_policy:
      "We accept returns and replacements within 7 days of delivery for damaged or defective items. Please contact our support team with order details.",
    sizes: [
      { size: "Double (4.0m)", price: 999, mrp: 1299, stock: 15 },
      { size: "Single (2.0m)", price: 699, mrp: 899, stock: 10 },
    ],
  },
];

async function seedProducts() {
  const dbName = getTargetDatabase();
  let connection = null;

  try {
    console.log(`Connecting to TiDB Cloud (${process.env.TIDB_HOST})...`);
    connection = await mysql.createConnection({
      host: process.env.TIDB_HOST,
      port: Number(process.env.TIDB_PORT || 4000),
      user: process.env.TIDB_USER,
      password: process.env.TIDB_PASSWORD,
      ssl: {
        minVersion: "TLSv1.2",
        rejectUnauthorized: true,
      },
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    await connection.query(`USE \`${dbName}\`;`);

    // 1. Ensure categories, products, and product_images tables exist
    await connection.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        subtitle VARCHAR(500) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        category_id INT NULL,
        subcategory VARCHAR(255) NULL,
        description TEXT NULL,
        price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        mrp DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        stock INT NOT NULL DEFAULT 0,
        in_stock BOOLEAN NOT NULL DEFAULT TRUE,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        display_order INT NOT NULL DEFAULT 0,
        tags TEXT NULL,
        image_url TEXT NULL,
        image_public_id VARCHAR(255) NULL,
        images_json TEXT NULL,
        sizes_json TEXT NULL,
        benefits TEXT NULL,
        how_to_use TEXT NULL,
        ingredients TEXT NULL,
        return_policy TEXT NULL,
        featured BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS product_images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        image_url TEXT NOT NULL,
        public_id VARCHAR(255) NULL,
        sort_order INT NOT NULL DEFAULT 0,
        CONSTRAINT fk_product_images_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        INDEX idx_product_images_product (product_id),
        INDEX idx_product_images_sort (product_id, sort_order)
      )
    `);

    // 2. Safe migrations: add any missing columns without deleting existing data
    const safeMigrations = [
      "ALTER TABLE categories ADD COLUMN subtitle VARCHAR(500) NULL",
      "ALTER TABLE products ADD COLUMN slug VARCHAR(255) UNIQUE",
      "ALTER TABLE products ADD COLUMN category_id INT NULL",
      "ALTER TABLE products ADD COLUMN subcategory VARCHAR(255) NULL",
      "ALTER TABLE products ADD COLUMN description TEXT NULL",
      "ALTER TABLE products ADD COLUMN price DECIMAL(10, 2) NOT NULL DEFAULT 0.00",
      "ALTER TABLE products ADD COLUMN mrp DECIMAL(10, 2) NOT NULL DEFAULT 0.00",
      "ALTER TABLE products ADD COLUMN stock INT NOT NULL DEFAULT 25",
      "ALTER TABLE products ADD COLUMN in_stock BOOLEAN NOT NULL DEFAULT TRUE",
      "ALTER TABLE products ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE",
      "ALTER TABLE products ADD COLUMN display_order INT NOT NULL DEFAULT 0",
      "ALTER TABLE products ADD COLUMN tags TEXT NULL",
      "ALTER TABLE products ADD COLUMN image_url TEXT NULL",
      "ALTER TABLE products ADD COLUMN image_public_id VARCHAR(255) NULL",
      "ALTER TABLE products ADD COLUMN images_json TEXT NULL",
      "ALTER TABLE products ADD COLUMN sizes_json TEXT NULL",
      "ALTER TABLE products ADD COLUMN benefits TEXT NULL",
      "ALTER TABLE products ADD COLUMN how_to_use TEXT NULL",
      "ALTER TABLE products ADD COLUMN ingredients TEXT NULL",
      "ALTER TABLE products ADD COLUMN return_policy TEXT NULL",
      "ALTER TABLE products ADD COLUMN featured BOOLEAN NOT NULL DEFAULT FALSE",
    ];

    for (const sql of safeMigrations) {
      try {
        await connection.query(sql);
      } catch {
        // Column already exists; ignore safely
      }
    }

    // 3. Seed Categories (and normalize legacy 'traditional-food' slug if present)
    const categoryIdBySlug = new Map();
    for (const cat of CATEGORIES) {
      await connection.execute(
        `INSERT INTO categories (name, slug, subtitle)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE
           name = VALUES(name),
           subtitle = VALUES(subtitle)`,
        [cat.name, cat.slug, cat.subtitle]
      );

      const [rows] = await connection.execute(
        "SELECT id FROM categories WHERE slug = ? LIMIT 1",
        [cat.slug]
      );
      if (rows[0]) {
        categoryIdBySlug.set(cat.slug, Number(rows[0].id));
      }
    }

    // If an old 'traditional-food' category row exists, point any products to 'traditional-foods' and remove duplicate
    const tradFoodsId = categoryIdBySlug.get("traditional-foods");
    if (tradFoodsId) {
      const [legacyCat] = await connection.execute(
        "SELECT id FROM categories WHERE slug = ? LIMIT 1",
        ["traditional-food"]
      );
      if (legacyCat[0] && Number(legacyCat[0].id) !== tradFoodsId) {
        await connection.execute(
          "UPDATE products SET category_id = ? WHERE category_id = ?",
          [tradFoodsId, legacyCat[0].id]
        );
        await connection.execute("DELETE FROM categories WHERE id = ?", [legacyCat[0].id]);
      }
    }

    // 4. Clean up any old non-existent '/products/*.jpg' placeholder paths so products without real images show the clean placeholder
    await connection.execute(
      "DELETE FROM product_images WHERE (public_id IS NULL OR public_id = '') AND image_url LIKE '/products/%'"
    );
    await connection.execute(
      "UPDATE products SET image_url = NULL WHERE (image_public_id IS NULL OR image_public_id = '') AND image_url LIKE '/products/%'"
    );

    // 5. Upsert all 31 products safely (safe to run multiple times)
    for (const p of PRODUCTS) {
      const categoryId = categoryIdBySlug.get(p.categorySlug) || null;
      const sizesJson = p.sizes && p.sizes.length > 0 ? JSON.stringify(p.sizes) : null;

      await connection.execute(
        `INSERT INTO products (
          name, slug, category_id, subcategory, description,
          price, mrp, stock, in_stock, is_active, display_order,
          tags, sizes_json, benefits, how_to_use, ingredients, return_policy, featured,
          image_url, image_public_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL)
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          category_id = VALUES(category_id),
          subcategory = VALUES(subcategory),
          description = VALUES(description),
          price = VALUES(price),
          mrp = VALUES(mrp),
          stock = VALUES(stock),
          in_stock = VALUES(in_stock),
          is_active = VALUES(is_active),
          display_order = VALUES(display_order),
          tags = VALUES(tags),
          sizes_json = COALESCE(products.sizes_json, VALUES(sizes_json)),
          benefits = VALUES(benefits),
          how_to_use = VALUES(how_to_use),
          ingredients = VALUES(ingredients),
          return_policy = VALUES(return_policy),
          featured = VALUES(featured)`,
        [
          p.name,
          p.slug,
          categoryId,
          p.subcategory,
          p.description,
          p.price,
          p.mrp,
          p.stock,
          p.in_stock ? 1 : 0,
          p.is_active ? 1 : 0,
          p.display_order,
          p.tags,
          sizesJson,
          p.benefits,
          p.how_to_use,
          p.ingredients,
          p.return_policy,
          p.featured ? 1 : 0,
        ]
      );
    }

    // 6. Query and display the number of products per category
    const [counts] = await connection.execute(`
      SELECT c.name AS category_name, c.slug AS category_slug, COUNT(p.id) AS product_count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id
      GROUP BY c.id, c.name, c.slug
      ORDER BY c.id ASC
    `);

    console.log("\n==========================================");
    console.log("  PRODUCTS SEEDED PER CATEGORY (TiDB)     ");
    console.log("==========================================");
    let totalCount = 0;
    for (const row of counts) {
      const count = Number(row.product_count || 0);
      totalCount += count;
      console.log(`- ${row.category_name} (${row.category_slug}): ${count} products`);
    }
    console.log("------------------------------------------");
    console.log(`Total products in database: ${totalCount}`);
    console.log("==========================================\n");
  } catch (error) {
    console.error("Failed to seed products:", error.message);
    process.exitCode = 1;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

seedProducts();
