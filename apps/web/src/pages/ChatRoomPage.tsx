import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/auth';

const ChatRoomPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');

  useEffect(() => {
    if (!id) return;
    const q = query(collection(db, 'chatRooms', id, 'messages'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })));
    });
    return () => unsub();
  }, [id]);

  const onSend = async () => {
    if (!id || !user || !text.trim()) return;
    await addDoc(collection(db, 'chatRooms', id, 'messages'), {
      senderId: user.uid,
      text,
      createdAt: serverTimestamp(),
    });
    setText('');
  };

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">채팅</h1>
      <div className="space-y-2 rounded-lg border bg-white p-4">
        {messages.map((msg) => (
          <div key={msg.id} className="text-sm">
            <span className="font-medium">{msg.senderId}</span>: {msg.text}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={text} onChange={(event) => setText(event.target.value)} className="flex-1 rounded border px-3 py-2" placeholder="메시지 입력" />
        <button onClick={onSend} className="rounded bg-slate-900 px-4 py-2 text-white">전송</button>
      </div>
    </section>
  );
};

export default ChatRoomPage;
