import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/auth';
import { fetchPosting } from '../lib/postings';
import { Link } from 'react-router-dom';

const BookmarksPage = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    getDocs(collection(db, 'users', user.uid, 'bookmarks')).then(async (snap) => {
      const postings = await Promise.all(
        snap.docs.map((docSnap) => fetchPosting(docSnap.id))
      );
      setItems(postings.filter(Boolean));
    });
  }, [user]);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">북마크</h1>
      <div className="grid gap-4">
        {items.map((item) => (
          <Link key={item.id} to={`/postings/${item.id}`} className="rounded-lg border bg-white p-4">
            <h2 className="text-lg font-semibold">{item.title}</h2>
            <p className="text-sm text-slate-600">{item.teamName}</p>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default BookmarksPage;
