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
    try {
      const { data: mem } = await supabase
        .from('workspace_members')
        .select('role, workspace_id')
        .eq('user_id', user.id)
        .single();

      if (mem) {
        setRole(mem.role);

        const { data: ws } = await supabase
          .from('workspaces')
          .select('*')
          .eq('id', mem.workspace_id)
          .single();

        setWorkspace(ws);

        const { data: allMembers } = await supabase
          .from('workspace_members')
          .select('id, user_id, role, joined_at')
          .eq('workspace_id', mem.workspace_id);

        // Get profiles separately
        const membersList = await Promise.all((allMembers || []).map(async m => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('owner_name')
            .eq('id', m.user_id)
            .single();
          return { ...m, profiles: profile };
        }));

        setMembers(membersList);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  async function joinWorkspace(inviteCode) {
    const { data: ws } = await supabase
      .from('workspaces')
      .select('*')
      .eq('invite_code', inviteCode.toUpperCase().trim())
      .single();

    if (!ws) return { error: 'Kode tim tidak ditemukan.' };

    const { data: existing } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', ws.id)
      .eq('user_id', user.id)
      .single();

    if (existing) return { error: 'Kamu sudah bergabung di workspace ini.' };

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
