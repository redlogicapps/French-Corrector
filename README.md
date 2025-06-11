# French Corrector with AI

A web application that helps users correct and improve their French writing using Google's Gemini AI. The app provides corrections, explanations, and maintains a history of all corrections for authenticated users.

## Features

- **AI-Powered Corrections**: Get instant corrections for French text using Google's Gemini AI
- **Detailed Explanations**: Understand the reasoning behind each correction
- **User Authentication**: Secure sign-up and login with Firebase Authentication
- **Correction History**: View and manage your past corrections
- **Responsive Design**: Works on desktop and mobile devices

## Prerequisites

- Node.js (v16 or later)
- npm or yarn
- Firebase account
- Google Gemini API key

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/redlogicapps/French-Corrector.git
   cd French-Corrector
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**
   - Create a new project in the [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password)
   - Create a Firestore database
   - Register a new web app in your Firebase project
   - Copy the Firebase configuration

4. **Configure environment variables**
   - Copy `.env.example` to `.env.local`
   - Fill in your Firebase configuration and Gemini API key
   ```env
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`

## Deployment

### Firebase Hosting

1. Install Firebase CLI
   ```bash
   npm install -g firebase-tools
   ```

2. Log in to Firebase
   ```bash
   firebase login
   ```

3. Initialize Firebase project
   ```bash
   firebase init
   ```
   - Select Hosting
   - Choose your Firebase project
   - Set `dist` as the public directory
   - Configure as a single-page app: Yes
   - Set up automatic builds: No

4. Build the app
   ```bash
   npm run build
   ```

5. Deploy to Firebase
   ```bash
   firebase deploy --only hosting
   ```

## Security Rules

Firestore security rules are defined in `firestore.rules`. By default, they:
- Allow users to read and write only their own documents in the 'corrections' collection
- Allow users to read and write only their own user document

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Google Gemini API](https://ai.google.dev/)
- [Firebase](https://firebase.google.com/)
- [React](https://reactjs.org/)
- [Vite](https://vitejs.dev/)
