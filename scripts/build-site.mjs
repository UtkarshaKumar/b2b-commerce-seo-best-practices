import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const dist = join(projectRoot, "dist");
const src = join(projectRoot, "src");
const siteUrl = (process.env.SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:4173")).replace(/\/$/, "");
const css = await readFile(join(src, "styles.css"), "utf8");
const catalog = JSON.parse(await readFile(join(src, "catalog.json"), "utf8"));

const markets = {
  en: {
    code: "en-ca", prefix: "en-ca", label: "Canada, English", categoryRoot: "dental", home: "Home", dental: "Dental",
    languageLink: "fr-ca", languageLabel: "Français", searchPlaceholder: "Search products, brands, or SKUs", shop: "Shop", brands: "Brands", equipment: "Equipment", resources: "Clinical resources", promotions: "Promotions", allCategories: "All dental supplies", categoryCountLabel: "products", resultLabel: "products", addToCart: "Add to cart", addToList: "Add to list", secure: "Secure ordering", fulfillment: "Fast fulfillment", support: "Practice support", quantity: "Quantity", productDetails: "Product details", ordering: "Ordering information", seoSignals: "SEO signals", related: "You may also need", filters: "Filter results", availability: "Availability", brandsFilter: "Brand", packSize: "Pack size", sortBy: "Sort by", featured: "Featured", inStock: "In stock", catalogDescription: "Order dental supplies, instruments, infection control, and equipment for your practice.", learnTitle: "A commerce page with inspectable SEO signals", learnCopy: "The storefront is the primary experience. The page signals stay close enough to inspect: crawl access, discoverable links, market alternates, canonical URLs, BreadcrumbList, ItemList, and Product JSON-LD."
  },
  fr: {
    code: "fr-ca", prefix: "fr-ca", label: "Canada, Français", categoryRoot: "dentaire", home: "Accueil", dental: "Dentaire",
    languageLink: "en-ca", languageLabel: "English", searchPlaceholder: "Rechercher des produits, marques ou SKU", shop: "Boutique", brands: "Marques", equipment: "Équipement", resources: "Ressources cliniques", promotions: "Promotions", allCategories: "Fournitures dentaires", categoryCountLabel: "produits", resultLabel: "produits", addToCart: "Ajouter au panier", addToList: "Ajouter à la liste", secure: "Commande sécurisée", fulfillment: "Expédition rapide", support: "Soutien au cabinet", quantity: "Quantité", productDetails: "Détails du produit", ordering: "Informations de commande", seoSignals: "Signaux SEO", related: "Vous pourriez aussi avoir besoin de", filters: "Filtrer les résultats", availability: "Disponibilité", brandsFilter: "Marque", packSize: "Format", sortBy: "Trier par", featured: "En vedette", inStock: "En stock", catalogDescription: "Commandez des fournitures, instruments, produits de contrôle des infections et équipements dentaires.", learnTitle: "Une page de commerce avec des signaux SEO inspectables", learnCopy: "La boutique est l'expérience principale. Les signaux restent faciles à inspecter: accès d'exploration, liens découvrables, marchés alternatifs, URL canoniques, BreadcrumbList, ItemList et Product JSON-LD."
  }
};

function absolute(path) { return `${siteUrl}${path}`; }
function escapeHtml(value) { return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
function jsonLd(value) { return `<script type="application/ld+json">${JSON.stringify(value, null, 2)}</script>`; }
function otherMarket(market) { return market.code === markets.en.code ? markets.fr : markets.en; }
function categoryForProduct(product) { return catalog.categories.find((category) => category.slug === product.category); }
function categoryLabelFor(market, category) { return market.code === markets.en.code ? category.label : category.frenchLabel; }
function nameFor(market, product) { return market.code === markets.en.code ? product.name : product.frenchName; }
function descriptionFor(market, product) { return market.code === markets.en.code ? product.description : product.frenchDescription; }
function categoryDescriptionFor(market, product) { return market.code === markets.en.code ? product.categoryDescription : product.frenchCategoryDescription; }
function departmentPath(market) { return `/${market.prefix}/${market.categoryRoot}/`; }
function categoryPath(market, category) { return `/${market.prefix}/${market.categoryRoot}/${market.code === markets.en.code ? category.slug : category.frenchSlug}/`; }
function productPath(market, product) { return `${categoryPath(market, categoryForProduct(product))}${product.slug}/${product.id}/`; }
function categoryProducts(category) { return catalog.products.filter((product) => product.category === category.slug); }
function hreflangTags(pathEn, pathFr) { return [`<link rel="alternate" hreflang="en-ca" href="${absolute(pathEn)}" />`, `<link rel="alternate" hreflang="fr-ca" href="${absolute(pathFr)}" />`].join("\n"); }

function head({ title, description, canonical, alternates = "", scripts = "", lang = "en-ca" }) {
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}" /><link rel="canonical" href="${canonical}" />${alternates}${scripts}<style>${css}</style></head>`;
}

function shell({ market, body }) {
  return `${body}<footer class="site-footer"><div><strong>Northline Dental Supply</strong><span>Professional ordering for modern practices.</span></div><div class="footer-links"><a href="${absolute("/robots.txt")}">Crawl policy</a><a href="${absolute("/sitemap.xml")}">XML sitemap</a><a href="${absolute("/")}">SEO learning lab</a></div></footer><script>
let cartCount = 0;
const cartLabel = document.querySelector("[data-cart-count]");
document.querySelectorAll("[data-add-to-cart]").forEach((button) => { button.setAttribute("data-original-label", button.textContent); button.addEventListener("click", () => { cartCount += 1; if (cartLabel) cartLabel.textContent = cartCount; button.textContent = "Added"; button.classList.add("is-added"); window.setTimeout(() => { button.textContent = button.getAttribute("data-original-label"); button.classList.remove("is-added"); }, 1400); }); });
document.querySelectorAll("[data-filter]").forEach((button) => { button.addEventListener("click", () => { document.querySelectorAll("[data-filter]").forEach((item) => item.classList.remove("is-selected")); button.classList.add("is-selected"); const filter = button.getAttribute("data-filter"); document.querySelectorAll("[data-availability]").forEach((card) => { card.hidden = filter !== "all" && card.getAttribute("data-availability") !== filter; }); }); });
document.querySelectorAll("[data-tab]").forEach((button) => { button.addEventListener("click", () => { document.querySelectorAll("[data-tab]").forEach((item) => item.classList.remove("active")); document.querySelectorAll("[data-panel]").forEach((item) => item.classList.remove("active")); button.classList.add("active"); document.querySelector('[data-panel="' + button.getAttribute("data-tab") + '"]').classList.add("active"); }); });
</script></body></html>`;
}

function header(market, active = "shop") {
  const equipment = catalog.categories.find((category) => category.slug === "dental-equipment");
  return `<div class="utility-bar"><div class="utility-inner"><span>Professional dental supplies for Canada</span><nav aria-label="Utility navigation"><a href="${absolute(`/${market.prefix}/`)}">${market.label}</a><a href="${absolute(`/${market.prefix}/`)}">Order history</a><a href="${absolute(`/${market.prefix}/`)}">Help centre</a></nav></div></div><header class="site-header"><div class="header-main"><a class="wordmark" href="${absolute(`/${market.prefix}/`)}"><span class="wordmark-mark"><span></span><span></span><span></span></span><span>Northline <b>Dental Supply</b></span></a><form class="site-search" action="${absolute(`/${market.prefix}/`)}" role="search"><label class="sr-only" for="site-search">${escapeHtml(market.searchPlaceholder)}</label><input id="site-search" type="search" placeholder="${escapeHtml(market.searchPlaceholder)}" /><button type="submit" aria-label="Search">⌕</button></form><div class="header-actions"><a class="account-link" href="${absolute(`/${market.prefix}/`)}"><span class="action-icon">♙</span><span>Account</span></a><a class="cart-link" href="${absolute(`/${market.prefix}/`)}"><span class="action-icon">▢</span><span>Cart <b data-cart-count>0</b></span></a></div></div><nav class="primary-nav" aria-label="Primary navigation"><a class="${active === "shop" ? "active" : ""}" href="${absolute(`/${market.prefix}/`)}">${market.shop}</a><a href="${absolute(`/${market.prefix}/`)}">${market.brands}</a><a class="${active === "equipment" ? "active" : ""}" href="${absolute(categoryPath(market, equipment))}">${market.equipment}</a><a href="${absolute(`/${market.prefix}/`)}">${market.resources}</a><a href="${absolute(`/${market.prefix}/`)}">${market.promotions}</a><a class="market-switch" href="${absolute(`/${otherMarket(market).prefix}/`)}">${market.languageLabel}</a></nav></header>`;
}

function breadcrumbs(market, category, product = null) {
  const items = [{ label: market.home, path: `/${market.prefix}/` }, { label: market.dental, path: departmentPath(market) }, { label: categoryLabelFor(market, category), path: categoryPath(market, category) }];
  if (product) items.push({ label: nameFor(market, product), path: productPath(market, product) });
  return `<nav class="breadcrumbs" aria-label="Breadcrumb">${items.map((item, index) => `${index ? `<span aria-hidden="true">›</span>` : ""}<a href="${absolute(item.path)}">${escapeHtml(item.label)}</a>`).join("")}</nav>`;
}

function breadcrumbSchema(market, category, product = null) {
  const items = [{ name: market.home, item: absolute(`/${market.prefix}/`) }, { name: market.dental, item: absolute(departmentPath(market)) }, { name: categoryLabelFor(market, category), item: absolute(categoryPath(market, category)) }];
  if (product) items.push({ name: nameFor(market, product), item: absolute(productPath(market, product)) });
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, item: item.item })) };
}

