import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../config/firebase';
import { User } from '../types';
import { authService } from '../services/authService';
import { pushService } from '../services/pushService';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

interface AuthContextData {
  user: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  isAppleSignInAvailable: boolean;
  signOut: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  deactivateAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

const GOOGLE_WEB_CLIENT_ID = '83831683899-r81jqu2fgvn04go8ar5gbhb5sdvtkj77.apps.googleusercontent.com';
const GOOGLE_ANDROID_CLIENT_ID = '174951830279-salstlredekull5rqej0970aiffn9hls.apps.googleusercontent.com';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAppleSignInAvailable, setIsAppleSignInAvailable] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
  });

  useEffect(() => {
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync().then(setIsAppleSignInAvailable);
    }
  }, []);

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      handleGoogleSignIn(id_token);
    }
  }, [response]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          let data = await authService.getUserData(firebaseUser.uid);
          if (!data) {
            // Documento no existe (usuario legacy o reset), crearlo
            await authService.ensureUserDocument(firebaseUser);
            data = await authService.getUserData(firebaseUser.uid);
          }
          if (data?.deactivatedAt) {
            await authService.logout();
            setUser(null);
            setUserData(null);
            setLoading(false);
            return;
          }
          setUserData(data);
          pushService.registerForPushNotifications(firebaseUser.uid).catch((error) => {
            console.error('Error registrando push token:', error);
          });
        } catch (error) {
          console.error('Error cargando datos de usuario:', error);
          setUserData(null);
        }
      } else {
        setUserData(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleGoogleSignIn = async (idToken: string) => {
    try {
      await authService.loginWithGoogle(idToken);
    } catch (error) {
      console.error('Error en Google Sign-In:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    await authService.login(email, password);
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    await authService.register(email, password, displayName);
  };

  const signInWithGoogle = async () => {
    await promptAsync();
  };

  const signInWithApple = async () => {
    const nonce = Math.random().toString(36).substring(2, 15);
    const hashedNonce = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      nonce
    );

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });

    if (!credential.identityToken) {
      throw new Error('No se recibió el token de Apple');
    }

    await authService.loginWithApple(credential.identityToken, nonce, {
      givenName: credential.fullName?.givenName,
      familyName: credential.fullName?.familyName,
    });
  };

  const refreshUserData = async () => {
    if (user) {
      try {
        const data = await authService.getUserData(user.uid);
        setUserData(data);
      } catch (error) {
        console.error('Error refrescando datos de usuario:', error);
      }
    }
  };

  const deactivateAccount = async () => {
    if (user) {
      await authService.deactivateAccount(user.uid);
    }
  };

  const signOut = async () => {
    await authService.logout();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signInWithApple,
        isAppleSignInAvailable,
        signOut,
        refreshUserData,
        deactivateAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);