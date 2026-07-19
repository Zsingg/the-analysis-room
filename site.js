/* The Analysis Room — shared site behaviour
   1. Fade-out transition on internal page navigation
   2. Offset anchor scroll (clears the 130px sticky header)
   3. Notes preview modal (History page)
   Progressive enhancement: everything still works with JS disabled. */
(function () {
  "use strict";

  var HEADER_OFFSET = 130;
  var root = document.getElementById("page-fade-root");

  // Capture the initial hash, then strip it from the URL immediately.
  // Some browsers re-run their own native "scroll to fragment" (using our
  // scroll-margin-top CSS) whenever a late layout shift happens — e.g. web
  // fonts finishing load — which silently undoes our custom offset/centred
  // scroll. Clearing the hash from the address bar removes that fragment
  // reference so only our own scrollToHash logic below can move the page.
  var initialHash = window.location.hash;
  if (window.history && "scrollRestoration" in window.history) {
    // Prevent the browser from auto-restoring a stored scroll position
    // (e.g. 0,0 from the moment below) over our own programmatic scroll.
    window.history.scrollRestoration = "manual";
  }
  if (initialHash && window.history && window.history.replaceState) {
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
  }

  /* ---- Offset anchor scroll on load (for cross-page page.html#section links) ---- */
  function scrollToHash(hash, smooth) {
    if (!hash) return;
    var id = hash.replace(/^#/, "");
    var el = document.getElementById(id);
    if (!el) return;
    var elTop = el.getBoundingClientRect().top + window.pageYOffset;
    var y = elTop - HEADER_OFFSET;

    if (id === "rates") {
      // Centre the rates section within the space below the sticky header,
      // rather than just clearing the header.
      var available = window.innerHeight - HEADER_OFFSET;
      var sectionHeight = el.getBoundingClientRect().height;
      if (sectionHeight < available) {
        y = elTop - HEADER_OFFSET - (available - sectionHeight) / 2;
      }
    }

    window.scrollTo({ top: y, behavior: smooth ? "smooth" : "auto" });
  }

  if (initialHash) {
    // Wait for layout/fonts, then land precisely on target.
    window.addEventListener("load", function () {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          scrollToHash(initialHash, true);
          if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(function () { scrollToHash(initialHash, false); });
          }
          setTimeout(function () { scrollToHash(initialHash, false); }, 400);
        });
      });
    });
  }

  /* ---- WhatsApp click conversion tracking (Google Ads) ---- */
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="https://wa.me/"]');
    if (!a) return;
    if (window.gtag) {
      window.gtag("event", "whatsapp_click", {
        event_category: "engagement",
        event_label: window.location.pathname
      });
    }
  }, true);

  /* ---- Fade-out on internal navigation ---- */
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href]");
    if (!a) return;
    if (a.target === "_blank") return;
    if (a.hasAttribute("download")) return;

    var href = a.getAttribute("href");
    if (!href) return;

    // Pure same-page anchor (e.g. "#rates") — use our offset/centring scroll instead of the browser default.
    if (href.charAt(0) === "#" && href.length > 1) {
      var target = document.getElementById(href.slice(1));
      if (target) {
        e.preventDefault();
        scrollToHash(href, true);
        setTimeout(function () { scrollToHash(href, false); }, 400);
      }
      return;
    }

    // Only intercept links to another internal .html page (not pure #anchors, not external).
    var isInternalPage = /\.html(?:#|$)/.test(href) && !/^https?:\/\//.test(href);
    if (!isInternalPage) return;

    // Same-page anchor within an .html link (e.g. history.html#notes while already on history) — let CSS handle.
    var targetPath = href.split("#")[0];
    var here = window.location.pathname.split("/").pop() || "index.html";
    if (targetPath === here || targetPath === "") return;

    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // respect open-in-new-tab

    e.preventDefault();
    if (root) { root.style.opacity = "0"; }
    setTimeout(function () { window.location.href = href; }, 150);
  }, true);

  /* ---- Notes preview modal ---- */
  var modal = document.getElementById("preview-modal");
  if (modal) {
    var titleEl = document.getElementById("modal-note-title");
    var closeBtn = document.getElementById("modal-close");
    var scrollEl = document.querySelector(".modal-scroll");
    var pageImgEls = [1].map(function (n) { return document.getElementById("modal-page-img-" + n); });
    var lastFocused = null;

    function resetPageSlot(el) {
      el.innerHTML = "";
      el.textContent = "Preview page coming soon";
    }

    function openModal(title, slug) {
      if (titleEl) titleEl.textContent = title;
      pageImgEls.forEach(function (el, i) {
        if (!el) return;
        if (slug) {
          var img = document.createElement("img");
          img.src = "resources/history/previews/" + slug + "/" + (i + 1) + ".jpg";
          img.alt = title + " — preview page " + (i + 1);
          img.loading = "lazy";
          img.onerror = function () { resetPageSlot(el); };
          el.innerHTML = "";
          el.appendChild(img);
        } else {
          resetPageSlot(el);
        }
      });
      modal.hidden = false;
      if (scrollEl) scrollEl.scrollTop = 0;
      document.body.style.overflow = "hidden";
      lastFocused = document.activeElement;
      if (closeBtn) closeBtn.focus();
    }

    function closeModal() {
      modal.hidden = true;
      document.body.style.overflow = "";
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    }

    document.querySelectorAll(".note-row").forEach(function (row) {
      row.addEventListener("click", function () {
        openModal(row.getAttribute("data-title") || "", row.getAttribute("data-slug") || "");
      });
    });

    if (closeBtn) closeBtn.addEventListener("click", closeModal);

    // Click on the dim overlay (but not the panel) closes.
    modal.addEventListener("click", function (e) {
      if (e.target === modal) closeModal();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !modal.hidden) closeModal();
    });
  }
})();
