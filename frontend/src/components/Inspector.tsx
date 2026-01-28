'use client';

import { Settings2 } from 'lucide-react';
import { useGraphStore, NodeData } from '@/store/graphStore';

export function Inspector() {
    const { nodes, selectedNodeId, updateNodeData } = useGraphStore();

    const selectedNode = nodes.find((n) => n.id === selectedNodeId);
    const data = selectedNode?.data as NodeData | undefined;

    if (!selectedNode || !data) {
        return (
            <div className="p-4 text-center">
                <Settings2 className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                <p className="text-sm text-zinc-500">Select a node to inspect</p>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-4">
            <div>
                <label className="text-xs text-zinc-500 uppercase tracking-wider">Node ID</label>
                <div className="mt-1 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-300 font-mono">
                    {selectedNode.id}
                </div>
            </div>

            <div>
                <label className="text-xs text-zinc-500 uppercase tracking-wider">Type</label>
                <div className="mt-1 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-300 capitalize">
                    {data.type || selectedNode.type}
                </div>
            </div>

            {data.shape !== undefined && (
                <div>
                    <label className="text-xs text-zinc-500 uppercase tracking-wider">Shape</label>
                    <input
                        type="text"
                        value={data.shape}
                        onChange={(e) =>
                            updateNodeData(selectedNode.id, { shape: e.target.value })
                        }
                        className="mt-1 w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 
                       text-sm text-zinc-300 font-mono focus:outline-none focus:border-violet-500"
                    />
                </div>
            )}

            {data.units !== undefined && (
                <div>
                    <label className="text-xs text-zinc-500 uppercase tracking-wider">Neurons</label>
                    <input
                        type="number"
                        value={data.units}
                        onChange={(e) =>
                            updateNodeData(selectedNode.id, { units: parseInt(e.target.value) || 0 })
                        }
                        className="mt-1 w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 
                       text-sm text-violet-400 font-mono focus:outline-none focus:border-violet-500"
                    />
                </div>
            )}

            {data.kernelSize !== undefined && (
                <div>
                    <label className="text-xs text-zinc-500 uppercase tracking-wider">Kernel Size</label>
                    <input
                        type="number"
                        value={data.kernelSize}
                        onChange={(e) =>
                            updateNodeData(selectedNode.id, { kernelSize: parseInt(e.target.value) || 0 })
                        }
                        className="mt-1 w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 
                       text-sm text-violet-400 font-mono focus:outline-none focus:border-violet-500"
                    />
                </div>
            )}

            {data.classes !== undefined && (
                <div>
                    <label className="text-xs text-zinc-500 uppercase tracking-wider">Classes</label>
                    <input
                        type="number"
                        value={data.classes}
                        onChange={(e) =>
                            updateNodeData(selectedNode.id, { classes: parseInt(e.target.value) || 0 })
                        }
                        className="mt-1 w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 
                       text-sm text-orange-400 font-mono focus:outline-none focus:border-violet-500"
                    />
                </div>
            )}

            {data.activation && (
                <div>
                    <label className="text-xs text-zinc-500 uppercase tracking-wider">Activation</label>
                    <select
                        value={data.activation}
                        onChange={(e) =>
                            updateNodeData(selectedNode.id, { activation: e.target.value })
                        }
                        className="mt-1 w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 
                       text-sm text-amber-400 focus:outline-none focus:border-violet-500"
                    >
                        <option value="relu">ReLU</option>
                        <option value="sigmoid">Sigmoid</option>
                        <option value="tanh">Tanh</option>
                        <option value="softmax">Softmax</option>
                    </select>
                </div>
            )}
        </div>
    );
}
