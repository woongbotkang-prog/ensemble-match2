import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchPosting } from '../lib/postings';
import { applyToPosting } from '../lib/functions';
import { useAuth } from '../lib/auth';

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
          {applyError && <p className="text-sm text-rose-600">{applyError}</p>}
          <button
            disabled={!user || applyLoading || !instrument}
            onClick={onApply}
            className="rounded bg-slate-900 px-4 py-2 text-white disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {applyLoading ? '지원 처리 중...' : user ? '지원하기' : '로그인이 필요합니다'}
          </button>
        </div>
      </div>
    </section>
  );
};

export default PostingDetailPage;
