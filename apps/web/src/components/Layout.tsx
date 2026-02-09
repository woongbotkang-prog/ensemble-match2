import { Link, Outlet } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useEffect, useState } from 'react';
import { fetchNotifications } from '../lib/notifications';

const Layout = () => {
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    fetchNotifications(user.uid).then((items) => {
      setUnreadCount(items.filter((item: any) => !item.isRead).length);
    });
  }, [user]);

  return (
    <div className="min-h-screen">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-xl font-semibold">Ensemble Match</Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link to="/postings/new">공고 작성</Link>
            <Link to="/applications">내 지원</Link>
            <Link to="/bookmarks">북마크</Link>
            <Link to="/notifications" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-2 -top-2 rounded-full bg-rose-500 px-1.5 text-[10px] text-white">{unreadCount}</span>
              )}
            </Link>
            {user ? (
              <button onClick={() => logout()} className="text-sm">로그아웃</button>
            ) : (
              <Link to="/login">로그인</Link>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
