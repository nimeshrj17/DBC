'use client';
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Settings, Percent, Receipt, Info, QrCode } from 'lucide-react';
import { useSettings } from '@/lib/hooks/useSettings';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { settings, loading, updateSettings } = useSettings();
  const [isSaving, setIsSaving] = useState(false);

  const handleTaxToggle = async (enabled: boolean) => {
    try {
      await updateSettings({ taxEnabled: enabled });
      toast.success(enabled ? "Tax enabled" : "Tax disabled");
    } catch (error) {
      toast.error("Failed to update tax setting");
    }
  };

  const handleTaxChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val) && val >= 0) {
      try {
        await updateSettings({ taxPercentage: val });
      } catch (error) {
        // Silent catch for live typing
      }
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full"><p className="text-muted-foreground">Loading settings...</p></div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10 h-full flex flex-col">
      <div>
        <h1 className="text-2xl font-bold mb-1">Store Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your cafe's global configuration.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="rounded-2xl border-border shadow-sm overflow-hidden">
          <div className="p-4 bg-muted/20 border-b border-border flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
              <Receipt className="w-4 h-4" />
            </div>
            <h3 className="font-semibold">Billing & Taxes</h3>
          </div>
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Enable Order Tax</p>
                <p className="text-sm text-muted-foreground mt-1">Automatically calculate and apply tax to all new orders.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={settings.taxEnabled}
                  onChange={(e) => handleTaxToggle(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            
            <div className={`pt-4 border-t border-border transition-opacity ${settings.taxEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
              <label className="block text-sm font-medium mb-2">Tax Percentage (%)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Percent className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={settings.taxPercentage}
                  onChange={handleTaxChange}
                  className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  disabled={!settings.taxEnabled}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2 flex items-start">
                <Info className="w-3 h-3 mr-1 mt-0.5 shrink-0" />
                This rate will be applied to the subtotal of all new orders. Existing orders will not be affected.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border shadow-sm overflow-hidden">
          <div className="p-4 bg-muted/20 border-b border-border flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
              <QrCode className="w-4 h-4" />
            </div>
            <h3 className="font-semibold">Payments & UPI</h3>
          </div>
          <CardContent className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Store UPI ID</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. yourname@upi"
                  value={settings.upiId || ''}
                  onChange={(e) => updateSettings({ upiId: e.target.value }).catch(() => {})}
                  className="w-full px-4 py-2 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2 flex items-start">
                <Info className="w-3 h-3 mr-1 mt-0.5 shrink-0" />
                This UPI ID will be used to generate dynamic payment QR codes for customers.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
