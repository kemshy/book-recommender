'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Supabaseクライアントをセットアップ
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- 書籍詳細モーダルコンポーネント ---
function BookDetailModal({ book, onClose }) {
  if (!book) return null;
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-25 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 relative"
        onClick={(e) => e.stopPropagation()} 
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-3xl font-light text-gray-500 hover:text-gray-900">&times;</button>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-shrink-0 mx-auto md:mx-0">
            <img src={book.cover_image_url || 'https://placehold.jp/200x300.png?text=NoImage'} alt={book.title} className="w-48 h-auto object-cover rounded-md shadow-lg" />
          </div>
          <div className="flex-1 text-left">
            <h2 className="text-3xl font-bold text-gray-900 leading-tight">{book.title}</h2>
            <p className="text-lg text-gray-600 mt-2">{book.author}</p>
            <hr className="my-6" />
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">あらすじ</h3>
            <p className="text-base leading-relaxed text-gray-700 whitespace-pre-wrap">{book.synopsis}</p>
            {book.purchase_link && (
              <a href={book.purchase_link} target="_blank" rel="noopener noreferrer" className="mt-8 inline-block w-full text-center px-6 py-3 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition-colors">
                購入ページへ
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- メインページコンポーネント ---
export default function HomePage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);

  // ボタンが押されたときに実行される関数
  const handleFindBooks = async () => {
    setLoading(true);
    setBooks([]);
    try {
      const { data, error } = await supabase.from('books').select('*');
      if (error) throw error;

      if (data) {
        // --- ここをシンプルなランダムロジックに戻しました ---
        const shuffled = data.sort(() => 0.5 - Math.random());
        const selectedBooks = shuffled.slice(0, 3);
        setBooks(selectedBooks);
        // --- ここまで ---
      }
    } catch (error) {
      console.error('Error fetching books:', error);
      alert('本の取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };
  
  const handleBookClick = (book) => {
    setSelectedBook(book);
  };

  const handleCloseModal = () => {
    setSelectedBook(null);
  };

  return (
    <>
      <main className="flex flex-col items-center min-h-screen p-8 bg-gray-50 text-center">
        <div className="w-full max-w-4xl pt-12 md:pt-20">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800">
            Book Recommender
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            次に読む本を見つけてくれる。
          </p>
          <button onClick={handleFindBooks} disabled={loading} className="mt-8 px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 disabled:bg-gray-400">
            {loading ? '検索中...' : '今週の三冊を見つける！'}
          </button>
          
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 min-h-[320px]">
            {books.map((book) => (
              <div key={book.id} onClick={() => handleBookClick(book)} className="p-4 bg-white rounded-lg shadow-lg flex flex-col items-center cursor-pointer hover:scale-105 transition-transform duration-200 h-full">
                <img src={book.cover_image_url || 'https://placehold.jp/150x230.png?text=NoImage'} alt={book.title} className="w-36 h-56 object-cover rounded-md" />
                <h3 className="mt-4 font-bold text-gray-800">{book.title}</h3>
                <p className="mt-1 text-sm text-gray-500">{book.author}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
      
      <BookDetailModal book={selectedBook} onClose={handleCloseModal} />
    </>
  );
}