// app/about/page.tsx
// Plain CSS inside the component: no Tailwind or extra packages needed.
// Images live in /public/about/ and are referenced as "/about/<file>".

import Image from "next/image";
import Link from "next/link";
import { Montserrat } from "next/font/google";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
});

export const metadata = {
  title: "About Uppiliees | Pure Nature. Pure Goodness.",
  description:
    "Uppiliees brings herbal care, traditional Kerala foods and handloom together, made simply and honestly.",
};

/* Leaf sprout, used as the one botanical accent (kept subtle, per the brand guide) */
function Sprout({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <path d="M60 112V58" stroke="#07552F" strokeWidth="5" strokeLinecap="round" />
      <path d="M60 64C60 38 40 22 14 22c0 28 18 44 46 42Z" fill="#4D9A18" />
      <path d="M60 52C60 28 78 10 106 8c0 28-18 46-46 44Z" fill="#C7E900" />
    </svg>
  );
}

/**
 * Photo slot. Pass `src` (must start with "/") to show a real photo.
 * Without `src` it shows a calm green panel with the leaf.
 */
function PhotoPanel({
  src,
  alt = "",
  tone = "leaf",
  className = "",
}: {
  src?: string;
  alt?: string;
  tone?: "leaf" | "deep" | "soft";
  className?: string;
}) {
  return (
    <div className={`photo photo-${tone} ${className}`}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 760px) 100vw, 50vw"
          style={{ objectFit: "cover" }}
        />
      ) : (
        <Sprout className="photo-sprout" />
      )}
    </div>
  );
}

const worlds = [
  {
    title: "Herbal care",
    text: "Hair oils, face wash, creams and powders for skin, hair and everyday wellness. Plant-based ingredients, with wording that stays plain and factual.",
    tone: "leaf" as const,
    src: "/about/herbal.jpeg",
    alt: "Uppiliees herbal care products",
  },
  {
    title: "Kerala kitchen",
    text: "Banana powder and chips, ragi, sambar powder, pickles and ghee, prepared in the home-style way many of us grew up with.",
    tone: "soft" as const,
    src: "/about/kitchen.jpeg",
    alt: "Traditional Kerala food products",
  },
  {
    title: "Handloom",
    text: "Sarees, set mundu and dhotis woven the traditional Kerala way, for people who like cloth that feels simple and lasting.",
    tone: "deep" as const,
    src: "/about/handloom.jpeg",
    alt: "Kerala handloom sarees and mundu",
  },
];

const values = [
  ["Simple", "Short ingredient lists and clear product names."],
  ["Honest", "We describe what a product is and how to use it. No big promises."],
  ["Rooted", "Recipes and crafts from Kerala, kept close to how they were made."],
  ["Caring", "Made for families, from babies to grandparents."],
];