function categorySchema(market, category) {
  const products = categoryProducts(category);
  return `${jsonLd(breadcrumbSchema(market, category))}${jsonLd({ "@context": "https://schema.org", "@type": "ItemList", itemListOrder: "https://schema.org/ItemListOrderAscending", numberOfItems: products.length, itemListElement: products.map((product, index) => ({ "@type": "ListItem", position: index + 1, name: nameFor(market, product), url: absolute(productPath(market, product)) })) })}`;
}

function productSchema(market, product, category) {
  const path = productPath(market, product);
  const node = { "@context": "https://schema.org", "@type": "Product", "@id": `${absolute(path)}#product`, name: nameFor(market, product), description: descriptionFor(market, product), sku: product.sku, brand: { "@type": "Brand", name: product.brand }, category: categoryLabelFor(market, category), aggregateRating: { "@type": "AggregateRating", ratingValue: product.rating, reviewCount: product.reviewCount }, offers: { "@type": "Offer", url: absolute(path), priceCurrency: product.currency, price: product.price.toFixed(2), availability: `https://schema.org/${product.availability}`, itemCondition: "https://schema.org/NewCondition" } };
  return `${jsonLd(breadcrumbSchema(market, category, product))}${jsonLd(node)}`;
}

function productVisual(product, size = "card") {
  const category = categoryForProduct(product);
  const initials = category.label.split(" ").map((word) => word[0]).join("").slice(0, 3);
  return `<div class="product-visual ${size} tone-${product.color}" aria-label="${escapeHtml(product.name)} product image"><div class="visual-topline">${escapeHtml(product.brand)}</div><div class="visual-mark">${escapeHtml(initials)}</div><div class="visual-name">${escapeHtml(product.name.replace(`${product.brand} `, ""))}</div><div class="visual-pack">${escapeHtml(product.packSize)}</div></div>`;
}

