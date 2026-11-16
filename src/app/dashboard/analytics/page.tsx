import { redirect } from 'next/navigation';

// Revenue lives in one place only
export default function AnalyticsRedirect() {
  redirect('/dashboard/revenue');
}
