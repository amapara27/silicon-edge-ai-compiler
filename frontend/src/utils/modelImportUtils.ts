import { Node, Edge } from '@xyflow/react';
import { NodeData } from '@/store/graphStore';
import { LayerInfo, ModelInfo } from '@/store/uploadStore';

// Map ONNX operators to React Flow node types and labels
const OP_TYPE_MAP: Record<string, { nodeType: string; label: string; type: NodeData['type'] }> = {
    // Input/Output
    'Input': { nodeType: 'inputNode', label: 'Input', type: 'input' },

    // Dense/Linear layers
    'Gemm': { nodeType: 'layerNode', label: 'Dense', type: 'dense' },
    'MatMul': { nodeType: 'layerNode', label: 'Dense', type: 'dense' },

    // Convolution
    'Conv': { nodeType: 'layerNode', label: 'Conv2D', type: 'conv2d' },

    // Activations
    'Relu': { nodeType: 'layerNode', label: 'ReLU', type: 'relu' },
    'Sigmoid': { nodeType: 'layerNode', label: 'Sigmoid', type: 'relu' },
    'Tanh': { nodeType: 'layerNode', label: 'Tanh', type: 'relu' },
    'Softmax': { nodeType: 'layerNode', label: 'Softmax', type: 'softmax' },

    // Normalization & Pooling
    'BatchNormalization': { nodeType: 'layerNode', label: 'BatchNorm', type: 'dense' },
    'MaxPool': { nodeType: 'layerNode', label: 'MaxPool', type: 'dense' },
    'AveragePool': { nodeType: 'layerNode', label: 'AvgPool', type: 'dense' },
    'GlobalAveragePool': { nodeType: 'layerNode', label: 'GlobalAvgPool', type: 'dense' },

    // Other common ops
    'Flatten': { nodeType: 'layerNode', label: 'Flatten', type: 'dense' },
    'Dropout': { nodeType: 'layerNode', label: 'Dropout', type: 'dense' },
    'Add': { nodeType: 'layerNode', label: 'Add', type: 'dense' },
    'Concat': { nodeType: 'layerNode', label: 'Concat', type: 'dense' },
    'Reshape': { nodeType: 'layerNode', label: 'Reshape', type: 'dense' },
};

const DEFAULT_OP = { nodeType: 'layerNode', label: 'Layer', type: 'dense' as const };

/**
 * Convert model layers from API response to React Flow nodes
 */
export function layersToNodes(modelInfo: ModelInfo): Node<NodeData>[] {
    const nodes: Node<NodeData>[] = [];
    const horizontalSpacing = 250;
    const verticalCenter = 200;

    // Create input node from model inputs
    if (modelInfo.inputs.length > 0) {
        const input = modelInfo.inputs[0];
        nodes.push({
            id: 'input-0',
            type: 'inputNode',
            position: { x: 100, y: verticalCenter },
            data: {
                label: 'Input',
                type: 'input',
                shape: input.shape.join(', '),
            },
        });
    }

    // Create layer nodes from model layers
    modelInfo.layers.forEach((layer, idx) => {
        const opInfo = OP_TYPE_MAP[layer.op_type] || DEFAULT_OP;

        nodes.push({
            id: `layer-${idx}`,
            type: opInfo.nodeType,
            position: {
                x: 100 + horizontalSpacing * (idx + 1),
                y: verticalCenter + (idx % 2 === 0 ? 0 : 50) // Slight vertical offset for visual interest
            },
            data: {
                label: opInfo.label,
                type: opInfo.type,
                inputShape: layer.input_shape,
                outputShape: layer.output_shape,
                params: layer.params && layer.params > 0 ? layer.params : undefined,
            },
        });
    });

    // Create output node from model outputs
    if (modelInfo.outputs.length > 0) {
        const output = modelInfo.outputs[0];
        const outputClasses = typeof output.shape[output.shape.length - 1] === 'number'
            ? output.shape[output.shape.length - 1] as number
            : 10;

        nodes.push({
            id: 'output-0',
            type: 'outputNode',
            position: {
                x: 100 + horizontalSpacing * (modelInfo.layers.length + 1),
                y: verticalCenter
            },
            data: {
                label: 'Output',
                type: 'output',
                classes: outputClasses,
            },
        });
    }

    return nodes;
}

/**
 * Create edges between nodes based on layer order (sequential connection)
 */
export function createEdgesFromNodes(nodes: Node<NodeData>[]): Edge[] {
    const edges: Edge[] = [];

    for (let i = 0; i < nodes.length - 1; i++) {
        edges.push({
            id: `e-${nodes[i].id}-${nodes[i + 1].id}`,
            source: nodes[i].id,
            target: nodes[i + 1].id,
            animated: true,
        });
    }

    return edges;
}

/**
 * Convert model info to React Flow nodes and edges
 */
export function modelInfoToGraph(modelInfo: ModelInfo): { nodes: Node<NodeData>[]; edges: Edge[] } {
    const nodes = layersToNodes(modelInfo);
    const edges = createEdgesFromNodes(nodes);

    return { nodes, edges };
}
