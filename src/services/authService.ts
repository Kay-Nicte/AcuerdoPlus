import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithCredential,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  OAuthProvider,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User } from '../types';

export const authService = {
  async register(email: string, password: string, displayName: string): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      await updateProfile(firebaseUser, { displayName });

      const userData: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName,
        showRelation: false,
        createdAt: new Date(),
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), {
        ...userData,
        createdAt: Timestamp.fromDate(userData.createdAt),
      });

      return userData;
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  async login(email: string, password: string): Promise<FirebaseUser> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  async loginWithGoogle(idToken: string): Promise<FirebaseUser> {
    try {
      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, credential);
      const firebaseUser = userCredential.user;

      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (!userDoc.exists()) {
        const userData: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email!,
          displayName: firebaseUser.displayName || 'Usuario',
          showRelation: false,
          createdAt: new Date(),
        };
        await setDoc(doc(db, 'users', firebaseUser.uid), {
          ...userData,
          createdAt: Timestamp.fromDate(userData.createdAt),
        });
      }

      return firebaseUser;
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  async loginWithApple(identityToken: string, nonce: string, fullName?: { givenName?: string | null; familyName?: string | null }): Promise<FirebaseUser> {
    try {
      const provider = new OAuthProvider('apple.com');
      const credential = provider.credential({ idToken: identityToken, rawNonce: nonce });
      const userCredential = await signInWithCredential(auth, credential);
      const firebaseUser = userCredential.user;

      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

      if (!userDoc.exists()) {
        const displayName =
          firebaseUser.displayName ||
          [fullName?.givenName, fullName?.familyName].filter(Boolean).join(' ').trim() ||
          'Usuario';

        const userData: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email!,
          displayName,
          showRelation: false,
          createdAt: new Date(),
        };
        await setDoc(doc(db, 'users', firebaseUser.uid), {
          ...userData,
          createdAt: Timestamp.fromDate(userData.createdAt),
        });
      }

      return firebaseUser;
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  async updateUserProfile(uid: string, data: {
    displayName: string;
    relationToMinor?: string;
    showRelation?: boolean;
    photoUrl?: string;
  }): Promise<void> {
    try {
      const updateData: any = { displayName: data.displayName };
      if (data.relationToMinor !== undefined) {
        updateData.relationToMinor = data.relationToMinor || null;
      }
      if (data.showRelation !== undefined) {
        updateData.showRelation = data.showRelation;
      }
      if (data.photoUrl) {
        updateData.photoUrl = data.photoUrl;
      }
      await setDoc(doc(db, 'users', uid), updateData, { merge: true });
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: data.displayName });
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  async deactivateAccount(uid: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', uid), {
        deactivatedAt: Timestamp.fromDate(new Date()),
      });
      await signOut(auth);
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  async ensureUserDocument(firebaseUser: FirebaseUser): Promise<void> {
    const userRef = doc(db, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      await setDoc(userRef, {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || 'Usuario',
        showRelation: false,
        createdAt: Timestamp.fromDate(new Date()),
      });
    }
  },

  async getUserData(uid: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data() as User;
      }
      return null;
    } catch (error: any) {
      throw new Error(error.message);
    }
  },
};