function ratingMarkup(product) {
  return `<span class="rating" aria-label="${product.rating} out of 5 stars"><span>★★★★★</span> <b>${product.rating}</b> <em>(${product.reviewCount})</em></span>`;
}

function productCard(market, product) {
  const path = productPath(market, product);
  return `<article class="product-card" data-availability="${product.availability}"><a class="product-card-link" href="${absolute(path)}">${productVisual(product)}<div class="product-card-copy"><div class="product-brand">${escapeHtml(product.brand)}</div><h3>${escapeHtml(nameFor(market, product))}</h3><div class="product-sku">SKU ${escapeHtml(product.sku)}</div>${ratingMarkup(product)}</div></a><div class="product-card-buy"><div><strong>$${product.price.toFixed(2)}</strong><span>CAD / ${escapeHtml(product.unit)}</span></div><button type="button" data-add-to-cart>${escapeHtml(market.addToCart)}</button></div><div class="stock ${product.availability.toLowerCase()}"><span></span>${escapeHtml(product.availability === "InStock" ? market.inStock : product.availability === "BackOrder" ? "Usually ships in 5 to 7 days" : "Temporarily unavailable")}</div></article>`;
}

function signalPanel(market, path, kind) {
  const example = catalog.products[0];
  const alternate = kind === "category" ? categoryPath(otherMarket(market), categoryForProduct(example)) : productPath(otherMarket(market), example);
  return `<aside class="signal-panel"><div class="signal-panel-head"><span class="signal-pulse"></span><strong>${escapeHtml(market.seoSignals)}</strong><span class="live-label">Live page</span></div><p>These implementation signals sit behind the visible commerce experience.</p><div class="signal-list"><div><span>Canonical</span><code>${escapeHtml(path)}</code><b>PASS</b></div><div><span>hreflang</span><code>${escapeHtml(alternate)}</code><b>PASS</b></div><div><span>Structured data</span><code>${kind === "category" ? "BreadcrumbList + ItemList" : "BreadcrumbList + Product"}</code><b>PASS</b></div><div><span>Public links</span><code>${kind === "category" ? "product cards" : "category trail"}</code><b>PASS</b></div></div><a class="text-link" href="${absolute("/")}#inspect">Inspect the learning notes <span>↗</span></a></aside>`;
}

