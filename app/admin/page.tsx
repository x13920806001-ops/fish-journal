'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';

export default function AdminPage() {
  const supabase = createClient();
  const router = useRouter();
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data } = await supabase
      .from('entries')
      .select('*')
      .order('date', { ascending: false });
    setEntries(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: number) {
    if (!confirm('确定删除这条记录？删除后不可恢复。')) return;
    const { error } = await supabase.from('entries').delete().eq('id', id);
    if (error) {
      alert('删除失败：' + error.message);
    } else {
      load();
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">后台管理</h1>
        <div className="flex gap-3">
          <Link href="/admin/new" className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800">
            + 新建条目
          </Link>
          <button onClick={handleLogout} className="border px-4 py-2 rounded hover:bg-gray-100">
            退出登录
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-400">加载中...</p>
      ) : entries.length === 0 ? (
        <p className="text-gray-400">还没有内容，点右上角新建。</p>
      ) : (
        <div className="border rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2">标题</th>
                <th className="text-left px-4 py-2">分类</th>
                <th className="text-left px-4 py-2">日期</th>
                <th className="text-right px-4 py-2">操作</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-t">
                  <td className="px-4 py-2">{e.title}</td>
                  <td className="px-4 py-2">{e.category}{e.subcategory ? ` / ${e.subcategory}` : ''}</td>
                  <td className="px-4 py-2">{e.date}</td>
                  <td className="px-4 py-2 text-right space-x-3">
                    <Link href={`/admin/edit/${e.id}`} className="text-blue-600 hover:underline">编辑</Link>
                    <button onClick={() => handleDelete(e.id)} className="text-red-600 hover:underline">删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}