export default function AboutPage() {
  return (
    <main className={`about ${montserrat.className}`}>
      <style>{css}</style>

      {/* Hero */}
      <section className="hero wrap">
        <div className="hero-text">
          <h1>
            Pure Nature.
            <br />
            Pure Goodness.
          </h1>
          <p className="lead">
            Uppiliees began with a simple idea: the things we put on our skin, on our plates and
            around our shoulders should feel honest and close to nature.
          </p>
        </div>
        <PhotoPanel
          src="/about/story.jpeg"
          alt="Uppiliees herbal and Kerala products"
          tone="leaf"
          className="hero-photo"
        />
      </section>

      {/* Story */}
      <section className="story wrap">
        <PhotoPanel
          src="/about/story2.png"
          alt="The Uppiliees story"
          tone="soft"
          className="story-photo"
        />
        <div className="story-text">
          <h2>Our story</h2>
          <p>
            Uppiliees grew out of Kerala kitchens, family remedies and the quiet rhythm of the
            loom. Every product started with a question: can this be made the simple way, with
            ingredients we recognise?
          </p>
          <p>
            Today that means herbal care for skin and hair, traditional foods made in small
            batches, and handloom cloth woven the way it has always been. Different products, one
            promise: keep it pure, keep it kind.
          </p>
        </div>
      </section>

      {/* Three worlds */}
      <section className="worlds wrap">
        <h2>What we make</h2>
        <ul>
          {worlds.map((w) => (
            <li key={w.title}>
              <PhotoPanel src={w.src} alt={w.alt} tone={w.tone} className="world-photo" />
              <div>
                <h3>{w.title}</h3>
                <p>{w.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Values */}
      <section className="values wrap">
        <h2>What we stand for</h2>
        <dl>
          {values.map(([term, desc]) => (
            <div key={term}>
              <dt>{term}</dt>
              <dd>{desc}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Closing */}
      <section className="closing">
        <div className="wrap closing-inner">
          <h2>Come and have a look</h2>
          <p>Browse the full range of herbal care, Kerala foods and handloom.</p>
          <Link href="/products" className="btn">
            Shop Uppiliees
          </Link>
        </div>
      </section>
    </main>
  );
}

const css = `
.about{
  --deep:#063D27; --forest:#07552F; --leaf:#4D9A18; --lime:#C7E900; --soft:#F4F8F1;
  background:#fff; color:#1d2b24; line-height:1.7; font-size:1rem;
}
.about *{box-sizing:border-box}
.about .wrap{max-width:1080px; margin:0 auto; padding:0 1.25rem}
.about h1,.about h2,.about h3{color:var(--deep); line-height:1.15; margin:0}
.about h1{font-size:clamp(2.4rem,7vw,4.5rem); font-weight:800; letter-spacing:-0.02em}
.about h2{font-size:clamp(1.6rem,4vw,2.25rem); font-weight:700; margin-bottom:1rem}
.about h3{font-size:1.2rem; font-weight:700; margin-bottom:.4rem}
.about p{margin:0 0 1rem; max-width:62ch}

/* photo panels */
.about .photo{position:relative; overflow:hidden; border-radius:1.25rem; aspect-ratio:4/3; display:grid; place-items:center}
.about .photo-leaf{background:linear-gradient(145deg,var(--deep),var(--forest) 60%,var(--leaf))}
.about .photo-deep{background:linear-gradient(160deg,var(--deep),var(--forest))}
.about .photo-soft{background:var(--soft); border:1px solid #dfe9d8}
.about .photo-sprout{width:38%; height:auto; opacity:.9}

/* hero */
.about .hero{display:grid; grid-template-columns:1.1fr .9fr; gap:3rem; align-items:center; padding-top:4rem; padding-bottom:4rem}
.about .lead{font-size:1.15rem; color:#3b4b43; margin-top:1.5rem}
.about .hero-photo{aspect-ratio:1/1}

/* story */
.about .story{display:grid; grid-template-columns:.9fr 1.1fr; gap:3rem; align-items:center; padding-top:3rem; padding-bottom:4rem}

/* worlds */
.about .worlds{padding-top:2rem; padding-bottom:4rem}
.about .worlds ul{list-style:none; margin:2rem 0 0; padding:0}
.about .worlds li{display:grid; grid-template-columns:200px 1fr; gap:2rem; align-items:center; padding:1.75rem 0; border-top:1px solid #dfe9d8}
.about .worlds li:last-child{border-bottom:1px solid #dfe9d8}
.about .world-photo{aspect-ratio:4/3}
.about .worlds p{margin:0}

/* values */
.about .values{padding-bottom:4.5rem}
.about .values dl{display:grid; grid-template-columns:repeat(4,1fr); gap:2rem; margin:2rem 0 0}
.about .values dt{font-weight:700; color:var(--forest); font-size:1.1rem; padding-top:.9rem; border-top:3px solid var(--lime); display:inline-block; min-width:3rem}
.about .values dd{margin:.5rem 0 0; color:#3b4b43}

/* closing */
.about .closing{background:var(--deep); color:#fff; padding:4.5rem 0; text-align:center}
.about .closing h2{color:#fff}
.about .closing p{color:#cfe0d5; margin:0 auto 1.75rem}
.about .btn{display:inline-block; background:var(--lime); color:var(--deep); font-weight:700; padding:.9rem 1.8rem; border-radius:999px; text-decoration:none; transition:transform .15s ease}
.about .btn:hover{transform:translateY(-2px)}
.about .btn:focus-visible{outline:3px solid #fff; outline-offset:3px}

/* tablet and mobile */
@media (max-width:900px){
  .about .values dl{grid-template-columns:repeat(2,1fr)}
}
@media (max-width:760px){
  .about .hero,.about .story{grid-template-columns:1fr; gap:2rem}
  .about .hero{padding-top:2.5rem; padding-bottom:2.5rem}
  .about .hero-photo{aspect-ratio:16/10; order:-1}
  .about .story{padding-bottom:3rem}
  .about .worlds li{grid-template-columns:1fr; gap:1rem}
  .about .world-photo{aspect-ratio:16/9}
  .about .values dl{grid-template-columns:1fr; gap:1.5rem}
  .about .closing{padding:3.5rem 0}
}
@media (prefers-reduced-motion:reduce){ .about .btn{transition:none} }
`;