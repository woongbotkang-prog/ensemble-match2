import { Route, Routes } from 'react-router-dom';
import Layout from '../components/Layout';
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';
import SignupPage from '../pages/SignupPage';
import NewPostingPage from '../pages/NewPostingPage';
import PostingDetailPage from '../pages/PostingDetailPage';
import ApplicationsPage from '../pages/ApplicationsPage';
import BookmarksPage from '../pages/BookmarksPage';
import NotificationsPage from '../pages/NotificationsPage';
import ChatRoomPage from '../pages/ChatRoomPage';

const App = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="signup" element={<SignupPage />} />
        <Route path="postings/new" element={<NewPostingPage />} />
        <Route path="postings/:id" element={<PostingDetailPage />} />
        <Route path="applications" element={<ApplicationsPage />} />
        <Route path="bookmarks" element={<BookmarksPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="chat/:id" element={<ChatRoomPage />} />
      </Route>
    </Routes>
  );
};

export default App;
