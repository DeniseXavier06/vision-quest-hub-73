import { TableHead } from '@/components/ui/table';
import { ArrowUp, ArrowDown, ArrowUpDown, GripVertical } from 'lucide-react';
import type { SortDirection } from '@/hooks/use-sortable';
import { cn } from '@/lib/utils';

interface SortableTableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sortKey: string;
  currentKey: string;
  direction: SortDirection;
  onSort: (key: string) => void;
  children: React.ReactNode;
  draggable?: boolean;
  isDragging?: boolean;
  isOver?: boolean;
  onDragStartCol?: () => void;
  onDragOverCol?: () => void;
  onDragEndCol?: () => void;
}

export function SortableTableHead({
  sortKey, currentKey, direction, onSort, children, className,
  draggable, isDragging, isOver, onDragStartCol, onDragOverCol, onDragEndCol,
  ...props
}: SortableTableHeadProps) {
  const isActive = currentKey === sortKey && direction !== null;
  return (
    <TableHead
      className={cn(
        'cursor-pointer select-none hover:bg-muted/50 transition-colors',
        isDragging && 'opacity-40',
        isOver && 'border-l-2 border-primary',
        className,
      )}
      draggable={draggable}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        onDragStartCol?.();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOverCol?.();
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDragEndCol?.();
      }}
      onDragEnd={() => onDragEndCol?.()}
      onClick={() => onSort(sortKey)}
      {...props}
    >
      <span className="flex items-center gap-1">
        {draggable && <GripVertical className="w-3 h-3 text-muted-foreground/40 flex-shrink-0 cursor-grab" />}
        {children}
        {isActive && direction === 'asc' && <ArrowUp className="w-3 h-3 text-primary" />}
        {isActive && direction === 'desc' && <ArrowDown className="w-3 h-3 text-primary" />}
        {!isActive && <ArrowUpDown className="w-3 h-3 text-muted-foreground/50" />}
      </span>
    </TableHead>
  );
}
