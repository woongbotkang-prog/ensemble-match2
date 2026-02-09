import { Link } from 'react-router-dom';
import BookmarkButton from '../components/BookmarkButton';
import algoliasearch from 'algoliasearch/lite';
import { InstantSearch, SearchBox, Hits, RefinementList } from 'react-instantsearch';

const searchClient = algoliasearch(
  import.meta.env.VITE_ALGOLIA_APP_ID || 'demo',
  import.meta.env.VITE_ALGOLIA_SEARCH_KEY || 'demo'
);

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

const HitCard = ({ hit }: { hit: any }) => {
  const statusBadge = getStatusBadge(hit.status);
  const deadlineLabel = getDeadlineLabel(hit.expiresAt);
  const totalFilled = hit.totalFilled ?? 0;
  const totalNeeded = hit.totalNeeded ?? 0;

  return (
    <div className="rounded-lg border bg-white p-4">
      <Link to={`/postings/${hit.objectID}`} className="block">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">{hit.title}</h2>
          <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusBadge.className}`}>
            {statusBadge.label}
          </span>
        </div>
        <p className="text-sm text-slate-600">{hit.teamName} · {hit.region}</p>
        <div className="mt-2 flex flex-wrap gap-2 text-sm text-slate-600">
          <span>마감: {deadlineLabel}</span>
          <span>모집 현황: {totalFilled}/{totalNeeded}</span>
        </div>
      </Link>
      <div className="mt-2">
        <BookmarkButton postingId={hit.objectID} />
      </div>
    </div>
  );
};

const HomePage = () => {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">공고 검색</h1>
      <InstantSearch searchClient={searchClient} indexName="postings">
        <div className="grid gap-4 md:grid-cols-[240px_1fr]">
          <aside className="space-y-4 rounded-lg border bg-white p-4">
            <SearchBox placeholder="검색어 입력" classNames={{ input: 'w-full rounded border px-3 py-2' }} />
            <div>
              <p className="mb-2 text-sm font-medium">지역</p>
              <RefinementList attribute="region" />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">카테고리</p>
              <RefinementList attribute="categoryMain" />
            </div>
          </aside>
          <div className="grid gap-4">
            <Hits hitComponent={HitCard} />
          </div>
        </div>
      </InstantSearch>
    </section>
  );
};

export default HomePage;
