import { initializeApp } from 'firebase/app';
import { initializeAuth } from 'firebase/auth';
// @ts-ignore — getReactNativePersistence exists at runtime in firebase 12.x
import { getReactNativePersistence } from '@firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyAIuZ8H3YZrk5u4EGypmVoE_YI72y899Do",
  authDomain: "acuerdo-plus.firebaseapp.com",
  projectId: "acuerdo-plus",
  storageBucket: "acuerdo-plus.firebasestorage.app",
  messagingSenderId: "83831683899",
  appId: "1:83831683899:web:3686c44d71edfb5eb0551e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services with AsyncStorage persistence for React Native
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
