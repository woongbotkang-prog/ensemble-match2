import { connectFunctionsEmulator, getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from './firebase';

const functions = getFunctions();
const useEmulator = import.meta.env.VITE_USE_EMULATOR === 'true';
if (useEmulator) {
  const host = import.meta.env.VITE_FIREBASE_EMULATOR_HOST || 'localhost';
  const port = Number(import.meta.env.VITE_FIREBASE_FUNCTIONS_EMULATOR_PORT || 5001);
  connectFunctionsEmulator(functions, host, port);
}

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