function categoryCards(market) {
  return catalog.categories.map((category) => { const products = categoryProducts(category); const path = categoryPath(market, category); return `<a class="category-tile" href="${absolute(path)}"><span class="category-icon icon-${products[0].color}">${escapeHtml(category.label.slice(0, 2).toUpperCase())}</span><span><strong>${escapeHtml(categoryLabelFor(market, category))}</strong><small>${products.length} ${escapeHtml(market.categoryCountLabel)}</small></span><span class="tile-arrow">↗</span></a>`; }).join("");
}

function marketHomePage(market) {
  const popular = catalog.products.slice(0, 6);
  const path = `/${market.prefix}/`;
  const otherPath = `/${otherMarket(market).prefix}/`;
  const body = `${head({ title: `${market.allCategories} | Northline Dental Supply`, description: market.catalogDescription, canonical: absolute(path), alternates: hreflangTags(path, otherPath), lang: market.code })}<body>${header(market)}<main class="commerce-shell"><div class="breadcrumbs"><a href="${absolute(path)}">${escapeHtml(market.home)}</a></div><section class="storefront-hero"><div class="hero-copy"><div class="eyebrow">NORTHLINE DENTAL SUPPLY</div><h1>Everything your practice needs to keep moving.</h1><p>${escapeHtml(market.catalogDescription)} Browse trusted categories, compare pack sizes, and order with confidence.</p><div class="hero-actions"><a class="button primary" href="#categories">Browse all supplies <span>↗</span></a><a class="button ghost" href="#popular">View popular products</a></div><div class="hero-proof"><span><b>360</b> products</span><span><b>10</b> clinical categories</span><span><b>2</b> market languages</span></div></div><div class="hero-card"><div class="hero-card-top"><span>Practice essentials</span><span class="hero-card-badge">Ready to ship</span></div><div class="hero-product-stack"><div class="stack-card stack-back"></div><div class="stack-card stack-mid"></div><div class="stack-card stack-front"><span>NL</span><strong>CLINIC<br />READY</strong><small>Care supplies for every operatory</small></div></div><div class="hero-card-bottom"><span>Curated for Canadian practices</span><span>Explore collection →</span></div></div></section><section class="trust-strip"><div><span class="trust-icon">✓</span><strong>${escapeHtml(market.secure)}</strong><small>Built for professional buyers</small></div><div><span class="trust-icon">↗</span><strong>${escapeHtml(market.fulfillment)}</strong><small>Clear availability by product</small></div><div><span class="trust-icon">◎</span><strong>${escapeHtml(market.support)}</strong><small>Resources for better ordering</small></div></section><section class="storefront-section" id="categories"><div class="section-title-row"><div><div class="eyebrow">SHOP BY NEED</div><h2>${escapeHtml(market.allCategories)}</h2></div><a class="text-link" href="#categories">View all categories <span>↗</span></a></div><div class="category-grid">${categoryCards(market)}</div></section><section class="storefront-section" id="popular"><div class="section-title-row"><div><div class="eyebrow">ORDERING FAVOURITES</div><h2>Popular with practices like yours</h2></div><a class="text-link" href="${absolute(categoryPath(market, categoryForProduct(popular[0])))}">Shop restorative materials <span>↗</span></a></div><div class="product-grid home-product-grid">${popular.map((product) => productCard(market, product)).join("")}</div></section><section class="learning-section" id="how-it-works"><div class="learning-copy"><div class="eyebrow">SEO LEARNING LAYER</div><h2>${escapeHtml(market.learnTitle)}</h2><p>${escapeHtml(market.learnCopy)}</p><div class="crawl-path"><span><b>01</b> Access</span><i>→</i><span><b>02</b> Discover</span><i>→</i><span><b>03</b> Describe</span><i>→</i><span><b>04</b> Connect markets</span></div></div><div class="learning-code"><div class="code-window-bar"><span></span><span></span><span></span><small>page-signals.jsonld</small></div><pre><code><span class="code-key">"@type"</span>: <span class="code-string">"Product"</span>,\n<span class="code-key">"name"</span>: <span class="code-string">"${escapeHtml(popular[0].name)}"</span>,\n<span class="code-key">"sku"</span>: <span class="code-string">"${escapeHtml(popular[0].sku)}"</span>,\n<span class="code-key">"offers"</span>: {\n  <span class="code-key">"price"</span>: <span class="code-number">"${popular[0].price.toFixed(2)}"</span>,\n  <span class="code-key">"availability"</span>: <span class="code-string">"InStock"</span>\n}</code></pre><a href="${absolute("/")}#inspect" class="code-link">Open the inspection guide <span>↗</span></a></div></section></main>${shell({ market, body: "" })}`;
  return body;
}

