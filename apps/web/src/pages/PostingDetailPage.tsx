import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchPosting } from '../lib/postings';
import { applyToPosting } from '../lib/functions';
import { useAuth } from '../lib/auth';

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
      </div>
    </section>
  );
};

export default PostingDetailPage;
