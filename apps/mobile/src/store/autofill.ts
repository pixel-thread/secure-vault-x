import { create } from 'zustand';

interface AutofillState {
  isAutofilling: boolean;
  autofillSiteKey: string | null;
  setAutofillSiteKey: (siteKey: string | null) => void;
  setIsAutofilling: (isAutofilling: boolean) => void;
  reset: () => void;
}

export const useAutofillStore = create<AutofillState>((set) => ({
  isAutofilling: false,
  autofillSiteKey: null,
  setAutofillSiteKey: (siteKey: string | null) =>
    set({
      autofillSiteKey: siteKey,
      isAutofilling: !!siteKey,
    }),
  setIsAutofilling: (isAutofilling: boolean) => set({ isAutofilling }),
  reset: () => set({ isAutofilling: false, autofillSiteKey: null }),
}));
