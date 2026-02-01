import { create } from 'zustand';

export type AppMode = 'landing' | 'build-new' | 'import-existing' | 'load-previous';

interface AppState {
    mode: AppMode;
    setMode: (mode: AppMode) => void;
    goToLanding: () => void;
}

export const useAppStore = create<AppState>((set) => ({
    mode: 'landing',

    setMode: (mode: AppMode) => {
        set({ mode });
    },

    goToLanding: () => {
        set({ mode: 'landing' });
    },
}));
