# UnwokeAI

Because WokeAI Fell Short.

## Tech Stack

* **Frontend:** React (Vite)
* **Backend:** Node.js (Express)
* **Authentication:** Firebase Auth
* **Database:** MongoDB Atlas

---

## Project Structure

```
project-root/
├── backend/          # Node.js Express API
│   ├── src/
│   ├── package.json
│   └── .env
├── frontend/         # React Vite SPA
│   ├── src/
│   ├── package.json
│   └── .env
└── .render.yaml      # Render deployment config
```

---

## Getting Started Locally

### 1. Clone the repo

```bash
git clone https://github.com/your-username/unwokeai.git
cd unwokeai
```

### 2. Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 3. Set up environment variables

#### Backend `.env`:

```
PORT=5000
FRONTEND_URL=http://localhost:5173
MONGODB_URI=your_mongodb_atlas_uri
MONGODB_DB=unwokeai
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

#### Frontend `.env`:

```
VITE_FB_API_KEY=your_firebase_api_key
VITE_FB_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FB_PROJECT_ID=your_project_id
```

---

## Running the App

### Development Mode (recommended)

Run backend and frontend in separate terminals for hot reload:

**Terminal 1: Backend**

```bash
cd backend
npm start
```

**Terminal 2: Frontend**

```bash
cd frontend
npm run dev
```

* Backend runs on `http://localhost:5000`
* Frontend runs on `http://localhost:5173` and proxies API requests

### Production Mode (single terminal)

Build frontend and serve it with the backend only:

```bash
cd frontend && npm run build
cd ../backend && npm start
```

* Everything runs from `http://localhost:5000`
* No frontend hot reload in this mode

---

## Testing

1. Open the frontend URL.
2. Sign up and log in.
3. Click **Test API** to confirm successful backend communication.

---

## Deployment (Render)

This project includes a `.render.yaml` for automated deployment on Render.

To deploy successfully:

* Connect this GitHub repo in Render’s Blueprint setup.
* Add the following Environment Variables in Render dashboard:

  * `MONGODB_URI`
  * `MONGODB_DB`
  * `FIREBASE_PROJECT_ID`
  * `FIREBASE_CLIENT_EMAIL`
  * `FIREBASE_PRIVATE_KEY`

Render will build the frontend and backend together and serve everything from a single URL.