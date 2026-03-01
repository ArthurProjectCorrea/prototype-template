import { PageHeader } from '@/components/page-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function HomePage() {
  return (
    <div className="space-y-2 p-2">
      <PageHeader
        title="Dashboard"
        description="Visão geral do sistema"
        routes={[{ title: 'Dashboard' }]}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Card 1</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 aspect-video rounded-lg" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Card 2</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 aspect-video rounded-lg" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Card 3</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 aspect-video rounded-lg" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Conteúdo Principal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 min-h-75 rounded-lg" />
        </CardContent>
      </Card>
    </div>
  );
}
