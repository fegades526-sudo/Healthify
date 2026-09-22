# Healtify

Static health-awareness site with an optional Gemini-powered assistant.

## Publish on GitHub Pages

1. Create a GitHub repository and push this folder to its `main` branch.
2. In the repository, open **Settings > Pages**.
3. Under **Build and deployment**, select **GitHub Actions** as the source.
4. Push to `main`, or run **Deploy static site to GitHub Pages** from the repository's **Actions** tab.

GitHub will show the published URL in the workflow summary and under **Settings > Pages**.

## Assistant security
https://fegades526-sudo.github.io/Healthify/

The site is static, so any API key placed in `index.js` would be visible to every visitor and could be abused. The public version intentionally leaves the key empty. Connect the assistant through a server-side endpoint or serverless function before enabling it in production, and revoke any key that was previously committed to the repository.
