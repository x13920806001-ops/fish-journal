// 分类树工具函数

export type Category = {
  id: number;
  name: string;
  parent_id: number | null;
  sort_order: number;
  created_at?: string;
};

export type CategoryNode = Category & {
  children: CategoryNode[];
};

/**
 * 把扁平的分类数组组装成树
 */
export function buildTree(categories: Category[]): CategoryNode[] {
  const map = new Map<number, CategoryNode>();
  const roots: CategoryNode[] = [];

  // 先全部转成带 children 的节点
  categories.forEach((c) => {
    map.set(c.id, { ...c, children: [] });
  });

  // 再挂到父节点上
  categories.forEach((c) => {
    const node = map.get(c.id)!;
    if (c.parent_id === null) {
      roots.push(node);
    } else {
      const parent = map.get(c.parent_id);
      if (parent) parent.children.push(node);
      else roots.push(node); // 父节点不存在，当顶级处理
    }
  });

  // 每层按 sort_order 排序
  const sortRec = (nodes: CategoryNode[]) => {
    nodes.sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
    nodes.forEach((n) => sortRec(n.children));
  };
  sortRec(roots);

  return roots;
}

/**
 * 获取某个分类及其所有后代的 id 集合（用于"点父分类，显示所有子分类下的内容"）
 */
export function getDescendantIds(tree: CategoryNode[], targetId: number): number[] {
  const result: number[] = [];

  const walk = (node: CategoryNode, collecting: boolean) => {
    const isTarget = node.id === targetId;
    const nowCollecting = collecting || isTarget;
    if (nowCollecting) result.push(node.id);
    node.children.forEach((child) => walk(child, nowCollecting));
  };

  tree.forEach((root) => walk(root, false));
  return result;
}

/**
 * 根据 id 找分类，并返回从根到它的路径（用于显示"鱼 / 淡水 / 鲤科"）
 */
export function findPath(tree: CategoryNode[], targetId: number): CategoryNode[] {
  const path: CategoryNode[] = [];

  const dfs = (node: CategoryNode, trail: CategoryNode[]): boolean => {
    const newTrail = [...trail, node];
    if (node.id === targetId) {
      path.push(...newTrail);
      return true;
    }
    for (const child of node.children) {
      if (dfs(child, newTrail)) return true;
    }
    return false;
  };

  for (const root of tree) {
    if (dfs(root, [])) break;
  }
  return path;
}