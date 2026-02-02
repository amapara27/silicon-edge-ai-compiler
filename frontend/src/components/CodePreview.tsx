'use client';

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Code2, Copy, Check, Download, FileCode, FileText } from 'lucide-react';
import { useUploadStore } from '@/store/uploadStore';
import { useGraphStore } from '@/store/graphStore';
import { useState } from 'react';

type CodeTab = 'source' | 'header';

export function CodePreview() {
    const { compiledSourceCode, compiledHeaderCode, compiledModelName, compileStatus, downloadCompiledFiles } = useUploadStore();
    const { targetChip } = useGraphStore();
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<CodeTab>('source');

    const getCurrentCode = () => {
        if (activeTab === 'source') return compiledSourceCode;
        return compiledHeaderCode;
    };

    const getFileName = () => {
        const name = compiledModelName || 'model';
        return activeTab === 'source' ? `${name}.c` : `${name}.h`;
    };

    const copyToClipboard = async () => {
        const code = getCurrentCode();
        if (code) {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleDownload = () => {
        const modelName = compiledModelName || 'model';
        downloadCompiledFiles(modelName, targetChip);
    };

    // Show placeholder when no code is compiled
    if (compileStatus !== 'success' || !compiledSourceCode) {
        return (
            <div className="p-4 text-center">
                <Code2 className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                <p className="text-sm text-zinc-500">Click &quot;Compile&quot; to generate C code</p>
                {compileStatus === 'error' && (
                    <p className="text-xs text-red-400 mt-2">Compilation failed. Make sure a model is loaded.</p>
                )}
            </div>
        );
    }

    const currentCode = getCurrentCode();

    return (
        <div className="flex flex-col h-full">
            {/* Tab Bar */}
            <div className="flex items-center border-b border-zinc-800">
                <button
                    onClick={() => setActiveTab('source')}
                    className={`
                        flex items-center gap-1.5 px-3 py-2 text-xs font-medium
                        transition-colors border-b-2
                        ${activeTab === 'source'
                            ? 'text-violet-400 border-violet-400'
                            : 'text-zinc-500 border-transparent hover:text-zinc-300'
                        }
                    `}
                >
                    <FileCode className="w-3 h-3" />
                    {compiledModelName || 'model'}.c
                </button>
                <button
                    onClick={() => setActiveTab('header')}
                    className={`
                        flex items-center gap-1.5 px-3 py-2 text-xs font-medium
                        transition-colors border-b-2
                        ${activeTab === 'header'
                            ? 'text-violet-400 border-violet-400'
                            : 'text-zinc-500 border-transparent hover:text-zinc-300'
                        }
                    `}
                >
                    <FileText className="w-3 h-3" />
                    {compiledModelName || 'model'}.h
                </button>

                {/* Actions */}
                <div className="ml-auto flex items-center gap-1 pr-2">
                    <button
                        onClick={copyToClipboard}
                        className="p-1.5 rounded-md hover:bg-zinc-700/50 transition-colors"
                        title="Copy to clipboard"
                    >
                        {copied ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                            <Copy className="w-4 h-4 text-zinc-500" />
                        )}
                    </button>
                    <button
                        onClick={handleDownload}
                        className="p-1.5 rounded-md hover:bg-zinc-700/50 transition-colors"
                        title="Download all files"
                    >
                        <Download className="w-4 h-4 text-zinc-500" />
                    </button>
                </div>
            </div>

            {/* Code Content */}
            <div className="flex-1 overflow-auto">
                <SyntaxHighlighter
                    language="c"
                    style={oneDark}
                    customStyle={{
                        margin: 0,
                        padding: '1rem',
                        background: 'transparent',
                        fontSize: '0.75rem',
                    }}
                    showLineNumbers
                >
                    {currentCode || '// No code generated'}
                </SyntaxHighlighter>
            </div>
        </div>
    );
}
