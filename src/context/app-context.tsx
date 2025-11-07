'use client';

import React, { createContext, useState, useContext, ReactNode } from 'react';

export type Role = 'teacher' | 'student';

interface AppContextType {
  role: Role | null;
  setRole: (role: Role) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role | null>(null);

  const setRole = (role: Role) => {
    setRoleState(role);
  };

  const value = {
    role,
    setRole,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
