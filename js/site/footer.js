// footer.js: the shared <site-footer> element

class SiteFooter extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <footer>
        <div class="footer-content">
          <span>&copy; ${new Date().getFullYear()} Çağlar Can Sarıkaya</span>
          <span data-feeds-updated></span>
          <a href="#top" onclick="window.scrollTo({ top: 0 }); return false;">Back to top &uarr;</a>
        </div>
      </footer>
    `;
  }
}
customElements.define('site-footer', SiteFooter);
