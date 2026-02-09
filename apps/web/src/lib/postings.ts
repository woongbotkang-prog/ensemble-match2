import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase';

export interface RequiredInstrument {
  instrument: string;
  count: number;
  filled: number;
}

export interface PostingPayload {
  title: string;
  teamName: string;
  categoryMain: 'chamber' | 'orchestra' | 'other';
  categorySub: string;
  requiredInstruments: RequiredInstrument[];
  repertoire: string;
  region: string;
  rehearsalFrequency: string;
  requiredSkillLevel: string[];
  description: string;
  expiresAt: string | null;
  autoCloseWhenFilled: boolean;
  allowReapplyAfterRejection: boolean;
}

export const createPosting = async (authorId: string, payload: PostingPayload) => {
  const totalNeeded = payload.requiredInstruments.reduce((sum, item) => sum + item.count, 0);
  const postingRef = await addDoc(collection(db, 'postings'), {
    authorId,
    title: payload.title,
    teamName: payload.teamName,
    categoryMain: payload.categoryMain,
    categorySub: payload.categorySub,
    requiredInstruments: payload.requiredInstruments.map((item) => ({
      ...item,
      filled: item.filled ?? 0,
    })),
    totalNeeded,
    totalFilled: 0,
    repertoire: payload.repertoire,
    region: payload.region,
    rehearsalFrequency: payload.rehearsalFrequency,
    requiredSkillLevel: payload.requiredSkillLevel,
    description: payload.description,
    expiresAt: payload.expiresAt ? new Date(payload.expiresAt) : null,
    autoCloseWhenFilled: payload.autoCloseWhenFilled,
    allowReapplyAfterRejection: payload.allowReapplyAfterRejection,
    status: 'open',
    applicantCount: 0,
    acceptedCount: 0,
    bookmarkCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return postingRef.id;
};

export const updatePosting = async (postingId: string, payload: Partial<PostingPayload>) => {
  await updateDoc(doc(db, 'postings', postingId), {
    ...payload,
    updatedAt: serverTimestamp(),
  });
};

export const fetchPosting = async (postingId: string) => {
  const snapshot = await getDoc(doc(db, 'postings', postingId));
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() };
};

export const fetchOpenPostings = async () => {
  const q = query(collection(db, 'postings'), where('status', '==', 'open'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
};
