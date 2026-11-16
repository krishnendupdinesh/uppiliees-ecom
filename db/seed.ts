import path from "path";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

// Load environment variables from .env.local first, then .env
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

function getTargetDatabase(): string {
  const raw = (process.env.TIDB_DATABASE || "uppiliees").trim();
  if (!raw || raw.toLowerCase() === "sys") {
    return "uppiliees";
  }
  return raw;
}

type SeedProduct = {
  slug: string;
  name: string;
  categorySlug: "herbal-beauty" | "traditional-foods" | "handloom";
  subcategory: string;
  price: number;
  mrp: number;
  stock: number;
  featured?: boolean;
  description: string;
  benefits: string;
  howToUse: string;
};

const SEED_CATEGORIES = [
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

const SEED_PRODUCTS: SeedProduct[] = [
  // -------------------- Herbal & Beauty (15 products) --------------------
  {
    slug: "changalam-paranda-pain-relief-oil",
    name: "Changalam Paranda Herbal Pain Relief Oil",
    categorySlug: "herbal-beauty",
    subcategory: "Pain Relief",
    price: 249,
    mrp: 320,
    stock: 25,
    description: "Traditional Kerala herbal pain relief oil infused with Changalam Paranda for joint, muscle, knee, and back relief.",
    benefits: "Rapid natural relief from joint, muscle, knee, and back pain.\nTraditional Kerala herbal formula infused with Changalam Paranda.\nImproves blood circulation and relieves chronic stiffness.\n100% natural herbal ingredients with no harsh chemicals.",
    howToUse: "Take a small amount, gently massage into the affected area for 5-10 minutes, and leave it on.",
  },
  {
    slug: "babyglow-baby-massage-oil",
    name: "BabyGlow Natural Baby Massage Oil",
    categorySlug: "herbal-beauty",
    subcategory: "Baby Care",
    price: 199,
    mrp: 250,
    stock: 25,
    description: "Gentle herbal massage oil specially formulated to nourish delicate baby skin and strengthen bones.",
    benefits: "Nourishes delicate baby skin with gentle herbs.\nStrengthens baby's bones and muscles through daily massage.\nPrevents dryness and maintains soft, supple skin.",
    howToUse: "Warm a few drops between your palms and gently massage over the baby's body before bath time.",
  },
  {
    slug: "pulari-herbal-hair-growth-oil",
    name: "PULARI Herbal Hair Growth Oil",
    categorySlug: "herbal-beauty",
    subcategory: "Hair Care",
    price: 349,
    mrp: 450,
    stock: 25,
    description: "Traditional Kerala herbal hair oil that stimulates hair follicles, controls dandruff, and reduces hair fall.",
    benefits: "Stimulates active hair follicles and encourages healthy hair growth.\nHelps reduce hair fall, breakage, and split ends.\nCools the scalp and fights dandruff.",
    howToUse: "Apply generously to scalp and hair roots. Massage gently and leave for 30 minutes before washing.",
  },
  {
    slug: "glow-plus-fairness-powder",
    name: "Glow Plus Herbal Fairness Powder",
    categorySlug: "herbal-beauty",
    subcategory: "Skin Care",
    price: 179,
    mrp: 230,
    stock: 25,
    description: "Botanical herbal face pack and scrub powder that gently exfoliates and brightens skin tone naturally.",
    benefits: "Improves skin tone and natural glow with authentic herbs.\nGently exfoliates dead skin cells and clears pores.\nHelps reduce blemishes and sun tanning.",
    howToUse: "Mix a spoonful with rose water or milk to form a paste. Apply on face for 10-15 minutes, then rinse.",
  },
  {
    slug: "glow-plus-skin-brightening-cream",
    name: "Glow Plus Skin Brightening Moisturizing Cream",
    categorySlug: "herbal-beauty",
    subcategory: "Skin Care",
    price: 279,
    mrp: 350,
    stock: 25,
    description: "Deeply hydrating botanical cream that brightens complexion and minimizes uneven skin tone.",
    benefits: "Deeply hydrates and replenishes the skin barrier.\nBrightens complexion and minimizes hyperpigmentation.\nNon-greasy, fast-absorbing texture suitable for daily use.",
    howToUse: "Dot evenly across cleansed face and neck every morning and night. Massage in upward circular motions.",
  },
  {
    slug: "sankhu-puspam-face-wash",
    name: "Sankhu Puspam Herbal Face Wash",
    categorySlug: "herbal-beauty",
    subcategory: "Skin Care",
    price: 159,
    mrp: 199,
    stock: 25,
    featured: true,
    description: "Refreshing herbal face wash infused with Shankhupushpam (Butterfly Pea) to cleanse and calm skin.",
    benefits: "Infused with Butterfly Pea extract to calm and refresh skin.\nCleanses deep impurities without stripping natural moisture.\nSulfate and paraben free gentle formula.",
    howToUse: "Splash face with lukewarm water, lather a small amount in hands, gently massage face, and rinse.",
  },
  {
    slug: "glow-plus-lip-care-cream",
    name: "Glow Plus Lip Care Cream",
    categorySlug: "herbal-beauty",
    subcategory: "Skin Care",
    price: 99,
    mrp: 130,
    stock: 25,
    description: "Nourishing herbal lip balm that heals chapped, dry lips and restores natural softness.",
    benefits: "Heals chapped, dry, and cracked lips with intense herbal moisture.\nRestores natural lip softness and suppleness.\nMade with wholesome natural waxes and oils.",
    howToUse: "Smooth a small amount over lips as often as needed throughout the day and before bedtime.",
  },
  {
    slug: "baby-glow-urukku-velichenna",
    name: "Homemade Baby Glow Virgin Coconut Oil",
    categorySlug: "herbal-beauty",
    subcategory: "Baby Care",
    price: 229,
    mrp: 280,
    stock: 25,
    description: "100% pure homemade Kerala Urukku Velichenna (hot-processed virgin coconut oil) for baby care and skin nourishment.",
    benefits: "100% pure homemade hot-processed virgin coconut oil.\nTraditional Kerala choice for baby massage and cradle cap care.\nRich in natural lauric acid and antioxidants.",
    howToUse: "Apply gently on baby's skin and scalp before bath or use as a soothing natural moisturizer.",
  },
  {
    slug: "painoplus-pain-relief-balm",
    name: "PainoPlus Changalam Paranda Pain Relief Balm",
    categorySlug: "herbal-beauty",
    subcategory: "Pain Relief",
    price: 149,
    mrp: 190,
    stock: 25,
    description: "Fast-acting herbal balm infused with Changalam Paranda and warming herbs for headaches and body aches.",
    benefits: "Quick soothing action for headaches, sprains, and joint pain.\nInfused with Changalam Paranda and warming aromatic herbs.\nNon-sticky, travel-friendly balm format.",
    howToUse: "Rub gently on temples, forehead, neck, or affected joints and muscles.",
  },
  {
    slug: "stretch-ease-stretch-mark-cream",
    name: "Stretch Ease Stretch Mark Care Cream",
    categorySlug: "herbal-beauty",
    subcategory: "Skin Care",
    price: 399,
    mrp: 520,
    stock: 25,
    description: "Herbal skin elasticity and stretch mark care cream for pregnancy and postpartum nourishment.",
    benefits: "Boosts skin elasticity and collagen strength.\nVisibly softens existing stretch marks and prevents new ones.\nDeeply hydrates dry, stretching skin.",
    howToUse: "Massage generously over abdomen, hips, and thighs twice daily in circular motions.",
  },
  {
    slug: "ojas-boost-herbal-powder",
    name: "Ojas Boost Herbal Wellness Powder",
    categorySlug: "herbal-beauty",
    subcategory: "Wellness Powders",
    price: 299,
    mrp: 380,
    stock: 25,
    description: "Ayurvedic vitality and immunity powder prepared from restorative herbs to elevate core stamina.",
    benefits: "Supports immune defense, stamina, and physical endurance.\nHelps counter fatigue and stress naturally.\n100% pure traditional Ayurvedic herbal blend.",
    howToUse: "Mix 1 teaspoon with warm milk, warm water, or honey once or twice daily after meals.",
  },
  {
    slug: "ashwagandha-powder",
    name: "Natural Ashwagandha Herbal Powder",
    categorySlug: "herbal-beauty",
    subcategory: "Wellness Powders",
    price: 199,
    mrp: 260,
    stock: 25,
    featured: true,
    description: "Pure Ayurvedic Ashwagandha root powder for stress relief, restful sleep, and holistic vitality.",
    benefits: "Reduces stress and anxiety naturally.\nEnhances physical strength, stamina, and muscle recovery.\nPromotes deep and restful sleep cycles.",
    howToUse: "Mix 1/2 to 1 teaspoon in warm milk or water with honey before bedtime.",
  },
  {
    slug: "naikuruna-powder",
    name: "Natural Naikuruna Herbal Powder",
    categorySlug: "herbal-beauty",
    subcategory: "Wellness Powders",
    price: 179,
    mrp: 220,
    stock: 25,
    description: "Pure Mucuna pruriens (Naikuruna) botanical root powder supporting nervous system health and energy.",
    benefits: "Supports nervous system health and mood balance.\nEnhances mental energy and physical stamina.\nPure, unadulterated botanical root powder.",
    howToUse: "Consume 1/2 teaspoon with warm milk or honey once daily after meals.",
  },
  {
    slug: "kalonji-black-seed-oil",
    name: "Pure Kalonji Black Seed Oil for Hair Care",
    categorySlug: "herbal-beauty",
    subcategory: "Hair Care",
    price: 269,
    mrp: 340,
    stock: 25,
    description: "100% pure cold-pressed Nigella Sativa (Kalonji) black seed oil for strong hair roots and scalp care.",
    benefits: "Strengthens hair roots and controls premature thinning.\nSoothes dry, flaky scalp with natural antioxidants.\n100% pure cold-pressed black seed oil.",
    howToUse: "Massage into hair roots and scalp and leave for 30-60 minutes before washing.",
  },
  {
    slug: "mozi-out-herbal-mosquito-repellent",
    name: "MOZI OUT Herbal Mosquito Repellent",
    categorySlug: "herbal-beauty",
    subcategory: "Home Care",
    price: 129,
    mrp: 160,
    stock: 25,
    description: "Plant-based, DEET-free herbal mosquito repellent safe for children and family.",
    benefits: "Natural mosquito defense powered by plant essential oils.\n100% DEET-free, non-toxic, and child safe.\nPleasant herbal aroma without harsh chemical odors.",
    howToUse: "Spray evenly on exposed skin or clothing. Reapply every 3-4 hours as needed.",
  },

  // -------------------- Traditional Food (13 products) --------------------
  {
    slug: "kannan-kaya-powder",
    name: "Traditional Kerala Kannan Kaya Powder",
    categorySlug: "traditional-foods",
    subcategory: "Powders",
    price: 199,
    mrp: 240,
    stock: 25,
    description: "Nutrient-rich raw Kerala Kannan banana powder, ideal as a wholesome porridge for babies and families.",
    benefits: "Prepared from authentic raw Kerala Kannan bananas.\nEasy to digest and promotes healthy growth.\n100% natural, preservative-free, and sugar-free.",
    howToUse: "Cook 2 tablespoons with 1 cup of water or milk on low flame, stirring continuously until smooth.",
  },
  {
    slug: "homemade-banana-powder",
    name: "Homemade Natural Banana Powder",
    categorySlug: "traditional-foods",
    subcategory: "Powders",
    price: 189,
    mrp: 230,
    stock: 25,
    description: "Wholesome sun-dried Kerala Nendran banana powder prepared hygienically for nutritious porridge.",
    benefits: "Made from mature sun-dried Kerala Nendran bananas.\nRich in dietary fiber and essential vitamins.\nZero chemicals, preservatives, or added sugar.",
    howToUse: "Boil with milk or water for 5-7 minutes into a smooth, comforting porridge.",
  },
  {
    slug: "ragi-powder",
    name: "Natural Ragi Finger Millet Powder",
    categorySlug: "traditional-foods",
    subcategory: "Powders",
    price: 149,
    mrp: 180,
    stock: 25,
    description: "High-calcium sprouted finger millet (Ragi) flour that supports strong bones and smooth digestion.",
    benefits: "High in natural calcium, iron, and dietary fiber.\nNaturally gluten-free whole grain superfood.\nIdeal wholesome meal for children and adults.",
    howToUse: "Cook with water or milk on low flame with jaggery or a pinch of salt.",
  },
  {
    slug: "homemade-sambar-powder",
    name: "Homemade Kerala Style Sambar Powder",
    categorySlug: "traditional-foods",
    subcategory: "Powders",
    price: 129,
    mrp: 160,
    stock: 25,
    description: "Aromatic Kerala village-style sambar masala stone-ground from roasted whole spices.",
    benefits: "Crafted from freshly roasted whole spices.\nImparts authentic Kerala aroma, flavor, and color.\nFree from preservatives, fillers, or MSG.",
    howToUse: "Add 1 to 2 tablespoons while simmering cooked dal and vegetables.",
  },
  {
    slug: "kannan-kaya-dried-chips",
    name: "Traditional Kannan Kaya Dried Banana Chips",
    categorySlug: "traditional-foods",
    subcategory: "Chips & Sweets",
    price: 179,
    mrp: 210,
    stock: 25,
    description: "Sun-dried raw Kannan banana slices with zero additives, ready for grinding into fresh baby food or cooking.",
    benefits: "Sun-dried authentic raw Kannan banana slices.\nContains no added salt, oil, or preservatives.\nLong shelf life while retaining natural nutrients.",
    howToUse: "Grind in a dry mixer for fresh homemade banana powder or use in traditional Kerala dishes.",
  },
  {
    slug: "banana-dried-chips",
    name: "Traditional Kerala Dried Banana Chips",
    categorySlug: "traditional-foods",
    subcategory: "Chips & Sweets",
    price: 159,
    mrp: 199,
    stock: 25,
    featured: true,
    description: "Crispy golden Kerala Nendran banana chips fried in pure coconut oil.",
    benefits: "Fried to crispy perfection in pure Kerala coconut oil.\nMade from handpicked mature Nendran bananas.\nNo artificial colors or preservatives.",
    howToUse: "Enjoy straight from the pack with hot tea or as a crunchy side with meals.",
  },
  {
    slug: "banana-figs",
    name: "Traditional Kerala Banana Figs",
    categorySlug: "traditional-foods",
    subcategory: "Chips & Sweets",
    price: 249,
    mrp: 299,
    stock: 25,
    description: "Naturally dehydrated ripe Kerala bananas bursting with rich, caramel-like sweetness and fiber.",
    benefits: "Made from sun-ripened Kerala bananas with zero added sugar.\nRich source of instant energy, fiber, and potassium.\nHealthy alternative to refined sweets.",
    howToUse: "Enjoy as a wholesome snack anytime or chop into oatmeal and trail mixes.",
  },
  {
    slug: "homemade-prawns-pickle",
    name: "Homemade Kerala Style Prawns Pickle",
    categorySlug: "traditional-foods",
    subcategory: "Pickle, Ghee & Lard",
    price: 299,
    mrp: 380,
    stock: 25,
    description: "Spicy coastal Kerala prawns pickle slow-cooked in pure gingelly oil with curry leaves and roasted spices.",
    benefits: "Prepared with fresh coastal prawns and Kerala spices.\nCooked in pure sesame oil with garlic, ginger, and curry leaves.\nSmall-batch homestyle preparation.",
    howToUse: "Serve a spoonful alongside hot rice, kanji, chapati, or biryani.",
  },
  {
    slug: "homemade-pure-cow-ghee",
    name: "Homemade Pure Cow Ghee",
    categorySlug: "traditional-foods",
    subcategory: "Pickle, Ghee & Lard",
    price: 699,
    mrp: 850,
    stock: 25,
    description: "Traditional granular homemade cow ghee churned from cultured curd with rich aroma.",
    benefits: "Crafted through traditional churning of pure cow milk curd.\nRich in fat-soluble vitamins A, D, E, and K.\nSupports digestion, immunity, and vitality.",
    howToUse: "Drizzle over warm rice, dosas, or use for traditional cooking and sweets.",
  },
  {
    slug: "homemade-pork-lard",
    name: "Homemade Pure Pork Lard",
    categorySlug: "traditional-foods",
    subcategory: "Pickle, Ghee & Lard",
    price: 349,
    mrp: 420,
    stock: 25,
    description: "Pure, unhydrogenated rendered pork fat with a high smoke point for traditional roasting and frying.",
    benefits: "100% pure rendered fat with a high smoke point.\nFree from industrial trans fats and bleaches.\nGives superior crispiness to roasts and stir-fries.",
    howToUse: "Use for searing, roasting, pan-frying, and traditional recipes.",
  },
  {
    slug: "dried-vegetables",
    name: "Homemade Sun-Dried Vegetables",
    categorySlug: "traditional-foods",
    subcategory: "Dried Foods",
    price: 219,
    mrp: 270,
    stock: 25,
    description: "Traditionally sun-dried homestead Kerala vegetables preserved naturally without chemicals for curries and fry dishes.",
    benefits: "Sun-dried naturally in clean Kerala homestead kitchens.\nPreserves seasonal vegetables with zero chemical preservatives.\nReady to fry or cook in traditional curries.",
    howToUse: "Soak briefly in warm water for curries, or fry directly in coconut oil for crispy kondattam.",
  },
  {
    slug: "dried-meat",
    name: "Traditional Kerala Dried Meat",
    categorySlug: "traditional-foods",
    subcategory: "Dried Foods",
    price: 549,
    mrp: 650,
    stock: 25,
    description: "Authentic Kerala style spiced and sun-dried meat (Idi Erachi), rich in protein and smoky traditional flavor.",
    benefits: "Prepared with lean meat marinated in traditional Kerala spices.\nNaturally sun-dried for rich flavor and long shelf life.\nHigh-protein delicacy ideal for Kerala idi erachi roast.",
    howToUse: "Soak in warm water, crush lightly, and roast with shallots, curry leaves, and chili flakes in coconut oil.",
  },
  {
    slug: "dried-fish",
    name: "Traditional Kerala Dried Fish",
    categorySlug: "traditional-foods",
    subcategory: "Dried Foods",
    price: 399,
    mrp: 480,
    stock: 25,
    description: "Hygienically sun-dried coastal Kerala fish (Unakka Meen), lightly salted and bursting with authentic flavor.",
    benefits: "Sourced from fresh coastal catch and sun-dried hygienically.\nNo chemical preservatives or artificial curing agents.\nClassic accompaniment for Kerala kanji and rice meals.",
    howToUse: "Rinse and soak in water for 10 minutes to remove excess salt, then shallow fry in coconut oil with chili and curry leaves.",
  },

  // -------------------- Handloom (3 products) --------------------
  {
    slug: "kerala-handloom-sarees",
    name: "Traditional Kerala Handloom Sarees",
    categorySlug: "handloom",
    subcategory: "Sarees",
    price: 2499,
    mrp: 3199,
    stock: 25,
    description: "Authentic 100% pure cotton Kerala Kasavu handloom saree woven by master artisans on traditional wooden shuttle looms.",
    benefits: "100% pure handwoven cotton ideal for tropical climates.\nAccented with classic golden Kasavu borders.\nDirectly supports traditional Kerala weaving communities.",
    howToUse: "Gentler hand wash in cold water. Dry in shade and iron on medium heat.",
  },
  {
    slug: "kerala-handloom-set-mundu",
    name: "Traditional Kerala Handloom Set Mundu",
    categorySlug: "handloom",
    subcategory: "Set Mundu",
    price: 1899,
    mrp: 2399,
    stock: 25,
    featured: true,
    description: "Classic two-piece Kerala Mundum Neriyathum handwoven from pure unbleached cotton with fine zari border.",
    benefits: "Authentic two-piece Mundum Neriyathum set.\nSoft, breathable handwoven cotton with rich Kasavu border.\nTimeless heritage attire for festivals and weddings.",
    howToUse: "Hand wash gently in cold water with mild detergent. Dry in shade.",
  },
  {
    slug: "kerala-handloom-dhotis",
    name: "Traditional Kerala Handloom Dhotis",
    categorySlug: "handloom",
    subcategory: "Dhotis",
    price: 999,
    mrp: 1299,
    stock: 25,
    description: "Premium Kerala handloom cotton Mundu (Dhoti) with a regal Kasavu border for all-day comfort and tradition.",
    benefits: "Pure handloom cotton weave for superior breathability.\nDistinctive Kasavu border for festive and formal wear.\nDurable craftsmanship woven by Kerala artisans.",
    howToUse: "Hand wash separately in cold water and dry in shade.",
  },
];

async function seedDatabase() {
  const dbName = getTargetDatabase();
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@uppiliees.com").trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123456";
  let connection: mysql.Connection | null = null;

  try {
    connection = await mysql.createConnection({
      host: process.env.TIDB_HOST,
      port: Number(process.env.TIDB_PORT || 4000),
      user: process.env.TIDB_USER,
      password: process.env.TIDB_PASSWORD,
      database: dbName,
      ssl: {
        minVersion: "TLSv1.2",
        rejectUnauthorized: true,
      },
    });

    console.log(`Seeding database "${dbName}"...`);

    // 1. Seed Categories
    const categoryIdBySlug = new Map<string, number>();
    for (const cat of SEED_CATEGORIES) {
      await connection.execute(
        `INSERT INTO categories (name, slug, subtitle)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name), subtitle = VALUES(subtitle)`,
        [cat.name, cat.slug, cat.subtitle]
      );

      const [rows] = await connection.execute<mysql.RowDataPacket[]>(
        "SELECT id FROM categories WHERE slug = ? LIMIT 1",
        [cat.slug]
      );
      if (rows[0]) {
        categoryIdBySlug.set(cat.slug, Number(rows[0].id));
      }
    }
    console.log(`Seeded ${SEED_CATEGORIES.length} categories.`);

    // 2. Seed Products & Product Images
    for (const p of SEED_PRODUCTS) {
      const categoryId = categoryIdBySlug.get(p.categorySlug) ?? null;
      const imageUrl = `/products/${p.slug}.jpg`;

      await connection.execute(
        `INSERT INTO products (
          name, slug, category_id, subcategory, description, price, mrp,
          stock, in_stock, image_url, benefits, how_to_use, featured
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          category_id = VALUES(category_id),
          subcategory = VALUES(subcategory),
          description = COALESCE(products.description, VALUES(description)),
          price = VALUES(price),
          mrp = VALUES(mrp),
          image_url = COALESCE(NULLIF(products.image_url, ''), VALUES(image_url)),
          benefits = COALESCE(products.benefits, VALUES(benefits)),
          how_to_use = COALESCE(products.how_to_use, VALUES(how_to_use)),
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
          imageUrl,
          p.benefits,
          p.howToUse,
          Boolean(p.featured),
        ]
      );

      const [prodRows] = await connection.execute<mysql.RowDataPacket[]>(
        "SELECT id FROM products WHERE slug = ? LIMIT 1",
        [p.slug]
      );

      if (prodRows[0]) {
        const productId = Number(prodRows[0].id);
        const [imgRows] = await connection.execute<mysql.RowDataPacket[]>(
          "SELECT id FROM product_images WHERE product_id = ? LIMIT 1",
          [productId]
        );
        if (imgRows.length === 0) {
          await connection.execute(
            "INSERT INTO product_images (product_id, image_url, public_id, sort_order) VALUES (?, ?, NULL, 0)",
            [productId, imageUrl]
          );
        }
      }
    }
    console.log(`Seeded ${SEED_PRODUCTS.length} products (including dried vegetables, dried meat, dried fish).`);

    // 3. Seed Admin User (hashed with bcrypt)
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await connection.execute(
      `INSERT INTO users (name, email, phone, password_hash, role)
       VALUES (?, ?, ?, ?, 'admin')
       ON DUPLICATE KEY UPDATE
         password_hash = VALUES(password_hash),
         role = 'admin'`,
      ["Uppiliees Admin", adminEmail, "9876543210", passwordHash]
    );
    console.log(`Seeded admin user: ${adminEmail}`);

    console.log("Database seeding completed successfully!");
  } catch (error: any) {
    console.error("Failed to seed database:", error.message);
    process.exitCode = 1;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

seedDatabase();
