'use client';

import { useCallback, useRef, DragEvent } from 'react';
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useGraphStore, NodeData } from '@/store/graphStore';
import { useAppStore } from '@/store/appStore';
import { InputNode, LayerNode, OutputNode } from '@/components/nodes';
import { Sidebar } from '@/components/Sidebar';
import { Inspector } from '@/components/Inspector';
import { CodePreview } from '@/components/CodePreview';
import { LandingPage } from '@/components/LandingPage';
import { Settings2, Code2, ChevronLeft, ChevronRight, Home as HomeIcon } from 'lucide-react';
import { useState, useEffect } from 'react';

const nodeTypes = {
  inputNode: InputNode,
  layerNode: LayerNode,
  outputNode: OutputNode,
};

let nodeId = 10;

function Playground() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    setSelectedNode,
    clearGraph,
  } = useGraphStore();

  const { goToLanding, mode } = useAppStore();

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'inspector' | 'code'>('inspector');

  // Clear graph when entering build-new mode
  useEffect(() => {
    if (mode === 'build-new') {
      clearGraph();
    }
  }, [mode, clearGraph]);

  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const bounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!bounds) return;

      const position = {
        x: event.clientX - bounds.left - 100,
        y: event.clientY - bounds.top - 50,
      };

      let data: NodeData;
      switch (type) {
        case 'inputNode':
          data = { label: 'Input', type: 'input', shape: '1, 28, 28' };
          break;
        case 'layerNode':
          data = { label: 'Dense', type: 'dense', units: 128, activation: 'relu' };
          break;
        case 'outputNode':
          data = { label: 'Output', type: 'output', classes: 10 };
          break;
        default:
          data = { label: 'Node' };
      }

      const newNode: Node<NodeData> = {
        id: `${++nodeId}`,
        type,
        position,
        data,
      };

      addNode(newNode);
    },
    [addNode]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNode(node.id);
    },
    [setSelectedNode]
  );

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, [setSelectedNode]);

  return (
    <div className="flex h-screen bg-zinc-950 text-white">
      {/* Left Sidebar */}
      <Sidebar collapsed={!leftPanelOpen} onToggle={() => setLeftPanelOpen(!leftPanelOpen)} />

      {/* Center Canvas */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="h-11 bg-zinc-900/80 border-b border-zinc-800/50 flex items-center px-4">
          <button
            onClick={goToLanding}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors"
          >
            <HomeIcon className="w-3.5 h-3.5" />
            <span className="font-medium">Home</span>
          </button>
          <div className="ml-4 text-xs text-zinc-600 font-medium tracking-wide">
            {mode === 'build-new' && 'Building New Model'}
            {mode === 'import-existing' && 'Imported Model'}
          </div>
        </div>

        {/* Canvas */}
        <div ref={reactFlowWrapper} className="flex-1 relative" onDragOver={onDragOver} onDrop={onDrop}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            className="bg-zinc-950"
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={24}
              size={1}
              color="#27272a"
            />
            <Controls className="!bg-zinc-800/90 !border-zinc-700/50 !rounded-xl !shadow-lg [&>button]:!bg-transparent [&>button]:!border-zinc-700/50 [&>button]:!text-zinc-400 [&>button:hover]:!bg-zinc-700/50 [&>button:hover]:!text-zinc-200" />
            <MiniMap
              className="!bg-zinc-900/90 !border-zinc-800/50 !rounded-xl !shadow-lg"
              nodeColor={(node) => {
                switch (node.type) {
                  case 'inputNode':
                    return '#34d399';
                  case 'layerNode':
                    return '#94a3b8';
                  case 'outputNode':
                    return '#fb923c';
                  default:
                    return '#71717a';
                }
              }}
            />
          </ReactFlow>
        </div>
      </div>

      {/* Right Panel */}
      <div
        className={`
          relative bg-zinc-900/50 backdrop-blur-sm border-l border-zinc-800
          transition-all duration-300 ease-in-out
          ${rightPanelOpen ? 'w-80' : 'w-0'}
        `}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setRightPanelOpen(!rightPanelOpen)}
          className="
            absolute -left-3 top-1/2 -translate-y-1/2 z-10
            w-6 h-12 flex items-center justify-center
            bg-zinc-800 border border-zinc-700 rounded-l-lg
            hover:bg-zinc-700 transition-colors
          "
        >
          {rightPanelOpen ? (
            <ChevronRight className="w-4 h-4 text-zinc-400" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-zinc-400" />
          )}
        </button>

        {rightPanelOpen && (
          <div className="flex flex-col h-full w-80">
            {/* Tabs */}
            <div className="flex border-b border-zinc-800/50">
              <button
                onClick={() => setActiveTab('inspector')}
                className={`
                  flex-1 flex items-center justify-center gap-2 py-3
                  transition-colors text-xs font-medium tracking-wide
                  ${activeTab === 'inspector' ? 'text-violet-400 border-b-2 border-violet-400' : 'text-zinc-500 hover:text-zinc-300'}
                `}
              >
                <Settings2 className="w-3.5 h-3.5" />
                Inspector
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={`
                  flex-1 flex items-center justify-center gap-2 py-3
                  transition-colors text-xs font-medium tracking-wide
                  ${activeTab === 'code' ? 'text-violet-400 border-b-2 border-violet-400' : 'text-zinc-500 hover:text-zinc-300'}
                `}
              >
                <Code2 className="w-3.5 h-3.5" />
                Code
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-auto">
              {activeTab === 'inspector' ? <Inspector /> : <CodePreview />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const { mode } = useAppStore();

  // Show landing page or playground based on mode
  if (mode === 'landing') {
    return <LandingPage />;
  }

  return <Playground />;
}


