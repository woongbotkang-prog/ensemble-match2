import { Link } from 'react-router-dom';
import BookmarkButton from '../components/BookmarkButton';
import algoliasearch from 'algoliasearch/lite';
import { InstantSearch, SearchBox, Hits, RefinementList } from 'react-instantsearch';

const searchClient = algoliasearch(
  import.meta.env.VITE_ALGOLIA_APP_ID || 'demo',
  import.meta.env.VITE_ALGOLIA_SEARCH_KEY || 'demo'
);

const HitCard = ({ hit }: { hit: any }) => {
  return (
    <div className="rounded-lg border bg-white p-4">
      <Link to={`/postings/${hit.objectID}`} className="block">
        <h2 className="text-lg font-semibold">{hit.title}</h2>
        <p className="text-sm text-slate-600">{hit.teamName} · {hit.region}</p>
        <p className="text-sm text-slate-600">모집 현황: {hit.bookmarkCount ?? 0}</p>
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
