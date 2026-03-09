import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';

export const storageService = {
  async uploadFile(
    path: string,
    fileUri: string
  ): Promise<string> {
    try {
      // Fetch file as blob - use XMLHttpRequest for React Native compatibility
      const blob: Blob = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = () => resolve(xhr.response);
        xhr.onerror = () => reject(new Error('Error leyendo archivo'));
        xhr.responseType = 'blob';
        xhr.open('GET', fileUri, true);
        xhr.send(null);
      });

      const storageRef = ref(storage, path);
      const metadata = { contentType: 'image/jpeg' };
      await uploadBytesResumable(storageRef, blob, metadata);
      const downloadUrl = await getDownloadURL(storageRef);
      return downloadUrl;
    } catch (error: any) {
      throw new Error(`Error subiendo archivo: ${error.message}`);
    }
  },

  async getFileUrl(path: string): Promise<string> {
    try {
      const storageRef = ref(storage, path);
      return await getDownloadURL(storageRef);
    } catch (error: any) {
      throw new Error(`Error obteniendo URL: ${error.message}`);
    }
  },
};
