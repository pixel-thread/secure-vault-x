import { createContext } from 'react';
import { DrizzleDB } from '@src/types/db';

export const DrizzleContext = createContext<DrizzleDB | null>(null);
