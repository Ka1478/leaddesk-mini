# LeadDesk Mini 🚀

> **Live Production Build & Training Submission**  
> *Built for [Digital Heroes Training Task](https://digitalheroesco.com)*

LeadDesk Mini is a full-stack lead-capture and pipeline management product featuring a high-converting public landing page, interactive lead capture form with client & server-side validation, persistent MongoDB database, secure admin authentication with JWT session cookies, and a management admin dashboard.

---

## 🛠️ Technology Stack

- **Frontend**: React (Vite), HTML5, Modern Vanilla CSS (Glassmorphism, dark palette, animations), `lucide-react` icons
- **Backend**: Node.js & Express.js (REST API architecture in JavaScript)
- **Database**: MongoDB with Mongoose ORM (equipped with zero-config memory database fallback for instant out-of-the-box execution)
- **Authentication**: `bcryptjs` password hashing + `jsonwebtoken` (JWT) authorization with protected Express middleware
- **Validation**: Client-side (React state & regex matching) + Server-side (Express payload validation middleware)

---

## 📊 Data Model

### 1. `Lead` Entity Schema
| Field | Type | Rules & Validation | Description |
|---|---|---|---|
| `_id` | ObjectId | Auto-generated | Primary key identifier |
| `name` | String | Required, 2-100 chars, trimmed | Full name of the prospect |
| `email` | String | Required, valid email regex pattern | Business email address |
| `budget` | String | Required, Enum (`$1,000 - $5,000`, `$5,000 - $15,000`, `$15,000 - $50,000`, `$50,000+`) | Budget tier selected by lead |
| `message` | String | Required, 10-2000 chars, trimmed | Project requirements / scope description |
| `status` | String | Enum (`New`, `Contacted`, `Closed`), default: `New` | Pipeline status stage |
| `createdAt` | Date | Auto timestamp | Submission creation timestamp |

### 2. `User` (Admin) Entity Schema
| Field | Type | Rules & Validation | Description |
|---|---|---|---|
| `_id` | ObjectId | Auto-generated | Primary key identifier |
| `email` | String | Unique, Required, lowercase | Admin account email |
| `passwordHash` | String | Required | Salted `bcrypt` password hash |
| `role` | String | Enum (`admin`), default: `admin` | Authorization role |

---

## 🔐 Auth Approach & Security

1. **Password Hashing**: Admin passwords are never stored in plain text. Passwords are salted and hashed using `bcryptjs` (salt factor 10).
2. **Session & Token Architecture**:
   - On successful login (`POST /api/auth/login`), the server issues a signed JWT (`jsonwebtoken`) containing user ID and role.
   - The token is set as an `HttpOnly` cookie with `SameSite=Lax` protection, and also returned in the response payload for Bearer header authorization support.
3. **Route & Endpoint Protection**:
   - The `protect` Express middleware verifies JWT signature on all incoming protected endpoints (`GET /api/leads`, `PATCH /api/leads/:id/status`, `DELETE /api/leads/:id`).
   - Unauthenticated attempts trigger an HTTP `401 Unauthorized` response.
4. **Client-Side Route Guard**:
   - Accessing `/admin` while unauthenticated automatically renders the `/login` view with an alert tip.

---

## 🔑 Test Credentials

To log into the Admin portal and test status changes:

- **Admin Email**: `admin@leaddesk.com`
- **Password**: `AdminPass123!`

*(The login page also provides a one-click **"Auto-fill Test Credentials"** button for instant testing).*

---

## 🚀 Local Installation & Running Guide

### Step 1: Install Dependencies
Run the command below in the project root to install dependencies for both server and client:

```bash
npm run install-all
```

### Step 2: Seed Sample Data
Populate default admin account and realistic initial leads into MongoDB:

```bash
npm run seed
```

### Step 3: Build & Start Production Mode
To build the React frontend bundle and launch the Express backend:

```bash
npm run build
npm start
```

Open your browser and navigate to:
- **Public Landing Page**: `http://localhost:5000/`
- **Admin Portal**: `http://localhost:5000/admin`
- **API Health Check**: `http://localhost:5000/api/health`

---

## 🌐 Free Tier Deployment Guide

### Deploying to Render / Railway / Vercel:

1. **Push to GitHub**: Push the repository to your public GitHub account.
2. **Deploy on Render / Railway / Vercel**:
   - Set **Build Command**: `npm run install-all && npm run build`
   - Set **Start Command**: `npm start`
   - Environment Variables (Optional):
     - `PORT`: `5000` (or platform default)
     - `JWT_SECRET`: `your-custom-production-jwt-secret`
     - `MONGODB_URI`: `mongodb+srv://<user>:<password>@cluster.mongodb.net/leaddesk?retryWrites=true&w=majority` (If omitted, the app will automatically use the memory MongoDB engine).

---

## 🎥 Loom Walkthrough Script

When recording your Loom walkthrough video, follow this flow:

1. **Introduction & Credit Line (0:00 - 0:30)**:
   - Introduce yourself and LeadDesk Mini.
   - Scroll to the footer and highlight the required credit line: *"Built for Digital Heroes Training Task"* linked to `digitalheroesco.com`.
2. **Public Landing Page & Form Validation (0:30 - 1:30)**:
   - Try submitting an empty form to show client-side validation errors (invalid email hint, missing name/message).
   - Fill out valid details (e.g. Name: *"Elena Vance"*, Email: *"elena@apex.com"*, Budget: *"$15,000 - $50,000"*).
   - Submit form and highlight success toast confirmation.
3. **Admin Area & Auth Guard (1:30 - 2:30)**:
   - Click "Admin Portal" in header while unauthenticated (demonstrate redirect to `/login`).
   - Click "Auto-fill Test Credentials" (`admin@leaddesk.com` / `AdminPass123!`) and submit login.
4. **Lead Management & Status Toggles (2:30 - 3:30)**:
   - Show metrics header (Total Leads, New, Contacted, Closed).
   - Search for *"Elena"* in the live search bar.
   - Change Elena's status from **New** ➔ **Contacted** ➔ **Closed** via the inline dropdown toggle.
   - Click "Export CSV" to demonstrate report downloading.
   - Click Logout to confirm session clearance.
