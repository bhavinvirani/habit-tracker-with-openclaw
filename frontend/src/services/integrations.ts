import api from './api';

export interface ConnectedApp {
  id: string;
  provider: string;
  username: string | null;
  isActive: boolean;
  createdAt: string;
}

export const integrationsApi = {
  getConnectedApps: async (): Promise<ConnectedApp[]> => {
    const response = await api.get('/integrations');
    return response.data.data.apps;
  },

  disconnect: async (provider: string): Promise<void> => {
    await api.delete(`/integrations/${provider}`);
  },
};
