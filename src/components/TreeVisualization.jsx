import { useCallback, useMemo, useRef, useState } from 'react';
import Tree from 'react-d3-tree';
import html2canvas from 'html2canvas';

/**
 * Converts flat persons + relationships arrays into a nested tree structure
 * expected by react-d3-tree.
 *
 * Strategy:
 * 1. Find root persons — those who have no "child" relationship (no one claims them as a child)
 * 2. Recursively build children from "parent → child" edges
 * 3. If no roots found, use the first person as a fallback
 */
function buildTree(persons, relationships, currentUserId) {
  if (!persons.length) return null;

  // Build adjacency: parentId → [childIds]
  const childrenOf = {};
  const hasParent = new Set();

  relationships.forEach((rel) => {
    if (rel.relation_type === 'parent') {
      // person_a is parent of person_b
      if (!childrenOf[rel.person_a_id]) childrenOf[rel.person_a_id] = [];
      childrenOf[rel.person_a_id].push(rel.person_b_id);
      hasParent.add(rel.person_b_id);
    } else if (rel.relation_type === 'child') {
      // person_a is child of person_b → person_b is parent of person_a
      if (!childrenOf[rel.person_b_id]) childrenOf[rel.person_b_id] = [];
      childrenOf[rel.person_b_id].push(rel.person_a_id);
      hasParent.add(rel.person_a_id);
    }
  });

  const personMap = Object.fromEntries(persons.map((p) => [p.id, p]));
  const visited = new Set();

  function buildNode(personId) {
    if (visited.has(personId)) return null;
    visited.add(personId);
    const person = personMap[personId];
    if (!person) return null;

    const initials = person.full_name
      .split(' ')
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

    const yearBorn = person.birth_date ? person.birth_date.slice(0, 4) : null;
    const yearDied = person.death_date ? person.death_date.slice(0, 4) : null;
    const lifespan = yearBorn
      ? yearDied
        ? `${yearBorn}–${yearDied}`
        : `b. ${yearBorn}`
      : '';

    const kids = (childrenOf[personId] || [])
      .map((cid) => buildNode(cid))
      .filter(Boolean);

    return {
      name: person.full_name,
      attributes: {
        lifespan,
        isDeceased: person.is_deceased,
        isCurrentUser: person.linked_user_id === currentUserId,
        initials,
        profilePhoto: person.profile_photo || null,
        personId,
      },
      children: kids,
    };
  }

  // Roots: persons with no parent relationship
  const roots = persons
    .filter((p) => !hasParent.has(p.id))
    .map((p) => buildNode(p.id))
    .filter(Boolean);

  if (roots.length === 0) {
    // Fallback: use first person
    const node = buildNode(persons[0].id);
    return node;
  }
  if (roots.length === 1) return roots[0];

  // Multiple roots — wrap in a virtual root
  return {
    name: 'Family',
    attributes: { initials: '🌳', isRoot: true, personId: null },
    children: roots,
  };
}

/** Custom SVG node rendered at each tree position */
function CustomNode({ nodeDatum, onNodeClick, toggleNode }) {
  const { name, attributes = {} } = nodeDatum;
  const { initials, lifespan, isDeceased, isCurrentUser, isRoot, personId } = attributes;

  const size = 36;
  const r = size / 2;

  if (isRoot) {
    return (
      <g onClick={toggleNode} style={{ cursor: 'pointer' }}>
        <text textAnchor="middle" y={4} fontSize={28}>🌳</text>
      </g>
    );
  }

  const avatarColor = isCurrentUser ? '#7c3aed' : isDeceased ? '#64748b' : '#6366f1';
  const borderColor = isCurrentUser ? '#a78bfa' : isDeceased ? '#94a3b8' : '#818cf8';

  return (
    <g
      onClick={() => personId && onNodeClick(personId)}
      style={{ cursor: personId ? 'pointer' : 'default' }}
    >
      {/* Glow ring for current user */}
      {isCurrentUser && (
        <circle r={r + 6} fill="none" stroke="#7c3aed" strokeWidth={2} strokeDasharray="4 2" opacity={0.7} />
      )}

      {/* Avatar circle */}
      <circle r={r} fill={avatarColor} stroke={borderColor} strokeWidth={2} />

      {/* Initials or photo (SVG can't render img natively in react-d3-tree easily) */}
      <text
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fontWeight="700"
        fill="white"
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {initials}
      </text>

      {/* Deceased cross */}
      {isDeceased && (
        <text x={r + 2} y={-r + 2} fontSize={10} className="fill-slate-500 dark:fill-slate-400">†</text>
      )}

      <text
        textAnchor="middle"
        y={r + 16}
        fontSize={11}
        fontWeight="600"
        className={isDeceased ? "fill-slate-500 dark:fill-slate-400" : "fill-slate-900 dark:fill-slate-100"}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {name.length > 18 ? name.slice(0, 17) + '…' : name}
      </text>

      {/* Lifespan */}
      {lifespan && (
        <text
          textAnchor="middle"
          y={r + 29}
          fontSize={9}
          className="fill-slate-500 dark:fill-slate-400"
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {lifespan}
        </text>
      )}
    </g>
  );
}

