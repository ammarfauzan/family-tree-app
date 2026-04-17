import { useCallback, useEffect, useRef, useState } from 'react';
import { 
  ReactFlow, 
  Controls, 
  Background, 
  MiniMap, 
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  Handle,
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import html2canvas from 'html2canvas';
import dagre from 'dagre';

// --- DAGRE AUTO LAYOUT ---
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const getLayoutedElements = (nodes, edges, direction = 'TB') => {
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 180, height: 100 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.position = {
      x: nodeWithPosition.x - 90,
      y: nodeWithPosition.y - 50,
    };
    return node;
  });

  return { nodes, edges };
};

// --- CUSTOM NODE VISUALS ---
function PersonNode({ data }) {
  const { person, isCurrentUser } = data;
  const isDeceased = person.is_deceased;
  
  const yearBorn = person.birth_date ? person.birth_date.slice(0, 4) : null;
  const yearDied = person.death_date ? person.death_date.slice(0, 4) : null;
  const lifespan = yearBorn ? (yearDied ? `${yearBorn} - ${yearDied}` : `b. ${yearBorn}`) : '';

  const avatarSeed = encodeURIComponent(person.full_name);
  const dicebearUrl = `https://api.dicebear.com/8.x/lorelei/svg?seed=${avatarSeed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
  const avatarSrc = person.profile_photo || dicebearUrl;

  return (
    <>
      <Handle type="target" position={Position.Top} className="!w-4 !h-1 !bg-transparent border-none" />
      <div 
        className={`w-[170px] p-4 flex flex-col items-center justify-center text-center rounded-2xl bg-white dark:bg-slate-800 shadow-xl border-2 transition-all hover:-translate-y-1 cursor-pointer
          ${isCurrentUser ? 'border-indigo-500 shadow-indigo-500/20' : 'border-slate-100 dark:border-slate-700 shadow-slate-200/50 dark:shadow-black/20'}
          ${isDeceased ? 'opacity-80 grayscale' : ''}
        `}
      >
        <div className="relative mb-3">
          <img 
            src={avatarSrc} 
            alt={person.full_name} 
            className={`w-14 h-14 rounded-full object-cover border-2 ${isCurrentUser ? 'border-indigo-500' : isDeceased ? 'border-slate-400' : 'border-slate-200 dark:border-slate-600'}`} 
          />
          {isDeceased && (
            <span className="absolute -top-1 -right-1 text-base leading-none bg-slate-800 rounded-full" title="Deceased">
              🕊️
            </span>
          )}
        </div>
        <h3 className="font-semibold text-sm text-slate-900 dark:text-white leading-tight line-clamp-2">
          {person.full_name}
        </h3>
        {lifespan && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{lifespan}</p>}
      </div>
      <Handle type="source" position={Position.Bottom} className="!w-4 !h-1 !bg-transparent border-none" />
    </>
  );
}

const nodeTypes = { personNode: PersonNode };

// --- MAIN COMPONENT ---
export function TreeVisualization({ persons, relationships, treeId, currentUserId, navigate }) {
  const containerRef = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!persons.length) return;

    // 1. Build Initial Nodes
    const initialNodes = persons.map((p) => ({
      id: p.id,
      type: 'personNode',
      position: { x: 0, y: 0 },
      data: { person: p, isCurrentUser: currentUserId === p.linked_user_id },
    }));

    // 2. Build DAG Edges (Using proper directed parent-to-child flow)
    const initialEdges = [];
    const edgeSet = new Set();
    
    relationships.forEach(rel => {
      let source, target;
      if (rel.relation_type === 'parent') {
        source = rel.person_a_id;
        target = rel.person_b_id;
      } else if (rel.relation_type === 'child') {
        source = rel.person_b_id;
        target = rel.person_a_id;
      } else {
        // We skip processing spouse edges explicitly for basic auto-layout,
        // but DAGRE will properly connect children who simply have two different parents!
        return; 
      }

      const edgeId = `e-${source}-${target}`;
      if (!edgeSet.has(edgeId) && source && target) {
        edgeSet.add(edgeId);
        initialEdges.push({
          id: edgeId,
          source,
          target,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#818cf8', strokeWidth: 2, opacity: 0.8 }
        });
      }
    });

    // 3. Apply Dagre Auto-layout
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(initialNodes, initialEdges, 'TB');
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [persons, relationships, currentUserId, setNodes, setEdges]);

  // Handle Export PNG
  const handleExport = useCallback(async () => {
    if (!containerRef.current) return;
    setExporting(true);
    try {
      // Small timeout to allow ReactFlow to settle if needed
      await new Promise(r => setTimeout(r, 100)); 
      
      const canvas = await html2canvas(containerRef.current, {
        backgroundColor: '#f8fafc',
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = 'family-tree.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      setExporting(false);
    }
  }, []);

  if (!nodes.length) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-3 text-center">
        <div className="text-5xl">🌱</div>
        <p className="text-slate-600 dark:text-slate-400 text-sm">Add members to see the family tree</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-end mb-4 flex-wrap gap-2">
        <button
          onClick={handleExport}
          disabled={exporting}
          className="btn-secondary text-xs py-1.5 px-3 border-slate-300"
        >
          {exporting ? 'Exporting…' : '⬇ Export PNG'}
        </button>
      </div>

      <div
        ref={containerRef}
        className="w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
        style={{ height: '600px' }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          onNodeClick={(e, node) => navigate(`/trees/${treeId}/members/${node.id}`)}
          fitView
          minZoom={0.1}
          maxZoom={2}
          attributionPosition="bottom-right"
        >
          {/* Brighter, fun background: light mode gets polka dots on white/slate-50, dark gets them on dark blue/slate */}
          <Background 
            variant={BackgroundVariant.Dots} 
            gap={20} 
            size={3} 
            color="#cbd5e1" 
            className="bg-slate-50 dark:bg-slate-900"
          />
          <Controls className="bg-white dark:bg-slate-800 shadow border border-slate-200 dark:border-slate-700" />
          <MiniMap 
            nodeColor={(n) => n.data.isCurrentUser ? '#6366f1' : '#cbd5e1'}
            maskColor="rgba(240, 246, 255, 0.4)"
            className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden" 
          />
        </ReactFlow>
      </div>

      <div className="flex items-center justify-center gap-3 mt-3">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          🖱️ Scroll to zoom &nbsp;·&nbsp; ✋ Drag to pan &nbsp;·&nbsp; 👆 Click a node to view profile
        </p>
      </div>
    </div>
  );
}
