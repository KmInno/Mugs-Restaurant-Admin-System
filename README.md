# Mugs Restaurant Monitoring

Lightweight dashboard to monitor sales, production, expenses and inventory for a small restaurant.

## Features
- Dashboard with sales, debtors, expenses and staff performance
- Inventory management with stock status (in-stock / out-of-stock)
- Expense templates and simple expense tracking
- Role-based UI (admin, staff, user)
- Mobile-friendly layout with a hamburger menu and partial-loading indicator

## Getting Started

Prerequisites:
- Node.js (14+)
- MySQL server

Install dependencies:

```bash
npm install
```

Database setup:

1. Create a MySQL database (the repo includes `src/config/db_init.sql` with schema statements).
2. Run the SQL file against your MySQL instance, or execute the contained statements manually.

Environment variables (example `.env`):

```
DB_HOST=localhost
DB_USER=root
DB_PASS=yourpassword
DB_NAME=restaurant_db
DB_PORT=3306
SESSION_SECRET=your_secret
NODE_ENV=development
```

Start the app:

```bash
node server.js
# or
npm start
```

Open the app at http://localhost:3000 (or the port configured in `server.js`).

## Inventory

The schema now includes an `inventory` table with a `status` column (`instock` or `outofstock`). The web UI lets `admin` and `staff` view inventory, mark items as in-stock/out-of-stock, and add new items.

## Notes
- The application uses server-side EJS templates located in `src/views` and static assets in `public/`.
- For production, secure sessions and DB credentials and run behind a process manager.

If you want, I can add a Docker compose file or automated migration script next.
