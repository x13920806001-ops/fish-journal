'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { buildTree, Category, CategoryNode } from '@/lib/categories';

type Aspect = {
  id: number;
  category_id: number;
  name: string;
  sort_order: number;
};

export default function CategoriesPage() {
  const supabase = createClient();
  const [categories, setCategories] = useState<Category[]>([]);
  const [aspects, setAspects] = useState<Aspect[]>([]);
  const [loading, setLoading] = useState(true);

  // 分类相关状态
  const [newTopName, setNewTopName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [addingChildTo, setAddingChildTo] = useState<number | null>(null);
  const [newChildName, setNewChildName] = useState('');

  // 评分方面相关状态
  const [openAspectFor, setOpenAspectFor] = useState<number | null>(null); // 展开哪个分类的方面
  const [newAspectName, setNewAspectName] = useState('');
  const [editingAspectId, setEditingAspectId] = useState<number | null>(null);
  const [editingAspectName, setEditingAspectName] = useState('');

  async function load() {
    const [{ data: c }, { data: a }] = await Promise.all([
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('aspects').select('*').order('sort_order'),
    ]);
    setCategories((c as Category[]) || []);
    setAspects((a as Aspect[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const tree = buildTree(categories);

  // ============ 分类操作 ============
  async function handleAddTop(e: React.FormEvent) {
    e.preventDefault();
    const name = newTopName.trim();
    if (!name) return;
    const maxOrder = Math.max(0, ...categories.filter((c) => c.parent_id === null).map((c) => c.sort_order));
    const { error } = await supabase.from('categories').insert({ name, parent_id: null, sort_order: maxOrder + 1 });
    if (error) return alert('添加失败：' + error.message);
    setNewTopName('');
    load();
  }

  async function handleAddChild(parentId: number) {
    const name = newChildName.trim();
    if (!name) return;
    const maxOrder = Math.max(0, ...categories.filter((c) => c.parent_id === parentId).map((c) => c.sort_order));
    const { error } = await supabase.from('categories').insert({ name, parent_id: parentId, sort_order: maxOrder + 1 });
    if (error) return alert('添加失败：' + error.message);
    setAddingChildTo(null);
    setNewChildName('');
    load();
  }

  async function handleRename(id: number) {
    const name = editingName.trim();
    if (!name) return;
    const { error } = await supabase.from('categories').update({ name }).eq('id', id);
    if (error) return alert('改名失败：' + error.message);
    setEditingId(null);
    setEditingName('');
    load();
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`确定删除分类「${name}」？\n如果它下面还有内容或子分类，会删除失败。`)) return;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) alert('删除失败：该分类下还有内容或子分类，请先处理它们。');
    else load();
  }

  async function handleMove(id: number, direction: 'up' | 'down') {
    const node = categories.find((c) => c.id === id);
    if (!node) return;
    const siblings = categories.filter((c) => c.parent_id === node.parent_id).sort((a, b) => a.sort_order - b.sort_order);
    const idx = siblings.findIndex((c) => c.id === id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= siblings.length) return;
    const other = siblings[swapIdx];
    await supabase.from('categories').update({ sort_order: other.sort_order }).eq('id', node.id);
    await supabase.from('categories').update({ sort_order: node.sort_order }).eq('id', other.id);
    load();
  }

  // ============ 评分方面操作 ============
  async function handleAddAspect(categoryId: number) {
    const name = newAspectName.trim();
    if (!name) return;
    const maxOrder = Math.max(0, ...aspects.filter((a) => a.category_id === categoryId).map((a) => a.sort_order));
    const { error } = await supabase.from('aspects').insert({ name, category_id: categoryId, sort_order: maxOrder + 1 });
    if (error) {
      if (error.message.includes('duplicate')) alert('该分类下已经有同名的方面了');
      else alert('添加失败：' + error.message);
      return;
    }
    setNewAspectName('');
    load();
  }

  async function handleRenameAspect(id: number) {
    const name = editingAspectName.trim();
    if (!name) return;
    const { error } = await supabase.from('aspects').update({ name }).eq('id', id);
    if (error) {
      if (error.message.includes('duplicate')) alert('该分类下已经有同名的方面了');
      else alert('改名失败：' + error.message);
      return;
    }
    setEditingAspectId(null);
    setEditingAspectName('');
    load();
  }

  async function handleDeleteAspect(id: number, name: string) {
    if (!confirm(`确定删除方面「${name}」？\n如果已有条目用它打过分，会删除失败。`)) return;
    const { error } = await supabase.from('aspects').delete().eq('id', id);
    if (error) alert('删除失败：已有条目使用了这个方面，请先处理那些评分。');
    else load();
  }

  async function handleMoveAspect(id: number, direction: 'up' | 'down') {
    const aspect = aspects.find((a) => a.id === id);
    if (!aspect) return;
    const siblings = aspects.filter((a) => a.category_id === aspect.category_id).sort((a, b) => a.sort_order - b.sort_order);
    const idx = siblings.findIndex((a) => a.id === id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= siblings.length) return;
    const other = siblings[swapIdx];
    await supabase.from('aspects').update({ sort_order: other.sort_order }).eq('id', aspect.id);
    await supabase.from('aspects').update({ sort_order: aspect.sort_order }).eq('id', other.id);
    load();
  }

  if (loading) return <p className="text-black/30 py-20 text-center text-sm">加载中...</p>;

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-2">分类管理</h1>
      <p className="text-sm text-black/40 mb-8">
        分类支持任意层级。点「评分方面」可以为该分类设置打分维度（如观赏性、饲养难度）。
      </p>

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
              // 评分方面
              aspects={aspects}
              openAspectFor={openAspectFor}
              onToggleAspects={(id) => {
                setOpenAspectFor(openAspectFor === id ? null : id);
                setNewAspectName('');
                setEditingAspectId(null);
              }}
              newAspectName={newAspectName}
              onNewAspectNameChange={setNewAspectName}
              onAddAspect={handleAddAspect}
              editingAspectId={editingAspectId}
              editingAspectName={editingAspectName}
              onStartEditAspect={(id, name) => { setEditingAspectId(id); setEditingAspectName(name); }}
              onCancelEditAspect={() => { setEditingAspectId(null); setEditingAspectName(''); }}
              onEditAspectNameChange={setEditingAspectName}
              onSaveAspect={handleRenameAspect}
              onDeleteAspect={handleDeleteAspect}
              onMoveAspect={handleMoveAspect}
            />
          ))
        )}
      </div>

      <form onSubmit={handleAddTop} className="mt-6 flex gap-2">
        <input
          value={newTopName}
          onChange={(e) => setNewTopName(e.target.value)}
          placeholder="新顶级分类的名字"
          className="flex-1 border rounded-lg px-3 py-2 text-sm"
        />
        <button type="submit" className="bg-[#1a1a1a] text-white px-4 py-2 rounded-lg text-sm hover:bg-black">
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
  // 评分方面
  aspects: Aspect[];
  openAspectFor: number | null;
  onToggleAspects: (id: number) => void;
  newAspectName: string;
  onNewAspectNameChange: (v: string) => void;
  onAddAspect: (categoryId: number) => void;
  editingAspectId: number | null;
  editingAspectName: string;
  onStartEditAspect: (id: number, name: string) => void;
  onCancelEditAspect: () => void;
  onEditAspectNameChange: (v: string) => void;
  onSaveAspect: (id: number) => void;
  onDeleteAspect: (id: number, name: string) => void;
  onMoveAspect: (id: number, direction: 'up' | 'down') => void;
};

