import { collection, deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export const toggleBookmark = async (uid: string, postingId: string) => {
  const bookmarkRef = doc(collection(db, 'users', uid, 'bookmarks'), postingId);
  const snapshot = await getDoc(bookmarkRef);
  if (snapshot.exists()) {
    await deleteDoc(bookmarkRef);
    return false;
  }
  await setDoc(bookmarkRef, {
    postingId,
    bookmarkedAt: new Date(),
  });
  return true;
};
