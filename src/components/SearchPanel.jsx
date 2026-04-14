import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';

/**
 * BFS to find the shortest relationship path between two persons.
 * Returns an array of steps: [{ personId, name, via }] or null if no path.
 */
function findRelationPath(fromId, toId, persons, relationships) {
  if (fromId === toId) return [];
  const personMap = Object.fromEntries(persons.map((p) => [p.id, p]));

  // Build adjacency: personId → [{ neighborId, relType }]
  const adj = {};
  persons.forEach((p) => { adj[p.id] = []; });
  relationships.forEach((r) => {
    if (adj[r.person_a_id]) adj[r.person_a_id].push({ id: r.person_b_id, type: r.relation_type, note: r.relation_note });
    if (adj[r.person_b_id]) adj[r.person_b_id].push({ id: r.person_a_id, type: r.relation_type, note: r.relation_note });
  });

  // BFS
  const visited = new Set([fromId]);
  const queue = [{ id: fromId, path: [{ personId: fromId, name: personMap[fromId]?.full_name, via: null }] }];

  while (queue.length) {
    const { id, path } = queue.shift();
    for (const neighbor of (adj[id] || [])) {
      if (visited.has(neighbor.id)) continue;
      visited.add(neighbor.id);
      const newPath = [...path, {
        personId: neighbor.id,
        name: personMap[neighbor.id]?.full_name || 'Unknown',
        via: neighbor.type + (neighbor.note ? ` (${neighbor.note})` : ''),
      }];
      if (neighbor.id === toId) return newPath;
      queue.push({ id: neighbor.id, path: newPath });
    }
  }
  return null; // no path found
}

