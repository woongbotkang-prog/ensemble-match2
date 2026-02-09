import { collection, getDocs, orderBy, query, updateDoc, doc, where } from 'firebase/firestore';
import { db } from './firebase';

export const fetchNotifications = async (uid: string) => {
  const q = query(collection(db, 'notifications'), where('userId', '==', uid), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
};

export const markAllRead = async (notifications: { id: string }[]) => {
  await Promise.all(
    notifications.map((item) => updateDoc(doc(db, 'notifications', item.id), { isRead: true }))
  );
};
