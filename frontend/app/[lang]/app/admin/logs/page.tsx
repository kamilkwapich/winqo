'use client';
import React, { useEffect, useState } from "react";
import { getToken } from "../../../../../lib/auth";
import { apiAuth } from "../../../../../lib/api";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function AdminLogsPage() {
  const params = useParams();
  const lang = params.lang as string;
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<any>(null);

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    try {
      const token = getToken();
      if (!token) return;
      const data = await apiAuth<any[]>("/admin/payment-logs?limit=100", token);
      setLogs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }
  
  const fmtDate = (d: string) => d ? new Date(d).toLocaleString() : "-";

  return (
     <div className="p-8">
      <div className="mb-6 flex gap-4">
          <Link href={`/${lang}/app/admin`} className="text-blue-600 hover:underline">← Back to Dashboard</Link>
          <Link href={`/${lang}/app/admin/users`} className="text-blue-600 hover:underline">All Users</Link>
      </div>
      <h1 className="text-2xl font-bold mb-4">Payment Logs / Failures</h1>
      
      {loading ? <div>Loading...</div> : (
        <div className="overflow-x-auto bg-white shadow rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
             <thead className="bg-gray-50">
               <tr>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provider</th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event Type</th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenant</th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Result</th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Error</th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
               </tr>
             </thead>
             <tbody className="bg-white divide-y divide-gray-200">
               {logs.map((L: any) => (
                 <tr key={L.id} className={L.processed_ok ? "" : "bg-red-50"}>
                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{fmtDate(L.received_at)}</td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{L.provider}</td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{L.event_type}</td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{L.tenant_name || L.tenant_id || "-"}</td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {L.processed_ok ? <span className="text-green-600">OK</span> : <span className="text-red-600">Failed</span>}
                   </td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm text-red-500 truncate max-w-xs">{L.error}</td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm">
                     <button onClick={() => setSelectedLog(L)} className="text-blue-600 hover:underline">View Payload</button>
                   </td>
                 </tr>
               ))}
             </tbody>
          </table>
        </div>
      )}
      
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="text-lg font-bold">Log Payload ({selectedLog.event_type})</h3>
              <button onClick={() => setSelectedLog(null)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="p-4 overflow-auto flex-1 bg-slate-50">
               <pre className="text-xs bg-gray-800 text-green-400 p-4 rounded overflow-auto whitespace-pre-wrap">
                 {JSON.stringify(selectedLog.payload, null, 2)}
               </pre>
            </div>
            <div className="p-4 border-t bg-gray-50 text-right">
              <button onClick={() => setSelectedLog(null)} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">Close</button>
            </div>
          </div>
        </div>
      )}
     </div>
  );
}
