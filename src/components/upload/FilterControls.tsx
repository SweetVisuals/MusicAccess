import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/@/ui/dropdown-menu";
import {
  Search,
  Filter,
  ArrowUpDown,
} from 'lucide-react';

type SortOrder = 'name' | 'date' | 'size';
type SortDirection = 'asc' | 'desc';

interface FilterControlsProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortOrder: SortOrder;
  sortDirection: SortDirection;
  handleChangeSortOrder: (order: SortOrder) => void;
}

export function FilterControls({
  searchQuery,
  setSearchQuery,
  sortOrder,
  sortDirection,
  handleChangeSortOrder,
}: FilterControlsProps) {
  return (
    <div className="py-4 border-b flex items-center justify-between">
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search files and folders..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <ArrowUpDown className="h-4 w-4" />
              Sort: {sortOrder.charAt(0).toUpperCase() + sortOrder.slice(1)}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleChangeSortOrder('name')}>
              Name {sortOrder === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleChangeSortOrder('date')}>
              Date {sortOrder === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleChangeSortOrder('size')}>
              Size {sortOrder === 'size' && (sortDirection === 'asc' ? '↑' : '↓')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
