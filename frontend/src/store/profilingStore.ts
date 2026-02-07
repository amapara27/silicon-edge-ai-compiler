'use client';

import { create } from 'zustand';

export interface LayerProfile {
    name: string;
    type: string;
    shape: string;
    paramCount: number;
    usage: number; // bytes
}

export interface ProfilingData {
    ramUsed: number;       // bytes
    ramTotal: number;      // bytes
    flashUsed: number;     // bytes
    flashTotal: number;    // bytes
    totalFlops: number;    // floating point operations
    layers: LayerProfile[];
    boardName: string;
}

interface ProfilingState {
    profilingData: ProfilingData | null;
    isLoading: boolean;
    isVisible: boolean;
    setProfilingData: (data: ProfilingData | null) => void;
    setLoading: (loading: boolean) => void;
    setVisible: (visible: boolean) => void;
    loadPlaceholderData: (boardName: string) => void;
}

// Placeholder data for demonstration
const getPlaceholderData = (boardName: string): ProfilingData => {
    const isSTM32 = boardName.includes('STM32');

    return {
        ramUsed: isSTM32 ? 117760 : 143360,      // ~115KB / ~140KB
        ramTotal: isSTM32 ? 262144 : 327680,     // 256KB / 320KB
        flashUsed: isSTM32 ? 147456 : 163840,    // ~144KB / ~160KB
        flashTotal: isSTM32 ? 524288 : 4194304,  // 512KB / 4MB
        totalFlops: 1248000,                      // ~1.2M FLOPs
        boardName,
        layers: [
            { name: 'conv1', type: 'Conv2D', shape: '26x26x32', paramCount: 320, usage: 21632 },
            { name: 'pool1', type: 'MaxPool2D', shape: '13x13x32', paramCount: 0, usage: 5408 },
            { name: 'conv2', type: 'Conv2D', shape: '11x11x64', paramCount: 18496, usage: 7744 },
            { name: 'pool2', type: 'MaxPool2D', shape: '5x5x64', paramCount: 0, usage: 1600 },
            { name: 'flatten', type: 'Flatten', shape: '1600', paramCount: 0, usage: 6400 },
            { name: 'dense1', type: 'Dense', shape: '128', paramCount: 204928, usage: 512 },
            { name: 'output', type: 'Dense', shape: '10', paramCount: 1290, usage: 40 },
        ],
    };
};

export const useProfilingStore = create<ProfilingState>((set) => ({
    profilingData: null,
    isLoading: false,
    isVisible: true,

    setProfilingData: (data) => set({ profilingData: data }),
    setLoading: (loading) => set({ isLoading: loading }),
    setVisible: (visible) => set({ isVisible: visible }),

    loadPlaceholderData: (boardName) => {
        set({ isLoading: true });
        // Simulate loading delay
        setTimeout(() => {
            set({
                profilingData: getPlaceholderData(boardName),
                isLoading: false
            });
        }, 500);
    },
}));
