import { useState, useCallback } from 'react';

export interface ColumnDef {
  key: string;
  label: string;
  className?: string;
}

export function useColumnOrder(initialColumns: ColumnDef[]) {
  const [columns, setColumns] = useState(initialColumns);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

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
