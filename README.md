# Retail Returns Tracker

A browser-based dashboard for recording retail returns and product exchanges, tracking inventory changes, and reviewing refund activity. Built with Next.js, React, TypeScript, and Tailwind CSS.

[Open the dashboard](https://icekung11.github.io/Retail_Tracker/)

## Features

- **Returns and exchanges:** Record products, quantities, reasons, and staff notes. Calculate refunds, additional payments, or even exchanges automatically.
- **Inventory tracking:** Restock sellable items, quarantine returned items, and deduct replacement stock for exchanges.
- **Analytics:** Review today's net refund total, transaction count, restocked and quarantined quantities, and refund costs by reason.
- **Transaction history:** Search by transaction ID or product name, filter by reason and type, and export filtered results to CSV.
- **Product catalog:** Browse sample products and current stock levels.
- **Integrity audit:** Check for negative inventory, standard returns exceeding the original purchase value, and defective or damaged items restocked without staff notes.
- **Appearance:** Switch between light and dark themes.

## Getting Started

Use Node.js 20 and npm to match the deployment workflow.

```bash
git clone https://github.com/icekung11/Retail_Tracker.git
cd Retail_Tracker
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. No environment variables or database setup are required.

## Usage

1. Open the product catalog to review available items and stock.
2. Start a new return or exchange and select the returned item, quantity, and reason.
3. Review the restock setting. Defective and damaged items default to quarantine; other reasons default to restocking.
4. For an exchange, select a different replacement product and quantity. The app checks replacement stock and calculates the balance.
5. Add staff notes as needed and submit the transaction.
6. Review the updated dashboard, filter the transaction history, export a CSV, or open the integrity audit.

The app records financial amounts for tracking purposes; it does not process payments or issue refunds through a payment provider.

## Data Storage

Products and transactions are saved in the current browser's `localStorage` under `retail-returns-tracker:database`. The first visit initializes sample products and two example return records.

Data is specific to the browser and site origin. It is not synchronized across users or devices, and clearing browser storage removes saved records. CSV export downloads the currently filtered transaction history; CSV import is not implemented.

The reset action restores sample product inventory and clears all return and exchange records after confirmation.

## Development Commands

| Command | Purpose |
| --- | --- |
| `npm ci` | Install dependencies from the lockfile. |
| `npm run dev` | Start the development server. |
| `npm run build` | Build and export the static site to `out/`. |
| `npx tsc --noEmit` | Check TypeScript types without emitting files. |

This project uses Next.js static export (`output: 'export'`). Preview a production build with a static file server serving `out/`. The package's `npm run start` command uses `next start`, which does not support this export configuration.

## Project Structure

```text
.github/workflows/deploy-pages.yml  GitHub Pages build and deployment
src/
  app/                            Dashboard page, layout, and global styles
  components/                     Dashboard cards, tables, and modal dialogs
  context/                        Theme state
  data/seedProducts.json          Sample product catalog
  lib/storage.ts                  Browser persistence and transaction logic
  lib/assertions.ts               Inventory, refund, and restock checks
  types/                          Shared TypeScript types
docs/                             Requirements, design, and task documents
next.config.js                    Static export and deployment base path
```

## GitHub Pages Deployment

The workflow in [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) builds and deploys the static site on every push to `main`. It can also be started manually from GitHub Actions.

In the repository's **Settings > Pages**, set the build and deployment source to **GitHub Actions**. The workflow installs dependencies, runs the production build, and publishes `out/`.

During GitHub Actions builds, `next.config.js` sets the base path to `/Retail_Tracker`. Update this setting if you deploy under a different repository name or URL path.
