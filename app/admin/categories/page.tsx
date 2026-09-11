'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { buildTree, Category, CategoryNode } from '@/lib/categories';

export default function CategoriesPage() {
  const supabase = createClient();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTopName, setNewTopName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [addingChildTo, setAddingChildTo] = useState<number | null>(null);
  const [newChildName, setNewChildName] = useState('');

  async function load() {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order');
    setCategories((data as Category[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const tree = buildTree(categories);

  // 添加顶级分类
  async function handleAddTop(e: React.FormEvent) {
    e.preventDefault();
    const name = newTopName.trim();
    if (!name) return;

    // 顶级分类 sort_order 取当前最大值 + 1
    const maxOrder = Math.max(
      0,
      ...categories.filter((c) => c.parent_id === null).map((c) => c.sort_order)
    );

    const { error } = await supabase
      .from('categories')
      .insert({ name, parent_id: null, sort_order: maxOrder + 1 });

    if (error) return alert('添加失败：' + error.message);
    setNewTopName('');
    load();
  }

  // 添加子分类
  async function handleAddChild(parentId: number) {
    const name = newChildName.trim();
    if (!name) return;

    const maxOrder = Math.max(
      0,
      ...categories
        .filter((c) => c.parent_id === parentId)
        .map((c) => c.sort_order)
    );

    const { error } = await supabase
      .from('categories')
      .insert({ name, parent_id: parentId, sort_order: maxOrder + 1 });

    if (error) return alert('添加失败：' + error.message);
    setAddingChildTo(null);
    setNewChildName('');
    load();
  }

  // 改名
  async function handleRename(id: number) {
    const name = editingName.trim();
    if (!name) return;

    const { error } = await supabase
      .from('categories')
      .update({ name })
      .eq('id', id);

    if (error) return alert('改名失败：' + error.message);
    setEditingId(null);
    setEditingName('');
    load();
  }

  // 删除
  async function handleDelete(id: number, name: string) {
    if (!confirm(`确定删除分类「${name}」？\n如果它下面还有内容或子分类，会删除失败。`)) return;

    const { error } = await supabase.from('categories').delete().eq('id', id);

    if (error) {
      // 数据库 on delete restrict 会拦下来
      alert('删除失败：该分类下还有内容或子分类，请先处理它们。');
    } else {
      load();
    }
  }

  // 同级上移
  async function handleMove(id: number, direction: 'up' | 'down') {
    const node = categories.find((c) => c.id === id);
    if (!node) return;

    const siblings = categories
      .filter((c) => c.parent_id === node.parent_id)
      .sort((a, b) => a.sort_order - b.sort_order);

    const idx = siblings.findIndex((c) => c.id === id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= siblings.length) return;

    const other = siblings[swapIdx];

    // 交换 sort_order
    await supabase.from('categories').update({ sort_order: other.sort_order }).eq('id', node.id);
    await supabase.from('categories').update({ sort_order: node.sort_order }).eq('id', other.id);
    load();
  }

  if (loading) return <p className="text-black/30 py-20 text-center text-sm">加载中...</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-2">分类管理</h1>
      <p className="text-sm text-black/40 mb-8">
        分类支持任意层级。点分类右边的按钮可以改名、加子分类、删除、调整顺序。
      </p>

      {/* 树形列表 */}
      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4">
        {tree.length === 0 ? (
          <p className="text-black/30 text-sm py-4 text-center">还没有分类</p>
        ) : (
          tree.map((node) => (
            <TreeNodeRow
              key={node.id}
              node={node}
              depth={0}
              editingId={editingId}
              editingName={editingName}
              addingChildTo={addingChildTo}
              newChildName={newChildName}
              onStartEdit={(id, name) => { setEditingId(id); setEditingName(name); }}
              onCancelEdit={() => { setEditingId(null); setEditingName(''); }}
              onEditNameChange={setEditingName}
              onSaveEdit={handleRename}
              onDelete={handleDelete}
              onStartAddChild={(id) => { setAddingChildTo(id); setNewChildName(''); }}
              onCancelAddChild={() => { setAddingChildTo(null); setNewChildName(''); }}
              onChildNameChange={setNewChildName}
              onSaveAddChild={handleAddChild}
              onMove={handleMove}
            />
          ))
        )}
      </div>

      {/* 添加顶级分类 */}
      <form onSubmit={handleAddTop} className="mt-6 flex gap-2">
        <input
          value={newTopName}
          onChange={(e) => setNewTopName(e.target.value)}
          placeholder="新顶级分类的名字"
          className="flex-1 border rounded-lg px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="bg-[#1a1a1a] text-white px-4 py-2 rounded-lg text-sm hover:bg-black"
        >
          添加顶级分类
        </button>
      </form>
    </div>
  );
}

// ============ 树形行组件 ============
type TreeNodeRowProps = {
  node: CategoryNode;
  depth: number;
  editingId: number | null;
  editingName: string;
  addingChildTo: number | null;
  newChildName: string;
  onStartEdit: (id: number, name: string) => void;
  onCancelEdit: () => void;
  onEditNameChange: (v: string) => void;
  onSaveEdit: (id: number) => void;
  onDelete: (id: number, name: string) => void;
  onStartAddChild: (id: number) => void;
  onCancelAddChild: () => void;
  onChildNameChange: (v: string) => void;
  onSaveAddChild: (id: number) => void;
  onMove: (id: number, direction: 'up' | 'down') => void;
};

function TreeNodeRow({
  node,
  depth,
  editingId,
  editingName,
  addingChildTo,
  newChildName,
  onStartEdit,
  onCancelEdit,
  onEditNameChange,
  onSaveEdit,
  onDelete,
  onStartAddChild,
  onCancelAddChild,
  onChildNameChange,
  onSaveAddChild,
  onMove,
}: TreeNodeRowProps) {
  const [open, setOpen] = useState(true);
  const hasChildren = node.children.length > 0;
  const isEditing = editingId === node.id;
  const isAddingChild = addingChildTo === node.id;

  return (
    <div>
      <div
        className="flex items-center gap-2 py-1.5 group"
        style={{ paddingLeft: `${depth * 16}px` }}
      >
        {hasChildren ? (
          <button
            onClick={() => setOpen(!open)}
            className="w-5 h-5 flex items-center justify-center text-black/30 text-xs"
          >
            <span className={`transition-transform ${open ? 'rotate-90' : ''}`}>▶</span>
          </button>
        ) : (
          <span className="w-5" />
        )}

        {isEditing ? (
          <>
            <input
              value={editingName}
              onChange={(e) => onEditNameChange(e.target.value)}
              className="flex-1 border rounded px-2 py-1 text-sm"
              autoFocus
            />
            <button onClick={() => onSaveEdit(node.id)} className="text-xs text-blue-600 hover:underline">
              保存
            </button>
            <button onClick={onCancelEdit} className="text-xs text-black/40 hover:underline">
              取消
            </button>
          </>
        ) : (
          <>
            <span className="flex-1 text-sm">{node.name}</span>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition text-xs">
              <button onClick={() => onMove(node.id, 'up')} className="text-black/40 hover:text-black" title="上移">↑</button>
              <button onClick={() => onMove(node.id, 'down')} className="text-black/40 hover:text-black" title="下移">↓</button>
              <button onClick={() => onStartEdit(node.id, node.name)} className="text-blue-600 hover:underline">改名</button>
              <button onClick={() => onStartAddChild(node.id)} className="text-blue-600 hover:underline">+子分类</button>
              <button onClick={() => onDelete(node.id, node.name)} className="text-red-600 hover:underline">删除</button>
            </div>
          </>
        )}
      </div>

      {isAddingChild && (
        <div className="flex gap-2 py-2" style={{ paddingLeft: `${(depth + 1) * 16 + 20}px` }}>
          <input
            value={newChildName}
            onChange={(e) => onChildNameChange(e.target.value)}
            placeholder="子分类名字"
            className="flex-1 border rounded px-2 py-1 text-sm"
            autoFocus
          />
          <button onClick={() => onSaveAddChild(node.id)} className="text-xs text-blue-600 hover:underline">添加</button>
          <button onClick={onCancelAddChild} className="text-xs text-black/40 hover:underline">取消</button>
        </div>
      )}

      {hasChildren && open && (
        <div>
          {node.children.map((child: CategoryNode) => (
            <TreeNodeRow
              key={child.id}
              node={child}
              depth={depth + 1}
              editingId={editingId}
              editingName={editingName}
              addingChildTo={addingChildTo}
              newChildName={newChildName}
              onStartEdit={onStartEdit}
              onCancelEdit={onCancelEdit}
              onEditNameChange={onEditNameChange}
              onSaveEdit={onSaveEdit}
              onDelete={onDelete}
              onStartAddChild={onStartAddChild}
              onCancelAddChild={onCancelAddChild}
              onChildNameChange={onChildNameChange}
              onSaveAddChild={onSaveAddChild}
              onMove={onMove}
            />
          ))}
        </div>
      )}
    </div>
  );
}