import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const dist = join(projectRoot, "dist");
const src = join(projectRoot, "src");
const siteUrl = (process.env.SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:4173")).replace(/\/$/, "");
const css = await readFile(join(src, "styles.css"), "utf8");

const products = [
  {
    id: "7772467",
    slug: "aquaform-flowable-composite",
    name: "Aquaform Flowable Composite",
    frenchName: "Composite fluide Aquaform",
    brand: "Northline Dental",
    category: "Restorative materials",
    frenchCategory: "Matériaux de restauration",
    description: "A smooth flowable composite for precise restorative work and clean finishing.",
    frenchDescription: "Un composite fluide pour des restaurations précises et une finition nette.",
    price: "39.99",
    sku: "NL-7772467",
    status: "In stock"
  },
  {
    id: "7772468",
    slug: "brightline-universal-composite",
    name: "Brightline Universal Composite",
    frenchName: "Composite universel Brightline",
    brand: "Northline Dental",
    category: "Restorative materials",
    frenchCategory: "Matériaux de restauration",
    description: "A universal composite designed for dependable shade matching across daily cases.",
    frenchDescription: "Un composite universel conçu pour une correspondance de teinte fiable au quotidien.",
    price: "44.50",
    sku: "NL-7772468",
    status: "In stock"
  },
  {
    id: "7772469",
    slug: "clearform-matrix-bands",
    name: "Clearform Matrix Bands",
    frenchName: "Bandes matricielles Clearform",
    brand: "Northline Dental",
    category: "Restorative materials",
    frenchCategory: "Matériaux de restauration",
    description: "Contour-friendly matrix bands for controlled proximal restorations.",
    frenchDescription: "Des bandes matricielles adaptées au contour pour des restaurations proximales contrôlées.",
    price: "18.75",
    sku: "NL-7772469",
    status: "Limited availability"
  }
];

const markets = {
  en: {
    code: "en-ca",
    label: "Canada, English",
    prefix: "en-ca",
    categoryPath: "dental/restorative-materials",
    home: "Home",
    dental: "Dental",
    category: "Restorative materials",
    languageLink: "fr-ca",
    languageLabel: "Français"
  },
  fr: {
    code: "fr-ca",
    label: "Canada, Français",
    prefix: "fr-ca",
    categoryPath: "dentaire/materiaux-de-restauration",
    home: "Accueil",
    dental: "Dentaire",
    category: "Matériaux de restauration",
    languageLink: "en-ca",
    languageLabel: "English"
  }
};

function absolute(path) {
  return `${siteUrl}${path}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function jsonLd(value) {
  return `<script type="application/ld+json">${JSON.stringify(value, null, 2)}</script>`;
}

function hreflangTags(pathEn, pathFr) {
  return [
    `<link rel="alternate" hreflang="en-ca" href="${absolute(pathEn)}" />`,
    `<link rel="alternate" hreflang="fr-ca" href="${absolute(pathFr)}" />`
  ].join("\n");
}

function head({ title, description, canonical, alternates = "", scripts = "", lang = "en" }) {
  return `<!doctype html>
<html lang="${lang}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="canonical" href="${canonical}" />
    ${alternates}
    ${scripts}
    <style>${css}</style>
  </head>`;
}

function shell({ body, lang = "en", title }) {
  return `${body}
    <footer class="site-footer">
      <strong>Index Lab</strong> is a small working model for learning how public commerce pages become legible to search engines.
    </footer>
    <script>
      document.querySelectorAll("[data-tab]").forEach((button) => {
        button.addEventListener("click", () => {
          document.querySelectorAll("[data-tab]").forEach((item) => item.classList.remove("active"));
          document.querySelectorAll("[data-panel]").forEach((item) => item.classList.remove("active"));
          button.classList.add("active");
          document.querySelector('[data-panel="' + button.dataset.tab + '"]').classList.add("active");
        });
      });
    </script>
  </body>
</html>`;
}

function header(active = "") {
  return `<header class="site-header">
    <a class="wordmark" href="${absolute("/")}"><span class="wordmark-mark"></span>Index Lab</a>
    <nav class="nav" aria-label="Primary navigation">
      <a href="${absolute("/en-ca/dental/restorative-materials/")}">English demo</a>
      <a href="${absolute("/fr-ca/dentaire/materiaux-de-restauration/")}">French demo</a>
      <a href="${absolute("/#how-it-works")}">How it works</a>
    </nav>
  </header>`;
}

function routeMap() {
  return `<div class="route-map" aria-label="SEO route map">
    <div class="route-label">The public route</div>
    <h2>Make the page legible before you make it visible.</h2>
    <div class="route-line">
      <div class="route-step"><span class="route-dot"></span><strong>robots</strong><span>access</span></div>
      <div class="route-step"><span class="route-dot"></span><strong>sitemap</strong><span>discovery</span></div>
      <div class="route-step"><span class="route-dot"></span><strong>category</strong><span>links</span></div>
      <div class="route-step"><span class="route-dot"></span><strong>product</strong><span>facts</span></div>
      <div class="route-step"><span class="route-dot"></span><strong>schema</strong><span>meaning</span></div>
    </div>
  </div>`;
}

function productPath(market, product) {
  return `/${market.prefix}/${market.categoryPath}/${product.slug}/${product.id}/`;
}

function categoryPath(market) {
  return `/${market.prefix}/${market.categoryPath}/`;
}

function categorySchema(market) {
  const path = categoryPath(market);
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: market.home, item: absolute(`/${market.prefix}/`) },
      { "@type": "ListItem", position: 2, name: market.dental, item: absolute(`/${market.prefix}/${market.dental === "Dental" ? "dental" : "dentaire"}/`) },
      { "@type": "ListItem", position: 3, name: market.category, item: absolute(path) }
    ]
  };
  const list = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: market.code === "en-ca" ? product.name : product.frenchName,
      url: absolute(productPath(market, product))
    }))
  };
  return `${jsonLd(breadcrumb)}${jsonLd(list)}`;
}

function productSchema(market, product) {
  const path = productPath(market, product);
  const name = market.code === "en-ca" ? product.name : product.frenchName;
  const description = market.code === "en-ca" ? product.description : product.frenchDescription;
  const category = market.code === "en-ca" ? product.category : product.frenchCategory;
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: market.home, item: absolute(`/${market.prefix}/`) },
      { "@type": "ListItem", position: 2, name: market.dental, item: absolute(`/${market.prefix}/${market.dental === "Dental" ? "dental" : "dentaire"}/`) },
      { "@type": "ListItem", position: 3, name: category, item: absolute(categoryPath(market)) },
      { "@type": "ListItem", position: 4, name, item: absolute(path) }
    ]
  };
  const productNode = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${absolute(path)}#product`,
    name,
    description,
    sku: product.sku,
    brand: { "@type": "Brand", name: product.brand },
    offers: {
      "@type": "Offer",
      url: absolute(path),
      priceCurrency: "CAD",
      price: product.price,
      availability: `https://schema.org/${product.status === "In stock" ? "InStock" : "LimitedAvailability"}`
    }
  };
  return `${jsonLd(breadcrumb)}${jsonLd(productNode)}`;
}