function departmentSchema(market) {
  return `${jsonLd({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: market.home, item: absolute(`/${market.prefix}/`) }, { "@type": "ListItem", position: 2, name: market.dental, item: absolute(departmentPath(market)) }] })}${jsonLd({ "@context": "https://schema.org", "@type": "ItemList", itemListOrder: "https://schema.org/ItemListOrderAscending", numberOfItems: catalog.categories.length, itemListElement: catalog.categories.map((category, index) => ({ "@type": "ListItem", position: index + 1, name: categoryLabelFor(market, category), url: absolute(categoryPath(market, category)) })) })}`;
}

function departmentPage(market) {
  const path = departmentPath(market);
  const otherPath = departmentPath(otherMarket(market));
  const body = `${head({ title: `${market.dental} supplies | Northline Dental Supply`, description: market.catalogDescription, canonical: absolute(path), alternates: hreflangTags(path, otherPath), scripts: departmentSchema(market), lang: market.code })}<body>${header(market)}<main class="commerce-shell"><nav class="breadcrumbs" aria-label="Breadcrumb"><a href="${absolute(`/${market.prefix}/`)}">${escapeHtml(market.home)}</a><span aria-hidden="true">›</span><a href="${absolute(path)}">${escapeHtml(market.dental)}</a></nav><section class="category-heading"><div><div class="eyebrow">NORTHLINE DENTAL SUPPLY / ${escapeHtml(market.dental.toUpperCase())}</div><h1>${escapeHtml(market.allCategories)}</h1><p>${escapeHtml(market.catalogDescription)} Browse by clinical need, then compare products, pack sizes, availability, and public pricing.</p></div><div class="category-heading-aside"><strong>10</strong><span>clinical<br />categories</span></div></section><section class="department-panel"><div class="section-title-row"><div><div class="eyebrow">SHOP BY CLINICAL NEED</div><h2>Find the right starting point.</h2></div><span class="department-count">360 catalog products</span></div><div class="category-grid">${categoryCards(market)}</div></section><section class="department-learning"><div><div class="eyebrow">PAGE SIGNALS</div><h2>One department, many discoverable routes.</h2><p>This department page links to each category. Each category links to its product pages and describes the same visible list with ItemList structured data.</p></div>${signalPanel(market, path, "category")}</section></main>${shell({ market, body: "" })}`;
  return body;
}

