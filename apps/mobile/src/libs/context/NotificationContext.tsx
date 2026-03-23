import { createContext } from 'react';
import { NotificationContextT } from '@src/types/notification';

export const NotificationContext = createContext<NotificationContextT | null>(null);
