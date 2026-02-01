'use client';

import { useCallback, useState, DragEvent, useRef, useEffect } from 'react';
import { Upload, FileCheck, AlertCircle, X, Loader2, Database, FileCode, ArrowRight } from 'lucide-react';
import { useUploadStore } from '@/store/uploadStore';
import { useGraphStore } from '@/store/graphStore';
import { useAppStore } from '@/store/appStore';
import { modelInfoToGraph } from '@/utils/modelImportUtils';

export function ImportModelModal() {
    const {
        uploadStatus,
        uploadError,
        modelInfo,
        onnxFileName,
        dataFileName,
        uploadFiles,
        resetUpload
    } = useUploadStore();

    const { setNodes, setEdges } = useGraphStore();
    const { mode } = useAppStore();

    const [isDragging, setIsDragging] = useState(false);
    const [pendingOnnxFile, setPendingOnnxFile] = useState<File | null>(null);
    const [pendingDataFile, setPendingDataFile] = useState<File | null>(null);
    const dataInputRef = useRef<HTMLInputElement>(null);

    // When model info is received and we're in import mode, convert to nodes
    useEffect(() => {
        if (uploadStatus === 'success' && modelInfo && mode === 'import-existing') {
            const { nodes, edges } = modelInfoToGraph(modelInfo);
            setNodes(nodes);
            setEdges(edges);
        }
    }, [uploadStatus, modelInfo, mode, setNodes, setEdges]);

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
                uploadFiles(onnxFile, dataFile);
            } else {
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

    // Success state - model loaded, show summary
    if (uploadStatus === 'success' && modelInfo) {
        return (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <FileCheck className="w-5 h-5 text-emerald-400" />
                        <span className="text-sm font-medium text-emerald-400">Model Imported</span>
                    </div>
                    <button
                        onClick={handleReset}
                        className="p-1 rounded hover:bg-emerald-500/20 transition-colors"
                    >
                        <X className="w-4 h-4 text-emerald-400" />
                    </button>
                </div>
                <div className="space-y-2 text-xs">
                    <p className="text-zinc-400 truncate">{onnxFileName}</p>
                    {dataFileName && (
                        <p className="text-zinc-500 truncate">+ {dataFileName}</p>
                    )}
                    <div className="flex justify-between text-zinc-500 pt-2 border-t border-emerald-500/20">
                        <span>Layers:</span>
                        <span className="text-emerald-400">{modelInfo.layers?.length || 0}</span>
                    </div>
                    <div className="flex justify-between text-zinc-500">
                        <span>Parameters:</span>
                        <span className="text-violet-400 font-mono">
                            {(modelInfo.total_parameters || 0).toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (uploadStatus === 'error') {
        return (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-red-400" />
                        <span className="text-sm font-medium text-red-400">Import Failed</span>
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
            <div className="p-6 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
                    <span className="text-sm text-zinc-400">Importing model...</span>
                </div>
            </div>
        );
    }

    // Pending state - Files selected, ready to upload
    if (pendingOnnxFile) {
        return (
            <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50 space-y-3">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-500/10 border border-violet-500/30">
                    <FileCode className="w-5 h-5 text-violet-400" />
                    <span className="text-sm text-violet-300 truncate flex-1">{pendingOnnxFile.name}</span>
                </div>

                {pendingDataFile ? (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
                        <Database className="w-5 h-5 text-amber-400" />
                        <span className="text-sm text-amber-300 truncate flex-1">{pendingDataFile.name}</span>
                        <button
                            onClick={() => setPendingDataFile(null)}
                            className="p-0.5 rounded hover:bg-amber-500/20"
                        >
                            <X className="w-4 h-4 text-amber-400" />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => dataInputRef.current?.click()}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg 
                                   border border-dashed border-zinc-600 text-zinc-500 hover:border-zinc-500 
                                   hover:text-zinc-400 transition-colors text-sm"
                    >
                        <Database className="w-4 h-4" />
                        Add .data file (optional)
                    </button>
                )}

                <input
                    ref={dataInputRef}
                    type="file"
                    accept=".data"
                    onChange={handleDataSelect}
                    className="hidden"
                />

                <div className="flex gap-2 pt-2">
                    <button
                        onClick={handleReset}
                        className="flex-1 py-2.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleUpload}
                        className="flex-1 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 
                                   text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        Import Model
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        );
    }

    // Idle state - Drop zone
    return (
        <label
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
                block p-8 rounded-xl border-2 border-dashed cursor-pointer
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
            <div className="flex flex-col items-center gap-3 text-center">
                <div className={`
                    w-12 h-12 rounded-xl flex items-center justify-center
                    ${isDragging ? 'bg-violet-500/20' : 'bg-zinc-800'}
                    transition-colors
                `}>
                    <Upload
                        className={`w-6 h-6 ${isDragging ? 'text-violet-400' : 'text-zinc-500'}`}
                    />
                </div>
                <div>
                    <p className="text-sm text-zinc-300 mb-1">
                        {isDragging ? 'Drop files here' : 'Upload ONNX Model'}
                    </p>
                    <p className="text-xs text-zinc-600">.onnx + .data (optional)</p>
                </div>
            </div>
        </label>
    );
}
