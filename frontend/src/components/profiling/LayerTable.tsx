'use client';

import { LayerProfile } from '@/store/profilingStore';

function formatBytes(bytes: number): string {
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)}MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${bytes}B`;
}

function formatNumber(num: number): string {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
}

interface LayerTableProps {
    layers: LayerProfile[];
}

export function LayerTable({ layers }: LayerTableProps) {
    if (layers.length === 0) {
        return (
            <div className="text-center py-6 text-zinc-500 text-xs">
                No layers to display
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-xs">
                <thead>
                    <tr className="border-b border-zinc-800">
                        <th className="text-left py-2 px-2 font-medium text-zinc-500 uppercase tracking-wider">
                            Layer
                        </th>
                        <th className="text-left py-2 px-2 font-medium text-zinc-500 uppercase tracking-wider">
                            Type
                        </th>
                        <th className="text-left py-2 px-2 font-medium text-zinc-500 uppercase tracking-wider">
                            Shape
                        </th>
                        <th className="text-right py-2 px-2 font-medium text-zinc-500 uppercase tracking-wider">
                            Params
                        </th>
                        <th className="text-right py-2 px-2 font-medium text-zinc-500 uppercase tracking-wider">
                            Usage
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {layers.map((layer, index) => (
                        <tr
                            key={layer.name}
                            className={`
                                border-b border-zinc-800/50 
                                hover:bg-zinc-800/30 transition-colors
                                ${index % 2 === 0 ? 'bg-zinc-900/30' : ''}
                            `}
                        >
                            <td className="py-2 px-2 font-mono text-zinc-300">
                                {layer.name}
                            </td>
                            <td className="py-2 px-2 text-violet-400">
                                {layer.type}
                            </td>
                            <td className="py-2 px-2 font-mono text-zinc-400">
                                {layer.shape}
                            </td>
                            <td className="py-2 px-2 text-right font-mono text-zinc-400">
                                {formatNumber(layer.paramCount)}
                            </td>
                            <td className="py-2 px-2 text-right font-mono text-emerald-400">
                                {formatBytes(layer.usage)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
