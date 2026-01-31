'use client';

import { useCallback, useState, DragEvent, useRef } from 'react';
import { Upload, FileCheck, AlertCircle, X, Loader2, Database, FileCode } from 'lucide-react';
import { useUploadStore } from '@/store/uploadStore';

// Onnx name mappings
const OP_NAME_MAP: Record<string, string> = {
    'Gemm': 'Dense',
    'MatMul': 'Neuron',
    'Conv': 'Conv',
    'Relu': 'ReLU',
    'Sigmoid': 'Sigmoid',
    'Tanh': 'Tanh',
    'Softmax': 'Softmax',
    'BatchNormalization': 'BatchNorm',
    'MaxPool': 'MaxPool',
    'AveragePool': 'AvgPool',
    'Flatten': 'Flatten',
    'Dropout': 'Dropout',
};

export function OnnxUploader() {
    const {
        uploadStatus,
        uploadError,
        modelInfo,
        onnxFileName,
        dataFileName,
        uploadFiles,
        resetUpload
    } = useUploadStore();

    const [isDragging, setIsDragging] = useState(false);
    const [pendingOnnxFile, setPendingOnnxFile] = useState<File | null>(null);
    const [pendingDataFile, setPendingDataFile] = useState<File | null>(null);
    const dataInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = useCallback((e: DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        const onnxFile = files.find(f => f.name.endsWith('.onnx'));
        const dataFile = files.find(f => f.name.endsWith('.data'));

        if (onnxFile) {
            if (dataFile) {
                // Both files dropped, upload immediately
                uploadFiles(onnxFile, dataFile);
            } else {
                // Only ONNX file, save as pending
                setPendingOnnxFile(onnxFile);
                setPendingDataFile(null);
            }
        }
    }, [uploadFiles]);

    const handleOnnxSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPendingOnnxFile(file);
            setPendingDataFile(null);
        }
        e.target.value = '';
    }, []);

    const handleDataSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && pendingOnnxFile) {
            setPendingDataFile(file);
        }
        e.target.value = '';
    }, [pendingOnnxFile]);

    const handleUpload = useCallback(() => {
        if (pendingOnnxFile) {
            uploadFiles(pendingOnnxFile, pendingDataFile || undefined);
            setPendingOnnxFile(null);
            setPendingDataFile(null);
        }
    }, [pendingOnnxFile, pendingDataFile, uploadFiles]);

    const handleReset = useCallback(() => {
        resetUpload();
        setPendingOnnxFile(null);
        setPendingDataFile(null);
    }, [resetUpload]);

    // Success state
    if (uploadStatus === 'success' && modelInfo) {
        return (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm font-medium text-emerald-400">Model Loaded</span>
                    </div>
                    <button
                        onClick={handleReset}
                        className="p-1 rounded hover:bg-emerald-500/20 transition-colors"
                    >
                        <X className="w-4 h-4 text-emerald-400" />
                    </button>
                </div>
                <p className="text-xs text-zinc-400 truncate">{onnxFileName}</p>
                {dataFileName && (
                    <p className="text-xs text-zinc-500 truncate">+ {dataFileName}</p>
                )}
                <div className="space-y-1 text-xs mt-2">
                    <div className="flex justify-between text-zinc-500">
                        <span>Input:</span>
                        <span className="text-zinc-300 font-mono">
                            [{modelInfo.inputs[0]?.shape.join(', ') || '?'}]
                        </span>
                    </div>
                    <div className="flex justify-between text-zinc-500">
                        <span>Output:</span>
                        <span className="text-zinc-300 font-mono">
                            [{modelInfo.outputs[0]?.shape.join(', ') || '?'}]
                        </span>
                    </div>
                    <div className="flex justify-between text-zinc-500">
                        <span>Ops:</span>
                        <span className="text-zinc-300">{modelInfo.layers?.length || 0}</span>
                    </div>
                    <div className="flex justify-between text-zinc-500">
                        <span>Parameters:</span>
                        <span className="text-violet-400 font-mono">
                            {(modelInfo.total_parameters || 0).toLocaleString()}
                        </span>
                    </div>
                </div>

                {/* Graph operations list */}
                {modelInfo.layers && modelInfo.layers.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-emerald-500/20">
                        <p className="text-xs text-zinc-500 mb-1.5">Graph Ops:</p>
                        <div className="max-h-32 overflow-y-auto space-y-1">
                            {modelInfo.layers.map((layer, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center gap-2 px-2 py-1 rounded bg-zinc-800/50 text-xs"
                                >
                                    <span className="text-zinc-500 font-mono w-4">{idx + 1}</span>
                                    <span className="text-violet-400 font-medium">
                                        {OP_NAME_MAP[layer.op_type] || layer.op_type}
                                    </span>
                                    <span className="text-zinc-600 truncate flex-1">{layer.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Error state
    if (uploadStatus === 'error') {
        return (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-400" />
                        <span className="text-sm font-medium text-red-400">Upload Failed</span>
                    </div>
                    <button
                        onClick={handleReset}
                        className="p-1 rounded hover:bg-red-500/20 transition-colors"
                    >
                        <X className="w-4 h-4 text-red-400" />
                    </button>
                </div>
                <p className="text-xs text-red-300/80">{uploadError}</p>
            </div>
        );
    }

    // Loading state
    if (uploadStatus === 'uploading') {
        return (
            <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
                    <span className="text-sm text-zinc-400">Uploading & validating...</span>
                </div>
            </div>
        );
    }

    // Pending state - ONNX selected, optional data file
    if (pendingOnnxFile) {
        return (
            <div className="p-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50 space-y-3">
                {/* ONNX file */}
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/30">
                    <FileCode className="w-4 h-4 text-violet-400" />
                    <span className="text-xs text-violet-300 truncate flex-1">{pendingOnnxFile.name}</span>
                </div>

                {/* Data file (optional) */}
                {pendingDataFile ? (
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
                        <Database className="w-4 h-4 text-amber-400" />
                        <span className="text-xs text-amber-300 truncate flex-1">{pendingDataFile.name}</span>
                        <button
                            onClick={() => setPendingDataFile(null)}
                            className="p-0.5 rounded hover:bg-amber-500/20"
                        >
                            <X className="w-3 h-3 text-amber-400" />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => dataInputRef.current?.click()}
                        className="w-full flex items-center justify-center gap-2 px-2 py-1.5 rounded-lg 
                       border border-dashed border-zinc-600 text-zinc-500 hover:border-zinc-500 
                       hover:text-zinc-400 transition-colors text-xs"
                    >
                        <Database className="w-3 h-3" />
                        Add .data file
                    </button>
                )}

                <input
                    ref={dataInputRef}
                    type="file"
                    accept=".data"
                    onChange={handleDataSelect}
                    className="hidden"
                />

                {/* Actions */}
                <div className="flex gap-2">
                    <button
                        onClick={handleReset}
                        className="flex-1 py-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleUpload}
                        className="flex-1 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 
                       text-white text-xs font-medium transition-colors"
                    >
                        Upload
                    </button>
                </div>
            </div>
        );
    }

    // Idle state - drop zone
    return (
        <label
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
        block p-4 rounded-xl border-2 border-dashed cursor-pointer
        transition-all duration-200
        ${isDragging
                    ? 'border-violet-500 bg-violet-500/10'
                    : 'border-zinc-700/50 hover:border-zinc-600 bg-zinc-800/30'
                }
      `}
        >
            <input
                type="file"
                accept=".onnx"
                onChange={handleOnnxSelect}
                className="hidden"
            />
            <div className="flex flex-col items-center gap-2 text-center">
                <Upload
                    className={`w-6 h-6 ${isDragging ? 'text-violet-400' : 'text-zinc-500'}`}
                />
                <div>
                    <p className="text-sm text-zinc-400">
                        {isDragging ? 'Drop files here' : 'Upload ONNX Model'}
                    </p>
                    <p className="text-xs text-zinc-600">.onnx + .data</p>
                </div>
            </div>
        </label>
    );
}
