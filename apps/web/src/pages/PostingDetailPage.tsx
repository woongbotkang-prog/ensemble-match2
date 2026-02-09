import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchPosting } from '../lib/postings';
import { acceptApplication, applyToPosting, rejectApplication } from '../lib/functions';
import { useAuth } from '../lib/auth';
import { collection, doc, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

const PostingDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [posting, setPosting] = useState<any>(null);
  const [instrument, setInstrument] = useState('');
  const [message, setMessage] = useState('');
  const [applications, setApplications] = useState<any[]>([]);
  const [applicantProfiles, setApplicantProfiles] = useState<Record<string, any>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchPosting(id).then((data) => {
      setPosting(data);
      if (data?.requiredInstruments?.length) {
        setInstrument(data.requiredInstruments[0].instrument);
      }
    });
  }, [id]);

  const isAuthor = user && posting?.authorId === user.uid;

  useEffect(() => {
    if (!id || !isAuthor) {
      setApplications([]);
      return;
    }
    const q = query(
      collection(db, 'applications'),
      where('postingId', '==', id),
      orderBy('appliedAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setApplications(snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })));
    });
    return () => unsub();
  }, [id, isAuthor]);

  const applicantIds = useMemo(
    () => Array.from(new Set(applications.map((item) => item.applicantId).filter(Boolean))),
    [applications]
  );

  useEffect(() => {
    if (!applicantIds.length) {
      setApplicantProfiles({});
      return;
    }

    setApplicantProfiles((prev) => {
      const next: Record<string, any> = {};
      applicantIds.forEach((applicantId) => {
        if (prev[applicantId]) {
          next[applicantId] = prev[applicantId];
        }
      });
      return next;
    });

    const unsubs = applicantIds.map((applicantId) =>
      onSnapshot(doc(db, 'users', applicantId), (snap) => {
        setApplicantProfiles((prev) => ({
          ...prev,
          [applicantId]: snap.exists() ? { id: snap.id, ...snap.data() } : null,
        }));
      })
    );

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [applicantIds]);

  const onApply = async () => {
    if (!id || !instrument) return;
    await applyToPosting({ postingId: id, appliedInstrument: instrument, message });
    alert('지원이 완료되었습니다.');
  };

  const onAccept = async (applicationId: string) => {
    setActionLoading(applicationId);
    try {
      await acceptApplication({ applicationId });
      setApplications((prev) => prev.map((item) => (item.id === applicationId ? { ...item, status: 'accepted' } : item)));
    } finally {
      setActionLoading(null);
    }
  };

  const onReject = async (applicationId: string) => {
    setActionLoading(applicationId);
    try {
      await rejectApplication({ applicationId });
      setApplications((prev) => prev.map((item) => (item.id === applicationId ? { ...item, status: 'rejected' } : item)));
    } finally {
      setActionLoading(null);
    }
  };

  if (!posting) {
    return <div className="rounded-lg border bg-white p-6">로딩 중...</div>;
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">{posting.title}</h1>
      <div className="rounded-lg border bg-white p-6 space-y-2">
        <p className="text-sm text-slate-600">{posting.teamName}</p>
        <p className="text-sm">지역: {posting.region}</p>
        <p className="text-sm">레퍼토리: {posting.repertoire}</p>
        <p className="text-sm">설명: {posting.description}</p>
        <div className="rounded border p-3 text-sm space-y-2">
          <p className="font-medium">지원하기</p>
          <select value={instrument} onChange={(event) => setInstrument(event.target.value)} className="w-full rounded border px-3 py-2">
            {posting.requiredInstruments?.map((item: any) => (
              <option key={item.instrument} value={item.instrument}>{item.instrument}</option>
            ))}
          </select>
          <textarea value={message} onChange={(event) => setMessage(event.target.value)} className="w-full rounded border px-3 py-2" rows={3} placeholder="지원 메시지" />
          <button disabled={!user} onClick={onApply} className="rounded bg-slate-900 px-4 py-2 text-white">
            {user ? '지원하기' : '로그인이 필요합니다'}
          </button>
        </div>
        {isAuthor && (
          <div className="rounded border p-3 space-y-3">
            <div>
              <p className="text-sm font-medium">지원자 리스트</p>
              <p className="text-xs text-slate-500">지원 상태는 실시간으로 업데이트됩니다.</p>
            </div>
            {applications.length === 0 && (
              <p className="text-sm text-slate-500">아직 지원자가 없습니다.</p>
            )}
            <div className="space-y-3">
              {applications.map((application) => {
                const profile = applicantProfiles[application.applicantId];
                const isPending = application.status === 'pending';
                return (
                  <div key={application.id} className="rounded border p-3 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{profile?.displayName ?? '이름 없음'}</p>
                        <p className="text-xs text-slate-500">{profile?.email ?? '이메일 없음'}</p>
                      </div>
                      <span className="text-xs rounded-full border px-2 py-1">
                        {application.status ?? 'pending'}
                      </span>
                    </div>
                    <div className="text-sm text-slate-600">
                      <p>지원 악기: {application.appliedInstrument}</p>
                      {profile?.instrument?.length > 0 && <p>보유 악기: {profile.instrument.join(', ')}</p>}
                      {profile?.skillLevel && <p>레벨: {profile.skillLevel}</p>}
                      {profile?.region && <p>지역: {profile.region}</p>}
                    </div>
                    {application.message && (
                      <p className="text-sm text-slate-700">지원 메시지: {application.message}</p>
                    )}
                    {profile?.bio && (
                      <p className="text-xs text-slate-500">소개: {profile.bio}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => onAccept(application.id)}
                        disabled={!isPending || actionLoading === application.id}
                        className="rounded border px-3 py-1 text-xs"
                      >
                        수락
                      </button>
                      <button
                        type="button"
                        onClick={() => onReject(application.id)}
                        disabled={!isPending || actionLoading === application.id}
                        className="rounded border px-3 py-1 text-xs"
                      >
                        거절
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default PostingDetailPage;
