'use client';
import React, { useState } from 'react';
import { useCustomers, Customer } from '@/lib/hooks/useCustomers';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Users, Search, Phone, Calendar, IndianRupee } from 'lucide-react';
import { format } from 'date-fns';

export default function CustomersPage() {
  const { customers, loading } = useCustomers();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            Customers
          </h1>
          <p className="text-muted-foreground mt-1">Manage and track your valuable customers.</p>
        </div>
        
        <div className="relative w-full sm:w-64">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="bg-gradient-to-br from-card to-card/50">
          <CardContent className="p-6">
            <div className="text-muted-foreground font-medium mb-1">Total Customers</div>
            <div className="text-4xl font-bold">{customers.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/30 border-b border-border">
              <tr>
                <th className="px-4 md:px-6 py-4 rounded-tl-xl font-semibold">Customer</th>
                <th className="px-4 md:px-6 py-4 rounded-tr-xl font-semibold">Phone</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={2} className="px-6 py-10 text-center text-muted-foreground">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading customers...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-6 py-10 text-center text-muted-foreground">
                    No customers found matching your search.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-4 md:px-6 py-4 font-medium text-foreground flex items-center gap-2 md:gap-3 whitespace-nowrap">
                      <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold flex-shrink-0">
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <span>{customer.name}</span>
                    </td>
                    <td className="px-4 md:px-6 py-4 text-muted-foreground whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3 h-3" />
                        {customer.phone}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