function categoryPage(market, category) {
  const path = categoryPath(market, category);
  const otherPath = categoryPath(otherMarket(market), category);
  const products = categoryProducts(category);
  const brands = [...new Set(products.map((product) => product.brand))].slice(0, 5);
  const stockCount = (status) => products.filter((product) => product.availability === status).length;
  const body = `${head({ title: `${categoryLabelFor(market, category)} | Northline Dental Supply`, description: category.description, canonical: absolute(path), alternates: hreflangTags(path, otherPath), scripts: categorySchema(market, category), lang: market.code })}<body>${header(market, category.slug === "dental-equipment" ? "equipment" : "shop")}<main class="commerce-shell">${breadcrumbs(market, category)}<section class="category-heading"><div><div class="eyebrow">SHOP / ${escapeHtml(categoryLabelFor(market, category).toUpperCase())}</div><h1>${escapeHtml(categoryLabelFor(market, category))}</h1><p>${escapeHtml(market.code === markets.en.code ? category.description : category.frenchCategoryDescription)}</p></div><div class="category-heading-aside"><strong>${products.length}</strong><span>${escapeHtml(market.resultLabel)}<br />in this category</span></div></section><div class="category-layout"><aside class="filter-sidebar"><div class="filter-heading"><strong>${escapeHtml(market.filters)}</strong><a href="${absolute(path)}">Clear</a></div><div class="filter-group"><h3>${escapeHtml(market.availability)}</h3><button class="filter-choice is-selected" data-filter="all">All products <span>${products.length}</span></button><button class="filter-choice" data-filter="InStock">${escapeHtml(market.inStock)} <span>${stockCount("InStock")}</span></button><button class="filter-choice" data-filter="BackOrder">Ships later <span>${stockCount("BackOrder")}</span></button><button class="filter-choice" data-filter="OutOfStock">Unavailable <span>${stockCount("OutOfStock")}</span></button></div><div class="filter-group"><h3>${escapeHtml(market.brandsFilter)}</h3>${brands.map((brand) => `<label class="check-choice"><input type="checkbox" /> <span>${escapeHtml(brand)}</span><small>${products.filter((product) => product.brand === brand).length}</small></label>`).join("")}</div><div class="filter-group"><h3>${escapeHtml(market.packSize)}</h3><label class="check-choice"><input type="checkbox" /> <span>Boxed products</span></label><label class="check-choice"><input type="checkbox" /> <span>Single units</span></label></div><div class="sidebar-note"><span class="signal-pulse"></span><strong>Buying for a practice?</strong><p>Sign in to see account pricing and order history.</p><a href="${absolute(`/${market.prefix}/`)}">Sign in <span>↗</span></a></div></aside><section class="category-results"><div class="results-toolbar"><span><strong>1 to ${products.length}</strong> of ${products.length} ${escapeHtml(market.resultLabel)}</span><label>${escapeHtml(market.sortBy)} <select><option>${escapeHtml(market.featured)}</option><option>Price: low to high</option><option>Price: high to low</option></select></label></div><div class="product-grid">${products.map((product) => productCard(market, product)).join("")}</div><div class="category-bottom-note"><div><strong>Showing the full category list</strong><span>Visible product links support discovery. ItemList describes the same list in structured data.</span></div>${signalPanel(market, path, "category")}</div></section></div></main>${shell({ market, body: "" })}`;
  return body;
}

