'use client';

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Code2, Copy, Check } from 'lucide-react';
import { useGraphStore } from '@/store/graphStore';
import { useState } from 'react';

export function CodePreview() {
    const { generatedCode } = useGraphStore();
    const [copied, setCopied] = useState(false);

    const copyToClipboard = async () => {
        if (generatedCode) {
            await navigator.clipboard.writeText(generatedCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (!generatedCode) {
        return (
            <div className="p-4 text-center">
                <Code2 className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                <p className="text-sm text-zinc-500">Click &quot;Compile&quot; to generate C code</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
                <span className="text-xs text-zinc-500 font-mono">output.c</span>
                <button
                    onClick={copyToClipboard}
                    className="p-1.5 rounded-md hover:bg-zinc-700/50 transition-colors"
                >
                    {copied ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                        <Copy className="w-4 h-4 text-zinc-500" />
                    )}
                </button>
            </div>
            <div className="flex-1 overflow-auto">
                <SyntaxHighlighter
                    language="c"
                    style={oneDark}
                    customStyle={{
                        margin: 0,
                        padding: '1rem',
                        background: 'transparent',
                        fontSize: '0.8rem',
                    }}
                    showLineNumbers
                >
                    {generatedCode}
                </SyntaxHighlighter>
            </div>
        </div>
    );
}
