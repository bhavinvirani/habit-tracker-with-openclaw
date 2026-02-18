import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { PageHeader } from '../components/ui';
import AdminTabNav, { AdminTab } from '../components/admin/AdminTabNav';
import OverviewTab from '../components/admin/OverviewTab';
import FeatureFlagsTab from '../components/admin/FeatureFlagsTab';
import UsersTab from '../components/admin/UsersTab';
import ReportsTab from '../components/admin/ReportsTab';

const Admin: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  if (!user?.isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Dashboard"
        subtitle="Manage feature flags, users, and application settings"
        icon={Settings}
      />
      <AdminTabNav activeTab={activeTab} onTabChange={setActiveTab} />
      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'flags' && <FeatureFlagsTab />}
      {activeTab === 'users' && <UsersTab currentUserId={user.id} />}
      {activeTab === 'reports' && <ReportsTab />}
    </div>
  );
};

export default Admin;
