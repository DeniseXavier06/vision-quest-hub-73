import { Card, CardContent } from '@/components/ui/card';
import { FileText } from 'lucide-react';

const RelatoriosSection = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading font-bold text-foreground">Relatórios</h2>
        <p className="text-sm text-muted-foreground mt-1">Documentos e relatórios da CPA</p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <FileText className="w-7 h-7 text-muted-foreground" />
          </div>
          <h3 className="text-base font-heading font-semibold text-foreground mb-1">Em breve</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            A seção de relatórios estará disponível após a conexão com o banco de dados.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default RelatoriosSection;
