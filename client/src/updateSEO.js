// updateSEO.js

const setOrUpdateTag = (selector, createTag) => {
   
  let element = document.head.querySelector(selector);

  if (!element) {
    element = createTag();
    document.head.appendChild(element);
  }

  return element;
};

// MAIN FUNCTION
export const updateSEO = ({
  title,
  description,
  keywords,
  robots = "index, follow",
  canonical,
  og = {},
  twitter = {},
  schema = null,
}) => {
    
  // =========================
  // 1. TITLE
  // =========================
  if (title) {
    document.title = title;
  }

  // =========================
  // 2. META DESCRIPTION
  // =========================
  if (description) {
    const metaDesc = setOrUpdateTag(
      'meta[name="description"]',
      () => {
        const meta = document.createElement("meta");
        meta.setAttribute("name", "description");
        return meta;
      }
    );
    metaDesc.setAttribute("content", description);
  }

  // =========================
// 2.5 META KEYWORDS (Bing)
// =========================
if (keywords) {
  const metaKeywords = setOrUpdateTag(
    'meta[name="keywords"]',
    () => {
      const meta = document.createElement("meta");
      meta.setAttribute("name", "keywords");
      return meta;
    }
  );
  metaKeywords.setAttribute("content", keywords);
}
  // =========================
  // 3. ROBOTS
  // =========================
  const robotsTag = setOrUpdateTag(
    'meta[name="robots"]',
    () => {
      const meta = document.createElement("meta");
      meta.setAttribute("name", "robots");
      return meta;
    }
  );
  robotsTag.setAttribute("content", robots);

  // =========================
// 3.5 THEME COLOR (Mobile UI)
// =========================
const themeTag = setOrUpdateTag(
  'meta[name="theme-color"]',
  () => {
    const meta = document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    return meta;
  }
);
themeTag.setAttribute("content", "#0056A6");
  
  // =========================
  // 4. CANONICAL
  // =========================
  if (canonical) {
    const link = setOrUpdateTag(
      'link[rel="canonical"]',
      () => {
        const l = document.createElement("link");
        l.setAttribute("rel", "canonical");
        return l;
      }
    );
    link.setAttribute("href", canonical);
  }

  // =========================
  // 5. OPEN GRAPH (OG)
  // =========================
  const setOG = (property, content) => {
    if (!content) return;

    const tag = setOrUpdateTag(
      `meta[property="og:${property}"]`,
      () => {
        const meta = document.createElement("meta");
        meta.setAttribute("property", `og:${property}`);
        return meta;
      }
    );

    tag.setAttribute("content", content);
  };

  setOG("title", og.title || title);
  setOG("description", og.description || description);
  setOG("type", og.type || "website");
  setOG("url", og.url || canonical);
  setOG("image", og.image);
  setOG("site_name", "Wakiee");

  // =========================
  // 6. TWITTER
  // =========================
  const setTwitter = (name, content) => {
    if (!content) return;

    const tag = setOrUpdateTag(
      `meta[name="twitter:${name}"]`,
      () => {
        const meta = document.createElement("meta");
        meta.setAttribute("name", `twitter:${name}`);
        return meta;
      }
    );

    tag.setAttribute("content", content);
  };

  setTwitter("card", twitter.card || "summary_large_image");
  setTwitter("title", twitter.title || title);
  setTwitter("description", twitter.description || description);
  setTwitter("image", twitter.image);
  setTwitter("site", "@wakiee_live");

  // =========================
  // 7. JSON-LD SCHEMA (CRITICAL)
  // =========================

  // Remove ONLY page schema
  const oldSchema = document.querySelector(
    'script[type="application/ld+json"][data-page]'
  );
  if (oldSchema) oldSchema.remove();

  // Add new schema
  if (schema) {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-page", "true");
    script.textContent = JSON.stringify(schema);

    document.head.appendChild(script);
  }
};
