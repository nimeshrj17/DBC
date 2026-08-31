import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Dream Bean Cafe</h1>
          <p className="text-muted-foreground">Management Dashboard</p>
        </div>
        
        <div className="grid gap-4">
          <Link href="/order?table=1" className="w-full">
            <Button size="lg" fullWidth variant="primary">
              Order as Customer (Table 1)
            </Button>
          </Link>
          
          <Link href="/dashboard" className="w-full">
            <Button size="lg" fullWidth variant="secondary">
              Staff Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
