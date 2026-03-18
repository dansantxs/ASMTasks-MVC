import { Button } from '../../ui/base/button';
import { LayoutGrid, List } from 'lucide-react';

export default function AlternarVisualizacao({ modoVisualizacao, aoAlterarModoVisualizacao }) {
  return (
    <div className="flex items-center bg-muted p-1 rounded-lg">
      <Button
        variant={modoVisualizacao === 'cards' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => aoAlterarModoVisualizacao('cards')}
        className={`flex items-center gap-1 ${
          modoVisualizacao === 'cards'
            ? 'bg-brand-blue hover:bg-brand-blue-dark text-white'
            : 'hover:bg-background'
        }`}
      >
        <LayoutGrid className="h-4 w-4" />
        Cards
      </Button>
      <Button
        variant={modoVisualizacao === 'list' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => aoAlterarModoVisualizacao('list')}
        className={`flex items-center gap-1 ${
          modoVisualizacao === 'list'
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
