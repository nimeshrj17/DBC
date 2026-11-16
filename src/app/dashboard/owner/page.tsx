import { redirect } from 'next/navigation';

// The live sales dashboard now lives on the single Revenue page
export default function OwnerHomeRedirect() {
  redirect('/dashboard/revenue');
}
