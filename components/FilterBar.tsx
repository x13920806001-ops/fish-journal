'use client';

type Props = {
  categories: any[];
  selectedCategory: string;
  selectedSub: string;
  onCategoryChange: (c: string) => void;
  onSubChange: (s: string) => void;
};

export default function FilterBar({
  categories,
  selectedCategory,
  selectedSub,
  onCategoryChange,
  onSubChange,
}: Props) {
  // 顶级分类
  const topCategories = categories.filter((c) => !c.parent_id);
  // 当前选中分类下的子分类
  const currentTop = categories.find((c) => c.name === selectedCategory);
  const subCategories = categories.filter((c) => c.parent_id === currentTop?.id);

  return (
    <div className="mt-6 space-y-3">
      {/* 顶级分类按钮 */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onCategoryChange('全部')}
          className={`px-4 py-1.5 rounded-full text-sm border ${
            selectedCategory === '全部' ? 'bg-black text-white border-black' : 'bg-white hover:bg-gray-50'
          }`}
        >
          全部
        </button>
        {topCategories.map((c) => (
          <button
            key={c.id}
            onClick={() => onCategoryChange(c.name)}
            className={`px-4 py-1.5 rounded-full text-sm border ${
              selectedCategory === c.name ? 'bg-black text-white border-black' : 'bg-white hover:bg-gray-50'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* 子分类按钮（只有当前分类有子类时才显示） */}
      {subCategories.length > 0 && (
        <div className="flex flex-wrap gap-2 pl-2">
          <button
            onClick={() => onSubChange('全部')}
            className={`px-3 py-1 rounded-full text-xs border ${
              selectedSub === '全部' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white hover:bg-gray-50'
            }`}
          >
            全部
          </button>
          {subCategories.map((c) => (
            <button
              key={c.id}
              onClick={() => onSubChange(c.name)}
              className={`px-3 py-1 rounded-full text-xs border ${
                selectedSub === c.name ? 'bg-gray-800 text-white border-gray-800' : 'bg-white hover:bg-gray-50'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}