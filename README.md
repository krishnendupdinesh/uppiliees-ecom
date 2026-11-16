# Uppiliees E-Commerce Frontend (Next.js)

Frontend storefront and admin dashboard for **Uppiliees** (Herbal Beauty, Traditional Food, and Kerala Handloom), located in `c:/Users/USER/Desktop/ecom/shopclues`. It communicates with the standalone Node.js + Express backend in `c:/Users/USER/Desktop/ecom/backend` using `NEXT_PUBLIC_API_URL` and `credentials: "include"`.

---

## Workspace Structure

```text
ecom/
├── shopclues/   # Next.js 16 Frontend (this folder)
└── backend/     # Standalone Node.js + Express + TiDB + Cloudinary Backend
```

---

## Quick Start (Local Development)

### 1. Start the Backend (`../backend`)

In a terminal at `c:/Users/USER/Desktop/ecom/backend`:

```bash
cd ../backend
npm install
cp .env.example .env   # Fill in TiDB, Cloudinary, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm run db:setup       # Creates tables & default categories in TiDB
npm run seed:admin     # Seeds the admin user
npm run dev            # Starts Express on http://localhost:5000
```

### 2. Start the Frontend (`shopclues`)

In a second terminal at `c:/Users/USER/Desktop/ecom/shopclues`:

```bash
cp .env.example .env
```

Ensure `.env` contains:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Install dependencies and start Next.js:

```bash
npm install
npm run dev
```

Visit **`http://localhost:3000`** for the storefront and **`http://localhost:3000/admin`** for the admin dashboard.

---

## Deployment

1. **Backend (`../backend`)**: Deploy to **Render** or **Railway** with `FRONTEND_URL` set to your Vercel URL (see [../backend/README.md](file:///C:/Users/USER/Desktop/ecom/backend/README.md)).
2. **Frontend (`shopclues`)**: Deploy to **Vercel** with `NEXT_PUBLIC_API_URL` set to your Render/Railway backend URL.
