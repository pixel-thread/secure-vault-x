import Constants, { AppOwnership } from 'expo-constants';

export const isExpoGo = (): boolean => {
  return Constants.appOwnership === ('expo' as AppOwnership);
};
