import { useContext } from 'react';
import { DrizzleContext } from '@libs/context/DBContext';

export const useDB = () => {
  const context = useContext(DrizzleContext);
  if (!context) throw new Error('useDB must be used within a DBProvider');
  return context;
};
