/* eslint-disable @typescript-eslint/no-require-imports */
const http = require("http");
const https = require("https");
const { spawn } = require("child_process");

const PORT = 3055;
const BASE_URL = `http://localhost:${PORT}`;

// Seed URLs to crawl
const seedUrls = [
  "/",
  "/shop",
  "/products",
  "/all-products",
  "/herbal-beauty",
  "/traditional-foods",
  "/handloom",
  "/collections",
  "/collections/handloom",
  "/collections/kerala-food",
  "/collections/herbal-beauty-wellness",
  "/skincare",
  "/about",
  "/contact",
  "/cart",
  "/checkout",
  "/wishlist",
  "/account",
  "/login",
  "/register",
  "/shipping-policy",
  "/privacy-policy",
  "/terms-and-conditions",
  "/quality-standards",
  "/track-order",
  "/product/product-1",
  "/product/product-2",
  "/product/product-3",
  "/product/product-4",
  "/order-success/UPP-1001",
];

// Product slugs from specification
const productSlugs = [
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
];

productSlugs.forEach((s) => {
  seedUrls.push(`/products/${s}`);
  seedUrls.push(`/herbal-beauty/${s}`);
  seedUrls.push(`/traditional-foods/${s}`);
  seedUrls.push(`/handloom/${s}`);
});

function fetchUrl(targetUrl, redirectCount = 0) {
  return new Promise((resolve) => {
    if (redirectCount > 10) {
      return resolve({ url: targetUrl, statusCode: 508, body: "Too many redirects" });
    }

    const client = targetUrl.startsWith("https") ? https : http;
    client
      .get(targetUrl, (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          if (
            [301, 302, 307, 308].includes(res.statusCode) &&
            res.headers.location
          ) {
            const loc = res.headers.location.startsWith("http")
              ? res.headers.location
              : new URL(res.headers.location, targetUrl).toString();
            return resolve(fetchUrl(loc, redirectCount + 1));
          }
          resolve({ url: targetUrl, statusCode: res.statusCode, body });
        });
      })
      .on("error", (err) => {
        console.error(`Fetch error on ${targetUrl}:`, err.code, err.message, err);
        resolve({ url: targetUrl, statusCode: 500, error: err.message });
      });
  });
}

function extractLinks(html, currentUrl) {
  const links = new Set();
  const hrefRegex = /href=["']([^"']+)["']/g;
  let match;
  while ((match = hrefRegex.exec(html)) !== null) {
    let link = match[1];
    if (
      link.startsWith("#") ||
      link.startsWith("mailto:") ||
      link.startsWith("tel:") ||
      link.startsWith("javascript:")
    ) {
      continue;
    }
    if (link.startsWith("http://") || link.startsWith("https://")) {
      if (link.startsWith(BASE_URL)) {
        link = link.replace(BASE_URL, "");
      } else {
        continue;
      }
    }
    if (!link.startsWith("/")) continue;
    // Remove hash and query for crawling unique pages
    const clean = link.split("#")[0];
    links.add(clean);
  }
  return Array.from(links);
}

async function runCrawler() {
  console.log(`Starting Next.js standalone runner on port ${PORT}...`);
  const server = spawn("npx", ["next", "start", "-p", String(PORT)], {
    shell: true,
    stdio: "pipe",
  });

  server.stdout.on("data", (d) => {
    const text = d.toString();
    // console.log("[server stdout]", text);
  });
  server.stderr.on("data", (d) => {
    console.error("[server stderr]", d.toString());
  });

  // Wait for server to boot
  await new Promise((r) => setTimeout(r, 4000));

  console.log("Beginning link verification crawl...");

  const queue = [...new Set(seedUrls)];
  const visited = new Set();
  const errors = [];
  let checked = 0;

  while (queue.length > 0) {
    const path = queue.shift();
    if (visited.has(path)) continue;
    visited.add(path);

    const fullUrl = `${BASE_URL}${path}`;
    const res = await fetchUrl(fullUrl);
    checked++;

    if (res.statusCode >= 400) {
      console.error(`[FAIL ${res.statusCode}] ${path}`);
      errors.push({ path, status: res.statusCode, error: res.error });
    } else {
      console.log(`[OK ${res.statusCode}] ${path}`);
    }

    if (res.body && typeof res.body === "string") {
      const extracted = extractLinks(res.body, fullUrl);
      for (const link of extracted) {
        if (!visited.has(link) && !queue.includes(link)) {
          queue.push(link);
        }
      }
    }
  }

  try {
    server.kill();
  } catch {}

  console.log(`\n========================================`);
  console.log(`Crawl finished! Checked ${checked} pages.`);
  if (errors.length > 0) {
    console.error(`Encountered ${errors.length} failed link(s):`);
    errors.forEach((e) => console.error(` - ${e.path} returned HTTP ${e.status}`));
    process.exit(1);
  } else {
    console.log(`All links resolved with zero 404 or 500 errors!`);
    process.exit(0);
  }
}

runCrawler();

