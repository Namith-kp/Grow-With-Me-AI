# Grow With Me 

AI Powered Co-Founder Finding Platform for Founders to build a start-up companies

## 🚀Project Overview

Grow-With-Me-AI is a platform designed to help startup founders find their perfect co-founder and investor matches. Leveraging AI, modern full-stack technologies, and startup matching logic, the platform aims to streamline the matchmaking process for early-stage companies.

Key highlights:

- Founder side: create a profile, define what you’re looking for (co-founder or investor), your domain, startup stage, skills, etc.

- Matchmaking engine: uses AI (via Google Gemini API) + profile attributes + preferences to suggest compatible co-founders/investors.

- Investor side: register as investor, indicate investment preferences (stage, sector, geography) and get matched with relevant founders.

- Negotiation Deck: Dedicated negotiation section between Founders & Investors to negotiate with the funds and equity for their startup ideas

- Real-time chat / connect flow (if implemented) to initiate conversations.

- Built with a modern stack: React + TypeScript + Tailwind CSS + Firebase, deployed via Vercel/ GitHub Pages.

## 🏃‍♂️ Run Locally

**Prerequisites:**  

- Node.js (version 16+ recommended)

- npm (or yarn)

- A Firebase project with authentication & Firestore configured

- A Google Gemini API key (for the AI matching engine)

- (Optional) GitHub repository for deployment or Vercel account


## 📦 Setup & Installation 

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

## 🔧Features

- User registration & authentication (via Firebase)
- Profile creation & editing (for founders & investors)
- Role selection: Founder vs Investor
- Detailed profile fields: startup stage, sector, skills, investment criteria, timeline, etc.
- AI-driven matching: using your Gemini API key to assist in pairing founders with co-founders/investors.
- Search & filter users based on criteria (skills, stage, sector, location)
- Responsive UI built with Tailwind and TypeScript
- Environment and API key management via `.env.local`
- Deployment ready (GitHub Pages / Vercel) with client-side routing handling
- Potential chat or messaging interface (depending on your code)
- Dashboard for users (founder/investor) with their matches, status, connection invites, etc.



## 📌Acknowledgements

- Thanks to the open-source community and the many libraries used in this project (React, TypeScript, Tailwind CSS, Firebase).
- Thanks to Google Gemini API for powering the AI-based matching feature.
- Inspiration for the project: many founders face difficulty finding the right co-founder or investor — this project aims to bridge that gap.
- Thanks to any early beta-users, testers, mentors, or collaborators.
[Shree Shashank - Collaborator & Co-author](https://github.com/ShreeshashankS)


## 👤Authors
Namith KP

- GitHub: [Namith K P](https://github.com/Namith-kp)
- Project URL: [Grow-With-Me-AI](https://github.com/Namith-kp/Grow-With-Me-AI)
- Description: Engineering Student with interest in tech and startup-ecosystem matching platforms.



## License

- [MIT](https://github.com/Namith-kp/Grow-With-Me-AI/blob/main/LICENSE)