function TreeNodeRow({
  node, depth,
  editingId, editingName, addingChildTo, newChildName,
  onStartEdit, onCancelEdit, onEditNameChange, onSaveEdit, onDelete,
  onStartAddChild, onCancelAddChild, onChildNameChange, onSaveAddChild, onMove,
  aspects, openAspectFor, onToggleAspects,
  newAspectName, onNewAspectNameChange, onAddAspect,
  editingAspectId, editingAspectName,
  onStartEditAspect, onCancelEditAspect, onEditAspectNameChange, onSaveAspect,
  onDeleteAspect, onMoveAspect,
}: TreeNodeRowProps) {
  const [open, setOpen] = useState(true);
  const hasChildren = node.children.length > 0;
  const isEditing = editingId === node.id;
  const isAddingChild = addingChildTo === node.id;
  const showAspects = openAspectFor === node.id;

  const myAspects = aspects
    .filter((a) => a.category_id === node.id)
    .sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div>
      <div className="flex items-center gap-2 py-1.5 group" style={{ paddingLeft: `${depth * 16}px` }}>
        {hasChildren ? (
          <button onClick={() => setOpen(!open)} className="w-5 h-5 flex items-center justify-center text-black/30 text-xs">
            <span className={`transition-transform ${open ? 'rotate-90' : ''}`}>▶</span>
          </button>
        ) : (
          <span className="w-5" />
        )}

        {isEditing ? (
          <>
            <input value={editingName} onChange={(e) => onEditNameChange(e.target.value)} className="flex-1 border rounded px-2 py-1 text-sm" autoFocus />
            <button onClick={() => onSaveEdit(node.id)} className="text-xs text-blue-600 hover:underline">保存</button>
            <button onClick={onCancelEdit} className="text-xs text-black/40 hover:underline">取消</button>
          </>
        ) : (
          <>
            <span className="flex-1 text-sm">{node.name}</span>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition text-xs">
              <button onClick={() => onMove(node.id, 'up')} className="text-black/40 hover:text-black" title="上移">↑</button>
              <button onClick={() => onMove(node.id, 'down')} className="text-black/40 hover:text-black" title="下移">↓</button>
              <button onClick={() => onToggleAspects(node.id)} className="text-amber-600 hover:underline">
                {showAspects ? '收起评分' : '评分方面'}
              </button>
              <button onClick={() => onStartEdit(node.id, node.name)} className="text-blue-600 hover:underline">改名</button>
              <button onClick={() => onStartAddChild(node.id)} className="text-blue-600 hover:underline">+子分类</button>
              <button onClick={() => onDelete(node.id, node.name)} className="text-red-600 hover:underline">删除</button>
            </div>
          </>
        )}
      </div>

      {/* 添加子分类输入框 */}
      {isAddingChild && (
        <div className="flex gap-2 py-2" style={{ paddingLeft: `${(depth + 1) * 16 + 20}px` }}>
          <input value={newChildName} onChange={(e) => onChildNameChange(e.target.value)} placeholder="子分类名字" className="flex-1 border rounded px-2 py-1 text-sm" autoFocus />
          <button onClick={() => onSaveAddChild(node.id)} className="text-xs text-blue-600 hover:underline">添加</button>
          <button onClick={onCancelAddChild} className="text-xs text-black/40 hover:underline">取消</button>
        </div>
      )}

      {/* 评分方面面板 */}
      {showAspects && (
        <div
          className="my-2 p-3 rounded-lg bg-amber-50/50 border border-amber-100"
          style={{ marginLeft: `${depth * 16 + 25}px` }}
        >
          <div className="text-xs text-amber-800 mb-2">「{node.name}」的评分方面</div>

          {myAspects.length === 0 ? (
            <p className="text-xs text-black/30 py-2">还没有方面，在下面添加。</p>
          ) : (
            <div className="space-y-1">
              {myAspects.map((a) => (
                <div key={a.id} className="flex items-center gap-2 group/aspect text-sm">
                  {editingAspectId === a.id ? (
                    <>
                      <input
                        value={editingAspectName}
                        onChange={(e) => onEditAspectNameChange(e.target.value)}
                        className="flex-1 border rounded px-2 py-0.5 text-xs"
                        autoFocus
                      />
                      <button onClick={() => onSaveAspect(a.id)} className="text-xs text-blue-600 hover:underline">保存</button>
                      <button onClick={onCancelEditAspect} className="text-xs text-black/40 hover:underline">取消</button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-xs text-black/70">{a.name}</span>
                      <div className="flex gap-2 opacity-0 group-hover/aspect:opacity-100 transition text-xs">
                        <button onClick={() => onMoveAspect(a.id, 'up')} className="text-black/40 hover:text-black">↑</button>
                        <button onClick={() => onMoveAspect(a.id, 'down')} className="text-black/40 hover:text-black">↓</button>
                        <button onClick={() => onStartEditAspect(a.id, a.name)} className="text-blue-600 hover:underline">改名</button>
                        <button onClick={() => onDeleteAspect(a.id, a.name)} className="text-red-600 hover:underline">删除</button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 添加方面 */}
          <div className="flex gap-2 mt-3">
            <input
              value={newAspectName}
              onChange={(e) => onNewAspectNameChange(e.target.value)}
              placeholder="新方面名，如：观赏性"
              className="flex-1 border rounded px-2 py-1 text-xs bg-white"
            />
            <button
              onClick={() => onAddAspect(node.id)}
              className="text-xs bg-amber-600 text-white px-3 py-1 rounded hover:bg-amber-700"
            >
              添加
            </button>
          </div>
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
              aspects={aspects}
              openAspectFor={openAspectFor}
              onToggleAspects={onToggleAspects}
              newAspectName={newAspectName}
              onNewAspectNameChange={onNewAspectNameChange}
              onAddAspect={onAddAspect}
              editingAspectId={editingAspectId}
              editingAspectName={editingAspectName}
              onStartEditAspect={onStartEditAspect}
              onCancelEditAspect={onCancelEditAspect}
              onEditAspectNameChange={onEditAspectNameChange}
              onSaveAspect={onSaveAspect}
              onDeleteAspect={onDeleteAspect}
              onMoveAspect={onMoveAspect}
            />
          ))}
        </div>
      )}
    </div>
  );
}