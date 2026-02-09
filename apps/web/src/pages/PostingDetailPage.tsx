import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchPosting } from '../lib/postings';
import { applyToPosting } from '../lib/functions';
import { useAuth } from '../lib/auth';

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

  useEffect(() => {
    if (!id) return;
    fetchPosting(id).then((data) => {
      setPosting(data);
      if (data?.requiredInstruments?.length) {
        setInstrument(data.requiredInstruments[0].instrument);
      }
    });
  }, [id]);

  const onApply = async () => {
    if (!id || !instrument) return;
    await applyToPosting({ postingId: id, appliedInstrument: instrument, message });
    alert('지원이 완료되었습니다.');
  };

  if (!posting) {
    return <div className="rounded-lg border bg-white p-6">로딩 중...</div>;
  }

  const statusBadge = getStatusBadge(posting.status);
  const deadlineLabel = getDeadlineLabel(posting.expiresAt);
  const totalFilled = posting.totalFilled ?? 0;
  const totalNeeded = posting.totalNeeded ?? 0;

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
          <button disabled={!user} onClick={onApply} className="rounded bg-slate-900 px-4 py-2 text-white">
            {user ? '지원하기' : '로그인이 필요합니다'}
          </button>
        </div>
      </div>
    </section>
  );
};

export default PostingDetailPage;
