import { useState, useCallback, useEffect } from 'react';

export interface ColumnDef {
  key: string;
  label: string;
  className?: string;
}

function loadOrder(storageKey: string, initialColumns: ColumnDef[]): ColumnDef[] {
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const keys: string[] = JSON.parse(saved);
      const map = new Map(initialColumns.map(c => [c.key, c]));
      const ordered: ColumnDef[] = [];
      for (const k of keys) {
        const col = map.get(k);
        if (col) {
          ordered.push(col);
          map.delete(k);
        }
      }
      // append any new columns not in saved order
      map.forEach(c => ordered.push(c));
      return ordered;
    }
  } catch {}
  return initialColumns;
}

export function useColumnOrder(initialColumns: ColumnDef[], storageKey?: string) {
  const key = storageKey ? `col-order-${storageKey}` : undefined;
  const [columns, setColumns] = useState(() =>
    key ? loadOrder(key, initialColumns) : initialColumns
  );
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  useEffect(() => {
    if (key) {
      localStorage.setItem(key, JSON.stringify(columns.map(c => c.key)));
    }
  }, [columns, key]);

  const onDragStart = useCallback((idx: number) => {
    setDragIndex(idx);
  }, []);

  const onDragOver = useCallback((idx: number) => {
    setOverIndex(idx);
  }, []);

  const onDragEnd = useCallback(() => {
    if (dragIndex !== null && overIndex !== null && dragIndex !== overIndex) {
      setColumns((prev) => {
        const next = [...prev];
        const [moved] = next.splice(dragIndex, 1);
        next.splice(overIndex, 0, moved);
        return next;
      });
    }
    setDragIndex(null);
    setOverIndex(null);
  }, [dragIndex, overIndex]);

  return { columns, dragIndex, overIndex, onDragStart, onDragOver, onDragEnd };
}