function categoryPage(market) {
  const enPath = categoryPath(markets.en);
  const frPath = categoryPath(markets.fr);
  const path = categoryPath(market);
  const description = market.code === "en-ca"
    ? "A category page that shows how visible links, BreadcrumbList, ItemList, canonical, and hreflang work together."
    : "Une page de catégorie qui montre comment les liens visibles, BreadcrumbList, ItemList, canonical et hreflang fonctionnent ensemble.";
  const cards = products.map((product) => {
    const name = market.code === "en-ca" ? product.name : product.frenchName;
    const itemPath = productPath(market, product);
    return `<a class="preview-link" href="${absolute(itemPath)}"><span>${escapeHtml(name)}</span><span aria-hidden="true">↗</span></a>`;
  }).join("");
  const body = `${head({
    title: `${market.category} | Index Lab`,
    description,
    canonical: absolute(path),
    alternates: hreflangTags(enPath, frPath),
    scripts: categorySchema(market),
    lang: market.code
  })}
  <body>
    ${header()}
    <main class="page-shell">
      <div class="page-header">
        <div class="kicker">Category page · ${market.label}</div>
        <div class="breadcrumb-line">${market.home} / ${market.dental} / ${market.category}</div>
        <h1>${escapeHtml(market.category)}</h1>
        <p>${escapeHtml(description)}</p>
      </div>
      <section class="preview-frame" aria-labelledby="category-products">
        <div class="browser-bar"><span class="browser-dot"></span><span class="browser-dot"></span><span class="browser-dot"></span><span class="preview-url">${absolute(path)}</span></div>
        <h2 id="category-products" style="font-size: 38px; margin-bottom: 10px;">Products on this page</h2>
        <p>These visible links are the source that the ItemList describes.</p>
        <div class="preview-links">${cards}</div>
      </section>
      <section class="explainer">
        <h3>Read the source, then read the meaning.</h3>
        <p>The browser can follow the product links. The BreadcrumbList explains where this page sits. The ItemList describes the products presented here. The canonical identifies this market page, and hreflang connects its French equivalent.</p>
        <div class="link-row"><a class="button-link" href="${absolute("/")}">Back to the lab</a><a class="button-link secondary" href="${absolute(`/fr-ca/dentaire/materiaux-de-restauration/`)}">Open French version</a></div>
      </section>
    </main>
    ${shell({ body: "", lang: market.code, title: market.category })}`;
  return body;
}

