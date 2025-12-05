# Google Authentication Setup Guide

To enable real Google Sign-In for this application, you need to integrate a backend authentication service. We recommend **Firebase Authentication** as it's free, easy to setup, and works great with React.

## Prerequisites

1.  A Google Cloud Account.
2.  Node.js installed.

## Step 1: Create a Firebase Project

1.  Go to [Firebase Console](https://console.firebase.google.com/).
2.  Click **"Add project"** and follow the setup wizard.
3.  Once created, go to **Build > Authentication** in the sidebar.
4.  Click **"Get Started"**.
5.  In the **Sign-in method** tab, select **Google**.
6.  Enable it, select your support email, and click **Save**.

## Step 2: Register Your App

1.  In Project Overview (gear icon), click the **Web (</>)** icon to add an app.
2.  Register the app (e.g., "Versatile Todo").
3.  You will see a config object (`firebaseConfig`). Keep this page open.

## Step 3: Install Firebase SDK

Run this command in your project terminal:

```bash
npm install firebase
```

## Step 4: Configure Firebase in Code

Create a file `src/firebase.ts`:

```typescript
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
```

> [!IMPORTANT]
> Replace the placeholder values with the ones from Step 2. Do not commit API keys to public repositories; use environment variables (`import.meta.env.VITE_FIREBASE_API_KEY`) in a real project.

## Step 5: Update AuthContext

Modify `src/context/AuthContext.tsx` to use Firebase:

```typescript
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, signOut } from 'firebase/auth';

// Inside AuthProvider...

const login = async (provider: 'google' | 'microsoft') => {
    if (provider === 'google') {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            // Map Firebase user to your User type and set state
        } catch (error) {
            console.error(error);
        }
    }
};

const logout = async () => {
    await signOut(auth);
    setUser(null);
};
```

## Step 6: Verify

1.  Restart your development server.
2.  Click "Sign in with Google".
3.  A popup should appear allowing you to login with your Google account.
