document.addEventListener('DOMContentLoaded', function () {
  const hamburger = document.getElementById('hamburger');
  const sidebar = document.querySelector('.app-sidebar');
  const mobileOverlay = document.getElementById('mobile-overlay');
  const loadingOverlay = document.getElementById('loading-overlay');

  function setExpanded(val) {
    if (hamburger) hamburger.setAttribute('aria-expanded', val ? 'true' : 'false');
  }

  function openSidebar() {
    if (sidebar) sidebar.classList.add('open');
    if (mobileOverlay) mobileOverlay.classList.add('show');
    setExpanded(true);
  }

  function closeSidebar() {
    if (sidebar) sidebar.classList.remove('open');
    if (mobileOverlay) mobileOverlay.classList.remove('show');
    setExpanded(false);
  }

  if (hamburger) {
    hamburger.addEventListener('click', function (e) {
      e.preventDefault();
      if (sidebar && sidebar.classList.contains('open')) closeSidebar();
      else openSidebar();
    });
  }

  if (mobileOverlay) {
    mobileOverlay.addEventListener('click', function () { closeSidebar(); });
  }

  // Show loading overlay on navigation for perceived partial loading
  function showLoader() {
    if (loadingOverlay) loadingOverlay.classList.add('show');
  }
  function hideLoader() {
    if (loadingOverlay) loadingOverlay.classList.remove('show');
  }

  // Intercept internal link clicks to show loader (except anchors or JS links)
  document.addEventListener('click', function (e) {
    const a = e.target.closest('a');
    if (!a) return;
    const href = a.getAttribute('href');
    const target = a.getAttribute('target');
    const noLoader = a.hasAttribute('data-no-loader');
    if (noLoader) return;
    if (!href) return;
    if (href.startsWith('#')) return; // anchor
    if (href.startsWith('mailto:') || href.startsWith('tel:')) return;
    if (target === '_blank') return;
    // allow external links (protocol present)
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(href) && !href.startsWith(window.location.origin)) return;

    showLoader();
  }, { capture: true });

  // Show loader on form submit
  document.addEventListener('submit', function (e) { showLoader(); }, { capture: true });

  // Hide loader when page fully loads or on pageshow (from bfcache)
  window.addEventListener('load', hideLoader);
  window.addEventListener('pageshow', hideLoader);

  // close sidebar when window is resized to large screens
  window.addEventListener('resize', function () {
    if (window.innerWidth > 800) {
      if (sidebar) sidebar.classList.remove('open');
      if (mobileOverlay) mobileOverlay.classList.remove('show');
      setExpanded(false);
    }
  });
});
