import { TableHead } from '@/components/ui/table';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import type { SortDirection } from '@/hooks/use-sortable';
import { cn } from '@/lib/utils';

interface SortableTableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sortKey: string;
  currentKey: string;
  direction: SortDirection;
  onSort: (key: string) => void;
  children: React.ReactNode;
}

export function SortableTableHead({ sortKey, currentKey, direction, onSort, children, className, ...props }: SortableTableHeadProps) {
  const isActive = currentKey === sortKey && direction !== null;
  return (
    <TableHead
      className={cn('cursor-pointer select-none hover:bg-muted/50 transition-colors', className)}
      onClick={() => onSort(sortKey)}
      {...props}
    >
      <span className="flex items-center gap-1">
        {children}
        {isActive && direction === 'asc' && <ArrowUp className="w-3 h-3 text-primary" />}
        {isActive && direction === 'desc' && <ArrowDown className="w-3 h-3 text-primary" />}
        {!isActive && <ArrowUpDown className="w-3 h-3 text-muted-foreground/50" />}
      </span>
    </TableHead>
  );
}
