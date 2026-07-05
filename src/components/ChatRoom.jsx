import React, { useEffect, useState, useRef, useMemo } from 'react';
import { supabase } from '../config/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

// Font Awesome Icon Core Pack Only
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faMessage, faSearch, faGear, faFolderPlus, faEllipsisVertical, 
  faArrowLeft, faPaperPlane, faVolumeMute, faVolumeUp, faTrash, 
  faBan, faPen, faThumbtack, faReply, faCopy, faEye, faMoon, faSun, 
  faLock, faSignOutAlt, faUserShield, faUserPlus, faUserMinus, 
  faCalendarAlt, faAddressCard, faCheck, faShieldAlt, faUserCheck, 
  faQuoteLeft, faCircle, faUserPen, faUserCircle, faHome, faUserGroup, 
  faXmark, faCheckSquare, faTimesCircle, faGlobe, faUserLock,
  faLink, faUser, faTrashCan, faFileContract, faCircleInfo, faCommentDots, faShieldHalved, faUserGear
} from '@fortawesome/free-solid-svg-icons';

// Hash-based Consistent Avatar Random Color System
const getRandomColor = (name) => {
  const colors = ['#007aff', '#34c759', '#ff9500', '#af52de', '#ff2d55', '#5ac8fa', '#5856d6', '#10b981', '#ef4444'];
  if (!name) return colors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

export default function ChatRoom({ currentUser }) {
  // Navigation Routing & Screen Contexts
  const [currentTab, setCurrentTab] = useState('chats'); // 'chats' | 'search' | 'create-group' | 'profile-view' | 'edit-profile' | 'settings' | 'privacy' | 'help-support' | 'private-settings'
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [activeRoomData, setActiveRoomData] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 840);

  // App Core State
  const [myProfile, setMyProfile] = useState({ username: '', unique_id: '', avatar_url: '', biography: '', birthday: '', privacy_muted: false, privacy_bio: 'public', privacy_profile: 'public', privacy_birthday: 'public' });
  const [rooms, setRooms] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [roomMembers, setRoomMembers] = useState([]);
  const [myRoomRole, setMyRoomRole] = useState('member');
  const [myMemberStatus, setMyMemberStatus] = useState('active');
  const [isMuted, setIsMuted] = useState(false);

  // Dynamic Real-time Status Indicators
  const [lastActive, setLastActive] = useState('Just now');
  const [isTyping, setIsTyping] = useState(false);

  // Interface Interactive Views States
  const [searchQuery, setSearchQuery] = useState('');
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [isSearchingChat, setIsSearchingChat] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [viewingUserTarget, setViewingUserTarget] = useState(null);
  const [viewingGroupMeta, setViewingGroupMeta] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  
  // Create Group Parameters Enhanced
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupAvatarUrl, setNewGroupAvatarUrl] = useState('https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=150&h=150');
  const [groupSelectedUsers, setGroupSelectedUsers] = useState([]);
  const [allProfilesCache, setAllProfilesCache] = useState([]);

  // Feedback & Security Temporary Inputs State
  const [feedbackText, setFeedbackText] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Context Menus & Action Intermediaries
  const [activeMenuMessageId, setActiveMenuMessageId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [replyTarget, setReplyTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [roomHeaderMenuOpen, setRoomHeaderMenuOpen] = useState(false);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false); 

  // Form Field Local Temporary Edit States
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editBirthday, setEditBirthday] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');

  // In-App Notification System State
  const [notifications, setNotifications] = useState([]);

  // UI Reference Nodes
  const messagesEndRef = useRef(null);

  // Enhanced Light / Dark Mode Colors Configs (Fixed: Colors fade bug corrected)
  const theme = useMemo(() => ({
    bg: darkMode ? '#0c0c0e' : '#f4f5f7',
    card: darkMode ? '#16161a' : '#ffffff',
    border: darkMode ? '#24242b' : '#d2d6dc',
    text: darkMode ? '#f3f4f6' : '#111827',
    subText: darkMode ? '#8e8e93' : '#4b5563',
    accent: '#007aff',
    accentLight: darkMode ? 'rgba(0, 122, 255, 0.18)' : 'rgba(0, 122, 255, 0.1)',
    bubbleMe: '#007aff',
    bubbleUser: darkMode ? '#24242b' : '#e5e7eb',
    textMe: '#ffffff',
    textUser: darkMode ? '#f3f4f6' : '#111827',
    floatingBg: darkMode ? 'rgba(22, 22, 26, 0.85)' : 'rgba(255, 255, 255, 0.9)',
    shadow: darkMode ? '0 12px 32px rgba(0,0,0,0.5)' : '0 12px 32px rgba(31,41,55,0.12)'
  }), [darkMode]);

  const showNotification = (message, type = 'success') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 2500);
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 840);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    fetchOrCreateProfile();
    supabase.from('profiles').select('*').then(({ data }) => { if (data) setAllProfilesCache(data); });
    fetchRoomsList();

    const messageSubscription = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        if (activeRoomId) fetchMessagesForRoom(activeRoomId);
        fetchRoomsList();
      })
      .subscribe();

    const roomSubscription = supabase
      .channel('public:chat_rooms')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_rooms' }, () => {
        fetchRoomsList();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messageSubscription);
      supabase.removeChannel(roomSubscription);
    };
  }, [currentUser, activeRoomId]);

  const fetchOrCreateProfile = async () => {
    try {
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        const generatedUsername = currentUser.email ? currentUser.email.split('@')[0] : 'user_' + Math.floor(Math.random() * 1000);
        const randId = 'talk-' + Math.floor(1000 + Math.random() * 9000);
        const { data: insertedData, error: insertError } = await supabase
          .from('profiles')
          .insert([{
            id: currentUser.id,
            username: generatedUsername,
            unique_id: randId,
            avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150',
            biography: 'Hello! I am using ThuTalk.',
            birthday: '2000-01-01',
            privacy_bio: 'public',
            privacy_profile: 'public',
            privacy_birthday: 'public'
          }])
          .select()
          .single();

        if (insertError) throw insertError;
        setMyProfile(insertedData);
        syncEditStates(insertedData);
      } else {
        setMyProfile(data);
        syncEditStates(data);
      }
    } catch (err) {
      showNotification('Error loading profile: ' + err.message, 'error');
    }
  };

  const syncEditStates = (profile) => {
    setEditUsername(profile.username || '');
    setEditBio(profile.biography || '');
    setEditBirthday(profile.birthday || '');
    setEditAvatarUrl(profile.avatar_url || '');
  };

  // PGRST200 Relationship Mapping Target fixed to chat_rooms
  const fetchRoomsList = async () => {
    try {
      const { data: memberships, error: memError } = await supabase
        .from('room_members')
        .select('room_id, is_muted, status, role')
        .eq('user_id', currentUser.id);

      if (memError) throw memError;
      if (!memberships || memberships.length === 0) {
        setRooms([]);
        return;
      }

      // Firebase messaging ခွင့်ပြုချက်တောင်းပြီး Supabase မှာ သိမ်းမည့် function
export const requestNotificationPermission = async (userId) => {
  if (!userId) {
    console.error("User ID is missing.");
    return;
  }

  try {
    // 1. Browser Notification ခွင့်ပြုချက်တောင်းခြင်း
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      // 2. Firebase Messaging မှ Token ထုတ်ယူခြင်း
      // VAPID_KEY နေရာတွင် မင်းရဲ့ Firebase Project Settings > Cloud Messaging > Web Push Certificates ထဲက Key ကို ထည့်ပါ
      const token = await getToken(messaging, { 
        vapidKey: 'BM7DFrbO5Y4a_lQK__W3BW9WiXVG1MMq5WT-WoYo-h3x24_j75wLH7PPQeZAnSJ1oGw-bgp2vZEb0Mx82gk3chg' 
      });
      
      if (token) {
        // 3. ရလာတဲ့ Token ကို Supabase Profiles table ထဲသို့ Update လုပ်ခြင်း
        const { error } = await supabase
          .from('profiles')
          .update({ fcm_token: token })
          .eq('id', userId);
          
        if (error) throw error;
        console.log("FCM Notification token saved to Supabase!");
      }
    } else {
      console.warn("Notification permission denied by user.");
    }
  } catch (error) {
    console.error("Notification initialization error:", error);
  }
};

      const roomIds = memberships.map(m => m.room_id);
      const { data: roomsData, error: roomsError } = await supabase
        .from('chat_rooms')
        .select(`
          *,
          room_members(*, profiles(*)),
          messages(content, created_at, sender_id)
        `)
        .in('id', roomIds);

      if (roomsError) throw roomsError;

      const formattedRooms = roomsData.map(room => {
        const specificMemberMeta = memberships.find(m => m.room_id === room.id);
        const sortedMsgs = room.messages ? [...room.messages].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) : [];
        const lastMsg = sortedMsgs[0] || null;

        let roomTitle = room.name;
        let roomAvatar = room.avatar_url;

        if (room.type === 'personal') {
          const alternateMember = room.room_members?.find(m => m.user_id !== currentUser.id);
          if (alternateMember && alternateMember.profiles) {
            roomTitle = alternateMember.profiles.username;
            roomAvatar = alternateMember.profiles.privacy_profile === 'public' || alternateMember.user_id === currentUser.id
              ? alternateMember.profiles.avatar_url 
              : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150';
          } else {
            roomTitle = 'Cloud Storage';
          }
        }

        return {
          ...room,
          displayName: roomTitle,
          displayAvatar: roomAvatar,
          lastMessage: lastMsg ? lastMsg.content : 'No messages yet',
          lastMessageTime: lastMsg ? new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
          rawTime: lastMsg ? new Date(lastMsg.created_at) : new Date(room.created_at),
          isMuted: specificMemberMeta?.is_muted || false,
          myStatus: specificMemberMeta?.status || 'active'
        };
      }).sort((a, b) => b.rawTime - a.rawTime);

      setRooms(formattedRooms);
    } catch (err) {
      showNotification('Error loading chats: ' + err.message, 'error');
    }
  };

  const fetchMessagesForRoom = async (roomId) => {
    try {
      const { data: memData } = await supabase
        .from('room_members')
        .select('role, status, is_muted')
        .eq('room_id', roomId)
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (memData) {
        setMyRoomRole(memData.role);
        setMyMemberStatus(memData.status);
        setIsMuted(memData.is_muted);
      }

      const { data: membersList, error: memsError } = await supabase
        .from('room_members')
        .select('*, profiles(*)')
        .eq('room_id', roomId);

      if (!memsError && membersList) setRoomMembers(membersList);

      const { data: msgData, error: msgError } = await supabase
        .from('messages')
        .select('*, profiles:sender_id(*)')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (msgError) throw msgError;
      setMessages(msgData || []);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'auto' }), 30);
    } catch (err) {
      showNotification('Failed loading message history', 'error');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeRoomId) return;

    if (myMemberStatus === 'banned') {
      showNotification('You are restricted to text-only viewing.', 'error');
      return;
    }

    try {
      if (editTarget) {
        const { error } = await supabase
          .from('messages')
          .update({ content: newMessage.trim() })
          .eq('id', editTarget.id);
        if (error) throw error;
        showNotification('Message updated');
      } else {
        const payload = {
          room_id: activeRoomId,
          sender_id: currentUser.id,
          content: newMessage.trim(),
          reply_to_id: replyTarget ? replyTarget.id : null
        };
        const { error } = await supabase.from('messages').insert([payload]);
        if (error) throw error;
      }

      setNewMessage('');
      setReplyTarget(null);
      setEditTarget(null);
      fetchMessagesForRoom(activeRoomId);
    } catch (err) {
      showNotification('Send error: ' + err.message, 'error');
    }
  };

  const handleGlobalSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${searchQuery}%,unique_id.ilike.%${searchQuery}%`);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (err) {
      showNotification('Search failed: ' + err.message, 'error');
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      showNotification('Please enter a valid group name', 'error');
      return;
    }
    try {
      const { data: groupRoom, error: createErr } = await supabase
        .from('chat_rooms')
        .insert([{ 
          type: 'group', 
          name: newGroupName.trim(), 
          avatar_url: newGroupAvatarUrl.trim() || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=150&h=150' 
        }])
        .select()
        .single();

      if (createErr) throw createErr;

      const memberInserts = [{ room_id: groupRoom.id, user_id: currentUser.id, role: 'owner', status: 'active' }];
      groupSelectedUsers.forEach(uid => {
        memberInserts.push({ room_id: groupRoom.id, user_id: uid, role: 'member', status: 'active' });
      });

      const { error: memInsErr } = await supabase.from('room_members').insert(memberInserts);
      if (memInsErr) throw memInsErr;

      showNotification('Group Workspace built cleanly');
      setNewGroupName('');
      setNewGroupAvatarUrl('');
      setGroupSelectedUsers([]);
      fetchRoomsList();
      setActiveRoomId(groupRoom.id);
      fetchMessagesForRoom(groupRoom.id);
      setCurrentTab('chats');
    } catch (err) {
      showNotification('Creation matrix failure: ' + err.message, 'error');
    }
  };

  const handleMsgContextMenu = (e, msg) => {
    e.preventDefault();
    setActiveMenuMessageId(msg.id);
    const clickX = e.clientX > window.innerWidth - 180 ? e.clientX - 160 : e.clientX;
    const clickY = e.clientY > window.innerHeight - 200 ? e.clientY - 180 : e.clientY;
    setMenuPosition({ x: clickX, y: clickY });
  };

  const executeMessageDelete = async (msgId) => {
    try {
      const { error } = await supabase.from('messages').delete().eq('id', msgId);
      if (error) throw error;
      setMessages(prev => prev.filter(m => m.id !== msgId));
      showNotification('Message string deleted');
    } catch (err) {
      showNotification('Delete error: ' + err.message, 'error');
    }
  };

  const executeBulkDeleteSelected = async () => {
    if (selectedMessages.length === 0) return;
    try {
      const { error } = await supabase.from('messages').delete().in('id', selectedMessages);
      if (error) throw error;
      showNotification(`Purged ${selectedMessages.length} elements`);
      setSelectedMessages([]);
      setIsSelectMode(false);
      fetchMessagesForRoom(activeRoomId);
    } catch (err) {
      showNotification('Bulk operation failure: ' + err.message, 'error');
    }
  };

  const handleClearChatDatabase = async () => {
    try {
      const { error } = await supabase.from('messages').delete().eq('room_id', activeRoomId);
      if (error) throw error;
      setMessages([]);
      showNotification('All conversation traces cleared');
      setRoomHeaderMenuOpen(false);
    } catch (err) {
      showNotification('Purge room logs failure', 'error');
    }
  };

  const executeLeaveRoom = async () => {
    try {
      const { error } = await supabase
        .from('room_members')
        .delete()
        .eq('room_id', activeRoomId)
        .eq('user_id', currentUser.id);

      if (error) throw error;
      showNotification('Left channel space safely');
      setActiveRoomId(null);
      setRoomHeaderMenuOpen(false);
      fetchRoomsList();
    } catch (err) {
      showNotification('Leave operation error', 'error');
    }
  };

  const openPersonalChat = async (targetUser) => {
    try {
      // 1. စကားပြောမည့်သူနှင့် မိမိကြားတွင် အရင်က personal room ရှိဖူးလား စစ်ဆေးခြင်း
      const { data: sharedRooms, error: checkError } = await supabase
        .from('chat_rooms')
        .select('id, type, room_members!inner(user_id)')
        .eq('type', 'personal')
        .eq('room_members.user_id', currentUser.id);

      if (checkError) throw checkError;

      let matchingRoomId = null;
      if (sharedRooms) {
        for (const room of sharedRooms) {
          const { data: pairMembers } = await supabase
            .from('room_members')
            .select('user_id')
            .eq('room_id', room.id);
          
          if (pairMembers?.some(m => m.user_id === targetUser.id)) {
            matchingRoomId = room.id;
            break;
          }
        }
      }

      // 2. ရှိပြီးသားဆိုလျှင် ထို Room အား Active လုပ်ပြီး Message ဆွဲခေါ်မည်
      if (matchingRoomId) {
        setActiveRoomId(matchingRoomId);
        fetchMessagesForRoom(matchingRoomId);
        setCurrentTab('chats');
      } else {
        // 3. မရှိသေးလျှင် chat_rooms table ထဲသို့ personal room အသစ် ဆောက်မည်
        const { data: newRoom, error: roomCreateErr } = await supabase
          .from('chat_rooms')
          .insert([{ type: 'personal', name: `Direct: ${targetUser.username}` }])
          .select()
          .single();

        if (roomCreateErr) throw roomCreateErr;

        // room_members ထဲသို့ အဖွဲ့ဝင် (၂) ယောက်လုံးကို သွင်းမည်
        await supabase.from('room_members').insert([
          { room_id: newRoom.id, user_id: currentUser.id, role: 'owner' },
          { room_id: newRoom.id, user_id: targetUser.id, role: 'member' }
        ]);

        setActiveRoomId(newRoom.id);
        fetchMessagesForRoom(newRoom.id);
        setCurrentTab('chats');
        showNotification('Direct chat pathway synchronized securely.', 'success');
      }
    } catch (err) {
      showNotification('Handshake error: ' + err.message, 'error');
    }
  };

  const executeDeleteAccount = async () => {
    if (window.confirm("Are you absolutely sure you want to delete your profile? This cannot be undone.")) {
      try {
        // room_members entries များကို အရင်ဖြုတ်ချခြင်း
        await supabase.from('room_members').delete().eq('user_id', currentUser.id);
        // profiles ဇယားထဲမှ data ကို purge လုပ်ခြင်း
        await supabase.from('profiles').delete().eq('id', currentUser.id);
        // auth session အား လုံးဝ အပြီးသတ် ဖျက်သိမ်းခြင်း
        await supabase.auth.signOut();
        showNotification('Account context records destroyed successfully.', 'success');
      } catch (err) {
        showNotification('Deletion system failure: ' + err.message, 'error');
      }
    }
  };

  const manageMemberAction = async (targetUserId, actionType) => {
    try {
      if (actionType === 'kick') {
        const { error } = await supabase.from('room_members').delete().eq('room_id', activeRoomId).eq('user_id', targetUserId);
        if (error) throw error;
        showNotification('Member dropped');
      } else if (actionType === 'admin') {
        const { error } = await supabase.from('room_members').update({ role: 'admin' }).eq('room_id', activeRoomId).eq('user_id', targetUserId);
        if (error) throw error;
        showNotification('Member promoted to Admin');
      } else if (actionType === 'ban_text') {
        const { error } = await supabase.from('room_members').update({ status: 'banned' }).eq('room_id', activeRoomId).eq('user_id', targetUserId);
        if (error) throw error;
        showNotification('Member status swapped to read-only text ban');
      }
      fetchMessagesForRoom(activeRoomId);
    } catch (err) {
      showNotification('Action failed: ' + err.message, 'error');
    }
  };

  const handleUpdateProfile = async (e) => {
    if (e) e.preventDefault();
    try {
      const updates = {
        username: editUsername,
        biography: editBio,
        birthday: editBirthday || null,
        avatar_url: editAvatarUrl
      };
      const { error } = await supabase.from('profiles').update(updates).eq('id', currentUser.id);
      if (error) throw error;
      setMyProfile(prev => ({ ...prev, ...updates }));
      showNotification('Profile parameters updated');
      setCurrentTab('profile-view');
    } catch (err) {
      showNotification('Profile updates failure', 'error');
    }
  };

  const handleSavePrivacyConfiguration = async (key, value) => {
    try {
      const payload = { [key]: value };
      const { error } = await supabase.from('profiles').update(payload).eq('id', currentUser.id);
      if (error) throw error;
      setMyProfile(prev => ({ ...prev, ...payload }));
      showNotification('Privacy protection updated');
    } catch (err) {
      showNotification('Privacy update failure', 'error');
    }
  };

  const handleSendFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    showNotification('Thank you! Your secure telemetry feedback has been dispatched.', 'success');
    setFeedbackText('');
  };

  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword) return;
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (!error) {
      showNotification('Account access credentials rotated safely.', 'success');
      setOldPassword('');
      setNewPassword('');
    } else {
      showNotification('Security reset fault: ' + error.message, 'error');
    }
  };

  const handleForgotPasswordTrigger = async () => {
    if (currentUser.email) {
      await supabase.auth.resetPasswordForEmail(currentUser.email);
      showNotification('Recovery token link transmitted to email node.');
    }
  };

  const togglePinMessage = async (msg) => {
    try {
      const { error } = await supabase.from('messages').update({ is_pinned: !msg.is_pinned }).eq('id', msg.id);
      if (error) throw error;
      showNotification(msg.is_pinned ? 'Message unpinned' : 'Message pinned');
      fetchMessagesForRoom(activeRoomId);
    } catch (err) {
      showNotification('Pin operation fault', 'error');
    }
  };

  const handleInputTyping = (e) => {
    setNewMessage(e.target.value);
  };

  const renderMessageContent = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    if (!urlRegex.test(text)) return text;
    return text.split(urlRegex).map((part, i) => {
      if (part.match(urlRegex)) {
        return <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{ color: '#5ac8fa', textDecoration: 'underline', fontWeight: 'bold' }}>{part}</a>;
      }
      return part;
    });
  };

  const personalRooms = rooms.filter(r => r.type === 'personal');
  const groupRooms = rooms.filter(r => r.type === 'group');

  const renderRoomListItems = (list) => {
    if (list.length === 0) return <div style={{ padding: '16px', color: theme.subText, fontSize: '13px', textAlign: 'center' }}>No chats found</div>;
    return list.map(room => {
      const isSelected = activeRoomId === room.id;
      return (
        <div 
          key={room.id}
          onClick={() => { setActiveRoomId(room.id); fetchMessagesForRoom(room.id); }}
          style={{
            display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '14px',
            cursor: 'pointer', background: isSelected ? theme.accentLight : 'transparent',
            transition: 'background 0.15s', marginBottom: '4px'
          }}
        >
          <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: getRandomColor(room.displayName), display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff', fontWeight: '700', fontSize: '14px', overflow: 'hidden', flexShrink: 0 }}>
            {room.displayAvatar && room.displayAvatar !== "" ? <img src={room.displayAvatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : room.displayName?.substring(0,2).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
              <span style={{ fontWeight: '600', fontSize: '15px', color: theme.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{room.displayName}</span>
              <span style={{ fontSize: '11px', color: theme.subText }}>{room.lastMessageTime}</span>
            </div>
            <p style={{ fontSize: '13px', color: theme.subText, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>{room.lastMessage}</p>
          </div>
        </div>
      );
    });
  };

  const tabsConfig = [
    { id: 'chats', label: 'Chats', icon: faMessage },
    { id: 'search', label: 'Search', icon: faSearch },
    { id: 'create-group', label: 'Group', icon: faFolderPlus },
    { id: 'profile-view', label: 'Profile', icon: faUserCircle, match: ['profile-view', 'edit-profile'] },
    { id: 'settings', label: 'Settings', icon: faGear, match: ['settings', 'privacy', 'help-support', 'private-settings'] }
  ];

  const currentActiveRoomData = rooms.find(r => r.id === activeRoomId);
  const pinnedMessage = messages.find(m => m.is_pinned);

  const filteredMessages = useMemo(() => {
    if (!chatSearchQuery.trim()) return messages;
    return messages.filter(m => m.content.toLowerCase().includes(chatSearchQuery.toLowerCase()));
  }, [messages, chatSearchQuery]);

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', background: theme.bg, color: theme.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', overflow: 'hidden', position: 'relative' }}>
      
      {/* Toast Overlay Banner Element */}
      <div style={{ position: 'absolute', top: '24px', right: '24px', zIndex: 99999, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <AnimatePresence>
          {notifications.map(n => (
            <motion.div key={n.id} initial={{ opacity: 0, y: -15, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ padding: '12px 18px', borderRadius: '12px', background: n.type === 'error' ? '#ff3b30' : theme.accent, color: '#fff', fontWeight: '600', fontSize: '13px', boxShadow: '0 8px 20px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FontAwesomeIcon icon={n.type === 'error' ? faTimesCircle : faCheck} />
              <span>{n.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Context Menu Blur Filter Overlayer Matrix */}
      <AnimatePresence>
        {activeMenuMessageId && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            onClick={() => setActiveMenuMessageId(null)}
            style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backdropFilter: 'blur(5px)', background: 'rgba(0,0,0,0.18)', zIndex: 9990 }}
          >
            <div 
              onClick={e => e.stopPropagation()}
              style={{ 
                position: 'absolute', top: menuPosition.y, left: menuPosition.x,
                background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '14px',
                padding: '6px', width: '160px', boxShadow: '0 12px 32px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '2px'
              }}
            >
              {(() => {
                const targetedMsg = messages.find(m => m.id === activeMenuMessageId);
                if (!targetedMsg) return null;
                return (
                  <>
                    <button onClick={() => { setReplyTarget(targetedMsg); setEditTarget(null); setActiveMenuMessageId(null); }} style={{ background: 'none', border: 'none', color: theme.text, padding: '10px 12px', borderRadius: '8px', textAlign: 'left', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FontAwesomeIcon icon={faReply} style={{ width: '14px' }} /> Reply
                    </button>
                    {targetedMsg.sender_id === currentUser.id && (
                      <button onClick={() => { setEditTarget(targetedMsg); setNewMessage(targetedMsg.content); setActiveMenuMessageId(null); }} style={{ background: 'none', border: 'none', color: theme.text, padding: '10px 12px', borderRadius: '8px', textAlign: 'left', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FontAwesomeIcon icon={faPen} style={{ width: '14px' }} /> Edit
                      </button>
                    )}
                    <button onClick={() => { navigator.clipboard.writeText(targetedMsg.content); showNotification('Copied to system asset clipboard'); setActiveMenuMessageId(null); }} style={{ background: 'none', border: 'none', color: theme.text, padding: '10px 12px', borderRadius: '8px', textAlign: 'left', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FontAwesomeIcon icon={faCopy} style={{ width: '14px' }} /> Copy
                    </button>
                    <button onClick={() => { togglePinMessage(targetedMsg); setActiveMenuMessageId(null); }} style={{ background: 'none', border: 'none', color: theme.text, padding: '10px 12px', borderRadius: '8px', textAlign: 'left', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FontAwesomeIcon icon={faThumbtack} style={{ width: '14px' }} /> {targetedMsg.is_pinned ? 'Unpin' : 'Pin'}
                    </button>
                    {(targetedMsg.sender_id === currentUser.id || myRoomRole === 'owner' || myRoomRole === 'admin') && (
                      <button onClick={() => { executeMessageDelete(targetedMsg.id); setActiveMenuMessageId(null); }} style={{ background: 'none', border: 'none', color: '#ff3b30', padding: '10px 12px', borderRadius: '8px', textAlign: 'left', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FontAwesomeIcon icon={faTrash} style={{ width: '14px' }} /> Delete
                      </button>
                    )}
                  </>
                );
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DESKTOP FULL-SCREEN SPLIT CONTROLLER LAYER */}
      {!isMobile && (
        <div style={{ width: '100%', height: '100%', display: 'flex' }}>
          
          {/* Side Drawer Column */}
          <div style={{ width: '380px', height: '100%', borderRight: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', background: theme.card }}>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', borderBottom: `1px solid ${theme.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '24px', fontWeight: '800', color: theme.accent, letterSpacing: '-0.5px' }}>ThuTalk</span>
                <div style={{ display: 'flex', gap: '14px', color: theme.subText }}>
                  <FontAwesomeIcon icon={faHome} title="Chats" style={{ cursor: 'pointer', color: currentTab === 'chats' ? theme.accent : '' }} onClick={() => setCurrentTab('chats')} />
                  <FontAwesomeIcon icon={faSearch} title="Search Node" style={{ cursor: 'pointer', color: currentTab === 'search' ? theme.accent : '' }} onClick={() => setCurrentTab('search')} />
                  <FontAwesomeIcon icon={faFolderPlus} title="Group Deployment" style={{ cursor: 'pointer', color: currentTab === 'create-group' ? theme.accent : '' }} onClick={() => setCurrentTab('create-group')} />
                  <FontAwesomeIcon icon={faUser} title="My Profile View" style={{ cursor: 'pointer', color: ['profile-view', 'edit-profile'].includes(currentTab) ? theme.accent : '' }} onClick={() => setCurrentTab('profile-view')} />
                  <FontAwesomeIcon icon={faGear} title="Control Parameters" style={{ cursor: 'pointer', color: ['settings', 'privacy', 'help-support', 'private-settings'].includes(currentTab) ? theme.accent : '' }} onClick={() => setCurrentTab('settings')} />
                </div>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
              {currentTab === 'chats' && (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: theme.subText, padding: '8px 16px', letterSpacing: '0.5px' }}>Accounts (Directs)</div>
                  {renderRoomListItems(personalRooms)}
                  <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: theme.subText, padding: '16px 16px 8px 16px', letterSpacing: '0.5px' }}>Groups Space</div>
                  {renderRoomListItems(groupRooms)}
                </div>
              )}

              {currentTab === 'search' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="text" placeholder="Search user ID or username..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleGlobalSearch()} style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', border: `1px solid ${theme.border}`, background: theme.bg, color: theme.text, fontSize: '14px', outline: 'none' }} />
                    <button onClick={handleGlobalSearch} style={{ padding: '10px 16px', background: theme.accent, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}><FontAwesomeIcon icon={faSearch} /></button>
                  </div>
                  <div style={{ marginTop: '8px' }}>
                    {searchResults.map(u => (
                      <div key={u.id} onClick={() => openPersonalChat(u)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', borderRadius: '12px', cursor: 'pointer', transition: 'background 0.2s', background: 'transparent' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: getRandomColor(u.username), display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontWeight: '700', overflow: 'hidden' }}>
                          {u.avatar_url && u.avatar_url !== "" ? <img src={u.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : u.username?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span style={{ fontWeight: '600', fontSize: '14px', display: 'block' }}>{u.username}</span>
                          <span style={{ fontSize: '11px', color: theme.subText }}>ID: {u.unique_id}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentTab === 'create-group' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '4px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>New Group Workspace</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '12px', color: theme.subText, fontWeight: '600' }}>Group Name</label>
                    <input type="text" placeholder="Enter workspace name..." value={newGroupName} onChange={e => setNewGroupName(e.target.value)} style={{ padding: '10px 12px', borderRadius: '10px', border: `1px solid ${theme.border}`, background: theme.bg, color: theme.text, fontSize: '14px', outline: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '12px', color: theme.subText, fontWeight: '600' }}>Group Photo URL</label>
                    <input type="text" placeholder="Paste image web connection link..." value={newGroupAvatarUrl} onChange={e => setNewGroupAvatarUrl(e.target.value)} style={{ padding: '10px 12px', borderRadius: '10px', border: `1px solid ${theme.border}`, background: theme.bg, color: theme.text, fontSize: '14px', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: theme.subText, textTransform: 'uppercase' }}>Select Members</label>
                    <div style={{ maxHeight: '160px', overflowY: 'auto', border: `1px solid ${theme.border}`, borderRadius: '10px', marginTop: '6px', padding: '6px', background: theme.bg }}>
                      {allProfilesCache.filter(p => p.id !== currentUser.id).map(p => {
                        const isChosen = groupSelectedUsers.includes(p.id);
                        return (
                          <div key={p.id} onClick={() => setGroupSelectedUsers(prev => isChosen ? prev.filter(id => id !== p.id) : [...prev, p.id])} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', borderRadius: '6px', cursor: 'pointer', background: isChosen ? theme.accentLight : 'transparent' }}>
                            <span style={{ fontSize: '13px' }}>{p.username}</span>
                            <FontAwesomeIcon icon={isChosen ? faCheckSquare : faCircle} style={{ color: isChosen ? theme.accent : theme.border, fontSize: '14px' }} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <button onClick={handleCreateGroup} style={{ width: '100%', padding: '12px', background: theme.accent, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}>Deploy Group</button>
                </div>
              )}

              {/* PROFILE VIEW TAB SEPARATED */}
              {currentTab === 'profile-view' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '4px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>My Profile</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '16px', background: theme.bg, borderRadius: '16px' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: getRandomColor(myProfile.username), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '28px', fontWeight: '800', overflow: 'hidden' }}>
                      {myProfile.avatar_url && myProfile.avatar_url !== "" ? <img src={myProfile.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : myProfile.username?.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontSize: '18px', fontWeight: '700' }}>{myProfile.username}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: theme.card, padding: '16px', borderRadius: '16px', border: `1px solid ${theme.border}` }}>
                    <div>
                      <span style={{ fontSize: '11px', color: theme.subText, textTransform: 'uppercase', fontWeight: '700' }}>Unique Node ID Token</span>
                      <p style={{ margin: '4px 0 0 0', fontWeight: '700', color: theme.accent }}>{myProfile.unique_id || 'Not Assigned'}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: theme.subText, textTransform: 'uppercase', fontWeight: '700' }}>Biography Details</span>
                      <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>{myProfile.biography || 'No biography written'}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: theme.subText, textTransform: 'uppercase', fontWeight: '700' }}>Timestamp Birthday</span>
                      <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}><FontAwesomeIcon icon={faCalendarAlt} /> {myProfile.birthday || 'Not Specified'}</p>
                    </div>
                  </div>
                  <button onClick={() => { setCurrentTab('edit-profile'); syncEditStates(myProfile); }} style={{ width: '100%', padding: '14px', background: theme.accentLight, color: theme.accent, border: `1px solid ${theme.accent}40`, borderRadius: '14px', fontWeight: '700', cursor: 'pointer' }}><FontAwesomeIcon icon={faUserPen} style={{ marginRight: '6px' }} /> Modify Layout Profile</button>
                </div>
              )}

              {/* EDIT PROFILE TAB GRAPHICS VIEW */}
              {currentTab === 'edit-profile' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: theme.accent }} onClick={() => setCurrentTab('profile-view')}>
                    <FontAwesomeIcon icon={faArrowLeft} /> <span style={{ fontSize: '13px', fontWeight: '600' }}>Back to View Profile</span>
                  </div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>Edit Profile Schema</h3>
                  
                  <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: theme.subText }}>Display Nickname</label>
                      <input type="text" value={editUsername} onChange={e => setEditUsername(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${theme.border}`, background: theme.bg, color: theme.text, fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', color: theme.subText }}>Unique Identifier ID (Can't Change)</label>
                      <input type="text" value={myProfile.unique_id || ''} disabled style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${theme.border}`, background: theme.border, color: theme.subText, fontSize: '14px', cursor: 'not-allowed', opacity: 0.6, boxSizing: 'border-box' }} />
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', color: theme.subText }}>Profile Photo URL Link</label>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <input type="text" value={editAvatarUrl} onChange={e => setEditAvatarUrl(e.target.value)} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: `1px solid ${theme.border}`, background: theme.bg, color: theme.text, fontSize: '14px', outline: 'none' }} />
                        <button type="button" onClick={() => window.open('https://img-url1.netlify.app', '_blank')} title="Convert Asset URL Link" style={{ width: '40px', height: '40px', background: theme.accentLight, border: `1px solid ${theme.accent}`, color: theme.accent, borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FontAwesomeIcon icon={faLink} /></button>
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', color: theme.subText }}>Biography Content</label>
                      <textarea value={editBio} onChange={e => setEditBio(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: `1px solid ${theme.border}`, background: theme.bg, color: theme.text, fontSize: '13px', outline: 'none', height: '70px', resize: 'none', boxSizing: 'border-box' }} />
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', color: theme.subText }}>Birthday Timestamp</label>
                      <input type="date" value={editBirthday} onChange={e => setEditBirthday(e.target.value)} style={{ padding: '10px', borderRadius: '10px', border: `1px solid ${theme.border}`, background: theme.bg, color: theme.text, fontSize: '14px', boxSizing: 'border-box' }} />
                    </div>

                    <button type="submit" style={{ padding: '12px', background: theme.accent, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', marginTop: '4px', fontSize: '14px' }}>Commit Settings Parameters</button>
                  </form>
                </div>
              )}

              {/* SETTINGS MENU SELECTION BRANCHES */}
              {currentTab === 'settings' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '12px', borderBottom: `1px solid ${theme.border}` }}>
                    <img src={myProfile.avatar_url} style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${theme.accent}` }} />
                    <div>
                      <h4 style={{ margin: 0, fontSize: '15px' }}>{myProfile.username}</h4>
                      <p style={{ margin: 0, fontSize: '11px', color: theme.subText }}>{currentUser.email}</p>
                    </div>
                  </div>
                  <button onClick={() => setCurrentTab('private-settings')} style={{ width: '100%', padding: '12px', background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: '12px', color: theme.text, fontWeight: '600', textAlign: 'left', cursor: 'pointer' }}><FontAwesomeIcon icon={faUserGear} style={{ marginRight: '8px', color: theme.accent }} /> Private Security Isolation Settings</button>
                  <button onClick={() => setCurrentTab('help-support')} style={{ width: '100%', padding: '12px', background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: '12px', color: theme.text, fontWeight: '600', textAlign: 'left', cursor: 'pointer' }}><FontAwesomeIcon icon={faCircleInfo} style={{ marginRight: '8px', color: theme.accent }} /> Help & Support Documentation</button>
                  <button onClick={() => setDarkMode(!darkMode)} style={{ width: '100%', padding: '12px', background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: '12px', color: theme.text, fontWeight: '600', textAlign: 'left', cursor: 'pointer', display:'flex', justifyContent:'space-between' }}><span><FontAwesomeIcon icon={darkMode ? faSun : faMoon} style={{ marginRight: '8px', color: '#ff9500' }} /> Interface Theme Mode</span><span style={{ fontSize:'11px', color:theme.subText }}>{darkMode ? 'DARK' : 'LIGHT'}</span></button>
                  <button onClick={() => supabase.auth.signOut()} style={{ width: '100%', padding: '12px', background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.2)', borderRadius: '12px', color: '#ff3b30', fontWeight: '700', cursor: 'pointer', marginTop: '12px' }}><FontAwesomeIcon icon={faSignOutAlt} /> Disconnect Active Sockets</button>
                </div>
              )}

              {/* PRIVATE SETTINGS MENU LAYOUT */}
              {currentTab === 'private-settings' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: theme.accent, cursor: 'pointer' }} onClick={() => setCurrentTab('settings')}>
                    <FontAwesomeIcon icon={faArrowLeft} /> <span style={{ fontSize: '13px', fontWeight: '700' }}>Back to Menu Control</span>
                  </div>
                  <h4 style={{ margin: 0, fontSize: '14px', textTransform: 'uppercase', color: theme.subText }}>Privacy Visibility Matrix</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13.5px', fontWeight: '600' }}><FontAwesomeIcon icon={faVolumeMute} style={{ marginRight: '8px', color: theme.subText }} /> Silence System Notification</span>
                    <input type="checkbox" checked={myProfile.privacy_muted || false} onChange={e => handleSavePrivacyConfiguration('privacy_muted', e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: theme.accent }} />
                  </div>
                  {['privacy_profile', 'privacy_bio', 'privacy_birthday'].map(field => (
                    <div key={field} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'capitalize', color: theme.text }}>{field.replace('privacy_', '')} Publicity Isolation Level</span>
                      <select value={myProfile[field] || 'public'} onChange={e => handleSavePrivacyConfiguration(field, e.target.value)} style={{ padding: '8px 12px', background: theme.background, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: '10px', fontSize: '12px', outline: 'none' }}>
                        <option value="public">Public Node Broadcast</option>
                        <option value="only_me">Isolated Locked Mode (Only Me)</option>
                      </select>
                    </div>
                  ))}
                  <hr style={{ border: 'none', height: '1px', background: theme.border }} />
                  <form onSubmit={handlePasswordChangeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: theme.subText }}>ROTATE ACCESS CREDENTIALS</span>
                    <input type="password" placeholder="New structural password..." value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ padding: '10px', borderRadius: '10px', border: `1px solid ${theme.border}`, background: theme.bg, color: theme.text, fontSize: '13px' }} />
                    <button type="submit" style={{ padding: '10px', background: theme.accent, border: 'none', color: '#fff', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '12px' }}>Rotate Password Key</button>
                    <button type="button" onClick={handleForgotPasswordTrigger} style={{ background: 'none', border: 'none', color: theme.accent, fontSize: '12px', textAlign: 'left', cursor: 'pointer', padding: '4px 0' }}><FontAwesomeIcon icon={faLock} /> Transmit Recovery Link Token</button>
                  </form>
                  <hr style={{ border: 'none', height: '1px', background: theme.border }} />
                  <form onSubmit={handleSendFeedback} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: theme.subText }}><FontAwesomeIcon icon={faCommentDots} /> SUBMIT RECURSIVE FEEDBACK REPORT</span>
                    <textarea value={feedbackText} onChange={e => setFeedbackText(e.target.value)} placeholder="Type feedback anomalies..." style={{ padding: '10px', background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: '10px', color: theme.text, fontSize: '13px', height: '60px', resize: 'none' }} />
                    <button type="submit" style={{ padding: '10px', background: theme.accent, border: 'none', color: '#fff', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '12px' }}>Dispatch Telemetry Report</button>
                  </form>
                  <button onClick={executeDeleteAccount} style={{ width: '100%', padding: '12px', background: 'rgba(255,59,48,0.12)', border: '1px solid rgba(255,59,48,0.2)', color: '#ff3b30', borderRadius: '12px', fontWeight: '800', fontSize: '13px', cursor: 'pointer', marginTop: '10px' }}><FontAwesomeIcon icon={faTrash} /> Delete Account permanently</button>
                </div>
              )}

              {/* HELP & SUPPORT DOCUMENTATION SECTION */}
              {currentTab === 'help-support' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: theme.accent, cursor: 'pointer' }} onClick={() => setCurrentTab('settings')}>
                    <FontAwesomeIcon icon={faArrowLeft} /> <span style={{ fontSize: '13px', fontWeight: '700' }}>Back to Configuration Menu</span>
                  </div>
                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}><FontAwesomeIcon icon={faCircleInfo} /> Support Center & Engine Documentation</h4>
                  <div style={{ background: theme.background, padding: '14px', borderRadius: '14px', border: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px', lineHeight: '1.5' }}>
                    <div>
                      <strong style={{ color: theme.text }}>Real-time Synchronizer System</strong>
                      <p style={{ margin: '2px 0 0 0', color: theme.subText }}>ThuTalk updates pipelines recursively across high-fidelity WebSocket streams mapped inside Supabase channel protocols. All message state drops execute across endpoints directly.</p>
                    </div>
                    <div>
                      <strong style={{ color: theme.text }}>Account Purge Mechanics</strong>
                      <p style={{ margin: '2px 0 0 0', color: theme.subText }}>Executing a hard data wipe across chat windows completely purges database records rows without maintaining server cache loops.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CHAT VIEW WORKFLOW ENGINE DESKTOP LAYER PANEL */}
          <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', background: theme.bg, position: 'relative' }}>
            {activeRoomId && currentActiveRoomData ? (
              <>
                {/* FLOATING GLASS CARD HEADER LAYER CONTROL */}
                <div style={{ position: 'absolute', top: '16px', left: '20px', right: '20px', height: '70px', border: `1px solid ${theme.border}`, background: theme.floatingBg, backdropFilter: 'blur(16px)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', zIndex: 100, boxShadow: theme.shadow }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => { if (currentActiveRoomData.type === 'group') { setViewingGroupMeta(true); } else { const matchNode = currentActiveRoomData.room_members?.find(m => m.user_id !== currentUser.id); if (matchNode) setViewingUserTarget(matchNode.profiles); } }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: getRandomColor(currentActiveRoomData.displayName), display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff', fontWeight: '800', fontSize: '15px', overflow:'hidden', flexShrink:0 }}>
                      {currentActiveRoomData.displayAvatar && currentActiveRoomData.displayAvatar !== "" ? <img src={currentActiveRoomData.displayAvatar} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : currentActiveRoomData.displayName?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: theme.text }}>{currentActiveRoomData.displayName}</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: theme.subText, marginTop: '2px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}><FontAwesomeIcon icon={faCircle} style={{ color: '#34c759', fontSize: '7px' }} /> Online encryption socket</span>
                        <span>•</span>
                        <span>{isSearchingChat ? 'filtering...' : 'Active now'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {isSearchingChat ? (
                      <div style={{ display: 'flex', alignItems: 'center', background: theme.bg, borderRadius: '8px', padding: '2px 8px', marginRight: '6px', border: `1px solid ${theme.border}` }}>
                        <input type="text" placeholder="Search node logs..." value={chatSearchQuery} onChange={e => setChatSearchQuery(e.target.value)} style={{ border: 'none', background: 'none', color: theme.text, outline: 'none', fontSize: '12px', width: '120px' }} />
                        <FontAwesomeIcon icon={faXmark} style={{ cursor: 'pointer', opacity: 0.6 }} onClick={() => { setIsSearchingChat(false); setChatSearchQuery(''); }} />
                      </div>
                    ) : (
                      <button onClick={() => setIsSearchingChat(true)} style={{ background: 'none', border: 'none', color: theme.text, fontSize: '16px', cursor: 'pointer', padding: '8px' }}><FontAwesomeIcon icon={faSearch} /></button>
                    )}

                    <div style={{ position: 'relative' }}>
                      <button onClick={() => setRoomHeaderMenuOpen(!roomHeaderMenuOpen)} style={{ background: 'none', border: 'none', color: theme.subText, fontSize: '16px', cursor: 'pointer', padding: '8px' }}>
                        <FontAwesomeIcon icon={faEllipsisVertical} />
                      </button>
                      <AnimatePresence>
                        {roomHeaderMenuOpen && (
                          <>
                            <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 990 }} onClick={() => setRoomHeaderMenuOpen(false)} />
                            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} style={{ position: 'absolute', right: 0, top: '40px', width: '180px', background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', padding: '4px', zIndex: 999, display: 'flex', flexDirection: 'column' }}>
                              <button onClick={toggleMuteRoom} style={{ background: 'none', border: 'none', color: theme.text, padding: '10px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', width: '100%', textAlign: 'left' }}>
                                <FontAwesomeIcon icon={isMuted ? faVolumeUp : faVolumeMute} /> {isMuted ? 'Unmute alerts loop' : 'Silence alerts channel'}
                              </button>
                              <button onClick={handleClearChatDatabase} style={{ background: 'none', border: 'none', color: '#ff3b30', padding: '10px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', width: '100%', textAlign: 'left' }}>
                                <FontAwesomeIcon icon={faTrash} /> Delete Chat History
                              </button>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {/* FLOATING CHAT ANCESTOR HEAD PINNED NOTIFIER STRIP BAR */}
                {pinnedMessage && (
                  <div style={{ position: 'absolute', top: '96px', left: '24px', right: '24px', background: theme.card, borderLeft: `4px solid ${theme.accent}`, borderRadius: '8px', padding: '10px 16px', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <FontAwesomeIcon icon={faThumbtack} style={{ color: theme.accent, fontSize: '12px' }} />
                      <p style={{ margin: 0, fontSize: '13px', color: theme.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pinnedMessage.content}</p>
                    </div>
                    <FontAwesomeIcon icon={faXmark} style={{ cursor: 'pointer', opacity: 0.5, fontSize: '14px' }} onClick={() => togglePinMessage(pinnedMessage)} />
                  </div>
                )}

                {/* Scrollable Message Grid Trace Element Layout */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '105px 24px 100px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {filteredMessages.map((msg) => {
                    const isMe = msg.sender_id === currentUser.id;
                    const isChosen = selectedMessages.includes(msg.id);
                    const replyParentMsg = msg.reply_to_id ? messages.find(m => m.id === msg.reply_to_id) : null;
                    return (
                      <div key={msg.id} onContextMenu={(e) => handleMsgContextMenu(e, msg)} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: '8px', width: '100%' }}>
                        {isSelectMode && (
                          <input type="checkbox" checked={isChosen} onChange={() => {
                            if (isChosen) setSelectedMessages(prev => prev.filter(id => id !== msg.id));
                            else setSelectedMessages(prev => [...prev, msg.id]);
                          }} style={{ width: '18px', height: '18px', marginBottom: '12px', cursor: 'pointer' }} />
                        )}
                        <div style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: '8px', maxWidth: '70%' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: getRandomColor(msg.profiles?.username), display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff', fontSize: '11px', fontWeight: '700', overflow:'hidden', flexShrink:0 }}>
                            {msg.profiles?.avatar_url && msg.profiles.avatar_url !== "" ? <img src={msg.profiles.avatar_url} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : msg.profiles?.username?.charAt(0).toUpperCase()}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                            <span style={{ fontSize: '11px', color: theme.subText, marginBottom: '2px', padding: '0 4px' }}>{msg.profiles?.username}</span>
                            
                            {replyParentMsg && (
                              <div style={{ background: theme.card, borderLeft: `3px solid ${theme.accent}`, padding: '6px 10px', borderRadius: '8px 8px 0 0', fontSize: '12px', opacity: 0.8, color: theme.text, marginBottom: '-4px', width: '100%', boxSizing: 'border-box' }}>
                                <span style={{ ArabianWeight: '700', fontSize: '10px', color: theme.accent }}>Reply chain link context</span>
                                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>{replyParentMsg.content}</span>
                              </div>
                            )}

                            <div style={{ padding: '12px 16px', borderRadius: isMe ? (replyParentMsg ? '0 16px 16px 16px' : '24px 24px 6px 24px') : (replyParentMsg ? '16px 0 16px 16px' : '24px 24px 24px 6px'), background: isMe ? theme.bubbleMe : theme.bubbleUser, color: isMe ? theme.textMe : theme.textUser, fontSize: '14px', lineHeight: '1.4', boxShadow: '0 2px 6px rgba(0,0,0,0.05)', position: 'relative', border: isChosen ? '2px solid #fff' : 'none' }}>
                              {renderMessageContent(msg.content)}
                              {msg.is_pinned && <FontAwesomeIcon icon={faThumbtack} style={{ position: 'absolute', top: '-6px', right: '-6px', fontSize: '10px', color: theme.accent, background: theme.card, padding: '3px', borderRadius: '50%' }} />}
                            </div>
                            <span style={{ fontSize: '9px', opacity: 0.6, marginTop: '2px', padding: '0 4px' }}>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* INPUT BAR FLOATING DOCK SEGMENT AT DISPATCH BOTTOM */}
                <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px', background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '20px', padding: '12px', zIndex: 100, boxShadow: '0 -8px 32px rgba(0,0,0,0.05)' }}>
                  <AnimatePresence>
                    {isSelectMode && selectedMessages.length > 0 && (
                      <div style={{ background: theme.card, padding: '8px 12px', borderRadius: '10px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px' }}>Selected Packet Count: {selectedMessages.length}</span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={executeBulkDeleteSelected} style={{ background: '#ff3b30', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>Purge Highlighted</button>
                          <button onClick={() => { setIsSelectMode(false); setSelectedMessages([]); }} style={{ background: 'none', border: `1px solid ${theme.border}`, color: theme.text, padding: '6px 12px', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
                        </div>
                      </div>
                    )}
                    {replyTarget && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: theme.bg, padding: '8px 12px', borderRadius: '10px', marginBottom: '8px' }}>
                        <div>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: theme.accent }}>Replying trace parameter source node</span>
                          <p style={{ margin: 0, fontSize: '13px', color: theme.subText, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '400px' }}>{replyTarget.content}</p>
                        </div>
                        <FontAwesomeIcon icon={faXmark} style={{ cursor: 'pointer', padding: '4px' }} onClick={() => setReplyTarget(null)} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input type="text" placeholder={myMemberStatus === 'banned' ? 'ReadOnly trace connection active...' : 'Transmit secure data parameters text stream...'} value={newMessage} disabled={myMemberStatus === 'banned'} onChange={handleInputTyping} style={{ flex: 1, padding: '14px 18px', borderRadius: '12px', border: `1px solid ${theme.border}`, background: theme.bg, color: theme.text, fontSize: '14px', outline: 'none' }} />
                    <button type="submit" disabled={!newMessage.trim() || myMemberStatus === 'banned'} style={{ height: '46px', width: '46px', borderRadius: '12px', background: theme.accent, color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><FontAwesomeIcon icon={faPaperPlane} /></button>
                  </form>
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: theme.subText }}>
                <FontAwesomeIcon icon={faMessage} style={{ fontSize: '48px', marginBottom: '16px', color: theme.border }} />
                <h3>Select an unmonitored communication network route loop</h3>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== VIEWPORT 2: MOBILE MODE LAYOUT ENGINE ==================== */}
      {isMobile && (
        <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          
          {/* Main Display Sub-tabs switches */}
          <div style={{ flex: 1, overflowY: 'auto', width: '100%', height: 'calc(100% - 70px)' }}>
            {!activeRoomId && currentTab === 'chats' && (
              <div style={{ padding: '16px 20px' }}>
                <span style={{ fontSize: '24px', fontWeight: '900', display: 'block', marginBottom: '16px', color: theme.accent }}>ThuTalk</span>
                <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: theme.subText, padding: '8px 4px' }}>Accounts (Directs)</div>
                {renderRoomListItems(personalRooms)}
                <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: theme.subText, padding: '16px 4px 8px 4px' }}>Groups Channel List</div>
                {renderRoomListItems(groupRooms)}
              </div>
            )}

            {!activeRoomId && currentTab === 'search' && (
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <span style={{ fontSize: '20px', fontWeight: '800' }}>Search Connections</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="text" placeholder="Search Talk-ID or Username token..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', border: `1px solid ${theme.border}`, background: theme.card, color: theme.text }} />
                  <button onClick={handleGlobalSearch} style={{ padding: '10px 16px', background: theme.accent, color: '#fff', border: 'none', borderRadius: '10px' }}><FontAwesomeIcon icon={faSearch} /></button>
                </div>
                <div>
                  {searchResults.map(u => (
                    <div key={u.id} onClick={() => openPersonalChat(u)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: theme.card, borderBottom: `1px solid ${theme.border}`, borderRadius: '14px', marginBottom: '6px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: getRandomColor(u.username), display:'flex', alignItems:'center', justifyContent:'center', color:'white' }}>{u.username?.charAt(0).toUpperCase()}</div>
                      <span style={{ fontWeight: '600' }}>{u.username}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!activeRoomId && currentTab === 'create-group' && (
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <span style={{ fontSize: '20px', fontWeight: '800' }}>Deploy Group Node</span>
                <input type="text" placeholder="Group Profile Title Designation" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} style={{ padding: '12px', borderRadius: '10px', border: `1px solid ${theme.border}`, background: theme.card, color: theme.text }} />
                <input type="text" placeholder="Group Photo Image URL Connection Link" value={newGroupAvatarUrl} onChange={e => setNewGroupAvatarUrl(e.target.value)} style={{ padding: '12px', borderRadius: '10px', border: `1px solid ${theme.border}`, background: theme.card, color: theme.text }} />
                <div style={{ maxHeight: '140px', overflowY: 'auto', border: `1px solid ${theme.border}`, borderRadius: '10px', padding: '6px' }}>
                  {allProfilesCache.filter(p => p.id !== currentUser.id).map(p => {
                    const isChosen = groupSelectedUsers.includes(p.id);
                    return (
                      <div key={p.id} onClick={() => setGroupSelectedUsers(prev => isChosen ? prev.filter(id => id !== p.id) : [...prev, p.id])} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px' }}>
                        <span>{p.username}</span>
                        <FontAwesomeIcon icon={isChosen ? faCheckSquare : faCircle} style={{ color: isChosen ? theme.accent : theme.border }} />
                      </div>
                    );
                  })}
                </div>
                <button onClick={handleCreateGroup} style={{ width: '100%', padding: '12px', background: theme.accent, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700' }}>Assemble Group Hub Node</button>
              </div>
            )}

            {/* MOBILE SYSTEM ISOLATED PROFILE PREVIEW */}
            {!activeRoomId && currentTab === 'profile-view' && (
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <span style={{ fontSize: '22px', fontWeight: '800' }}>My Profile Node</span>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '24px 20px', background: theme.card, borderRadius: '20px', border: `1px solid ${theme.border}` }}>
                  <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: getRandomColor(myProfile.username), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '24px', fontWeight: 'bold', overflow: 'hidden' }}>
                    {myProfile.avatar_url && myProfile.avatar_url !== "" ? <img src={myProfile.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : myProfile.username?.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontSize: '18px', fontWeight: '700' }}>{myProfile.username}</span>
                  <span style={{ fontSize: '12px', color: theme.accent }}>ID Token: {myProfile.unique_id}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', background: theme.card, padding: '14px', borderRadius: '16px', border: `1px solid ${theme.border}` }}>
                  <div><span style={{ color: theme.subText, fontSize: '11px', fontWeight: '800' }}>BIOGRAPHY</span><p style={{ margin: '2px 0 0 0' }}>{myProfile.biography || 'Empty data trace context'}</p></div>
                  <div><span style={{ color: theme.subText, fontSize: '11px', fontWeight: '800' }}>BIRTHDAY</span><p style={{ margin: '2px 0 0 0' }}>{myProfile.birthday || 'Not calibrated'}</p></div>
                </div>
                <button onClick={() => { setCurrentTab('edit-profile'); syncEditStates(myProfile); }} style={{ width: '100%', padding: '12px', background: theme.accentLight, border: `1px solid ${theme.accent}40`, color: theme.accent, borderRadius: '12px', fontWeight: '700' }}><FontAwesomeIcon icon={faUserPen} /> Edit Profile Config</button>
              </div>
            )}

            {/* MOBILE SYSTEM ISOLATED EDIT PROFILE PANEL */}
            {!activeRoomId && currentTab === 'edit-profile' && (
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: theme.accent, cursor: 'pointer' }} onClick={() => setCurrentTab('profile-view')}>
                  <FontAwesomeIcon icon={faArrowLeft} /> <span>Back to Profile View</span>
                </div>
                <span style={{ fontSize: '20px', fontWeight: '800' }}>Modify Profile Config</span>
                
                <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <input type="text" value={editUsername} onChange={e => setEditUsername(e.target.value)} placeholder="Username" style={{ padding: '12px', borderRadius: '10px', border: `1px solid ${theme.border}`, background: theme.card, color: theme.text, outline: 'none' }} />
                  <input type="text" value={myProfile.unique_id || ''} disabled style={{ padding: '12px', borderRadius: '10px', border: `1px solid ${theme.border}`, background: theme.border, color: theme.subText, opacity: 0.6 }} />
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="text" value={editAvatarUrl} onChange={e => setEditAvatarUrl(e.target.value)} placeholder="Avatar Photo URL Link Connection" style={{ flex: 1, padding: '12px', borderRadius: '10px', border: `1px solid ${theme.border}`, background: theme.card, color: theme.text, outline: 'none' }} />
                    <button type="button" onClick={() => window.open('https://img-url1.netlify.app', '_blank')} style={{ padding: '12px', background: theme.accentLight, border: `1px solid ${theme.accent}`, color: theme.accent, borderRadius: '10px' }}><FontAwesomeIcon icon={faLink} /></button>
                  </div>
                  <textarea value={editBio} onChange={e => setEditBio(e.target.value)} placeholder="Biography details..." style={{ padding: '12px', borderRadius: '10px', border: `1px solid ${theme.border}`, background: theme.card, color: theme.text, height: '70px', resize: 'none', outline: 'none' }} />
                  <input type="date" value={editBirthday} onChange={e => setEditBirthday(e.target.value)} style={{ padding: '12px', borderRadius: '10px', border: `1px solid ${theme.border}`, background: theme.card, color: theme.text }} />
                  <button type="submit" style={{ padding: '14px', background: theme.accent, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700' }}>Commit Changes</button>
                </form>
              </div>
            )}

            {/* MOBILE SYSTEM ISOLATED SETTINGS & PRIVACY MATRIX */}
            {!activeRoomId && currentTab === 'settings' && (
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <span style={{ fontSize: '22px', fontWeight: '800' }}>Settings & Privacy Sub-routine</span>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '12px', borderBottom: `1px solid ${theme.border}` }}>
                  <img src={myProfile.avatar_url} style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${theme.accent}` }} />
                  <div>
                    <h4 style={{ margin: 0, fontSize: '15px' }}>{myProfile.username}</h4>
                    <p style={{ margin: 0, fontSize: '11px', color: theme.subText }}>{currentUser.email}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', background: theme.card, padding: '16px', borderRadius: '16px', border: `1px solid ${theme.border}` }}>
                  <h4 style={{ margin: 0, fontSize: '14px', color: theme.accent, textTransform: 'uppercase', fontWeight: '800' }}>Private Isolation Settings</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13.5px', fontWeight: '600' }}><FontAwesomeIcon icon={faVolumeMute} style={{ marginRight: '8px' }} /> Silence Notification Alerts</span>
                    <input type="checkbox" checked={myProfile.privacy_muted || false} onChange={e => handleSavePrivacyConfiguration('privacy_muted', e.target.checked)} style={{ width: '18px', height: '18px', accentColor: theme.accent }} />
                  </div>
                  {['privacy_profile', 'privacy_bio', 'privacy_birthday'].map(field => (
                    <div key={field} style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'capitalize' }}>{field.replace('privacy_', '')} Publicity Isolation Level</span>
                      <select value={myProfile[field] || 'public'} onChange={e => handleSavePrivacyConfiguration(field, e.target.value)} style={{ padding: '8px 12px', background: theme.background, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: '10px', fontSize: '12px' }}>
                        <option value="public">Public Node Broadcast</option>
                        <option value="only_me">Isolated Locked Mode (Only Me)</option>
                      </select>
                    </div>
                  ))}
                </div>

                <div style={{ background: theme.card, padding: '16px', borderRadius: '14px', fontSize: '11px', color: theme.subText, lineHeight: '1.5', border: `1px solid ${theme.border}` }}>
                  <h5><FontAwesomeIcon icon={faFileContract} /> Terms of Operation Policies</h5>
                  Decentralized messaging array data packets purge elements recursively upon active interface drop operations triggers safely.
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button onClick={() => { setDarkMode(!darkMode); showNotification('Theme variable toggled'); }} style={{ padding: '14px', borderRadius: '12px', background: theme.card, border: `1px solid ${theme.border}`, color: theme.text, fontWeight: '700' }}><FontAwesomeIcon icon={darkMode ? faSun : faMoon} /> Switch Display Alignment</button>
                  <button onClick={async () => { await supabase.auth.signOut(); window.location.reload(); }} style={{ padding: '14px', borderRadius: '12px', background: theme.accent, color: '#fff', fontWeight: '700', border: 'none' }}>Disconnect Socket</button>
                  <button onClick={executeDeleteAccount} style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.2)', color: '#ff3b30', fontWeight: '700' }}>Terminate Profile Account</button>
                </div>
              </div>
            )}

            {/* MOBILE INTERACTIVE FULL SCREEN CHAT INTERFACE WINDOW */}
            {activeRoomId && currentActiveRoomData && (
              <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: theme.bg, zIndex: 500, display: 'flex', flexDirection: 'column' }}>
                {/* Floating Navigation Core Card Header Bar row layout */}
                <div style={{ position: 'absolute', top: '10px', left: '10px', right: '10px', height: '60px', background: theme.floatingBg, backdropFilter: 'blur(16px)', borderRadius: '18px', border: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', padding: '0 14px', gap: '10px', zIndex: 510, boxShadow: theme.shadow }}>
                  <FontAwesomeIcon icon={faArrowLeft} style={{ fontSize: '16px', cursor: 'pointer', paddingRight: '4px' }} onClick={() => { setActiveRoomId(null); setActiveRoomData(null); }} />
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: getRandomColor(currentActiveRoomData.name), display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:'bold', fontSize:'13px', overflow:'hidden', flexShrink:0 }} onClick={() => { if (currentActiveRoomData.type === 'group') { setViewingGroupMeta(true); } else { const alternative = currentActiveRoomData.room_members?.find(m => m.user_id !== currentUser.id); if (alternative) setViewingUserTarget(alternative.profiles); } }}>
                    {currentActiveRoomData.avatar_url && currentActiveRoomData.avatar_url !== "" ? <img src={currentActiveRoomData.avatar_url} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : currentActiveRoomData.name?.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentActiveRoomData.name}</h4>
                    <div style={{ fontSize: '10px', color: '#34c759', fontWeight: 'bold' }}>Online handshakes sync</div>
                  </div>
                  <FontAwesomeIcon icon={faEllipsisVertical} onClick={() => setShowHeaderMenu(!showHeaderMenu)} style={{ padding: '6px', cursor: 'pointer' }} />
                  
                  {showHeaderMenu && (
                    <div style={{ position: 'absolute', right: '10px', top: '55px', width: '160px', background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '4px', zIndex: 600, display: 'flex', flexDirection: 'column' }}>
                      <button onClick={handleClearChatDatabase} style={{ background: 'none', border: 'none', color: '#ff3b30', padding: '8px', fontSize: '12px', textAlign: 'left', fontWeight: '700' }}><FontAwesomeIcon icon={faTrash} /> Clear History</button>
                    </div>
                  )}
                </div>

                {/* Sub-floating layer Pinned Notifier bar row display */}
                {pinnedMessage && (
                  <div style={{ position: 'absolute', top: '76px', left: '14px', right: '14px', background: theme.floatingBg, backdropFilter: 'blur(10px)', borderLeft: `3px solid ${theme.accent}`, padding: '8px 12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', zIndex: 505, boxShadow: theme.shadow }}>
                    <span style={{ fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '85%' }}>📌 {pinnedMessage.content}</span>
                    <FontAwesomeIcon icon={faXmark} style={{ opacity: 0.6 }} onClick={() => togglePinMessage(pinnedMessage)} />
                  </div>
                )}

                {/* Mobile Scroller Stream Block Grid */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '85px 16px 85px 16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {filteredMessages.map(msg => {
                    const isMe = msg.sender_id === currentUser.id;
                    const nestedReply = msg.reply_to_id ? messages.find(m => m.id === msg.reply_to_id) : null;
                    return (
                      <div key={msg.id} onContextMenu={(e) => handleMsgContextMenu(e, msg)} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: '8px', width: '100%' }}>
                        <div style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: '8px', maxWidth: '80%' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: getRandomColor(msg.profiles?.username), display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff', fontSize: '11px', fontWeight: '700', overflow:'hidden', flexShrink:0 }}>
                            {msg.profiles?.avatar_url && msg.profiles.avatar_url !== "" ? <img src={msg.profiles.avatar_url} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : msg.profiles?.username?.charAt(0).toUpperCase()}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                            <span style={{ fontSize: '11px', color: theme.subText, marginBottom: '2px', padding: '0 4px' }}>{msg.profiles?.username}</span>
                            {nestedReply && (
                              <div style={{ background: theme.card, padding: '4px 8px', borderRadius: '6px', fontSize: '11px', opacity: 0.7, marginBottom: '-2px' }}>
                                ↳ {nestedReply.content}
                              </div>
                            )}
                            <div style={{ padding: '10px 14px', borderRadius: isMe ? '14px 14px 4px 14px' : '14px 14px 14px 4px', background: isMe ? theme.bubbleMe : theme.bubbleUser, color: isMe ? theme.textMe : theme.textUser, fontSize: '13.5px', wordBreak: 'break-word' }}>
                              {renderMessageContent(msg.content)}
                            </div>
                            <span style={{ fontSize: '9px', opacity: 0.6, marginTop: '2px', padding: '0 4px' }}>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Mobile Floating Input Dock row layout configuration */}
                <div style={{ position: 'absolute', bottom: '10px', left: '10px', right: '10px', background: theme.floatingBg, backdropFilter: 'blur(16px)', borderRadius: '18px', padding: '8px', border: `1px solid ${theme.border}`, zIndex: 510, boxShadow: theme.shadow, display: 'flex', flexDirection: 'column' }}>
                  {replyTarget && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', background: theme.bg, padding: '6px 12px', fontSize: '11px', borderRadius: '8px', marginBottom: '4px' }}>
                      <span>Replying payload text trace...</span>
                      <FontAwesomeIcon icon={faXmark} onClick={() => setReplyTarget(null)} />
                    </div>
                  )}
                  <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <input type="text" placeholder="Message trace payload..." value={newMessage} onChange={handleInputTyping} style={{ flex: 1, padding: '10px 12px', borderRadius: '12px', border: `1px solid ${theme.border}`, background: theme.bg, color: theme.text, fontSize: '13.5px', outline: 'none' }} />
                    <button type="submit" style={{ width: '38px', height: '38px', borderRadius: '50%', background: theme.accent, border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FontAwesomeIcon icon={faPaperPlane} size="sm" /></button>
                  </form>
                </div>
              </div>
            )}
          </div>

          {/* LOWER MOBILE FLOATING NAVIGATION SPRING ASSISTED BAR (LIQUID SHADOW INJECTED) */}
          {!activeRoomId && (
            <div style={{ position: 'fixed', bottom: '16px', left: '4%', width: '92%', height: '64px', background: theme.card, borderRadius: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.25)', border: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 99, padding: '0 8px', boxSizing: 'border-box' }}>
              {tabsConfig.map(tab => {
                const isSelected = tab.match ? tab.match.includes(currentTab) : currentTab === tab.id;
                return (
                  <button 
                    key={tab.id}
                    onClick={() => { setCurrentTab(tab.id); setActiveRoomId(null); }}
                    style={{ background: 'none', border: 'none', color: isSelected ? theme.accent : theme.subText, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer', width: '54px', height: '100%', justifyContent: 'center', position: 'relative', outline: 'none' }}
                  >
                    {isSelected && (
                      <motion.div 
                        layoutId="liquid-pill-mobile"
                        transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                        style={{ position: 'absolute', top: '5px', bottom: '5px', left: 0, right: 0, background: theme.accentLight, borderRadius: '18px', zIndex: -1, boxShadow: `0 4px 14px ${theme.accent}35`, border: `1px solid ${theme.accent}20` }}
                      />
                    )}
                    <FontAwesomeIcon icon={tab.icon} style={{ fontSize: isSelected ? '17px' : '15px', transition: 'transform 0.15s', transform: isSelected ? 'scale(1.08)' : 'scale(1)' }} />
                    <span style={{ fontSize: '9px', fontWeight: '700' }}>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CLUSTER GROUP TOPOLOGY USER ROSTER LEDGER ACTION MODAL OVERLAY */}
      <AnimatePresence>
        {viewingGroupMeta && currentActiveRoomData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', zIndex: 99999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px', boxSizing: 'border-box' }} onClick={() => setViewingGroupMeta(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} transition={{ duration: 0.15 }} style={{ background: theme.card, borderRadius: '28px', padding: '24px', width: '100%', maxWidth: '380px', border: `1px solid ${theme.border}`, boxShadow: theme.shadow }} onClick={e => e.stopPropagation()}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: '800', textAlign: 'center' }}>Group Control Panel</h3>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: getRandomColor(currentActiveRoomData.name), display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'24px', fontWeight:'bold', overflow:'hidden' }}>
                  {currentActiveRoomData.avatar_url && currentActiveRoomData.avatar_url !== "" ? <img src={currentActiveRoomData.avatar_url} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : currentActiveRoomData.name?.charAt(0).toUpperCase()}
                </div>
                <h4 style={{ margin: 0, fontSize: '18px' }}>{currentActiveRoomData.name}</h4>
              </div>
              <div style={{ margin: '16px 0', maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {roomMembers.map(member => (
                  <div key={member.user_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: theme.bg, borderRadius: '14px', border: `1px solid ${theme.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: getRandomColor(member.profiles?.username), display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'12px', overflow:'hidden' }}>
                        {member.profiles?.avatar_url ? <img src={member.profiles.avatar_url} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : member.profiles?.username?.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: '700', fontSize: '14px' }}>{member.profiles?.username}</span>
                        <span style={{ fontSize: '11px', color: theme.accent, fontWeight: '800' }}>{member.role?.toUpperCase()} {member.status === 'banned' && '[MUTED]'}</span>
                      </div>
                    </div>
                    {['owner', 'admin'].includes(myRoomRole) && member.user_id !== currentUser.id && (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {myRoomRole === 'owner' && member.role !== 'admin' && <button onClick={() => manageMemberAction(member.user_id, 'admin')} style={{ background: theme.accent, border: 'none', color: '#fff', padding: '6px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>Admin</button>}
                        {member.status !== 'banned' && <button onClick={() => manageMemberAction(member.user_id, 'ban_text')} style={{ background: '#ff9500', border: 'none', color: '#fff', padding: '6px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>Mute</button>}
                        <button onClick={() => manageMemberAction(member.user_id, 'kick')} style={{ background: '#ff3b30', border: 'none', color: '#fff', padding: '6px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>Kick</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={() => setViewingGroupMeta(false)} style={{ width: '100%', padding: '14px', background: theme.border, border: 'none', color: theme.text, borderRadius: '16px', fontWeight: '800', cursor: 'pointer', fontSize: '15px' }}>Close Diagnostics View</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DETACHED ISOLATED USER PORFOLIO TARGET VIEW MODAL OVERLAY */}
      <AnimatePresence>
        {viewingUserTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', zIndex: 99999, display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={() => setViewingUserTarget(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} style={{ background: theme.card, borderRadius: '24px', padding: '24px', width: '340px', border: `1px solid ${theme.border}`, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px' }} onClick={e => e.stopPropagation()}>
              <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: getRandomColor(viewingUserTarget.username), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '28px', fontWeight: '800', margin: '0 auto', overflow: 'hidden' }}>
                {viewingUserTarget.avatar_url && viewingUserTarget.avatar_url !== "" ? <img src={viewingUserTarget.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : viewingUserTarget.username?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '800' }}>{viewingUserTarget.username}</h3>
                <span style={{ fontSize: '12px', color: theme.accent, fontWeight: '700' }}>@{viewingUserTarget.unique_id}</span>
              </div>
              <div style={{ textAlign: 'left', background: theme.bg, padding: '14px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <span style={{ fontSize: '10px', fontWeight: '800', color: theme.subText }}>BIOGRAPHY</span>
                  <p style={{ margin: '2px 0 0 0', fontSize: '13.5px' }}>{viewingUserTarget.privacy_bio === 'public' ? viewingUserTarget.biography : '🔒 Isolated Vault Content'}</p>
                </div>
                <div>
                  <span style={{ fontSize: '10px', fontWeight: '800', color: theme.subText }}>BIRTHDAY</span>
                  <p style={{ margin: '2px 0 0 0', fontSize: '13.5px' }}>{viewingUserTarget.privacy_birthday === 'public' ? viewingUserTarget.birthday : '🔒 Isolated Vault Content'}</p>
                </div>
              </div>
              <button onClick={() => setViewingUserTarget(null)} style={{ width: '100%', padding: '12px', background: theme.border, border: 'none', color: theme.text, borderRadius: '14px', fontWeight: '700', cursor: 'pointer' }}>Close Spectrum View</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}