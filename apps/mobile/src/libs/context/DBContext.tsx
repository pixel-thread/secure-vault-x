import { createContext } from 'react';
import { DrizzleDB } from '../../types/db';

export const DrizzleContext = createContext<DrizzleDB | null>(null);
