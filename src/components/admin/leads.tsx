"use client";

import { useEffect, useState } from "react";

type Lead = {
  id: string;
  name: string;
  surname: string;
  phone: string;
  email: string;
  plan: string;
  createdAt: string | Date;
};

export default function AdminLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    fetch("/api/admin/leads")
      .then((res) => res.json())
      .then((data: Lead[]) => setLeads(data));
  }, []);

  return (
    <div className="mt-10">
      <h2 className="text-xl font-bold mb-4">Lead Merkezi</h2>
      <table className="w-full border text-sm">
        <thead>
          <tr className="bg-zinc-800 text-white">
            <th className="p-2">Ad</th>
            <th className="p-2">Soyad</th>
            <th className="p-2">Telefon</th>
            <th className="p-2">E-posta</th>
            <th className="p-2">Plan</th>
            <th className="p-2">Tarih</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead: Lead) => (
            <tr key={lead.id} className="border-b">
              <td className="p-2">{lead.name}</td>
              <td className="p-2">{lead.surname}</td>
              <td className="p-2">{lead.phone}</td>
              <td className="p-2">{lead.email}</td>
              <td className="p-2">{lead.plan}</td>
              <td className="p-2">{new Date(lead.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
