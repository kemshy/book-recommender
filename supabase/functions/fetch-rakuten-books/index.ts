import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface RakutenBook {
  title: string;
  author: string;
  largeImageUrl: string;
  itemUrl: string;
  itemCaption: string;
  rank: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const rakutenAppId = Deno.env.get('RAKUTEN_APP_ID');
    if (!rakutenAppId) {
      throw new Error('Rakuten App ID not found in secrets.');
    }

    const rakutenApiUrl = `https://app.rakuten.co.jp/services/api/BooksTotal/Search/20170404?format=json&booksGenreId=001004&applicationId=${rakutenAppId}`;

    const response = await fetch(rakutenApiUrl);
    if (!response.ok) {
      throw new Error(`Rakuten API request failed: ${response.statusText}`);
    }
    const data = await response.json();

    const booksToInsert = data.Items.map((item: { Item: RakutenBook }) => ({
      title: item.Item.title,
      author: item.Item.author,
      cover_image_url: item.Item.largeImageUrl.replace('?_ex=120x120', ''),
      synopsis: item.Item.itemCaption,
      purchase_link: item.Item.itemUrl,
      ranking: item.Item.rank,
    }));

    // --- データベース操作（ここを修正） ---
    // 1. 古いデータを全て削除（ランキングが0以上のものを全て削除、という条件に変更）
    const { error: deleteError } = await supabaseClient.from('books').delete().gte('ranking', 0);
    if (deleteError) throw deleteError;

    // 2. 新しいデータを挿入
    const { error: insertError } = await supabaseClient.from('books').insert(booksToInsert);
    if (insertError) throw insertError;

    return new Response(JSON.stringify({ message: `Successfully inserted ${booksToInsert.length} books.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});