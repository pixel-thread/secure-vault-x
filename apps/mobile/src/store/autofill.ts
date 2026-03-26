import { create } from 'zustand';

type AutoFillStoreType = {
  isAutofilling: boolean;
  autofillSiteKey: string | null;
  setAutofillSiteKey: (siteKey: string | null) => void;
  setIsAutofilling: (isAutofilling: boolean) => void;
};

export const AuthFillStoreManageer = create<AutoFillStoreType>((set) => ({
  isAutofilling: false,
  autofillSiteKey: null,
  setAutofillSiteKey: (siteKey: string | null) => set({ autofillSiteKey: siteKey }),
  setIsAutofilling: (isAutofilling: boolean) => set({ isAutofilling }),
}));
