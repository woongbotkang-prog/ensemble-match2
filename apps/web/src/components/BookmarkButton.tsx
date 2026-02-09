import { useState } from 'react';
import { Heart } from 'lucide-react';
import { toggleBookmark } from '../lib/bookmarks';
import { useAuth } from '../lib/auth';

const BookmarkButton = ({ postingId }: { postingId: string }) => {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);

  const onToggle = async () => {
    if (!user) return;
    setBusy(true);
    await toggleBookmark(user.uid, postingId);
    setBusy(false);
  };

  return (
    <button onClick={onToggle} disabled={busy} className="flex items-center gap-1 text-xs text-rose-600">
      <Heart className="h-4 w-4" />
      북마크
    </button>
  );
};

export default BookmarkButton;
