import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface AddItemData {
  type: 'lost' | 'found';
  name: string;
  category: string;
  description: string;
  location: string;
  latitude?: number;
  longitude?: number;
  timestamp: Date;
  imageUri?: string;
}

interface AddItemContextType {
  data: AddItemData;
  updateData: (updates: Partial<AddItemData>) => void;
  resetData: () => void;
}

const defaultData: AddItemData = {
  type: 'lost',
  name: '',
  category: '',
  description: '',
  location: '',
  timestamp: new Date(),
};

const AddItemContext = createContext<AddItemContextType | undefined>(undefined);

export function AddItemProvider({ children, type }: { children: ReactNode; type: 'lost' | 'found' }) {
  const [data, setData] = useState<AddItemData>({ ...defaultData, type });

  const updateData = (updates: Partial<AddItemData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const resetData = () => {
    setData({ ...defaultData, type });
  };

  return (
    <AddItemContext.Provider value={{ data, updateData, resetData }}>
      {children}
    </AddItemContext.Provider>
  );
}

export function useAddItem() {
  const context = useContext(AddItemContext);
  if (!context) {
    throw new Error('useAddItem must be used within an AddItemProvider');
  }
  return context;
}
