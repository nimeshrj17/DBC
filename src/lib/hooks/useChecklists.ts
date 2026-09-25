import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, addDoc, updateDoc, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

export interface ChecklistTemplate {
  id: string;
  name: string;
  items: { label: string; required: boolean }[];
}

export interface ChecklistRun {
  id?: string;
  templateId: string;
  templateName: string;
  date: string;
  shift: string;
  completedBy: string;
  completedById: string;
  itemsStatus: { label: string; checked: boolean; checkedAt?: number }[];
  completedAt: number;
}

export const SEED_TEMPLATES: ChecklistTemplate[] = [
  {
    id: 'opening',
    name: 'Opening Checklist',
    items: [
      { label: 'Entrance cleaned', required: true },
      { label: 'Tables & Chairs arranged', required: true },
      { label: 'Floor mopped', required: true },
      { label: 'Glasses checked/polished', required: true },
      { label: 'Washroom clean & stocked', required: true },
      { label: 'Counter wiped down', required: true },
      { label: 'Kitchen surfaces sanitized', required: true },
      { label: 'Dustbins emptied', required: true },
      { label: 'Menu board updated', required: true },
      { label: 'Outside area cleaned', required: true },
      { label: 'Staff attendance marked', required: true },
      { label: 'Vegetables & Paneer prepped', required: true },
      { label: 'Cheese, Bread, Buns, Pizza base ready', required: true },
      { label: 'Momos, Sauces, Maggi ready', required: true },
      { label: 'Milk, Ice, Tea ingredients, Coffee ready', required: true },
      { label: 'Packaging material stocked', required: true }
    ]
  },
  {
    id: 'peak_prep',
    name: '6PM Peak-Prep Checklist',
    items: [
      { label: 'Kitchen prep complete', required: true },
      { label: 'Sauces filled', required: true },
      { label: 'Vegetables chopped & ready', required: true },
      { label: 'Paneer & Cheese portioned', required: true },
      { label: 'Pizza bases & Momos ready', required: true },
      { label: 'Fries ready', required: true },
      { label: 'Tea & Milk boiled/ready', required: true },
      { label: 'Beverage station stocked', required: true },
      { label: 'Service tables clean', required: true },
      { label: 'Cutlery & Tissues ready', required: true },
      { label: 'Water station ready', required: true },
      { label: 'Billing system checked', required: true },
      { label: 'Takeaway packaging ready', required: true }
    ]
  },
  {
    id: 'closing',
    name: 'Closing Checklist',
    items: [
      { label: 'Service tables cleaned', required: true },
      { label: 'Chairs arranged on tables', required: true },
      { label: 'Floor swept and mopped', required: true },
      { label: 'Dustbins emptied outside', required: true },
      { label: 'All cutlery washed & dried', required: true },
      { label: 'Service counter cleaned', required: true },
      { label: 'Washroom checked & locked', required: true },
      { label: 'Gas & Kitchen equipment turned OFF', required: true },
      { label: 'Kitchen deep cleaned', required: true },
      { label: 'Fryer oil condition checked', required: true },
      { label: 'Food stored correctly in fridge', required: true },
      { label: 'Raw materials covered', required: true },
      { label: 'Wastage recorded in system', required: true },
      { label: 'Cash counted & matched', required: true },
      { label: 'UPI & Card totals verified', required: true },
      { label: 'Cancelled bills checked', required: true }
    ]
  }
];

export const NON_NEGOTIABLE_RULES = [
  "1. No order without KOT.",
  "2. No verbal kitchen orders.",
  "3. No customer ignored.",
  "4. No phone use during active service.",
  "5. No arguing with customers.",
  "6. No unrecorded wastage.",
  "7. No free food without owner/authorized approval.",
  "8. No changing recipe/portion without approval.",
  "9. Every closing shift reconciles cash and billing.",
  "10. Every employee leaves their station clean.",
  "11. Repeated mistakes are documented and trained — not ignored.",
  "12. Owner should manage the system, not constantly rescue it."
];

export function useChecklists() {
  const [runs, setRuns] = useState<ChecklistRun[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    // Only fetch the last 20 runs to keep reads low
    const q = query(collection(db, 'checklist_runs'), orderBy('completedAt', 'desc'), limit(20));
    const unsubscribe = onSnapshot(q, (snap) => {
      setRuns(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChecklistRun)));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const submitChecklist = async (run: Omit<ChecklistRun, 'id' | 'completedAt' | 'completedBy' | 'completedById'>) => {
    try {
      if (!user) throw new Error("Not logged in");
      
      const payload: ChecklistRun = {
        ...run,
        completedBy: user.name,
        completedById: user.id,
        completedAt: Date.now()
      };
      
      await addDoc(collection(db, 'checklist_runs'), payload);
      toast.success(`${run.templateName} submitted successfully!`);
      return true;
    } catch (e) {
      console.error(e);
      toast.error("Failed to submit checklist");
      return false;
    }
  };

  return { templates: SEED_TEMPLATES, runs, loading, submitChecklist, rules: NON_NEGOTIABLE_RULES };
}
