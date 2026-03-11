# Pluck

Airbnb-style neighborhood fruit marketplace prototype.

## Run locally

From the repo root:

 npm install
 npm run dev

Client: http://localhost:5173
Server: http://localhost:8080

## Optional Google Maps key

Create `client/.env`:

VITE_API_BASE=http://localhost:8080
VITE_GOOGLE_MAPS_API_KEY=your_key_here

Without a key, the app still runs with a clean discovery fallback.
