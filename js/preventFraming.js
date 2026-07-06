// Runtime clickjacking protection for environments where headers can't be set.

(function () {
  function preventFraming() {
    // If already top-level, nothing to do.
    if (window.top === window.self) return;

    // Try to break out of the frame.
    try {
      // Best effort: navigate top window to this app URL.
      window.top.location = window.location.href;
    } catch {
      // Cross-origin restrictions can block this; fallback below.
    }

    // After a short delay, if still framed, show blocking overlay fallback.
    setTimeout(() => {
      if (window.top === window.self) return;

      // Avoid duplicate overlays.
      if (document.getElementById("frame-block-overlay")) return;

      const overlay = document.createElement("div");
      overlay.id = "frame-block-overlay";
      overlay.setAttribute("role", "alertdialog");
      overlay.setAttribute("aria-modal", "true");

      const title = document.createElement("p");
      title.className = "frame-block-title";
      title.textContent = "SnapViewer cannot be displayed inside another site.";

      const linkHint = document.createElement("p");
      linkHint.className = "frame-block-hint";
      linkHint.textContent = `The link below works best if you middle-click it or
        right-click and choose "Open link in new tab":`;

      const link = document.createElement("a");
      link.href = window.location.href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = 'Open SnapViewer in a new tab';

      const copyHint = document.createElement("p");
      copyHint.className = "frame-block-hint";
      copyHint.textContent = "Or just copy-and-paste the link address:";

      const rawLink = document.createElement("p");
      rawLink.textContent = window.location.href;

      overlay.appendChild(title);
      overlay.appendChild(linkHint);
      overlay.appendChild(link);
      overlay.appendChild(copyHint);
      overlay.appendChild(rawLink);

      // Block background interaction as much as possible.
      document.documentElement.classList.add("frame-blocked");
      document.body.classList.add("frame-blocked");
      document.body.appendChild(overlay);
    }, 50);
  }

  // Run as early as possible
  preventFraming();
})();
