'use client';

import { create } from 'zustand';

export interface LayerProfile {
    name: string;
    type: string;
    shape: string;
    paramCount: number;
    usage: number; // bytes (memory_bytes from API)
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

export type ProfilingStatus = 'idle' | 'loading' | 'success' | 'error';

interface ProfilingState {
    profilingData: ProfilingData | null;
    profilingStatus: ProfilingStatus;
    profilingError: string | null;
    isVisible: boolean;

    setProfilingData: (data: ProfilingData | null) => void;
    setVisible: (visible: boolean) => void;

    // Fetch profiling data from API
    fetchProfilingData: (
        onnxFile: File,
        dataFile: File | null,
        boardName: string,
        quantized?: boolean
    ) => Promise<void>;

    // Legacy placeholder function (for testing without backend)
    loadPlaceholderData: (boardName: string) => void;

    resetProfiling: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Placeholder data for demonstration/fallback
const getPlaceholderData = (boardName: string): ProfilingData => {
    const isSTM32 = boardName.includes('STM32');

    return {
        ramUsed: isSTM32 ? 117760 : 143360,
        ramTotal: isSTM32 ? 262144 : 327680,
        flashUsed: isSTM32 ? 147456 : 163840,
        flashTotal: isSTM32 ? 524288 : 4194304,
        totalFlops: 1248000,
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

// Transform API response to ProfilingData
const transformApiResponse = (apiData: {
    ram_used: number;
    ram_total: number;
    flash_used: number;
    flash_total: number;
    total_flops: number;
    board_name: string;
    layers: Array<{
        name: string;
        type: string;
        shape: string;
        param_count: number;
        memory_bytes: number;
        flops: number;
    }>;
}): ProfilingData => {
    return {
        ramUsed: apiData.ram_used,
        ramTotal: apiData.ram_total,
        flashUsed: apiData.flash_used,
        flashTotal: apiData.flash_total,
        totalFlops: apiData.total_flops,
        boardName: apiData.board_name,
        layers: apiData.layers.map(layer => ({
            name: layer.name,
            type: layer.type,
            shape: layer.shape,
            paramCount: layer.param_count,
            usage: layer.memory_bytes,
        })),
    };
};

export const useProfilingStore = create<ProfilingState>((set) => ({
    profilingData: null,
    profilingStatus: 'idle',
    profilingError: null,
    isVisible: true,

    setProfilingData: (data) => set({ profilingData: data }),
    setVisible: (visible) => set({ isVisible: visible }),

    fetchProfilingData: async (onnxFile, dataFile, boardName, quantized = false) => {
        set({ profilingStatus: 'loading', profilingError: null });

        try {
            const formData = new FormData();
            formData.append('file', onnxFile);

            if (dataFile) {
                formData.append('data_file', dataFile);
            }

            const url = new URL(`${API_URL}/profile-model/profile`);
            url.searchParams.append('board_name', boardName);
            url.searchParams.append('quantized', String(quantized));

            const response = await fetch(url.toString(), {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `Profiling failed: ${response.status}`);
            }

            const data = await response.json();

            if (!data.valid) {
                set({
                    profilingStatus: 'error',
                    profilingError: data.error || 'Profiling failed',
                    profilingData: null,
                });
                return;
            }

            const profilingData = transformApiResponse(data.model_info);

            set({
                profilingStatus: 'success',
                profilingData,
                profilingError: null,
            });
        } catch (error) {
            set({
                profilingStatus: 'error',
                profilingError: error instanceof Error ? error.message : 'Profiling failed',
                profilingData: null,
            });
        }
    },

    loadPlaceholderData: (boardName) => {
        set({ profilingStatus: 'loading', profilingError: null });
        // Simulate loading delay
        setTimeout(() => {
            set({
                profilingData: getPlaceholderData(boardName),
                profilingStatus: 'success',
                profilingError: null,
            });
        }, 500);
    },

    resetProfiling: () => {
        set({
            profilingData: null,
            profilingStatus: 'idle',
            profilingError: null,
        });
    },
}));
