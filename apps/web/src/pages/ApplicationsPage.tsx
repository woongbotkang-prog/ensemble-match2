import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/auth';
import { cancelApplication } from '../lib/functions';
import { Link } from 'react-router-dom';

const ApplicationsPage = () => {
  const { user } = useAuth();
  const [apps, setApps] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'applications'),
      where('applicantId', '==', user.uid),
      orderBy('appliedAt', 'desc')
    );
    getDocs(q).then((snap) => {
      setApps(snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })));
    });
  }, [user]);

  const onCancel = async (applicationId: string) => {
    await cancelApplication({ applicationId });
    setApps((prev) => prev.map((item) => (item.id === applicationId ? { ...item, status: 'cancelled' } : item)));
  };

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">내 지원</h1>
      <div className="space-y-2">
        {apps.map((item) => (
          <div key={item.id} className="rounded-lg border bg-white p-4">
            <p className="text-sm">공고: {item.postingId}</p>
            <p className="text-sm">상태: {item.status}</p>
            {item.status === 'pending' && (
              <button onClick={() => onCancel(item.id)} className="mt-2 rounded border px-3 py-1 text-sm">지원 취소</button>
            )}
            {item.status === 'accepted' && (
              <Link to={`/chat/${item.id}`} className="mt-2 inline-block rounded border px-3 py-1 text-sm">채팅 이동</Link>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default ApplicationsPage;
