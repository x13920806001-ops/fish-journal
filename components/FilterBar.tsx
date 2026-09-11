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
  const topCategories = categories.filter((c) => !c.parent_id);
  const currentTop = categories.find((c) => c.name === selectedCategory);
  const subCategories = categories.filter((c) => c.parent_id === currentTop?.id);

  const chip = (active: boolean) =>
    `px-4 py-1.5 rounded-full text-sm transition-all duration-200 ${
      active
        ? 'bg-[#1a1a1a] text-white shadow-sm'
        : 'bg-white text-black/60 hover:text-black hover:bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]'
    }`;

  return (
    <div className="mt-6 space-y-3">
      <div className="flex flex-wrap gap-2">
        <button onClick={() => onCategoryChange('全部')} className={chip(selectedCategory === '全部')}>
          全部
        </button>
        {topCategories.map((c) => (
          <button
            key={c.id}
            onClick={() => onCategoryChange(c.name)}
            className={chip(selectedCategory === c.name)}
          >
            {c.name}
          </button>
        ))}
      </div>

      {subCategories.length > 0 && (
        <div className="flex flex-wrap gap-2 pl-1">
          <button
            onClick={() => onSubChange('全部')}
            className={`px-3 py-1 rounded-full text-xs transition ${
              selectedSub === '全部'
                ? 'bg-black/70 text-white'
                : 'text-black/40 hover:text-black'
            }`}
          >
            全部
          </button>
          {subCategories.map((c) => (
            <button
              key={c.id}
              onClick={() => onSubChange(c.name)}
              className={`px-3 py-1 rounded-full text-xs transition ${
                selectedSub === c.name
                  ? 'bg-black/70 text-white'
                  : 'text-black/40 hover:text-black'
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