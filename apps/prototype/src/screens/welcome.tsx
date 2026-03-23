import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface Feature {
  title: string;
  description: string;
  status: 'ready' | 'planned' | 'in-progress';
}

const FEATURES: Feature[] = [
  { title: 'Agent-driven development', description: '12 specialized AI agents for your workflow', status: 'ready' },
  { title: 'Spec-based planning', description: 'Structured specs with acceptance criteria', status: 'ready' },
  { title: 'Quality gates', description: 'Automated review, testing, and QA', status: 'ready' },
  { title: 'Prototype playground', description: 'This app — design screens with Tailwind + shadcn/ui', status: 'ready' },
];

export default function WelcomeScreen() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">MetaCRM</h1>
        <p className="text-muted-foreground mt-1">Meta CRM is a next-generation, fully customizable customer relationship management platform that unifies data, communication, and workflows into a single, real-time view of every customer relationship.</p>
      </div>

      <Separator />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {FEATURES.map((f) => (
          <Card key={f.title}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{f.title}</CardTitle>
                <Badge variant={f.status === 'ready' ? 'default' : 'secondary'}>
                  {f.status}
                </Badge>
              </div>
              <CardDescription>{f.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Getting started</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>This is the prototype playground for <strong>MetaCRM</strong>.</p>
          <p>Use the <code className="bg-muted px-1 py-0.5 rounded">prototype-designer</code> agent to generate new screens here.</p>
          <p>Each screen uses Tailwind CSS and shadcn/ui components with mock data only.</p>
        </CardContent>
      </Card>
    </div>
  );
}
