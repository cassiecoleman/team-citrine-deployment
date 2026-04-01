# Team Citrine

This repository contains the `ultra-web` frontend prototype for the Ultra ride-sharing application.

## Running the app locally

1. Open a terminal in the project root.
2. Change into the app directory:

```bash
cd ultra-web
```

3. Install dependencies if you have not already:

```bash
npm install
```

4. Start the development server:

```bash
npm run dev
```

5. Open `http://localhost:3000` in your browser.

## Available routes

### Rider routes

- `/` — rider home
- `/book` — ride booking
- `/book/split` — split-fare invite
- `/book/split/confirm` — shared ride confirmation
- `/passes` — ride pass dashboard
- `/passes/review` — ride pass review
- `/passes/active` — active pass details
- `/profile` — rider profile
- `/receipt` — ride receipt

### Driver wireframe routes

- `/driver` — driver home / shift dashboard
- `/queue` — trip assignment review
- `/trip/trip-204` — navigation to passenger
- `/trip/trip-204/pickup` — passenger pickup confirmation

## Running tests

From the `ultra-web` directory:

```bash
npm run lint
npm run test
npm run test:e2e
```

If Playwright asks for browser binaries on your machine, install them with:

```bash
npx playwright install chromium
```

## Notes

- The driver screens are currently wireframes built inside the existing `ultra-web` app structure.
- Shared rider navigation components were left in their original location to reduce merge conflicts with parallel wireframe work.