function productPage(market, product) {
  const enPath = productPath(markets.en, product);
  const frPath = productPath(markets.fr, product);
  const path = productPath(market, product);
  const name = market.code === "en-ca" ? product.name : product.frenchName;
  const description = market.code === "en-ca" ? product.description : product.frenchDescription;
  const category = market.code === "en-ca" ? product.category : product.frenchCategory;
  const body = `${head({
    title: `${name} | Index Lab`,
    description,
    canonical: absolute(path),
    alternates: hreflangTags(enPath, frPath),
    scripts: productSchema(market, product),
    lang: market.code
  })}
  <body>
    ${header()}
    <main class="page-shell">
      <div class="page-header">
        <div class="kicker">Product detail page · ${market.label}</div>
        <div class="breadcrumb-line">${market.home} / ${market.dental} / ${category} / ${name}</div>
      </div>
      <section class="product-grid">
        <div class="product-art" aria-label="Abstract product package illustration">
          <div class="product-pack"><small>NORTHLINE DENTAL</small><strong>${escapeHtml(name)}</strong></div>
        </div>
        <div class="product-detail">
          <div class="eyebrow">${escapeHtml(product.brand)} · ${escapeHtml(category)}</div>
          <h1>${escapeHtml(name)}</h1>
          <p class="description">${escapeHtml(description)}</p>
          <div class="product-meta"><div><span>SKU</span><strong>${escapeHtml(product.sku)}</strong></div><div><span>Page identity</span><strong>Self-canonical</strong></div><div><span>Market</span><strong>${market.code}</strong></div></div>
          <div class="price-row"><span class="price">$${escapeHtml(product.price)} CAD</span><span class="availability">${escapeHtml(product.status)}</span></div>
        </div>
      </section>
      <section class="explainer">
        <h3>What search engines can learn here</h3>
        <p>The visible product facts are repeated in Product JSON-LD. The page also carries a BreadcrumbList, a self-canonical URL, and reciprocal hreflang links to the equivalent market page. The offer contains public values only.</p>
        <div class="link-row"><a class="button-link" href="${absolute(categoryPath(market))}">Back to category</a><a class="button-link secondary" href="${absolute(market.code === "en-ca" ? frPath : enPath)}">Open equivalent market page</a></div>
      </section>
    </main>
    ${shell({ body: "", lang: market.code, title: name })}`;
  return body;
}

