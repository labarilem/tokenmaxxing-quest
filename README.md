# Tokenmaxxing Quest

An incremental browser game about maximizing LLM token spending to advance your career at a big tech company. Satirical take on [token maxxing](https://en.wikipedia.org/wiki/Workplace_impact_of_artificial_intelligence#Token_maxxing).

**Play:** [https://labarilem.github.io/tokenmaxxing-quest/](https://labarilem.github.io/tokenmaxxing-quest/) *(after enabling GitHub Pages)*

## V0.1 — Current gameplay

- Click **Send Prompt** to consume tokens (+1 each)
- Buy **Background Agents** (25 tokens) for passive +1 token/sec each
- Progress autosaves to your browser

## Local development

ES modules need a local server:

```bash
python -m http.server 8080
# or
npx serve .
```

Open [http://localhost:8080](http://localhost:8080).

## Deploy to GitHub Pages

1. Push this repo to GitHub
2. Go to **Settings → Pages → Build and deployment → Source: GitHub Actions**
3. Push to `main` — the workflow deploys automatically

## Design doc

See [`docs/DESIGN.md`](docs/DESIGN.md) for requirements, architecture, and roadmap.

## Tech stack

- HTML, CSS, vanilla JavaScript (ES modules)
- No game engine, no build step
- Inspired by [Kittens Game](https://kittensgame.com/web/)
