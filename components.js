// components.js

// 1. Shared Head Tag Imports (Fonts & Google Analytics)
function injectGlobalHead() {
  const head = document.head;
  head.insertAdjacentHTML('beforeend', `
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@400;600&family=Source+Sans+3:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">
    
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-6DJCPL0T9F"></script>
  `);
  
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-6DJCPL0T9F');
}

// 2. Shared Header Component
class SiteHeader extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <header>
        <nav>
          <a href="index.html" class="nav-name">Caglar Sarikaya</a>
          <span class="nav-links">
            <a href="index.html#about">About</a>
            /
            <a href="index.html#experience">Experience</a>
            /
            <a href="index.html#projects">Projects</a>
            /
            <a href="index.html#contact">Contact</a>
          </span>
        </nav>
      </header>
    `;
  }
}
customElements.define('site-header', SiteHeader);

// 3. Shared Footer Component
class SiteFooter extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <footer>
        <p>&copy; 2026 Caglar Sarikaya</p>
      </footer>
    `;
  }
}
customElements.define('site-footer', SiteFooter);

// Execute head injection when the script loads
injectGlobalHead();
