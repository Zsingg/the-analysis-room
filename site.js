/* The Analysis Room — shared site behaviour
   1. Fade-out transition on internal page navigation
   2. Offset anchor scroll (clears the 130px sticky header)
   3. Notes preview modal (History page)
   Progressive enhancement: everything still works with JS disabled. */
(function () {
  "use strict";

  var HEADER_OFFSET = 130;
  var root = document.getElementById("page-fade-root");

  /* ---- Offset anchor scroll on load (for cross-page page.html#section links) ---- */
  function scrollToHash(hash, smooth) {
    if (!hash) return;
    var el = document.getElementById(hash.replace(/^#/, ""));
    if (!el) return;
    var y = el.getBoundingClientRect().top + window.pageYOffset - HEADER_OFFSET;
    window.scrollTo({ top: y, behavior: smooth ? "smooth" : "auto" });
  }

  if (window.location.hash) {
    // Wait for layout/fonts, then land precisely below the sticky header.
    window.addEventListener("load", function () {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { scrollToHash(window.location.hash, true); });
      });
    });
  }

  /* ---- Fade-out on internal navigation ---- */
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href]");
    if (!a) return;
    if (a.target === "_blank") return;
    if (a.hasAttribute("download")) return;

    var href = a.getAttribute("href");
    if (!href) return;

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
    var pageImgEls = [1, 2, 3].map(function (n) { return document.getElementById("modal-page-img-" + n); });
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
