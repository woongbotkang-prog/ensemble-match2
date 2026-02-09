import { useEffect, useMemo, useState } from 'react';
import { collection, doc, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/auth';
import { cancelApplication } from '../lib/functions';
import { Link } from 'react-router-dom';

const mapFunctionsErrorMessage = (error: unknown) => {
  if (!error || typeof error !== 'object' || !('code' in error)) {
    return '요청을 처리할 수 없습니다. 잠시 후 다시 시도해주세요.';
  }

  const rawCode = String((error as { code?: string }).code ?? '');
  const code = rawCode.startsWith('functions/') ? rawCode.replace('functions/', '') : rawCode;

  switch (code) {
    case 'unauthenticated':
      return '로그인이 필요합니다.';
    case 'permission-denied':
      return '요청 권한이 없습니다.';
    case 'not-found':
      return '지원 정보를 찾을 수 없습니다.';
    case 'failed-precondition':
      return '현재 요청을 처리할 수 없습니다.';
    case 'invalid-argument':
      return '입력한 정보를 확인해주세요.';
    case 'resource-exhausted':
      return '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
    case 'unavailable':
      return '서버가 응답하지 않습니다. 잠시 후 다시 시도해주세요.';
    case 'deadline-exceeded':
      return '요청 시간이 초과되었습니다.';
    case 'internal':
      return '서버 오류가 발생했습니다.';
    default:
      return '요청을 처리할 수 없습니다. 잠시 후 다시 시도해주세요.';
  }
};

const ApplicationsPage = () => {
  const { user } = useAuth();
  const [apps, setApps] = useState<any[]>([]);
  const [postingsById, setPostingsById] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [cancelError, setCancelError] = useState('');
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setApps([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    const q = query(
      collection(db, 'applications'),
      where('applicantId', '==', user.uid),
      orderBy('appliedAt', 'desc')
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setApps(snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })));
        setIsLoading(false);
      },
      (error) => {
        setErrorMessage(mapFunctionsErrorMessage(error));
        setIsLoading(false);
      }
    );

    return () => unsub();
  }, [user]);

  const postingIds = useMemo(
    () => Array.from(new Set(apps.map((item) => item.postingId).filter(Boolean))),
    [apps]
  );

  useEffect(() => {
    if (!postingIds.length) {
      setPostingsById({});
      return;
    }

    // keep only still-relevant cached postings
    setPostingsById((prev) => {
      const next: Record<string, any> = {};
      postingIds.forEach((id) => {
        if (prev[id] !== undefined) next[id] = prev[id];
      });
      return next;
    });

    const unsubs = postingIds.map((postingId) =>
      onSnapshot(doc(db, 'postings', postingId), (snap) => {
        setPostingsById((prev) => ({
          ...prev,
          [postingId]: snap.exists() ? { id: snap.id, ...snap.data() } : null,
        }));
      })
    );

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [postingIds]);

  const onCancel = async (applicationId: string) => {
    setCancelingId(applicationId);
    setCancelError('');
    try {
      await cancelApplication({ applicationId });
      // optimistic UI update (snapshot will also reflect it if server updates status)
      setApps((prev) =>
        prev.map((item) => (item.id === applicationId ? { ...item, status: 'cancelled' } : item))
      );
    } catch (error) {
      setCancelError(mapFunctionsErrorMessage(error));
    } finally {
      setCancelingId(null);
    }
  };

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">내 지원</h1>

      {errorMessage && (
        <p className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {errorMessage}
        </p>
      )}
      {cancelError && (
        <p className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {cancelError}
        </p>
      )}

      <div className="space-y-2">
        {isLoading && (
          <div className="rounded-lg border bg-white p-4 text-sm text-slate-500">로딩 중...</div>
        )}

        {!isLoading && apps.length === 0 && (
          <div className="rounded-lg border bg-white p-4 text-sm text-slate-500">
            아직 지원한 공고가 없습니다.
          </div>
        )}

        {apps.map((item) => {
          const posting = postingsById[item.postingId];
          return (
            <div key={item.id} className="rounded-lg border bg-white p-4">
              <p className="text-sm font-medium">{posting?.title ?? '공고 정보 없음'}</p>
              <p className="text-sm text-slate-600">{posting?.teamName ?? '팀 정보 없음'}</p>
              <p className="text-sm">공고 상태: {posting?.status ?? '알 수 없음'}</p>
              <p className="text-sm">지원 상태: {item.status}</p>

              {item.status === 'pending' && (
                <button
                  onClick={() => onCancel(item.id)}
                  className="mt-2 rounded border px-3 py-1 text-sm disabled:cursor-not-allowed disabled:text-slate-400"
                  disabled={cancelingId === item.id}
                >
                  {cancelingId === item.id ? '취소 처리 중...' : '지원 취소'}
                </button>
              )}

              {item.status === 'accepted' && (
                <Link to={`/chat/${item.id}`} className="mt-2 inline-block rounded border px-3 py-1 text-sm">
                  채팅 이동
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default ApplicationsPage;