import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faScrewdriverWrench } from '@fortawesome/free-solid-svg-icons';

export default function AdminDashboard({ theme, showNotification, isMaintenanceMode, setIsMaintenanceMode }) {
  const [adminBroadcastText, setAdminBroadcastText] = useState('');
  const [allUsersList, setAllUsersList] = useState([]);

  useEffect(() => {
    fetchGlobalUsersForAdmin();
  }, []);

  const toggleMaintenanceModeState = async () => {
    const nextState = !isMaintenanceMode;
    try {
      await supabase.from('system_settings').update({ value: nextState.toString() }).eq('key', 'maintenance_mode');
      setIsMaintenanceMode(nextState);
      showNotification(`System Maintenance swapped to: ${nextState.toString().toUpperCase()}`);
    } catch (err) {
      showNotification('Failed to toggle architecture server state.');
    }
  };

  const fetchGlobalUsersForAdmin = async () => {
    const { data } = await supabase.from('profiles').select('*');
    if (data) setAllUsersList(data);
  };

  const executeAdminUserUpdateAction = async (targetId, type, metaValue) => {
    try {
      if (type === 'role') {
        await supabase.from('profiles').update({ role: metaValue }).eq('id', targetId);
        showNotification('User operational framework role updated successfully.');
      } else if (type === 'ban_account') {
        await supabase.from('profiles').update({ status_banned: metaValue }).eq('id', targetId);
        showNotification(metaValue ? 'User account blocked completely.' : 'User account unblocked.');
      } else if (type === 'warn') {
        showNotification(`Warning token broadcasted to user session pipeline.`);
      }
      fetchGlobalUsersForAdmin();
    } catch (err) {
      showNotification('Failed processing administrative control sequence.');
    }
  };

  const dispatchOfficialBotBroadcastMessage = async (e) => {
    e.preventDefault();
    if (!adminBroadcastText.trim()) return;
    try {
      let { data: botRoom } = await supabase.from('chat_rooms').select('id').eq('name', 'ItalK Official Noti Bot Workspace').maybeSingle();
      if (!botRoom) {
        const { data: nr } = await supabase.from('chat_rooms').insert([{ type: 'group', name: 'ItalK Official Noti Bot Workspace', avatar_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&h=150' }]).select().single();
        botRoom = nr;
      }

      await supabase.from('messages').insert([{
        room_id: botRoom.id,
        sender_id: '00000000-0000-0000-0000-000000000000', 
        content: adminBroadcastText.trim()
      }]);

      showNotification('Broadcast data distributed cleanly to ItalK Official Bot Node.');
      setAdminBroadcastText('');
    } catch (err) {
      showNotification('Global broadcast transmission matrix fault.');
    }
  };

  return (
    <div style={{ padding: '24px', height: '100%', overflowY: 'auto', background: theme.bg, display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <FontAwesomeIcon icon={faScrewdriverWrench} style={{ color: theme.accent, fontSize: '22px' }} />
        <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: theme.text }}>Administrative Matrix Core</h2>
      </div>
      <hr style={{ border: 'none', height: '1px', background: theme.border, margin: 0 }} />
      
      {/* Maintenance Mode Toggle */}
      <div style={{ background: theme.card, padding: '20px', borderRadius: '16px', border: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h4 style={{ margin: 0, fontSize: '15px', color: theme.text }}>System Deployment Isolation (Maintenance Mode)</h4>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: theme.subText }}>Stop connection channels pipelines universally across all ordinary user instances safely.</p>
        </div>
        <button type="button" onClick={toggleMaintenanceModeState} style={{ padding: '10px 16px', background: isMaintenanceMode ? '#ff3b30' : '#34c759', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}>
          {isMaintenanceMode ? 'DEACTIVATE MAINTENANCE' : 'ACTIVATE MAINTENANCE'}
        </button>
      </div>

      {/* Official Noti Bot Broadcast Interface */}
      <div style={{ background: theme.card, padding: '20px', borderRadius: '16px', border: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <h4 style={{ margin: 0, fontSize: '15px', color: theme.text }}>ItalK Official Noti Bot Broadcast Interface</h4>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: theme.subText }}>Transmits data packets text instantly to all registered cluster sockets. Users cannot reply.</p>
        </div>
        <form onSubmit={dispatchOfficialBotBroadcastMessage} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <textarea value={adminBroadcastText} onChange={e => setAdminBroadcastText(e.target.value)} placeholder="Type official notifications broadcast..." style={{ padding: '12px', background: theme.bg, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: '10px', fontSize: '13.5px', resize: 'none', height: '80px', outline: 'none' }} />
          <button type="submit" style={{ padding: '12px', background: theme.accent, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', alignSelf: 'flex-end' }}>Dispatch Global Packet Broadcast</button>
        </form>
      </div>

      {/* User Accounts Management Ledger */}
      <div style={{ background: theme.card, padding: '20px', borderRadius: '16px', border: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ margin: 0, fontSize: '15px', color: theme.text }}>Roster User Registrations Allocation Ledger</h4>
          <button type="button" onClick={fetchGlobalUsersForAdmin} style={{ padding: '6px 12px', fontSize: '12px', background: theme.accentLight, color: theme.accent, border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Fetch Profiles Cache</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto' }}>
          {allUsersList.map(user => (
            <div key={user.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: theme.bg, borderRadius: '8px', border: `1px solid ${theme.border}` }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: theme.text }}>{user.username} ({user.role})</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button type="button" onClick={() => executeAdminUserUpdateAction(user.id, 'role', user.role === 'admin' ? 'user' : 'admin')} style={{ padding: '6px 10px', fontSize: '11px', background: theme.card, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: '6px', cursor: 'pointer' }}>Toggle Admin</button>
                <button type="button" onClick={() => executeAdminUserUpdateAction(user.id, 'ban_account', !user.status_banned)} style={{ padding: '6px 10px', fontSize: '11px', background: '#ff3b30', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>{user.status_banned ? 'Unban' : 'Ban'}</button>
                <button type="button" onClick={() => executeAdminUserUpdateAction(user.id, 'warn', null)} style={{ padding: '6px 10px', fontSize: '11px', background: '#ff9500', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Warn</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}