/** Side panel shown when a node is clicked */
function MemberPanel({ persons, personId, treeId, onClose, navigate }) {
  const person = persons.find((p) => p.id === personId);
  if (!person) return null;

  const initials = person.full_name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="absolute top-4 right-4 w-72 z-10 animate-fade-in">
      <div className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-900/80 to-slate-900 p-4 flex items-center gap-3">
          {person.profile_photo ? (
            <img
              src={person.profile_photo}
              alt={person.full_name}
              className={`w-12 h-12 rounded-full object-cover ring-2 ring-slate-300 dark:ring-slate-700 flex-shrink-0 ${person.is_deceased ? 'grayscale opacity-70' : ''}`}
            />
          ) : (
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-slate-900 dark:text-white font-bold flex-shrink-0 ${person.is_deceased ? 'bg-slate-300 dark:bg-slate-600' : 'bg-brand-700'}`}>
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900 dark:text-white text-sm leading-tight">{person.full_name}</p>
            {person.nickname && <p className="text-slate-600 dark:text-slate-400 text-xs italic">"{person.nickname}"</p>}
            {person.is_deceased && (
              <span className="badge bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 text-[10px] mt-0.5">† Deceased</span>
            )}
          </div>
          <button onClick={onClose} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors text-lg leading-none ml-1">×</button>
        </div>

        {/* Details */}
        <div className="p-4 space-y-2 text-xs">
          {person.occupation && (
            <p className="text-slate-600 dark:text-slate-400"><span className="text-slate-600">💼</span> {person.occupation}</p>
          )}
          {person.birth_date && (
            <p className="text-slate-600 dark:text-slate-400"><span className="text-slate-600">🎂</span> {person.birth_date}</p>
          )}
          {person.birth_place && (
            <p className="text-slate-600 dark:text-slate-400"><span className="text-slate-600">📍</span> {person.birth_place}</p>
          )}
          {person.death_date && (
            <p className="text-slate-600 dark:text-slate-400"><span className="text-slate-600">🕊️</span> {person.death_date}</p>
          )}
          {person.biography && (
            <p className="text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed mt-1">{person.biography}</p>
          )}
        </div>

        <div className="px-4 pb-4">
          <button
            onClick={() => navigate(`/trees/${treeId}/members/${personId}`)}
            className="btn-primary w-full text-xs py-2"
          >
            View Full Profile →
          </button>
        </div>
      </div>
    </div>
  );
}

export function TreeVisualization({ persons, relationships, treeId, currentUserId, navigate }) {
  const containerRef = useRef(null);
  const [selectedPersonId, setSelectedPersonId] = useState(null);
  const [orientation, setOrientation] = useState('vertical'); // vertical = top-down
  const [exporting, setExporting] = useState(false);

  const treeData = useMemo(() => {
    return buildTree(persons, relationships, currentUserId);
  }, [persons, relationships, currentUserId]);

  const handleExport = useCallback(async () => {
    if (!containerRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(containerRef.current, {
        backgroundColor: '#ffffff', // clear/white background requested by user
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

  if (!treeData) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-3 text-center">
        <div className="text-5xl">🌱</div>
        <p className="text-slate-600 dark:text-slate-400 text-sm">Add members to see the family tree</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Controls */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex gap-2">
          <button
            onClick={() => setOrientation((o) => (o === 'vertical' ? 'horizontal' : 'vertical'))}
            className="btn-secondary text-xs py-1.5 px-3"
          >
            {orientation === 'vertical' ? '↔ Horizontal' : '↕ Vertical'}
          </button>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="btn-secondary text-xs py-1.5 px-3"
        >
          {exporting ? 'Exporting…' : '⬇ Export PNG'}
        </button>
      </div>

      {/* Tree canvas */}
      <div
        ref={containerRef}
        className="w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
        style={{ height: '520px' }}
        id="tree-canvas"
      >
        <Tree
          data={treeData}
          orientation={orientation}
          pathFunc="step"
          translate={
            orientation === 'vertical'
              ? { x: typeof window !== 'undefined' ? window.innerWidth / 2 - 100 : 400, y: 60 }
              : { x: 80, y: 200 }
          }
          nodeSize={{ x: 160, y: 110 }}
          separation={{ siblings: 1.2, nonSiblings: 1.5 }}
          renderCustomNodeElement={(rd3tProps) => (
            <CustomNode
              {...rd3tProps}
              onNodeClick={setSelectedPersonId}
            />
          )}
          pathClassFunc={() => 'stroke-slate-300 dark:stroke-slate-700 stroke-[1.5px] fill-none'}
          collapsible={true}
          zoomable={true}
          draggable={true}
          initialDepth={3}
        />
      </div>

      {/* Side panel */}
      {selectedPersonId && (
        <MemberPanel
          persons={persons}
          personId={selectedPersonId}
          treeId={treeId}
          onClose={() => setSelectedPersonId(null)}
          navigate={navigate}
        />
      )}

      <p className="text-xs text-slate-600 mt-2 text-center">
        Scroll to zoom · Drag to pan · Click a node to preview
      </p>
    </div>
  );
}
