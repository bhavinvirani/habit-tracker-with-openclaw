import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { featuresApi } from '../services/features';

interface FeatureFlagContextValue {
  enabledFeatures: string[];
  isEnabled: (key: string) => boolean;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

const FeatureFlagContext = createContext<FeatureFlagContextValue>({
  enabledFeatures: [],
  isEnabled: () => false,
  isLoading: true,
  refetch: async () => {},
});

export const useFeatureFlags = () => useContext(FeatureFlagContext);

export const FeatureFlagProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  const [enabledFeatures, setEnabledFeatures] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFeatures = async () => {
    try {
      const features = await featuresApi.getEnabledFeatures();
      setEnabledFeatures(features);
    } catch {
      setEnabledFeatures([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchFeatures();
    } else {
      setEnabledFeatures([]);
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const isEnabled = (key: string) => enabledFeatures.includes(key);

  return (
    <FeatureFlagContext.Provider
      value={{ enabledFeatures, isEnabled, isLoading, refetch: fetchFeatures }}
    >
      {children}
    </FeatureFlagContext.Provider>
  );
};

export const FeatureGate: React.FC<{ flag: string; children: React.ReactNode }> = ({
  flag,
  children,
}) => {
  const { isEnabled, isLoading } = useFeatureFlags();

  if (isLoading) return null;
  if (!isEnabled(flag)) return null;

  return <>{children}</>;
};
