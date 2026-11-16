import { redirect } from 'next/navigation';

// Monthly P&L now lives in the Month view of the Revenue page
export default function ReportsRedirect() {
  redirect('/dashboard/revenue');
}
