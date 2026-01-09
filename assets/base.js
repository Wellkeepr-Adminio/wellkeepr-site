(function () {
  function pick(params, key) {
    const v = params.get(key);
    return (v && String(v).trim()) ? v.trim() : "";
  }

  const params = new URLSearchParams(window.location.search);

  // Standard UTMs
  const utm = {
    utm_source: pick(params, "utm_source"),
    utm_medium: pick(params, "utm_medium"),
    utm_campaign: pick(params, "utm_campaign"),
    utm_content: pick(params, "utm_content"),
    utm_term: pick(params, "utm_term"),
  };

  // Persist UTMs for the session (useful if user reaches /thanks/ without UTMs)
  const existing = sessionStorage.getItem("wk_utm");
  if (!existing) {
    sessionStorage.setItem("wk_utm", JSON.stringify(utm));
  }

  // Also store landing page URL
  if (!sessionStorage.getItem("wk_lp")) {
    sessionStorage.setItem("wk_lp", window.location.pathname);
  }

  // Helper to get stored UTMs (fallback)
  function getStoredUtm() {
    try {
      return JSON.parse(sessionStorage.getItem("wk_utm") || "{}");
    } catch {
      return {};
    }
  }

  // Build query string for Tally hidden fields
  function buildUtmQuery() {
    const stored = getStoredUtm();
    const q = new URLSearchParams();

    const keys = ["utm_source","utm_medium","utm_campaign","utm_content","utm_term"];
    keys.forEach(k => {
      const val = utm[k] || stored[k] || "";
      if (val) q.set(k, val);
    });

    // extra attribution helpers
    q.set("lp", sessionStorage.getItem("wk_lp") || window.location.pathname);
    q.set("referrer", document.referrer || "");

    return q.toString();
  }

  // Inject into Tally iframe if present
  const iframe = document.querySelector("[data-tally-embed='true']");
  if (iframe) {
    const base = iframe.getAttribute("data-tally-base") || "";
    if (base) {
      const qs = buildUtmQuery();
      const joiner = base.includes("?") ? "&" : "?";
      iframe.src = base + joiner + qs;
    }
  }

  // On the thanks page, fire Lead event (if configured)
  const isThanks = document.body && document.body.dataset && document.body.dataset.page === "thanks";
  if (isThanks && window.fbq) {
    // Meta Pixel standard event "Lead"
    window.fbq("track", "Lead");
  }
})();
