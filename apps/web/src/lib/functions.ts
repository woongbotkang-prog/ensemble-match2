import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from './firebase';

const functions = getFunctions();

export const applyToPosting = async (payload: { postingId: string; appliedInstrument: string; message?: string }) => {
  const callable = httpsCallable(functions, 'applyToPosting');
  const result = await callable(payload);
  return result.data as { applicationId: string };
};

export const cancelApplication = async (payload: { applicationId: string }) => {
  const callable = httpsCallable(functions, 'cancelApplication');
  const result = await callable(payload);
  return result.data as { ok: boolean };
};

export const acceptApplication = async (payload: { applicationId: string }) => {
  const callable = httpsCallable(functions, 'acceptApplication');
  const result = await callable(payload);
  return result.data as { chatRoomId: string };
};

export const rejectApplication = async (payload: { applicationId: string }) => {
  const callable = httpsCallable(functions, 'rejectApplication');
  const result = await callable(payload);
  return result.data as { ok: boolean };
};

export const currentUserId = () => auth.currentUser?.uid;
