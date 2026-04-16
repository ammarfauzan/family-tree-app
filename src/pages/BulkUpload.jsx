import { useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Papa from 'papaparse';
import { Navbar } from '../components/Navbar';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { useMembers } from '../hooks/useMembers';

export default function BulkUpload() {
  const { treeId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getMembers } = useMembers();

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setError('');
    }
  };

  const processUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError('');
    setProgress('Parsing CSV file...');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rows = results.data;
          
          if (rows.length === 0) {
            throw new Error('CSV file is empty.');
          }

          // Strict validation
          for (let i = 0; i < rows.length; i++) {
            if (!rows[i].full_name?.trim()) {
              throw new Error(`Row ${i + 1} is missing the required "full_name" column. strict batch rules: aborting.`);
            }
          }

          setProgress('Fetching existing tree members...');
          const existingMembers = await getMembers(treeId);
          const existingNameMap = new Map();
          existingMembers.forEach(m => existingNameMap.set(m.full_name.toLowerCase(), m.id));

          setProgress('Preparing new member insertions...');
          const newPersonsToInsert = [];
          
          // Deduplicate incoming rows against existing members
          rows.forEach((row) => {
            const nameKey = row.full_name.trim().toLowerCase();
            if (!existingNameMap.has(nameKey)) {
              newPersonsToInsert.push({
                tree_id: treeId,
                full_name: row.full_name.trim(),
                gender: row.gender?.toLowerCase() || 'unknown',
                birth_date: row.birth_date || null,
                birth_place: row.birth_place || null,
                is_deceased: row.is_deceased?.toLowerCase() === 'true',
                created_by: user.id,
                updated_by: user.id,
              });
              // Temporarily mark as processing to dedupe within the CSV itself
              existingNameMap.set(nameKey, 'pending'); 
            }
          });

          if (newPersonsToInsert.length > 0) {
            setProgress(`Inserting ${newPersonsToInsert.length} new members...`);
            const { data: insertedPersons, error: insertError } = await supabase
              .from('persons')
              .insert(newPersonsToInsert)
              .select();

            if (insertError) throw insertError;

            // Update Name Map with newly generated IDs
            insertedPersons.forEach(m => {
              existingNameMap.set(m.full_name.toLowerCase(), m.id);
            });
          }

          setProgress('Resolving and creating relationships...');
          const relationsToInsert = [];

          const existingRelationsSet = new Set();
          // We can fetch existing relationships to avoid duplicates, but to save bandwidth,
          // we just use simple ON CONFLICT DO NOTHING (if we had constraints) 
          // or manually check if it fails. We'll do a simple select first.
          
          const { data: currentRels } = await supabase.from('relationships').select('person_a_id,person_b_id,relation_type').eq('tree_id', treeId);
          if (currentRels) {
            currentRels.forEach(r => existingRelationsSet.add(`${r.person_a_id}-${r.person_b_id}-${r.relation_type}`));
          }

          rows.forEach((row) => {
            const childId = existingNameMap.get(row.full_name.trim().toLowerCase());
            if (!childId || childId === 'pending') return;

            // Parents
            ['parent1_name', 'parent2_name'].forEach((col) => {
              const parentName = row[col]?.trim();
              if (parentName) {
                const parentId = existingNameMap.get(parentName.toLowerCase());
                if (parentId && parentId !== childId) {
                  // Forward (parent -> child)
                  if (!existingRelationsSet.has(`${parentId}-${childId}-parent`)) {
                    relationsToInsert.push({ tree_id: treeId, person_a_id: parentId, person_b_id: childId, relation_type: 'parent', created_by: user.id });
                    existingRelationsSet.add(`${parentId}-${childId}-parent`);
                  }
                  // Inverse (child -> parent)
                  if (!existingRelationsSet.has(`${childId}-${parentId}-child`)) {
                    relationsToInsert.push({ tree_id: treeId, person_a_id: childId, person_b_id: parentId, relation_type: 'child', created_by: user.id });
                    existingRelationsSet.add(`${childId}-${parentId}-child`);
                  }
                }
              }
            });

            // Spouse
            const spouseName = row.spouse_name?.trim();
            if (spouseName) {
              const spouseId = existingNameMap.get(spouseName.toLowerCase());
              if (spouseId && spouseId !== childId) {
                // Forward (spouse1 -> spouse2)
                if (!existingRelationsSet.has(`${childId}-${spouseId}-spouse`)) {
                  relationsToInsert.push({ tree_id: treeId, person_a_id: childId, person_b_id: spouseId, relation_type: 'spouse', created_by: user.id });
                  existingRelationsSet.add(`${childId}-${spouseId}-spouse`);
                }
                // Inverse (spouse2 -> spouse1)
                if (!existingRelationsSet.has(`${spouseId}-${childId}-spouse`)) {
                  relationsToInsert.push({ tree_id: treeId, person_a_id: spouseId, person_b_id: childId, relation_type: 'spouse', created_by: user.id });
                  existingRelationsSet.add(`${spouseId}-${childId}-spouse`);
                }
              }
            }
          });

          if (relationsToInsert.length > 0) {
            setProgress(`Inserting ${relationsToInsert.length} relationship links...`);
            const { error: relError } = await supabase.from('relationships').insert(relationsToInsert);
            if (relError) throw relError;
          }

          setProgress('Done!');
          setTimeout(() => {
            navigate(`/trees/${treeId}`);
          }, 1000);

        } catch (err) {
          setError(err.message || 'Error processing CSV.');
          setLoading(false);
          setProgress('');
        }
      },
      error: (err) => {
        setError(err.message || 'Error reading CSV internal parser.');
        setLoading(false);
      }
    });
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-10">
        <Link to={`/trees/${treeId}`} className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300 text-sm mb-6 inline-flex items-center gap-1">
          ← Back to Tree
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-2 mb-1">Bulk Upload Members</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Have a lot of family members? Add them instantly by uploading a CSV file.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-900/40 border border-red-700 text-red-300 text-sm">
            {error}
          </div>
        )}

        <div className="card space-y-6">
          <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/10 text-sm text-blue-800 dark:text-blue-200">
            <p className="font-semibold mb-2">Step 1: Download Template</p>
            <p className="mb-3 opacity-90">Please use our standard CSV template to ensure your columns are formatted correctly. Do not alter the column headers.</p>
            <a href="/template.csv" download className="btn-secondary inline-block px-4 py-2 opacity-100 font-medium">⬇ Download Template.csv</a>
          </div>

          <div>
            <p className="font-semibold mb-2 text-sm text-slate-900 dark:text-white">Step 2: Upload CSV</p>
            <p className="text-xs text-slate-500 mb-3">Upload the filled template. If a member's name exactly matches an existing person, they will be skipped, but relationships will still link up.</p>
            <div 
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-10 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {file ? (
                <div>
                  <span className="text-4xl text-brand-500 block mb-2">📄</span>
                  <p className="text-slate-900 dark:text-white font-medium">{file.name}</p>
                  <p className="text-slate-500 text-xs">{(file.size / 1024).toFixed(2)} KB • Click to change</p>
                </div>
              ) : (
                <div>
                  <span className="text-4xl opacity-50 block mb-2">📤</span>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Click to select your .csv file</p>
                </div>
              )}
            </div>
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
            />
          </div>

          <div className="pt-2">
           {progress ? (
              <div className="text-center">
                <p className="text-brand-600 font-medium text-sm mb-2">{progress}</p>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-brand-500 h-full animate-pulse w-full"></div>
                </div>
              </div>
           ) : (
             <button 
                onClick={processUpload} 
                disabled={!file || loading}
                className="btn-primary w-full"
              >
                Start Bulk Upload
              </button>
           )}
          </div>
        </div>

      </main>
    </div>
  );
}