function productPage(market, product) {
  const category = categoryForProduct(product);
  const path = productPath(market, product);
  const otherPath = productPath(otherMarket(market), product);
  const related = categoryProducts(category).filter((item) => item.id !== product.id).slice(0, 4);
  const body = `${head({ title: `${nameFor(market, product)} | Northline Dental Supply`, description: descriptionFor(market, product), canonical: absolute(path), alternates: hreflangTags(path, otherPath), scripts: productSchema(market, product, category), lang: market.code })}<body>${header(market, "shop")}<main class="commerce-shell">${breadcrumbs(market, category, product)}<section class="product-detail-layout"><div class="product-gallery"><div class="gallery-main">${productVisual(product, "large")}<span class="gallery-label">Professional supply</span></div><div class="gallery-thumbs"><button class="thumb active">${productVisual(product, "thumb")}</button><button class="thumb">Package details</button><button class="thumb">Usage guide</button></div></div><div class="product-information"><div class="eyebrow">${escapeHtml(product.brand)} / ${escapeHtml(categoryLabelFor(market, category))}</div><h1>${escapeHtml(nameFor(market, product))}</h1><div class="product-rating-line">${ratingMarkup(product)} <span class="verified-badge">✓ Verified buyer reviews</span></div><div class="detail-divider"></div><p class="product-description">${escapeHtml(descriptionFor(market, product))}</p><dl class="product-facts"><div><dt>SKU</dt><dd>${escapeHtml(product.sku)}</dd></div><div><dt>Pack size</dt><dd>${escapeHtml(product.packSize)}</dd></div><div><dt>Brand</dt><dd>${escapeHtml(product.brand)}</dd></div></dl><div class="buy-box"><div class="buy-price"><strong>$${product.price.toFixed(2)}</strong><span>CAD / ${escapeHtml(product.unit)}</span></div><div class="availability-line ${product.availability.toLowerCase()}"><span></span>${escapeHtml(product.availability === "InStock" ? market.inStock : product.availability === "BackOrder" ? "Usually ships in 5 to 7 days" : "Temporarily unavailable")}</div><div class="purchase-row"><label>${escapeHtml(market.quantity)}<select><option>1</option><option>2</option><option>3</option><option>4</option></select></label><button class="button primary add-button" type="button" data-add-to-cart>${escapeHtml(market.addToCart)}</button></div><button class="list-button" type="button">♡ ${escapeHtml(market.addToList)}</button></div><div class="delivery-note"><span>▣</span><div><strong>Order today, plan with confidence</strong><small>Availability and public pricing are shown on this page before sign in.</small></div></div></div></section><section class="product-lower"><div class="product-tabs"><div class="code-tabs" role="tablist" aria-label="Product information"><button class="code-tab active" data-tab="details" role="tab">${escapeHtml(market.productDetails)}</button><button class="code-tab" data-tab="ordering" role="tab">${escapeHtml(market.ordering)}</button><button class="code-tab" data-tab="signals" role="tab">${escapeHtml(market.seoSignals)}</button></div><div class="tab-panel active" data-panel="details"><h2>Built for the daily workflow</h2><p>${escapeHtml(categoryDescriptionFor(market, product))} This product page keeps the product name, SKU, brand, pack size, price, and availability visible for buyers and consistent with the machine-readable product description.</p><div class="detail-columns"><div><strong>Product category</strong><span>${escapeHtml(categoryLabelFor(market, category))}</span></div><div><strong>Pack format</strong><span>${escapeHtml(product.packSize)}</span></div><div><strong>Customer rating</strong><span>${product.rating} out of 5</span></div></div></div><div class="tab-panel" data-panel="ordering"><h2>Ordering information</h2><p>Public catalog values are available before sign in. Account-specific pricing, contract terms, and order history belong behind the customer account experience.</p></div><div class="tab-panel" data-panel="signals"><h2>What search engines can learn</h2><p>Product JSON-LD describes the visible product. BreadcrumbList describes page position. Canonical and hreflang connect this page to its preferred URL and French equivalent.</p><div class="signal-inline"><span>Canonical</span><code>${escapeHtml(path)}</code><b>PASS</b></div><div class="signal-inline"><span>French equivalent</span><code>${escapeHtml(otherPath)}</code><b>PASS</b></div></div></div>${signalPanel(market, path, "product")}</section><section class="storefront-section related-section"><div class="section-title-row"><div><div class="eyebrow">COMPLETE THE ORDER</div><h2>${escapeHtml(market.related)}</h2></div><a class="text-link" href="${absolute(categoryPath(market, category))}">Back to category <span>↗</span></a></div><div class="product-grid">${related.map((item) => productCard(market, item)).join("")}</div></section></main>${shell({ market, body: "" })}`;
  return body;
}

