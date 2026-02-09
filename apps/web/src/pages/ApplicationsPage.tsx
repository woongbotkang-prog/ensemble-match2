import { useEffect, useMemo, useState } from 'react';
import { collection, doc, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/auth';
import { cancelApplication } from '../lib/functions';
import { Link } from 'react-router-dom';

const ApplicationsPage = () => {
  const { user } = useAuth();
  const [apps, setApps] = useState<any[]>([]);
  const [postingsById, setPostingsById] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!user) {
      setApps([]);
      return;
    }
    const q = query(
      collection(db, 'applications'),
      where('applicantId', '==', user.uid),
      orderBy('appliedAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setApps(snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })));
    });
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

    setPostingsById((prev) => {
      const next: Record<string, any> = {};
      postingIds.forEach((id) => {
        if (prev[id]) {
          next[id] = prev[id];
        }
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
    await cancelApplication({ applicationId });
    setApps((prev) => prev.map((item) => (item.id === applicationId ? { ...item, status: 'cancelled' } : item)));
  };

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">내 지원</h1>
      <div className="space-y-2">
        {apps.map((item) => {
          const posting = postingsById[item.postingId];
          return (
            <div key={item.id} className="rounded-lg border bg-white p-4">
              <p className="text-sm font-medium">{posting?.title ?? '공고 정보 없음'}</p>
              <p className="text-sm text-slate-600">{posting?.teamName ?? '팀 정보 없음'}</p>
              <p className="text-sm">공고 상태: {posting?.status ?? '알 수 없음'}</p>
              <p className="text-sm">지원 상태: {item.status}</p>
              {item.status === 'pending' && (
                <button onClick={() => onCancel(item.id)} className="mt-2 rounded border px-3 py-1 text-sm">
                  지원 취소
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
