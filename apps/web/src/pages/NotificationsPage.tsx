import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { fetchNotifications, markAllRead } from '../lib/notifications';

const NotificationsPage = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    fetchNotifications(user.uid).then(setItems);
  }, [user]);

  const onMarkAll = async () => {
    await markAllRead(items);
    setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">알림</h1>
        <button onClick={onMarkAll} className="rounded border px-3 py-1 text-sm">모두 읽음</button>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="rounded-lg border bg-white p-4">
            <p className="text-sm font-semibold">{item.title}</p>
            <p className="text-sm text-slate-600">{item.message}</p>
            {!item.isRead && <span className="text-xs text-rose-500">읽지 않음</span>}
          </div>
        ))}
      </div>
    </section>
  );
};

export default NotificationsPage;
