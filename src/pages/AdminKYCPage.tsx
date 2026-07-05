import React, { useState } from 'react';
import { useAdminData } from '@/hooks/useAdminData';
import { KYCList } from './components/KYCList';
import { DisputeList } from './components/DisputeList';
import { MembershipList } from './components/MembershipList';

export const AdminKYCPage = () => {
  const { pendingUsers, disputes, payments, loading } = useAdminData();
  const [activeTab, setActiveTab] = useState<'kyc' | 'disputes' | 'memberships'>('kyc');

  if (loading) return <div className="text-center p-10">Cargando datos administrativos...</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Panel Administrativo</h1>
      
      {/* Navegación de pestañas */}
      <div className="flex gap-4 border-b pb-4 mb-6">
        <button onClick={() => setActiveTab('kyc')} className={activeTab === 'kyc' ? 'font-bold text-blue-600' : ''}>KYC</button>
        <button onClick={() => setActiveTab('disputes')} className={activeTab === 'disputes' ? 'font-bold text-blue-600' : ''}>Disputas</button>
        <button onClick={() => setActiveTab('memberships')} className={activeTab === 'memberships' ? 'font-bold text-blue-600' : ''}>Membresías</button>
      </div>

      {/* Contenido dinámico */}
      {activeTab === 'kyc' && <KYCList users={pendingUsers} />}
      {activeTab === 'disputes' && <DisputeList disputes={disputes} />}
      {activeTab === 'memberships' && <MembershipList payments={payments} />}
    </div>
  );
};
