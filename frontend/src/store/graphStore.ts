import { create } from 'zustand';
import {
    Node,
    Edge,
    OnNodesChange,
    OnEdgesChange,
    applyNodeChanges,
    applyEdgeChanges,
    Connection,
    addEdge,
} from '@xyflow/react';

export type TargetChip = 'STM32F401' | 'ESP32';

export interface NodeData {
    [key: string]: unknown;
    label: string;
    type?: 'input' | 'dense' | 'conv2d' | 'relu' | 'softmax' | 'output';
    shape?: string;
    units?: number;
    kernelSize?: number;
    activation?: string;
    classes?: number;
}

interface GraphState {
    nodes: Node<NodeData>[];
    edges: Edge[];
    selectedNodeId: string | null;
    targetChip: TargetChip;
    generatedCode: string;

    onNodesChange: OnNodesChange<Node<NodeData>>;
    onEdgesChange: OnEdgesChange;
    onConnect: (connection: Connection) => void;
    addNode: (node: Node<NodeData>) => void;
    setSelectedNode: (nodeId: string | null) => void;
    updateNodeData: (nodeId: string, data: Partial<NodeData>) => void;
    setTargetChip: (chip: TargetChip) => void;
    compile: () => void;
    setNodes: (nodes: Node<NodeData>[]) => void;
    setEdges: (edges: Edge[]) => void;
    clearGraph: () => void;
}

// Initial placeholder network
const initialNodes: Node<NodeData>[] = [
    {
        id: '1',
        type: 'inputNode',
        position: { x: 100, y: 200 },
        data: { label: 'Input', type: 'input', shape: '1, 28, 28' },
    },
    {
        id: '2',
        type: 'layerNode',
        position: { x: 350, y: 150 },
        data: { label: 'Dense', type: 'dense', units: 128, activation: 'relu' },
    },
    {
        id: '3',
        type: 'layerNode',
        position: { x: 600, y: 200 },
        data: { label: 'ReLU', type: 'relu' },
    },
    {
        id: '4',
        type: 'outputNode',
        position: { x: 850, y: 200 },
        data: { label: 'Output', type: 'output', classes: 10 },
    },
];

const initialEdges: Edge[] = [
    { id: 'e1-2', source: '1', target: '2', animated: true },
    { id: 'e2-3', source: '2', target: '3', animated: true },
    { id: 'e3-4', source: '3', target: '4', animated: true },
];

const generatePlaceholderCode = (nodes: Node<NodeData>[], targetChip: TargetChip) => {
    const layerCode = nodes.map((node, index) => {
        const data = node.data;
        switch (data.type) {
            case 'input':
                return `  // Layer ${index}: Input [${data.shape}]
  float input[${data.shape?.split(',').map(s => s.trim()).join('][')}];`;
            case 'dense':
                return `  // Layer ${index}: Dense (${data.units} units, ${data.activation})
  dense_layer(&layer${index}, input, ${data.units});`;
            case 'relu':
                return `  // Layer ${index}: ReLU Activation
  relu_activation(&layer${index});`;
            case 'conv2d':
                return `  // Layer ${index}: Conv2D (kernel: ${data.kernelSize}x${data.kernelSize})
  conv2d_layer(&layer${index}, input, ${data.kernelSize});`;
            case 'softmax':
                return `  // Layer ${index}: Softmax
  softmax_activation(&layer${index});`;
            case 'output':
                return `  // Layer ${index}: Output (${data.classes} classes)
  float output[${data.classes}];`;
            default:
                return `  // Layer ${index}: Unknown`;
        }
    }).join('\n\n');

    return `/**
 * Silicon Neural Network - Generated C Code
 * Target: ${targetChip}
 * Generated: ${new Date().toISOString()}
 */

#include "silicon_nn.h"
#include "${targetChip.toLowerCase()}_hal.h"

void neural_network_init(void) {
  // Initialize hardware
  ${targetChip}_init();
  
  // Allocate layer buffers
  nn_allocate_buffers();
}

void neural_network_forward(void) {
${layerCode}
}

int main(void) {
  neural_network_init();
  
  while(1) {
    neural_network_forward();
    delay_ms(100);
  }
  
  return 0;
}`;
};

export const useGraphStore = create<GraphState>((set, get) => ({
    nodes: initialNodes,
    edges: initialEdges,
    selectedNodeId: null,
    targetChip: 'STM32F401',
    generatedCode: '',

    onNodesChange: (changes) => {
        set({
            nodes: applyNodeChanges(changes, get().nodes),
        });
    },

    onEdgesChange: (changes) => {
        set({
            edges: applyEdgeChanges(changes, get().edges),
        });
    },

    onConnect: (connection) => {
        set({
            edges: addEdge({ ...connection, animated: true }, get().edges),
        });
    },

    addNode: (node) => {
        set({
            nodes: [...get().nodes, node],
        });
    },

    setSelectedNode: (nodeId) => {
        set({ selectedNodeId: nodeId });
    },

    updateNodeData: (nodeId, data) => {
        set({
            nodes: get().nodes.map((node) =>
                node.id === nodeId
                    ? { ...node, data: { ...node.data, ...data } }
                    : node
            ),
        });
    },

    setTargetChip: (chip) => {
        set({ targetChip: chip });
    },

    compile: () => {
        const { nodes, targetChip } = get();
        const code = generatePlaceholderCode(nodes, targetChip);
        set({ generatedCode: code });
    },

    setNodes: (nodes) => {
        set({ nodes });
    },

    setEdges: (edges) => {
        set({ edges });
    },

    clearGraph: () => {
        set({ nodes: [], edges: [], selectedNodeId: null, generatedCode: '' });
    },
}));

