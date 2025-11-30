import { Button } from '../../ui/base/button';
import { LayoutGrid, List } from 'lucide-react';

export default function ViewToggle({ viewMode, onViewModeChange }) {
  return (
    <div className="flex items-center bg-muted p-1 rounded-lg">
      <Button
        variant={viewMode === 'cards' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewModeChange('cards')}
        className={`flex items-center gap-1 ${
          viewMode === 'cards'
            ? 'bg-brand-blue hover:bg-brand-blue-dark text-white'
            : 'hover:bg-background'
        }`}
      >
        <LayoutGrid className="h-4 w-4" />
        Cards
      </Button>
      <Button
        variant={viewMode === 'list' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewModeChange('list')}
        className={`flex items-center gap-1 ${
          viewMode === 'list'
            ? 'bg-brand-blue hover:bg-brand-blue-dark text-white'
            : 'hover:bg-background'
        }`}
      >
        <List className="h-4 w-4" />
        Lista
      </Button>
    </div>
  );
}