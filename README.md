# Portfolio Website Template for GitHub Pages

A modern, responsive personal portfolio website template built with React, TypeScript, and Vite. Perfect for hosting on GitHub Pages for free!

## 📋 Overview

This portfolio template is designed for developers, designers, and professionals looking to showcase their work online. Easily deployable to GitHub Pages, this template provides a professional web presence without any hosting costs.

**Keywords:** portfolio website, developer portfolio, free template, GitHub Pages, responsive design, React portfolio

The site features a clean, modern design with sections for:

- Introduction/Hero section
- About Me
- Projects showcase
- Content/Blog
- Contact information

## 🚀 Technologies Used

- **Frontend**: React 19, TypeScript
- **Routing**: React Router v7
- **Styling**: CSS
- **Icons**: React Icons
- **Build Tool**: Vite
- **Linting**: ESLint
- **Hosting**: GitHub Pages compatible

## 🛠️ Setup & Installation

1. Clone the repository
   ```
   git clone <repository-url>
   cd portfolio
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Run development server
   ```
   npm run dev
   ```

4. Build for production
   ```
   npm run build
   ```

5. Preview production build
   ```
   npm run preview
   ```

## 📦 Deployment to GitHub Pages

1. Create a GitHub repository for your portfolio
2. Update the `base` property in `vite.config.ts` to match your repository name:
   ```ts
   base: '/your-repo-name/',
   ```
3. Build your project with `npm run build`
4. Push the `dist` folder content to a `gh-pages` branch or configure GitHub Actions for automatic deployment

## 📁 Project Structure

```
src/
├── assets/           # Static assets (images, fonts)
├── components/       # React components
│   ├── layout/       # Layout components (Header, Footer)
│   └── sections/     # Page section components
├── data/            # Data files for projects, content, etc.
├── App.tsx          # Main application component
└── main.tsx         # Application entry point
```

## 🔧 Customization

The content can be easily modified by editing the data files in the `src/data/` directory. Make it your own by:

- Updating personal information
- Adding your projects
- Customizing colors and styling
- Adding new sections that showcase your skills

## 📱 Responsive Design

The portfolio is fully responsive and optimized for viewing on devices of all sizes, ensuring your professional presence looks great on desktop, tablet, and mobile.

## 🔒 Security

The project follows best practices for React security and includes proper handling of user inputs and data.

## 📄 License

This template is open source and free to use for personal or commercial purposes. You can:
- Use it to create your own portfolio
- Modify it to suit your needs
- Share it with others
- Use it as a base for client projects

Attribution is appreciated but not required.

## 🌟 SEO Tips

To maximize the visibility of your portfolio:
- Add relevant keywords to your content
- Include a proper meta description in the index.html
- Use semantic HTML throughout your components
- Ensure all images have alt tags
- Create a sitemap.xml file
- Submit your site to search engines

---

© 2024 Template originally by Çağlar Sarıkaya. Free to use and modify.
