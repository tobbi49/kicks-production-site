# Kicks

One-page marketing/production agency website for **Kicks**, a Vienna-based content & marketing team.

## Tech Stack

Plain HTML, CSS, and JavaScript — no framework, no build tools. Static site.

## Project Structure

```
/kicks-site
  /assets
    /images
    /icons
  index.html
  style.css
  script.js
```

## Running Locally

No build step required. Either:

- Open `index.html` directly in your browser, or
- Serve the folder with a simple local server, e.g.:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Deployment

Deployed to **Cloudflare Pages** as a static site (no build command needed — root directory is the publish directory).