function rootHomePage() {
  const enCategory = categoryPath(markets.en, catalog.categories[0]);
  const frCategory = categoryPath(markets.fr, catalog.categories[0]);
  const body = `${head({ title: "Northline Dental Supply | SEO learning lab", description: "A working B2B commerce experience with inspectable SEO signals across category and product pages.", canonical: absolute("/") })}<body>${header(markets.en)}<main class="lab-shell"><section class="lab-hero"><div><div class="eyebrow">COMMERCE SEO FIELD GUIDE</div><h1>See how an enterprise catalog becomes a page search engines can understand.</h1><p>Browse the storefront first. Then inspect how crawl access, internal links, canonical URLs, market alternates, BreadcrumbList, ItemList, and Product JSON-LD work together.</p><div class="hero-actions"><a class="button primary" href="${absolute("/en-ca/")}">Enter the storefront <span>↗</span></a><a class="button ghost" href="#inspect">Inspect the implementation</a></div></div><div class="lab-hero-card"><div class="lab-card-kicker">LIVE ROUTE</div><strong>Route and product data</strong><span>↓</span><strong>Product page component</strong><span>↓</span><strong>Visible HTML + JSON-LD</strong><span>↓</span><strong>Analytics and review calls</strong></div></section><section class="lab-stats"><div><strong>360</strong><span>catalog products</span></div><div><strong>10</strong><span>category routes</span></div><div><strong>2</strong><span>market variants</span></div><div><strong>1</strong><span>inspectable build</span></div></section><section class="lab-section" id="inspect"><div class="lab-section-heading"><div><div class="eyebrow">START HERE</div><h2>Trace one category into one product.</h2></div><p>Use the working pages as the artifact. View source and compare the visible page to the structured data blocks.</p></div><div class="lab-route-cards"><a href="${absolute(enCategory)}"><span class="route-number">01</span><strong>English category</strong><small>Internal links, ItemList, BreadcrumbList, canonical, hreflang</small><span class="route-arrow">↗</span></a><a href="${absolute(frCategory)}"><span class="route-number">02</span><strong>French category</strong><small>Equivalent market route with its own language and canonical</small><span class="route-arrow">↗</span></a><a href="${absolute("/robots.txt")}"><span class="route-number">03</span><strong>Crawl policy</strong><small>Open robots.txt and follow its sitemap reference</small><span class="route-arrow">↗</span></a></div></section><section class="lab-section lab-concepts"><div class="lab-section-heading"><div><div class="eyebrow">THE CORE CONCEPTS</div><h2>Four page agreements.</h2></div></div><div class="concept-list"><article><span>01</span><div><h3>Access</h3><p><code>robots.txt</code> sets the crawl boundary. It does not hide private information.</p></div></article><article><span>02</span><div><h3>Discovery</h3><p><code>sitemap.xml</code> lists public canonical URLs. HTML links connect category pages to product pages.</p></div></article><article><span>03</span><div><h3>Meaning</h3><p>Product, BreadcrumbList, and ItemList structured data describe visible page relationships.</p></div></article><article><span>04</span><div><h3>Market fit</h3><p>Canonical and hreflang express the preferred URL and the equivalent language or regional page.</p></div></article></div></section></main>${shell({ market: markets.en, body: "" })}`;
  return body;
}

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
const publicPaths = ["/"];
await writeFile(join(dist, "index.html"), rootHomePage());

for (const market of Object.values(markets)) {
  const marketRoot = join(dist, market.prefix);
  await mkdir(marketRoot, { recursive: true });
  await writeFile(join(marketRoot, "index.html"), marketHomePage(market));
  publicPaths.push(`/${market.prefix}/`);
  const departmentUrl = departmentPath(market);
  const departmentTarget = join(dist, departmentUrl);
  await mkdir(departmentTarget, { recursive: true });
  await writeFile(join(departmentTarget, "index.html"), departmentPage(market));
  publicPaths.push(departmentUrl);
  for (const category of catalog.categories) {
    const categoryUrl = categoryPath(market, category);
    const target = join(dist, categoryUrl);
    await mkdir(target, { recursive: true });
    await writeFile(join(target, "index.html"), categoryPage(market, category));
    publicPaths.push(categoryUrl);
  }
  for (const product of catalog.products) {
    const productUrl = productPath(market, product);
    const target = join(dist, productUrl);
    await mkdir(target, { recursive: true });
    await writeFile(join(target, "index.html"), productPage(market, product));
    publicPaths.push(productUrl);
  }
}

await writeFile(join(dist, "styles.css"), css);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${publicPaths.map((path) => `  <url><loc>${absolute(path)}</loc></url>`).join("\n")}\n</urlset>\n`;
const robots = `User-agent: *\nAllow: /\nDisallow: /private/\n\nSitemap: ${absolute("/sitemap.xml")}\n`;
await writeFile(join(dist, "sitemap.xml"), sitemap);
await writeFile(join(dist, "robots.txt"), robots);
console.log(`Built ${publicPaths.length} public pages at ${dist}`);
