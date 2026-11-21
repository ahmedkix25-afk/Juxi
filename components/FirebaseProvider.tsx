'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
  type User,
} from 'firebase/auth';
import { auth, testFirestoreConnection } from '@/lib/firebase';
import { checkIsUserAdmin } from '@/lib/firestore-service';
import {
  formatFirebaseAuthError,
  isPopupFallbackError,
} from '@/lib/auth-errors';

interface FirebaseContextValue {
  user: User | null;
  isAdmin: boolean;
  authReady: boolean;
  redirectAuthError: string | null;
  clearRedirectAuthError: () => void;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextValue | null>(null);

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [redirectAuthError, setRedirectAuthError] = useState<string | null>(
    null,
  );

  useEffect(() => {
    void testFirestoreConnection();

    getRedirectResult(auth).catch((err: unknown) => {
      const hostname =
        typeof window !== 'undefined' ? window.location.hostname : undefined;
      const formatted = formatFirebaseAuthError(err, 'google', hostname);
      if (formatted) {
        setRedirectAuthError(formatted);
      }
    });

    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (nextUser) {
        setRedirectAuthError(null);
        const adminOk = await checkIsUserAdmin(
          nextUser.uid,
          nextUser.email,
          nextUser.emailVerified,
        );
        setIsAdmin(adminOk);
      } else {
        setIsAdmin(false);
      }
      setAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  const clearRedirectAuthError = useCallback(() => {
    setRedirectAuthError(null);
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    setRedirectAuthError(null);
    await signInWithEmailAndPassword(auth, email.trim(), password);
  }, []);

  const registerWithEmail = useCallback(async (email: string, password: string) => {
    setRedirectAuthError(null);
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    if (cred.user && !cred.user.emailVerified) {
      try {
        await sendEmailVerification(cred.user);
      } catch {
        // Ignore verification email rate limits
      }
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setRedirectAuthError(null);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      const isTopWindow =
        typeof window !== 'undefined' && window.self === window.top;
      if (isTopWindow && isPopupFallbackError(err)) {
        await signInWithRedirect(auth, provider);
        return;
      }
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    setRedirectAuthError(null);
    await signOut(auth);
  }, []);

  return (
    <FirebaseContext.Provider
      value={{
        user,
        isAdmin,
        authReady,
        redirectAuthError,
        clearRedirectAuthError,
        signInWithEmail,
        registerWithEmail,
        signInWithGoogle,
        logout,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebaseAuth(): FirebaseContextValue {
  const ctx = useContext(FirebaseContext);
  if (!ctx) {
    throw new Error('useFirebaseAuth must be used within FirebaseProvider');
  }
  return ctx;
}