function homePage() {
  const body = `${head({
    title: "Index Lab | Learn SEO by inspecting the page",
    description: "A working ecommerce SEO lab for understanding crawl access, discovery, page meaning, and market relationships.",
    canonical: absolute("/")
  })}
  <body>
    ${header()}
    <main class="page-shell">
      <section class="hero">
        <div>
          <div class="kicker">A working SEO lab</div>
          <h1>Make the web legible to machines.</h1>
          <p class="lede">A category page is not just a list. A product page is not just a template. This lab lets you inspect the small agreements that make commerce content discoverable, understandable, and market-aware.</p>
          <p class="hero-note">Open a page. View its source. Follow the route from crawl access to product meaning.</p>
        </div>
        ${routeMap()}
      </section>

      <section class="section-rule" id="how-it-works">
        <div class="section-heading"><h2>Four signals, one public page.</h2><p>The important part is not the vocabulary. It is how each signal answers a different question.</p></div>
        <div class="concept-grid">
          <article class="concept-card"><div class="tag">01 · Access</div><h3>Can a crawler request it?</h3><p><code>robots.txt</code> sets the crawl boundary. It is a public instruction, not a privacy wall.</p></article>
          <article class="concept-card"><div class="tag">02 · Discovery</div><h3>How does it find it?</h3><p>The sitemap lists public canonical URLs. Normal HTML links connect categories to products.</p></article>
          <article class="concept-card"><div class="tag">03 · Meaning</div><h3>What is this page?</h3><p>Product, BreadcrumbList, and ItemList structured data add machine-readable meaning to visible content.</p></article>
        </div>
      </section>

      <section class="section-rule">
        <div class="section-heading"><h2>Inspect a live relationship.</h2><p>Choose a layer. The code on the right is the output that belongs to the page on the left.</p></div>
        <div class="inspect-grid">
          <div class="preview-frame">
            <div class="browser-bar"><span class="browser-dot"></span><span class="browser-dot"></span><span class="browser-dot"></span><span class="preview-url">/en-ca/dental/restorative-materials/</span></div>
            <div class="crumbs">Home / Dental / Restorative materials</div>
            <h3>Restorative materials</h3>
            <p>A category page makes its product relationships visible through ordinary links.</p>
            <div class="preview-links"><a class="preview-link" href="${absolute("/en-ca/dental/restorative-materials/")}"><span>Open the category page</span><span aria-hidden="true">↗</span></a><a class="preview-link" href="${absolute(productPath(markets.en, products[0]))}"><span>Open the product page</span><span aria-hidden="true">↗</span></a></div>
          </div>
          <div class="code-panel">
            <div class="code-tabs" role="tablist" aria-label="SEO code examples"><button class="code-tab active" data-tab="links" role="tab">HTML links</button><button class="code-tab" data-tab="list" role="tab">ItemList</button><button class="code-tab" data-tab="product" role="tab">Product</button></div>
            <p class="code-copy">The visible page and its machine-readable description should agree. Change tabs to see how the layers relate.</p>
            <div class="code-block active" data-panel="links">&lt;a href="/en-ca/dental/p/aquaform-flowable-composite/7772467/"&gt;
  Aquaform Flowable Composite
&lt;/a&gt;</div>
            <div class="code-block" data-panel="list">{
  "@type": "<span class="token-type">ItemList</span>",
  "itemListElement": [{
    "@type": "<span class="token-type">ListItem</span>",
    "position": 1,
    "url": "<span class="token-string">.../7772467/</span>"
  }]
}</div>
            <div class="code-block" data-panel="product">{
  "@type": "<span class="token-type">Product</span>",
  "name": "<span class="token-string">Aquaform Flowable Composite</span>",
  "sku": "<span class="token-string">NL-7772467</span>",
  "offers": { "price": "<span class="token-string">39.99</span>" }
}</div>
          </div>
        </div>
      </section>

      <section class="section-rule">
        <div class="section-heading"><h2>Learn by tracing the page.</h2><p>The demo keeps the rules inspectable. Every page has a job, and every output has a place.</p></div>
        <div class="learning-grid">
          <div class="learning-copy"><h3>Start with the category.</h3><p>Open the English or French category page. Read the visible links, then inspect its canonical, market alternates, BreadcrumbList, and ItemList. Open a product. Compare the visible facts with Product JSON-LD.</p><div class="link-row"><a class="button-link" href="${absolute(categoryPath(markets.en))}">English category</a><a class="button-link secondary" href="${absolute(categoryPath(markets.fr))}">French category</a></div></div>
          <div class="check-list"><strong>Check the source</strong><ul><li>Canonical matches the page</li><li>Market alternates are reciprocal</li><li>JSON-LD matches visible facts</li><li>Offer values are public</li><li>Sitemap lists the public URL</li></ul></div>
        </div>
      </section>
    </main>
    ${shell({ body: "", lang: "en", title: "Index Lab" })}`;
  return body;
}

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await mkdir(join(dist, "en-ca", "dental", "restorative-materials"), { recursive: true });
await mkdir(join(dist, "fr-ca", "dentaire", "materiaux-de-restauration"), { recursive: true });

await writeFile(join(dist, "index.html"), homePage());
await writeFile(join(dist, "en-ca", "dental", "restorative-materials", "index.html"), categoryPage(markets.en));
await writeFile(join(dist, "fr-ca", "dentaire", "materiaux-de-restauration", "index.html"), categoryPage(markets.fr));

for (const market of Object.values(markets)) {
  for (const product of products) {
    const target = join(dist, productPath(market, product));
    await mkdir(target, { recursive: true });
    await writeFile(join(target, "index.html"), productPage(market, product));
  }
}

await writeFile(join(dist, "styles.css"), css);

const publicPaths = [
  "/",
  categoryPath(markets.en),
  categoryPath(markets.fr),
  ...Object.values(markets).flatMap((market) => products.map((product) => productPath(market, product)))
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${publicPaths.map((path) => `  <url><loc>${absolute(path)}</loc></url>`).join("\n")}\n</urlset>\n`;
const robots = `User-agent: *\nAllow: /\nDisallow: /private/\n\nSitemap: ${absolute("/sitemap.xml")}\n`;
await writeFile(join(dist, "sitemap.xml"), sitemap);
await writeFile(join(dist, "robots.txt"), robots);

console.log(`Built ${publicPaths.length} public pages at ${dist}`);
