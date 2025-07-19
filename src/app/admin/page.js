'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Supabaseクライアントをセットアップ
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- フォームコンポーネント ---
function BookForm({ book, onSave, onCancel }) {
  const [formData, setFormData] = useState(
    book || { title: '', author: '', cover_image_url: '', synopsis: '', purchase_link: '', ranking: 51 }
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  // --- ここから追加 ---
  // 各入力欄の共通スタイルを定義（文字色を濃いグレーに設定）
  const inputStyle = "w-full px-3 py-2 border rounded-md text-gray-900";
  // --- ここまで追加 ---

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
        <h3 className="text-xl font-bold mb-4">{book ? '書籍の編集' : '新しい書籍の追加'}</h3>
        <div className="space-y-4">
          {/* ↓ 各入力項目の className を修正 */}
          <input name="title" value={formData.title || ''} onChange={handleChange} placeholder="タイトル" className={inputStyle} required />
          <input name="author" value={formData.author || ''} onChange={handleChange} placeholder="著者" className={inputStyle} required />
          <input name="cover_image_url" value={formData.cover_image_url || ''} onChange={handleChange} placeholder="表紙画像のURL" className={inputStyle} />
          <textarea name="synopsis" value={formData.synopsis || ''} onChange={handleChange} placeholder="あらすじ" className={inputStyle} rows="4"></textarea>
          <input name="purchase_link" value={formData.purchase_link || ''} onChange={handleChange} placeholder="購入ページのURL" className={inputStyle} />
          <input name="ranking" type="number" value={formData.ranking || ''} onChange={handleChange} placeholder="ランキング" className={inputStyle} required />
        </div>
        <div className="flex justify-end gap-4 mt-6">
          <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400">キャンセル</button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">保存</button>
        </div>
      </form>
    </div>
  );
}


// --- ダッシュボード本体 ---
function AdminDashboard() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingBook, setEditingBook] = useState(null); // 編集中の本 or null
  const [isFormVisible, setIsFormVisible] = useState(false);

  useEffect(() => {
    fetchBooks();
  }, []);

  async function fetchBooks() {
    setLoading(true);
    const { data, error } = await supabase.from('books').select('*').order('ranking', { ascending: true });
    if (error) console.error('Error fetching books:', error);
    else setBooks(data);
    setLoading(false);
  }

  async function handleDelete(id) {
    if (window.confirm('本当にこの本を削除しますか？')) {
      const { error } = await supabase.from('books').delete().match({ id });
      if (error) alert('削除に失敗しました。');
      else fetchBooks(); // データを再取得してリストを更新
    }
  }

  async function handleSave(bookData) {
    if (editingBook) { // 編集モード
      const { error } = await supabase.from('books').update(bookData).match({ id: editingBook.id });
      if (error) alert('更新に失敗しました。');
    } else { // 新規追加モード
      const { error } = await supabase.from('books').insert(bookData);
      if (error) alert('追加に失敗しました。');
    }
    setIsFormVisible(false);
    setEditingBook(null);
    fetchBooks(); // データを再取得してリストを更新
  }

  const handleAddNewClick = () => {
    setEditingBook(null);
    setIsFormVisible(true);
  };
  
  const handleEditClick = (book) => {
    setEditingBook(book);
    setIsFormVisible(true);
  };

  if (loading) return <div>読み込み中...</div>;

  return (
    <div className="p-8">
      {isFormVisible && <BookForm book={editingBook} onSave={handleSave} onCancel={() => setIsFormVisible(false)} />}
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">書籍管理ダッシュボード</h2>
        <button onClick={handleAddNewClick} className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700">
          新規追加
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg">
        <ul className="divide-y divide-gray-200">
  {books.map((book) => (
    <li key={book.id} className="p-4 flex items-center justify-between">
      <div>
        <span className="font-bold text-gray-600 mr-4">{book.ranking}.</span>
        {/* ↓ タイトルと著者の文字色を濃くしました */}
        <span className="font-semibold text-lg text-gray-900">{book.title}</span>
        <p className="text-sm text-gray-700 ml-8">{book.author}</p>
      </div>
      <div className="flex gap-4">
        <button onClick={() => handleEditClick(book)} className="px-4 py-2 bg-yellow-600 text-white text-sm font-semibold rounded-md hover:bg-yellow-700">
          編集
        </button>
        <button onClick={() => handleDelete(book.id)} className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-md hover:bg-red-700">
          削除
        </button>
      </div>
    </li>
  ))}
</ul>
      </div>
    </div>
  );
}

// --- ログイン機能（変更なし） ---
export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const correctPassword = 'aaaa'; // あなたが設定したパスワード

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === correctPassword) setIsAuthenticated(true);
    else alert('パスワードが違います');
  };

  if (isAuthenticated) return <AdminDashboard />;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleLogin} className="p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">管理者ログイン</h1>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="パスワード" className="w-full px-3 py-2 border rounded-md" />
        <button type="submit" className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">ログイン</button>
      </form>
    </div>
  );
}