export function SearchPanel({ persons, relationships, treeId }) {
  const navigate = useNavigate();

  // Search & filter state
  const [query, setQuery] = useState('');
  const [filterGender, setFilterGender] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all'); // all | alive | deceased
  const [showFilters, setShowFilters] = useState(false);

  // Relation finder state
  const [showFinder, setShowFinder] = useState(false);
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [pathResult, setPathResult] = useState(null); // array or null
  const [noPath, setNoPath] = useState(false);

  // Filtered results
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return persons.filter((p) => {
      const matchesQuery = !q ||
        p.full_name.toLowerCase().includes(q) ||
        (p.nickname || '').toLowerCase().includes(q) ||
        (p.birth_place || '').toLowerCase().includes(q) ||
        (p.occupation || '').toLowerCase().includes(q);
      const matchesGender = filterGender === 'all' || p.gender === filterGender;
      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'alive' && !p.is_deceased) ||
        (filterStatus === 'deceased' && p.is_deceased);
      return matchesQuery && matchesGender && matchesStatus;
    });
  }, [persons, query, filterGender, filterStatus]);

  const handleFindRelation = useCallback(() => {
    if (!fromId || !toId) return;
    setNoPath(false);
    setPathResult(null);
    const path = findRelationPath(fromId, toId, persons, relationships);
    if (!path || path.length === 0) {
      setNoPath(true);
    } else {
      setPathResult(path);
    }
  }, [fromId, toId, persons, relationships]);

  // PDF export of member list
  function handleExportPDF() {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const margin = 14;
    let y = 20;

    doc.setFontSize(18);
    doc.setTextColor(30, 30, 60);
    doc.text('Family Tree — Member List', margin, y);
    y += 8;

    doc.setFontSize(9);
    doc.setTextColor(120, 120, 140);
    doc.text(`Generated: ${new Date().toLocaleDateString()}   Total: ${persons.length} members`, margin, y);
    y += 10;

    doc.setDrawColor(180, 180, 200);
    doc.line(margin, y, 210 - margin, y);
    y += 8;

    filtered.forEach((p, i) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      // Name
      doc.setFontSize(11);
      doc.setTextColor(20, 20, 50);
      doc.text(`${i + 1}. ${p.full_name}${p.is_deceased ? ' †' : ''}`, margin, y);
      y += 5;

      // Meta line
      const parts = [];
      if (p.gender && p.gender !== 'unknown') parts.push(p.gender);
      if (p.birth_date) parts.push(`b. ${p.birth_date}`);
      if (p.birth_place) parts.push(p.birth_place);
      if (p.occupation) parts.push(p.occupation);
      if (parts.length) {
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 130);
        doc.text(parts.join('  ·  '), margin + 4, y);
        y += 4;
      }
      y += 3;
    });

    doc.save('family-tree-members.pdf');
  }

  const activeFilters = filterGender !== 'all' || filterStatus !== 'all';

  return (
    <div className="space-y-4">
      {/* Search bar + filter toggle + export */}
      <div className="flex gap-2 flex-wrap">
        <input
          id="memberSearch"
          type="search"
          className="input flex-1 min-w-[180px]"
          placeholder="Search by name, nickname, birthplace, occupation…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          onClick={() => setShowFilters((s) => !s)}
          className={`btn-secondary text-xs px-3 gap-1 ${activeFilters ? 'border-brand-600 text-brand-400' : ''}`}
        >
          ⚙ Filters {activeFilters && <span className="badge bg-brand-700 text-brand-200 text-[10px] py-0">On</span>}
        </button>
        <button
          onClick={() => setShowFinder((s) => !s)}
          className={`btn-secondary text-xs px-3 ${showFinder ? 'border-brand-600 text-brand-400' : ''}`}
        >
          🔍 Find Relation
        </button>
        <button onClick={handleExportPDF} className="btn-secondary text-xs px-3" title="Export PDF">
          📄 PDF
        </button>
      </div>

      {/* Filter row */}
      {showFilters && (
        <div className="flex gap-3 flex-wrap p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div>
            <label className="label text-[10px]">Gender</label>
            <select
              id="filterGender"
              className="input py-1.5 text-xs"
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
            >
              <option value="all">All genders</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="unknown">Unknown</option>
            </select>
          </div>
          <div>
            <label className="label text-[10px]">Status</label>
            <select
              id="filterStatus"
              className="input py-1.5 text-xs"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All members</option>
              <option value="alive">Living only</option>
              <option value="deceased">Deceased only</option>
            </select>
          </div>
          {activeFilters && (
            <div className="flex items-end">
              <button
                onClick={() => { setFilterGender('all'); setFilterStatus('all'); }}
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-red-400 transition-colors"
              >
                ✕ Clear filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Find My Relation panel */}
      {showFinder && (
        <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-0.5">🔍 Find My Relation</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs">Discover the relationship path between any two family members.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label text-[10px]">From</label>
              <select
                id="relationFromId"
                className="input text-sm"
                value={fromId}
                onChange={(e) => { setFromId(e.target.value); setPathResult(null); setNoPath(false); }}
              >
                <option value="">— Select person —</option>
                {persons.map((p) => (
                  <option key={p.id} value={p.id}>{p.full_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label text-[10px]">To</label>
              <select
                id="relationToId"
                className="input text-sm"
                value={toId}
                onChange={(e) => { setToId(e.target.value); setPathResult(null); setNoPath(false); }}
              >
                <option value="">— Select person —</option>
                {persons.map((p) => (
                  <option key={p.id} value={p.id}>{p.full_name}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            id="findRelationBtn"
            onClick={handleFindRelation}
            disabled={!fromId || !toId || fromId === toId}
            className="btn-primary text-sm"
          >
            Find Relationship Path
          </button>

          {/* Path result */}
          {noPath && (
            <div className="p-3 rounded-xl bg-amber-900/20 border border-amber-800 text-amber-300 text-sm">
              No relationship path found between these two members.
            </div>
          )}
          {pathResult && pathResult.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Relationship Path</p>
              <div className="flex flex-wrap items-center gap-2">
                {pathResult.map((step, i) => (
                  <span key={step.personId} className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/trees/${treeId}/members/${step.personId}`)}
                      className="px-3 py-1.5 rounded-xl bg-brand-900/40 border border-brand-800 text-brand-300 text-xs font-medium hover:bg-brand-800/50 transition-colors"
                    >
                      {step.name}
                    </button>
                    {i < pathResult.length - 1 && (
                      <span className="text-slate-500 dark:text-slate-400 text-xs flex items-center gap-1">
                        <span className="text-slate-600">→</span>
                        <span className="italic">{pathResult[i + 1].via}</span>
                        <span className="text-slate-600">→</span>
                      </span>
                    )}
                  </span>
                ))}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {pathResult.length - 1} {pathResult.length - 1 === 1 ? 'step' : 'steps'} apart
              </p>
            </div>
          )}
        </div>
      )}

      {/* Result count */}
      {(query || activeFilters) && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {filtered.length} of {persons.length} members
          {query && <span> matching "<strong className="text-slate-700 dark:text-slate-300">{query}</strong>"</span>}
        </p>
      )}
    </div>
  );
}
