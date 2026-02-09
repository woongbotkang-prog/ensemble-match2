import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { fetchPosting } from '../lib/postings';
import { acceptApplication, applyToPosting, rejectApplication } from '../lib/functions';
import { useAuth } from '../lib/auth';
import { collection, doc, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

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
      return '요청한 공고를 찾을 수 없습니다.';
    case 'already-exists':
      return '이미 지원한 공고입니다.';
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

const resolveDate = (value: any) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof value?.toDate === 'function') {
    return value.toDate();
  }
  if (typeof value?.seconds === 'number') {
    return new Date(value.seconds * 1000);
  }
  return null;
};

const getDeadlineLabel = (expiresAt: any) => {
  const deadline = resolveDate(expiresAt);
  if (!deadline) return '상시';
  const diffMs = deadline.getTime() - Date.now();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return '마감';
  return `D-${diffDays}`;
};

const getStatusBadge = (status?: string) => {
  if (status === 'closed') {
    return { label: '마감', className: 'bg-slate-200 text-slate-700' };
  }
  if (status === 'open') {
    return { label: '모집중', className: 'bg-emerald-100 text-emerald-700' };
  }
  return { label: status ?? '상태없음', className: 'bg-slate-100 text-slate-600' };
};

const PostingDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [posting, setPosting] = useState<any>(null);
  const [instrument, setInstrument] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [applyLoading, setApplyLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [applyError, setApplyError] = useState('');

  useEffect(() => {
    if (!id) return;
    const loadPosting = async () => {
      setIsLoading(true);
      setErrorMessage('');
      try {
        const data = await fetchPosting(id);
        setPosting(data);
        if (data?.requiredInstruments?.length) {
          setInstrument(data.requiredInstruments[0].instrument);
        }
      } catch (error) {
        setErrorMessage(mapFunctionsErrorMessage(error));
      } finally {
        setIsLoading(false);
      }
    };

    loadPosting();
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
    setApplyLoading(true);
    setApplyError('');
    try {
      await applyToPosting({ postingId: id, appliedInstrument: instrument, message });
      alert('지원이 완료되었습니다.');
    } catch (error) {
      setApplyError(mapFunctionsErrorMessage(error));
    } finally {
      setApplyLoading(false);
    }
  };

  if (isLoading) {
    return <div className="rounded-lg border bg-white p-6">로딩 중...</div>;
  }

  if (!posting) {
    return (
      <div className="rounded-lg border bg-white p-6 space-y-2">
        <p className="text-sm text-slate-600">공고 정보를 불러오지 못했습니다.</p>
        {errorMessage && <p className="text-sm text-rose-600">{errorMessage}</p>}
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold">{posting.title}</h1>
        <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusBadge.className}`}>
          {statusBadge.label}
        </span>
      </div>
      <div className="rounded-lg border bg-white p-6 space-y-2">
        <p className="text-sm text-slate-600">{posting.teamName}</p>
        <div className="flex flex-wrap gap-2 text-sm text-slate-600">
          <span>마감: {deadlineLabel}</span>
          <span>모집 현황: {totalFilled}/{totalNeeded}</span>
        </div>
        <p className="text-sm">지역: {posting.region}</p>
        <p className="text-sm">레퍼토리: {posting.repertoire}</p>
        <p className="text-sm">설명: {posting.description}</p>
        <p className="text-sm">정원 마감 자동 종료: {posting.autoCloseWhenFilled ? '예' : '아니오'}</p>
        <div className="rounded border p-3 text-sm space-y-2">
          <p className="font-medium">지원하기</p>
          <select value={instrument} onChange={(event) => setInstrument(event.target.value)} className="w-full rounded border px-3 py-2">
            {posting.requiredInstruments?.map((item: any) => (
              <option key={item.instrument} value={item.instrument}>{item.instrument}</option>
            ))}
          </select>
          <textarea value={message} onChange={(event) => setMessage(event.target.value)} className="w-full rounded border px-3 py-2" rows={3} placeholder="지원 메시지" />
          {applyError && <p className="text-sm text-rose-600">{applyError}</p>}
          <button
            disabled={!user || applyLoading || !instrument}
            onClick={onApply}
            className="rounded bg-slate-900 px-4 py-2 text-white disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {applyLoading ? '지원 처리 중...' : user ? '지원하기' : '로그인이 필요합니다'}
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
