# Grow With Me 

This contains everything you need to run your app locally.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
# Grow With Me

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
4. Add your API keys and configuration:
   - Get Firebase configuration from your Firebase Console
   - Get Gemini API key from Google AI Studio
   - Update `.env.local` with your values

5. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

The following environment variables are required:

- `VITE_FIREBASE_API_KEY`: Your Firebase API key
- `VITE_FIREBASE_AUTH_DOMAIN`: Your Firebase auth domain
- `VITE_FIREBASE_PROJECT_ID`: Your Firebase project ID
- `VITE_FIREBASE_STORAGE_BUCKET`: Your Firebase storage bucket
- `VITE_FIREBASE_MESSAGING_SENDER_ID`: Your Firebase messaging sender ID
- `VITE_FIREBASE_APP_ID`: Your Firebase app ID
- `VITE_FIREBASE_MEASUREMENT_ID`: Your Firebase measurement ID
- `VITE_FIREBASE_CLIENT_ID`: Your Firebase client ID
- `VITE_GEMINI_API_KEY`: Your Gemini API key

See `.env.example` for the required format.

## Deployment to GitHub Pages

This app is configured to deploy to GitHub Pages. The deployment handles client-side routing automatically.

### Automatic Deployment

1. Push your changes to the `main` branch
2. GitHub Actions will automatically build and deploy your app
3. Your app will be available at: `https://yourusername.github.io/Grow-With-Me-AI/`

### Manual Deployment

1. Build the app:
   ```bash
   npm run build
   ```
2. Deploy the `dist` folder to GitHub Pages

### Environment Variables for Deployment

Make sure to add your `GEMINI_API_KEY` as a GitHub secret:
1. Go to your repository Settings > Secrets and variables > Actions
2. Add a new repository secret named `GEMINI_API_KEY`
3. Set the value to your Gemini API key

## Run Locally

3. Run the app:
   ```bash
   npm run dev
   ```
