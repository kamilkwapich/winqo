'use client';
import React, { useEffect, useState } from "react";
import { getToken } from "../../../../../lib/auth";
import { apiAuth } from "../../../../../lib/api";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function AdminUsersPage() {
  const params = useParams();
  const lang = params.lang as string;
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null); // For modal

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const token = getToken();
      if (!token) return;
      const data = await apiAuth<any[]>("/admin/users-dashboard", token);
      setUsers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // Helper to format date
  const fmtDate = (d: string) => d ? new Date(d).toLocaleString() : "-";
  
  // Format Price
  const fmtPrice = (amount: number, currency: string) => {
    if (amount == null) return "-";
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount / 100);
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex gap-4">
          <Link href={`/${lang}/app/admin`} className="text-blue-600 hover:underline">← Back to Dashboard</Link>
          <Link href={`/${lang}/app/admin/logs`} className="text-blue-600 hover:underline">Payment Logs</Link>
      </div>
      <h1 className="text-2xl font-bold mb-4">All Users (Tenants)</h1>
      
      {loading ? <div>Loading...</div> : (
        <div className="overflow-x-auto bg-white shadow rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
             <thead className="bg-gray-50">
               <tr>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User Email</th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenant Name</th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registered</th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expires</th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
               </tr>
             </thead>
             <tbody className="bg-white divide-y divide-gray-200">
               {users.map((u: any) => (
                 <tr key={u.user_id}>
                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.email}</td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.tenant?.name || "-"}</td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{fmtDate(u.created_at)}</td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.subscription?.plan_code || "-"}</td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${u.subscription?.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {u.subscription?.status || "inactive"}
                      </span>
                   </td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{fmtDate(u.subscription?.current_period_end)}</td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                     <button onClick={() => setSelectedUser(u)} className="text-indigo-600 hover:text-indigo-900">Details</button>
                   </td>
                 </tr>
               ))}
             </tbody>
          </table>
        </div>
      )}

      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="text-lg font-bold">User Details</h3>
              <button onClick={() => setSelectedUser(null)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-700">User Info</h4>
                    <p className="text-sm">Email: {selectedUser.email}</p>
                    <p className="text-sm">Registered: {fmtDate(selectedUser.created_at)}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700">Subscription</h4>
                    <p className="text-sm">Plan: {selectedUser.subscription?.plan_code}</p>
                    <p className="text-sm">Status: {selectedUser.subscription?.status}</p>
                    <p className="text-sm">Expires: {fmtDate(selectedUser.subscription?.current_period_end)}</p>
                    <p className="text-sm">Price: {fmtPrice(selectedUser.subscription?.price_amount, selectedUser.subscription?.currency)}</p>
                  </div>
               </div>
               
               <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-700 mb-2">Tenant / Billing Data</h4>
                  {selectedUser.tenant ? (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                       <div><span className="text-gray-500">Name:</span> {selectedUser.tenant.name}</div>
                       <div><span className="text-gray-500">Tax ID:</span> {selectedUser.tenant.billing_tax_id || "-"}</div>
                       <div><span className="text-gray-500">Billing Name:</span> {selectedUser.tenant.billing_full_name || "-"}</div>
                       <div><span className="text-gray-500">Country:</span> {selectedUser.tenant.billing_country || "-"}</div>
                       <div><span className="text-gray-500">City:</span> {selectedUser.tenant.billing_city || "-"}</div>
                       <div><span className="text-gray-500">Street:</span> {selectedUser.tenant.billing_street || "-"}</div>
                       <div><span className="text-gray-500">House/Apt:</span> {selectedUser.tenant.billing_house_no} {selectedUser.tenant.billing_apartment_no ? `/ ${selectedUser.tenant.billing_apartment_no}` : ""}</div>
                       <div><span className="text-gray-500">Postcode:</span> {selectedUser.tenant.billing_postcode || "-"}</div>
                    </div>
                  ) : (
                    <p className="text-gray-500">No tenant attached.</p>
                  )}
               </div>
            </div>
            <div className="p-4 border-t bg-gray-50 text-right">
              <button onClick={() => setSelectedUser(null)} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
