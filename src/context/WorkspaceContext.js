import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const WorkspaceContext = createContext({});

export function WorkspaceProvider({ children }) {
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState(null);
  const [members, setMembers] = useState([]);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchWorkspace();
    else { setWorkspace(null); setMembers([]); setRole(null); setLoading(false); }
  }, [user]); // eslint-disable-line

  async function fetchWorkspace() {
    setLoading(true);
    const { data: mem } = await supabase
      .from('workspace_members')
      .select('*, workspaces(*)')
      .eq('user_id', user.id)
      .single();

    if (mem) {
      setWorkspace(mem.workspaces);
      setRole(mem.role);
      // Fetch all members
      const { data: allMembers } = await supabase
        .from('workspace_members')
        .select('*, profiles(owner_name)')
        .eq('workspace_id', mem.workspace_id);
      setMembers(allMembers || []);
    }
    setLoading(false);
  }

  async function joinWorkspace(inviteCode) {
    // Find workspace by invite code
    const { data: ws } = await supabase
      .from('workspaces')
      .select('*')
      .eq('invite_code', inviteCode.toUpperCase().trim())
      .single();

    if (!ws) return { error: 'Kode tim tidak ditemukan. Cek kembali kode dari owner WO kamu.' };

    // Check if already member
    const { data: existing } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', ws.id)
      .eq('user_id', user.id)
      .single();

    if (existing) return { error: 'Kamu sudah bergabung di workspace ini.' };

    // Join as member
    const { error } = await supabase
      .from('workspace_members')
      .insert({ workspace_id: ws.id, user_id: user.id, role: 'member' });

    if (error) return { error: error.message };

    await fetchWorkspace();
    return { success: true, wsName: ws.name };
  }

  async function removeMember(userId) {
    if (role !== 'owner') return;
    await supabase.from('workspace_members').delete()
      .eq('workspace_id', workspace.id)
      .eq('user_id', userId);
    await fetchWorkspace();
  }

  async function updateWorkspaceName(name) {
    await supabase.from('workspaces').update({ name }).eq('id', workspace.id);
    setWorkspace(w => ({ ...w, name }));
  }

  return (
    <WorkspaceContext.Provider value={{
      workspace, members, role, loading,
      isOwner: role === 'owner',
      joinWorkspace, removeMember, updateWorkspaceName, fetchWorkspace
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export const useWorkspace = () => useContext(WorkspaceContext);
