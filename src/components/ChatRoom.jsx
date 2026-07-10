import React, { useEffect, useState, useRef, useMemo } from 'react';
import { supabase } from '../config/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { requestNotificationPermission } from '../config/firebaseClient';

// Font Awesome Icon Pack Injection
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faMessage, faSearch, faGear, faFolderPlus, faEllipsisVertical, 
  faArrowLeft, faPaperPlane, faVolumeMute, faVolumeUp, faTrash, 
  faBan, faPen, faThumbtack, faReply, faCopy, faEye, faMoon, faSun, 
  faLock, faSignOutAlt, faUserShield, faUserPlus, faUserMinus, 
  faCalendarAlt, faAddressCard, faCheck, faShieldAlt, faUserCheck, 
  faQuoteLeft, faCircle, faUserPen, faUserCircle, faHome, faUserGroup, 
  faXmark, faCheckSquare, faTimesCircle, faGlobe, faUserLock,
  faLink, faUser, faTrashCan, faFileContract, faCircleInfo, faCommentDots, faFaceSmile, 
  faShieldHalved, faUserGear, faUnlock, faWrench, faBullhorn, faRobot,
  faCertificate, faExclamationTriangle, faClock
} from '@fortawesome/free-solid-svg-icons';

const emojiOptions = ['😂','😆','😊','❤️','😡','😢','🙂','😮','🤗','👍','🎉','🔥','🙌','😌','🫡','🤮','🗿'];
const telegramBotToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
const telegramChatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;

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
  const [currentTab, setCurrentTab] = useState('chats'); 
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [isViewingInfo, setIsViewingInfo] = useState(false); 
  const [darkMode, setDarkMode] = useState(true);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 840 : false);

  // App Core State
  const [myProfile, setMyProfile] = useState({ username: '', unique_id: '', avatar_url: '', biography: '', birthday: '', privacy_muted: false, privacy_bio: 'public', privacy_profile: 'public', privacy_birthday: 'public', role: 'member' });
  const [rooms, setRooms] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [roomMembers, setRoomMembers] = useState([]);
  const [myRoomRole, setMyRoomRole] = useState('member');
  const [myMemberStatus, setMyMemberStatus] = useState('active');
  const [isMuted, setIsMuted] = useState(false);

  // Global Maintenance State
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Dynamic Real-time Status Indicators
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Real-time Presence States (Seen, Online, Offline Header Sync System)
  const [userPresenceList, setUserPresenceList] = useState({});
  const [isGroupAddMemberOpen, setIsGroupAddMemberOpen] = useState(false);

  // Interface Interactive Views States
  const [searchQuery, setSearchQuery] = useState('');
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [isSearchingChat, setIsSearchingChat] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  
  // Create Group Parameters Enhanced
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupAvatarUrl, setNewGroupAvatarUrl] = useState('https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=150&h=150');
  const [groupSelectedUsers, setGroupSelectedUsers] = useState([]);
  const [allProfilesCache, setAllProfilesCache] = useState([]);

  // Admin Panel Dedicated Component State Elements
  const [adminBroadcastText, setAdminBroadcastText] = useState('');
  const [adminSelectedUser, setAdminSelectedUser] = useState(null);
  const [adminUserWarningText, setAdminUserWarningText] = useState('');
  const [banDuration, setBanDuration] = useState('lifetime'); 

  // Feedback & Security Temporary Inputs State
  const [feedbackText, setFeedbackText] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Context Menus & Action Intermediaries
  const [activeMenuMessageId, setActiveMenuMessageId] = useState(null);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [replyTarget, setReplyTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [roomHeaderMenuOpen, setRoomHeaderMenuOpen] = useState(false);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false); 

  // Chat List Item Press Context Menu State Options
  const [activeMenuRoomId, setActiveMenuRoomId] = useState(null);
  const [roomMenuPosition, setRoomMenuPosition] = useState({ x: 0, y: 0 });

  // Form Field Local Temporary Edit States
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editBirthday, setEditBirthday] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');

  // In-App Notification System State
  const [notifications, setNotifications] = useState([]);

  // UI Reference Nodes
  const messagesEndRef = useRef(null);
  const activeRoomIdRef = useRef(activeRoomId);
  const roomsRef = useRef(rooms);
  const myProfileRef = useRef(myProfile);

  // Real-time notification synchronization references
  useEffect(() => { activeRoomIdRef.current = activeRoomId; }, [activeRoomId]);
  useEffect(() => { roomsRef.current = rooms; }, [rooms]);
  useEffect(() => { myProfileRef.current = myProfile; }, [myProfile]);

  // 🔔 NEW FEATURE: Hardware Back Key Navigation Interception Loop Protocol
  useEffect(() => {
    const handleHardwareBackAction = (event) => {
      if (activeRoomIdRef.current) {
        event.preventDefault();
        setActiveRoomId(null);
        setIsViewingInfo(false);
        setCurrentTab('chats');
        window.history.pushState(null, null, window.location.pathname);
      }
    };

    window.history.pushState(null, null, window.location.pathname);
    window.addEventListener('popstate', handleHardwareBackAction);

    return () => {
      window.removeEventListener('popstate', handleHardwareBackAction);
    };
  }, []);

  useEffect(() => {
    if (!activeRoomId) return;
    window.history.pushState({ roomId: activeRoomId }, null, window.location.pathname);
  }, [activeRoomId]);

  // 🔔 NEW FEATURE: Real-time Global Presence System Tracking (Online/Last Seen Status Setup)
  useEffect(() => {
    if (!currentUser) return;

    const presenceChannel = supabase.channel('online-presence-hub', {
      config: { presence: { key: currentUser.id } }
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const formattedPresence = {};
        Object.keys(state).forEach((uid) => {
          formattedPresence[uid] = { status: 'online', last_seen: new Date().toISOString() };
        });
        setUserPresenceList(formattedPresence);
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        setUserPresenceList(prev => ({ ...prev, [key]: { status: 'online', last_seen: new Date().toISOString() } }));
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setUserPresenceList(prev => ({ ...prev, [key]: { status: 'offline', last_seen: new Date().toISOString() } }));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ user_id: currentUser.id, online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, [currentUser]);

  // Enhanced Light / Dark Mode Colors Configs
  const theme = useMemo(() => ({
    bg: darkMode ? '#0c0c0e' : '#f4f5f7',
    card: darkMode ? '#16161a' : '#ffffff',
    border: darkMode ? '#24242b' : '#d2d6dc',
    text: darkMode ? '#f3f4f6' : '#111827',
    subText: darkMode ? '#8e8e93' : '#4b5563',
    accent: '#007aff',
    accentLight: darkMode ? 'rgba(0, 122, 255, 0.18)' : 'rgba(0, 122, 255, 0.1)',
    bubbleMe: '#00142a',
    bubbleUser: darkMode ? '#24242b' : '#e5e7eb',
    textMe: '#ffffff',
    textUser: darkMode ? '#f3f4f6' : '#111827',
    floatingBg: darkMode ? 'rgba(22, 22, 26, 0.85)' : 'rgba(255, 255, 255, 0.9)',
    shadow: darkMode ? '0 12px 32px rgba(0,0,0,0.5)' : '0 12px 32px rgba(31,41,55,0.12)',
    adminMark: darkMode ? '#ffffff' : '#000000'
  }), [darkMode]);

  const showNotification = (message, type = 'success') => {
    const id = Date.now();
    setNotifications(prev => {
      const next = [...prev.slice(-2), { id, message, type }];
      return next;
    });
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 2000);
  };

  const triggerPushNotification = (title, bodyContext) => {
    if (myProfileRef.current?.privacy_muted === true) {
      return; 
    }

    if (typeof window !== 'undefined' && "Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        body: bodyContext,
        icon: 'https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?w=128&h=128&fit=crop'
      });
    }
  };

  useEffect(() => {
    const handleStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

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
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMsg = payload.new;
        
        if (newMsg.sender_id !== currentUser.id) {
          const currentRoomContext = roomsRef.current.find(r => r.id === newMsg.room_id);
          if (currentRoomContext && !currentRoomContext.isMuted) {
            if (activeRoomIdRef.current !== newMsg.room_id) {
              showNotification(`New message from ${currentRoomContext.displayName}`, 'success');
              triggerPushNotification(`ItalK Matrix: ${currentRoomContext.displayName}`, newMsg.content);
            }
          }
        }

        if (activeRoomIdRef.current === newMsg.room_id) {
          fetchMessagesForRoom(newMsg.room_id);
        }
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
  }, [currentUser]);

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
            avatar_url: 'https://img-url1.netlify.app/default',
            biography: 'Hello! I am using Imaginary talK.',
            birthday: '2000-01-01',
            privacy_bio: 'public',
            privacy_profile: 'public',
            privacy_birthday: 'public',
            privacy_muted: false,
            role: 'member'
          }])
          .select()
          .single();

        if (insertError) throw insertError;
        setMyProfile(insertedData);
        syncEditStates(insertedData);

        await handleBotWelcomeGreeting(insertedData);
      } else {
        setMyProfile(data);
        syncEditStates(data);
      }
    } catch (err) {
      showNotification('Error loading profile: ' + err.message, 'error');
    }
  };

  const handleBotWelcomeGreeting = async (newProfileData) => {
    try {
      let { data: botRoom, error: roomErr } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('is_bot_channel', true)
        .maybeSingle();

      if (!botRoom && !roomErr) {
        const { data: createdRoom, error: createErr } = await supabase
          .from('chat_rooms')
          .insert([{ type: 'personal', name: 'ItalK Official Noti Bot', is_bot_channel: true }])
          .select().single();
        
        if (!createErr) botRoom = createdRoom;
      }

      if (botRoom) {
        await supabase.from('room_members').insert([
          { room_id: botRoom.id, user_id: currentUser.id, role: 'member', status: 'active', is_pinned: false, is_muted: false }
        ]);

        await supabase.from('messages').insert([{
          room_id: botRoom.id,
          sender_id: null, 
          content: `Welcome ${newProfileData.username} to ItalK Network Structure! This is a secure Read-Only transmission system for official alerts. Status: Operational.`,
          is_bot_generated: true
        }]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const syncEditStates = (profile) => {
    setEditUsername(profile.username || '');
    setEditBio(profile.biography || '');
    setEditBirthday(profile.birthday || '');
    setEditAvatarUrl(profile.avatar_url || '');
  };

  const fetchRoomsList = async () => {
    try {
      const { data: memberships, error: memError } = await supabase
        .from('room_members')
        .select('room_id, is_muted, is_pinned, status, role')
        .eq('user_id', currentUser.id);

      if (memError) throw memError;
      if (!memberships || memberships.length === 0) {
        setRooms([]);
        return;
      }

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

        if (room.is_bot_channel || room.name === 'ItalK Official Noti Bot') {
          roomTitle = "ItalK Official Noti Bot";
          roomAvatar = "https://images.unsplash.com/photo-1546776310-eef45dd6d63c?w=150&h=150&fit=crop";
        } else if (room.type === 'personal') {
          const alternateMember = room.room_members?.find(m => m.user_id !== currentUser.id);
          if (alternateMember && alternateMember.profiles) {
            roomTitle = alternateMember.profiles.username;
            roomAvatar = alternateMember.profiles.privacy_profile === 'public' || alternateMember.user_id === currentUser.id
              ? alternateMember.profiles.avatar_url 
              : 'https://img-url1.netlify.app/default';
          } else {
            roomTitle = 'Saved Chat';
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
          isPinned: specificMemberMeta?.is_pinned || false,
          myStatus: specificMemberMeta?.status || 'active'
        };
      }).sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return b.rawTime - a.rawTime;
      });

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
    if (e) e.preventDefault();
    if (!newMessage.trim() || !activeRoomId) return;

    const currentRoom = rooms.find(r => r.id === activeRoomId);
    if (currentRoom && currentRoom.is_bot_channel) {
      showNotification('This is an isolated official broadcast channel. Direct message streaming disabled.', 'error');
      setNewMessage('');
      return;
    }

    if (myMemberStatus === 'banned') {
      showNotification('You have been restricted from sending messages here.', 'error');
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
          avatar_url: newGroupAvatarUrl.trim() || 'https://img-url1.netlify.app/default' 
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

  // 🔔 NEW FEATURE: Group Membership Management Loop Functions
  const handleAddNewGroupMember = async (targetUserId) => {
    if (!activeRoomId) return;
    try {
      const { error } = await supabase.from('room_members').insert([
        { room_id: activeRoomId, user_id: targetUserId, role: 'member', status: 'active' }
      ]);
      if (error) throw error;
      showNotification('New member pipeline injected to group roster ledger.');
      setIsGroupAddMemberOpen(false);
      fetchMessagesForRoom(activeRoomId);
    } catch (e) {
      showNotification('Failed to register member.', 'error');
    }
  };

  const handleRevokeGroupAdminRole = async (targetUserId) => {
    if (!activeRoomId) return;
    try {
      const { error } = await supabase
        .from('room_members')
        .update({ role: 'member' })
        .eq('room_id', activeRoomId)
        .eq('user_id', targetUserId);
      if (error) throw error;
      showNotification('Admin operational level revoked down to standard member.');
      fetchMessagesForRoom(activeRoomId);
    } catch (e) {
      showNotification('Failed transformation privileges.', 'error');
    }
  };

  const manageMemberAction = async (targetUserId, action) => {
    if (!activeRoomId) return;
    try {
      if (action === 'admin') {
        const { error } = await supabase
          .from('room_members')
          .update({ role: 'admin' })
          .eq('room_id', activeRoomId)
          .eq('user_id', targetUserId);
        if (error) throw error;
        showNotification('Member promoted to Admin role');
      } else if (action === 'ban_text') {
        const { error } = await supabase
          .from('room_members')
          .update({ status: 'banned' })
          .eq('room_id', activeRoomId)
          .eq('user_id', targetUserId);
        if (error) throw error;
        showNotification('Member muted for text access');
      } else if (action === 'unban_text') {
        const { error } = await supabase
          .from('room_members')
          .update({ status: 'active' })
          .eq('room_id', activeRoomId)
          .eq('user_id', targetUserId);
        if (error) throw error;
        showNotification('Member restored to active messaging');
      } else if (action === 'kick') {
        const { error } = await supabase
          .from('room_members')
          .delete()
          .eq('room_id', activeRoomId)
          .eq('user_id', targetUserId);
        if (error) throw error;
        showNotification('Member removed from group room');
      }
      fetchRoomsList();
      if (activeRoomId) fetchMessagesForRoom(activeRoomId);
    } catch (e) {
      showNotification('Group member action failed: ' + e.message, 'error');
    }
  };


  // NEW FEATURE: Chat List Room Item Destructive Database Trace Purge
  const executeDeleteWholeChatRoom = async (roomId) => {
    if (!window.confirm("Are you sure you want to delete and wipe this entire chat log history?")) return;
    try {
      await supabase.from('messages').delete().eq('room_id', roomId);
      await supabase.from('room_members').delete().eq('room_id', roomId).eq('user_id', currentUser.id);
      showNotification('Chat track traces disconnected and destroyed cleanly.');
      setActiveMenuRoomId(null);
      if (activeRoomId === roomId) setActiveRoomId(null);
      fetchRoomsList();
    } catch (e) {
      showNotification('Wipe failure protocol.', 'error');
    }
  };

  const handleMsgContextMenu = (e, msg) => {
    e.preventDefault();
    setActiveMenuMessageId(msg.id);
    const clickX = e.clientX > window.innerWidth - 180 ? e.clientX - 160 : e.clientX;
    const clickY = e.clientY > window.innerHeight - 200 ? e.clientY - 180 : e.clientY;
    setActiveMenuRoomId(null); 
    setMenuPosition({ x: clickX, y: clickY });
  };

  const handleRoomContextMenu = (e, roomId) => {
    e.preventDefault();
    setActiveMenuRoomId(roomId);
    const clickX = e.clientX > window.innerWidth - 200 ? e.clientX - 180 : e.clientX;
    const clickY = e.clientY > window.innerHeight - 180 ? e.clientY - 150 : e.clientY;
    setActiveMenuMessageId(null); 
    setRoomMenuPosition({ x: clickX, y: clickY });
  };

  const togglePinRoomState = async (roomId, currentPinStatus) => {
    try {
      const { error } = await supabase
        .from('room_members')
        .update({ is_pinned: !currentPinStatus })
        .eq('room_id', roomId)
        .eq('user_id', currentUser.id);
      if (error) throw error;
      showNotification(!currentPinStatus ? 'Chat space pinned to top routing ledger' : 'Chat space unpinned');
      setActiveMenuRoomId(null);
      fetchRoomsList();
    } catch (err) {
      showNotification('Pin adjustment failure context link.', 'error');
    }
  };

  const toggleMuteRoomState = async (roomId, currentMuteStatus) => {
    try {
      const { error } = await supabase
        .from('room_members')
        .update({ is_muted: !currentMuteStatus })
        .eq('room_id', roomId)
        .eq('user_id', currentUser.id);
      if (error) throw error;
      showNotification(!currentMuteStatus ? 'Notifications loops silenced' : 'Notifications alerts restored');
      setActiveMenuRoomId(null);
      fetchRoomsList();
    } catch (err) {
      showNotification('Mute adjustment failure context link.', 'error');
    }
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
    if (!window.confirm("Are you sure you want to leave this group room?")) return;
    try {
      const { error } = await supabase
        .from('room_members')
        .delete()
        .eq('room_id', activeRoomId)
        .eq('user_id', currentUser.id);

      if (error) throw error;
      showNotification('Left channel space safely');
      setActiveRoomId(null);
      setIsViewingInfo(false);
      setRoomHeaderMenuOpen(false);
      fetchRoomsList(); 
    } catch (err) {
      showNotification('Leave operation error', 'error');
    }
  };

  const openPersonalChat = async (targetUser) => {
    try {
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

      if (matchingRoomId) {
        setActiveRoomId(matchingRoomId);
        fetchMessagesForRoom(matchingRoomId);
        setCurrentTab('chats');
      } else {
        const { data: newRoom, error: roomCreateErr } = await supabase
          .from('chat_rooms')
          .insert([{ type: 'personal', name: `Direct: ${targetUser.username}` }])
          .select()
          .single();

        if (roomCreateErr) throw roomCreateErr;

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
        await supabase.from('room_members').delete().eq('user_id', currentUser.id);
        await supabase.from('profiles').delete().eq('id', currentUser.id);
        await supabase.auth.signOut();
        showNotification('Account context records destroyed successfully.', 'success');
      } catch (err) {
        showNotification('Deletion system failure: ' + err.message, 'error');
      }
    }
  };

  const handleToggleMaintenanceMode = async () => {
    const nextState = !maintenanceMode;
    try {
      const { error } = await supabase.from('system_settings').update({ value: String(nextState) }).eq('key', 'maintenance_mode');
      if (error) throw error;
      setMaintenanceMode(nextState);
      showNotification(`Global Maintenance Mode set to: ${nextState ? 'ENABLED' : 'DISABLED'}`);
    } catch (e) {
      showNotification('Failed to update cluster settings: ' + e.message, 'error');
    }
  };

  const executeGlobalBroadcast = async () => {
    if (!adminBroadcastText.trim()) return;
    try {
      const { data: targetBotRooms, error: rErr } = await supabase
        .from('chat_rooms')
        .select('id')
        .eq('is_bot_channel', true);

      if (rErr) throw rErr;

      if (targetBotRooms && targetBotRooms.length > 0) {
        const broadcastPayloads = targetBotRooms.map(room => ({
          room_id: room.id,
          sender_id: null, 
          content: adminBroadcastText.trim(),
          is_bot_generated: true
        }));

        const { error: insErr } = await supabase.from('messages').insert(broadcastPayloads);
        if (insErr) throw insErr;
        
        showNotification(`Dispatched ItalK Broadcast Alert packets safely across user accounts pipelines.`);
        setAdminBroadcastText('');
      } else {
        showNotification('No active bot endpoints mapped in channel ledger matrix cluster.', 'error');
      }
    } catch (err) {
      showNotification('Broadcast system error: ' + err.message, 'error');
    }
  };

  const handleAlterUserGlobalRole = async (userId, targetRole) => {
    try {
      const { error } = await supabase.from('profiles').update({ role: targetRole }).eq('id', userId);
      if (error) throw error;
      showNotification(`User assigned role matrix: ${targetRole}`);
      supabase.from('profiles').select('*').then(({ data }) => { if (data) setAllProfilesCache(data); });
    } catch (e) {
      showNotification('Role adaptation structural failure', 'error');
    }
  };

  const handleIssueUserWarning = async (e) => {
    e.preventDefault();
    if (!adminSelectedUser || !adminUserWarningText.trim()) {
      showNotification('Please select a target user and fill the warning text field.', 'error');
      return;
    }

    try {
      const { data: userBotMember } = await supabase
        .from('room_members')
        .select('room_id, chat_rooms!inner(is_bot_channel)')
        .eq('user_id', adminSelectedUser.id)
        .eq('chat_rooms.is_bot_channel', true)
        .maybeSingle();

      if (userBotMember) {
        const warningPayload = `⚠️ SYSTEM OFFICIAL WARNING: ${adminUserWarningText.trim()}`;
        await supabase.from('messages').insert([{
          room_id: userBotMember.room_id,
          sender_id: null, 
          content: warningPayload,
          is_bot_generated: true
        }]);
        showNotification(`Official Warning notice payload injected into ${adminSelectedUser.username}'s pipeline successfully.`);
        setAdminUserWarningText('');
      } else {
        showNotification('User specialized isolated bot node not found.', 'error');
      }
    } catch (err) {
      showNotification('Warning deployment system structural error.', 'error');
    }
  };

  const handleExecuteGlobalBan = async () => {
    if (!adminSelectedUser) return;
    try {
      const banMetaValue = banDuration === 'lifetime' ? 'banned_lifetime' : `banned_temp_${banDuration}`;
      const { error } = await supabase.from('profiles').update({ role: banMetaValue }).eq('id', adminSelectedUser.id);
      if (error) throw error;

      showNotification(`Target node ${adminSelectedUser.username} restricted via duration type: ${banDuration.toUpperCase()}`);
      supabase.from('profiles').select('*').then(({ data }) => { if (data) setAllProfilesCache(data); });
    } catch (err) {
      showNotification('Ban engine injection system level error.', 'error');
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
      const { error = null } = await supabase.from('profiles').update(updates).eq('id', currentUser.id);
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
      if (key === 'privacy_muted' && value === false) {
        showNotification('Requesting secure web token authentication push channels...', 'success');
        try {
          await requestNotificationPermission(currentUser.id); 
        } catch (fcmErr) {
          console.warn("FCM registration deferred or blocked:", fcmErr.message);
        }
      }

      const payload = { [key]: value };
      const { error } = await supabase.from('profiles').update(payload).eq('id', currentUser.id);
      if (error) throw error;
      
      setMyProfile(prev => ({ ...prev, ...payload }));
      showNotification('Privacy configuration state successfully committed to cloud storage.');
    } catch (err) {
      showNotification('Privacy update failure', 'error');
    }
  };

  const handleSelectEmoji = (emoji) => {
    setNewMessage(prev => prev + emoji);
    setIsEmojiPickerOpen(false);
  };

  const sendFeedbackToTelegram = async (feedbackPayload) => {
    if (!telegramBotToken || !telegramChatId) {
      throw new Error('Telegram bot token or chat id is not configured.');
    }

    const response = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: telegramChatId,
        text: `New feedback from ${currentUser?.username || currentUser?.email || 'unknown user'}:\n\n${feedbackPayload}`,
        parse_mode: 'HTML'
      })
    });

    const body = await response.json();
    if (!response.ok || body.ok === false) {
      throw new Error(body.description || 'Telegram API failed to send feedback');
    }

    return body;
  };

  const handleSendFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    try {
      await sendFeedbackToTelegram(feedbackText.trim());
      showNotification('Thank you! Your secure telemetry feedback has been dispatched via Telegram.', 'success');
      setFeedbackText('');
    } catch (err) {
      showNotification(`Feedback failed: ${err.message}`, 'error');
    }
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

  const toggleMuteRoom = async () => {
    try {
      const { error } = await supabase
        .from('room_members')
        .update({ is_muted: !isMuted })
        .eq('room_id', activeRoomId)
        .eq('user_id', currentUser.id);

      if (error) throw error;
      setIsMuted(!isMuted);
      showNotification(!isMuted ? 'Muted room alerts' : 'Unmuted room alerts');
      setRoomHeaderMenuOpen(false);
      fetchRoomsList();
    } catch (err) {
      showNotification('Mute toggle error: ' + err.message, 'error');
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

  // NEW FEATURE METHOD: Real-time Header Status presence helper string generator
  const getRoomPresenceSubheaderText = () => {
    if (!currentActiveRoomData) return '';
    if (currentActiveRoomData.is_bot_channel) return 'Official Automated System System Channel';
    if (currentActiveRoomData.type === 'group') return `Group Channel • ${roomMembers.length} active roles`;
    
    // Direct Personal Presence Sync Trace Tracker
    const alternateMember = currentActiveRoomData.room_members?.find(m => m.user_id !== currentUser.id);
    if (!alternateMember) return 'Secure cloud buffer loop';
    
    const statusObj = userPresenceList[alternateMember.user_id];
    if (statusObj?.status === 'online') {
      return '🟢 Online Encryption Sockets';
    }
    return '⚪ Offline • Secure Node Sync';
  };

  const renderRoomListItems = (list) => {
    if (list.length === 0) return <div style={{ padding: '16px', color: theme.subText, fontSize: '13px', textAlign: 'center' }}>No chats found</div>;
    return list.map(room => {
      const isSelected = activeRoomId === room.id;
      return (
        <div 
          key={room.id}
          onClick={() => { setActiveRoomId(room.id); fetchMessagesForRoom(room.id); setIsViewingInfo(false); }}
          onContextMenu={(e) => handleRoomContextMenu(e, room.id)}
          style={{
            display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '14px',
            cursor: 'pointer', background: isSelected ? theme.accentLight : 'transparent',
            transition: 'background 0.15s, transform 0.1s', marginBottom: '4px', position: 'relative',
            borderLeft: room.isPinned ? `4px solid ${theme.accent}` : 'none'
          }}
        >
          <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: getRandomColor(room.displayName), display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff', fontWeight: '700', fontSize: '14px', overflow: 'hidden', flexShrink: 0 }}>
            {room.displayAvatar && room.displayAvatar !== "" ? <img src={room.displayAvatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : room.displayName?.substring(0,2).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
              <span style={{ fontWeight: '600', fontSize: '15px', color: theme.text, display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {room.displayName}
                {room.is_bot_channel && (
                  <FontAwesomeIcon icon={faCertificate} style={{ color: '#007aff', fontSize: '12px' }} title="Verified Official Bot Account" />
                )}
              </span>
              <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                {room.isMuted && <FontAwesomeIcon icon={faVolumeMute} style={{ fontSize: '11px', color: theme.subText }} />}
                {room.isPinned && <FontAwesomeIcon icon={faThumbtack} style={{ fontSize: '11px', color: theme.accent }} />}
                <span style={{ fontSize: '11px', color: theme.subText }}>{room.lastMessageTime}</span>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: theme.subText, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>{room.lastMessage}</p>
          </div>
        </div>
      );
    });
  };

  const renderSettingsScreen = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', background: theme.bg, borderRadius: '16px', border: `1px solid ${theme.border}` }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: getRandomColor(myProfile.username), display:'flex', justifyContent:'center', alignItems:'center', color:'#fff', fontWeight:'bold', fontSize:'16px' }}>
          {myProfile.avatar_url ? <img src={myProfile.avatar_url} style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }} /> : myProfile.username?.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: theme.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{myProfile.username}</h4>
          <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: theme.subText, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUser.email}</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: theme.card, borderRadius: '16px', border: `1px solid ${theme.border}`, padding: '6px' }}>
        <button onClick={() => setCurrentTab('private-settings')} style={{ width: '100%', padding: '14px 16px', background: 'none', border: 'none', borderRadius: '12px', color: theme.text, fontWeight: '600', fontSize: '14px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', transition: 'background 0.2s' }}>
          <FontAwesomeIcon icon={faUserGear} style={{ color: theme.accent, width: '18px' }} /> Private Security & Notifications Setup
        </button>
        <button onClick={() => setCurrentTab('help-support')} style={{ width: '100%', padding: '14px 16px', background: 'none', border: 'none', borderRadius: '12px', color: theme.text, fontWeight: '600', fontSize: '14px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', transition: 'background 0.2s' }}>
          <FontAwesomeIcon icon={faCircleInfo} style={{ color: theme.accent, width: '18px' }} /> Support Matrix Configuration Info
        </button>
        <button onClick={() => setDarkMode(!darkMode)} style={{ width: '100%', padding: '14px 16px', background: 'none', border: 'none', borderRadius: '12px', color: theme.text, fontWeight: '600', fontSize: '14px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'background 0.2s' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><FontAwesomeIcon icon={darkMode ? faSun : faMoon} style={{ color: '#ff9500', width: '18px' }} /> Interface Theme Matrix Mode</span>
          <span style={{ fontSize: '11px', fontWeight: '800', background: theme.bg, padding: '4px 8px', borderRadius: '6px', color: theme.subText }}>{darkMode ? 'DARK' : 'LIGHT'}</span>
        </button>
      </div>

      <div style={{ background: 'rgba(255,59,48,0.04)', border: '1px solid rgba(255,59,48,0.1)', borderRadius: '16px', padding: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <button onClick={() => supabase.auth.signOut()} style={{ width: '100%', padding: '14px 16px', background: 'none', border: 'none', borderRadius: '12px', color: '#ff3b30', fontWeight: '700', fontSize: '14px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FontAwesomeIcon icon={faSignOutAlt} /> Disconnect Cloud Socket Streams
        </button>
      </div>
    </div>
  );

  const renderPrivateSettingsScreen = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '0 16px 16px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: theme.accent, cursor: 'pointer' }} onClick={() => setCurrentTab('settings')}>
        <FontAwesomeIcon icon={faArrowLeft} /> <span style={{ fontSize: '13px', fontWeight: '700' }}>Back to Configuration Menu</span>
      </div>
      <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h4 style={{ margin: 0, fontSize: '12px', fontWeight: '800', color: theme.accent, textTransform: 'uppercase' }}>Alert Dispatch Configurations</h4>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '13.5px', fontWeight: '600' }}><FontAwesomeIcon icon={faVolumeMute} style={{ marginRight: '6px', color: theme.subText }} /> Silence Out-App Push Notifications</span>
            <p style={{ margin: 0, fontSize: '11px', color: theme.subText }}>Toggling this ON completely isolates and drops native push streams.</p>
          </div>
          <input type="checkbox" checked={myProfile.privacy_muted || false} onChange={e => handleSavePrivacyConfiguration('privacy_muted', e.target.checked)} style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: theme.accent }} />
        </div>
      </div>

      <h4 style={{ margin: '8px 0 0 0', fontSize: '12px', textTransform: 'uppercase', color: theme.subText, fontWeight:'800' }}>Privacy Visibility Matrix</h4>
      {['privacy_profile', 'privacy_bio', 'privacy_birthday'].map(field => (
        <div key={field} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'capitalize', color: theme.text }}>{field.replace('privacy_', '')} Publicity Isolation Level</span>
          <select value={myProfile[field] || 'public'} onChange={e => handleSavePrivacyConfiguration(field, e.target.value)} style={{ padding: '10px 12px', background: theme.card, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: '10px', fontSize: '13px', outline: 'none' }}>
            <option value="public">Public Node Broadcast</option>
            <option value="only_me">Isolated Locked Mode (Only Me)</option>
          </select>
        </div>
      ))}

      <hr style={{ border: 'none', height: '1px', background: theme.border, margin:'8px 0' }} />
      <form onSubmit={handlePasswordChangeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <span style={{ fontSize: '12px', fontWeight: '700', color: theme.subText }}>ROTATE ACCESS CREDENTIALS</span>
        <input type="password" placeholder="New structural password security key..." value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ padding: '10px 12px', borderRadius: '10px', border: `1px solid ${theme.border}`, background: theme.bg, color: theme.text, fontSize: '13px', outline:'none' }} />
        <button type="submit" style={{ padding: '10px', background: theme.accent, border: 'none', color: '#fff', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '12px' }}>Rotate Password Key</button>
        <button type="button" onClick={handleForgotPasswordTrigger} style={{ background: 'none', border: 'none', color: theme.accent, fontSize: '12px', textAlign: 'left', cursor: 'pointer', padding: '4px 0' }}><FontAwesomeIcon icon={faLock} /> Transmit Recovery Link Token</button>
      </form>

      <hr style={{ border: 'none', height: '1px', background: theme.border, margin:'8px 0' }} />
      <form onSubmit={handleSendFeedback} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <span style={{ fontSize: '12px', fontWeight: '700', color: theme.subText }}><FontAwesomeIcon icon={faCommentDots} /> SUBMIT RECURSIVE FEEDBACK REPORT</span>
        <textarea value={feedbackText} onChange={e => setFeedbackText(e.target.value)} placeholder="Type feedback anomalies..." style={{ padding: '10px', background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: '10px', color: theme.text, fontSize: '13px', height: '60px', resize: 'none', outline:'none' }} />
        <button type="submit" style={{ padding: '10px', background: theme.accent, border: 'none', color: '#fff', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '12px' }}>Dispatch Telemetry Report</button>
      </form>
      <button onClick={executeDeleteAccount} style={{ width: '100%', padding: '12px', background: 'rgba(255,59,48,0.12)', border: '1px solid rgba(255,59,48,0.2)', color: '#ff3b30', borderRadius: '12px', fontWeight: '800', fontSize: '13px', cursor: 'pointer', marginTop: '10px' }}>Delete Account permanently</button>
    </div>
  );

  const renderHelpSupportScreen = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '0 16px 16px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: theme.accent, cursor: 'pointer' }} onClick={() => setCurrentTab('settings')}>
        <FontAwesomeIcon icon={faArrowLeft} /> <span style={{ fontSize: '13px', fontWeight: '700' }}>Back to Configuration Menu</span>
      </div>
      <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}><FontAwesomeIcon icon={faCircleInfo} /> Support Center & Engine Documentation</h4>
      <div style={{ background: theme.card, padding: '14px', borderRadius: '14px', border: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px', lineHeight: '1.5' }}>
        <div>
          <strong style={{ color: theme.text }}>Real-time Synchronizer System</strong>
          <p style={{ margin: '2px 0 0 0', color: theme.subText }}>Imaginary talK updates pipelines recursively across high-fidelity WebSocket streams mapped inside Supabase channel protocols.</p>
        </div>
      </div>
    </div>
  );

  const tabsConfig = useMemo(() => {
    const baseTabs = [
      { id: 'chats', label: 'Chats', icon: faMessage },
      { id: 'search', label: 'Search', icon: faSearch },
      { id: 'create-group', label: 'Group', icon: faFolderPlus },
      { id: 'profile-view', label: 'Profile', icon: faUserCircle, match: ['profile-view', 'edit-profile'] },
      { id: 'settings', label: 'Settings', icon: faGear, match: ['settings', 'privacy', 'help-support', 'private-settings'] }
    ];
    if (['admin', 'owner'].includes(myProfile.role)) {
      baseTabs.push({ id: 'admin-dashboard', label: 'Admin', icon: faShieldHalved });
    }
    return baseTabs;
  }, [myProfile.role]);

  const currentActiveRoomData = rooms.find(r => r.id === activeRoomId);
  const targetPersonalProfile = currentActiveRoomData?.type === 'personal' ? currentActiveRoomData.room_members?.find(m => m.user_id !== currentUser.id)?.profiles : null;
  const pinnedMessage = messages.find(m => m.is_pinned);

  const filteredMessages = useMemo(() => {
    if (!chatSearchQuery.trim()) return messages;
    return messages.filter(m => m.content.toLowerCase().includes(chatSearchQuery.toLowerCase()));
  }, [messages, chatSearchQuery]);

  const renderInfoPage = () => {
    if (!currentActiveRoomData) return null;
    const isGroup = currentActiveRoomData.type === 'group';

    return (
      <motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }} style={{ width: '100%', height: '100%', background: theme.bg, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', borderBottom: `1px solid ${theme.border}`, background: theme.card }}>
          <button onClick={() => setIsViewingInfo(false)} style={{ background: 'none', border: 'none', color: theme.accent, fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FontAwesomeIcon icon={faArrowLeft} /> <span style={{ fontWeight: '600' }}>Back to Chatroom</span>
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '30px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
          <div style={{ width: '110px', height: '110px', borderRadius: '50%', background: getRandomColor(currentActiveRoomData.displayName), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '36px', fontWeight: '800', overflow: 'hidden', boxShadow: theme.shadow }}>
            {currentActiveRoomData.displayAvatar ? <img src={currentActiveRoomData.displayAvatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : currentActiveRoomData.displayName?.charAt(0).toUpperCase()}
          </div>

          <div style={{ textAlign: 'center' }}>
            <h2 style={{ margin: '0 0 6px 0', fontSize: '24px', fontWeight: '800', color: theme.text, display:'inline-flex', alignItems:'center', gap:'6px' }}>
              {currentActiveRoomData.displayName}
              {currentActiveRoomData.is_bot_channel && (
                <FontAwesomeIcon icon={faCertificate} style={{ color: '#007aff', fontSize: '20px' }} />
              )}
              {!isGroup && targetPersonalProfile && ['admin', 'owner'].includes(targetPersonalProfile.role) && (
                <FontAwesomeIcon icon={faUserCheck} style={{ color: theme.adminMark, fontSize: '18px' }} />
              )}
            </h2>
            <br />
            {!isGroup && targetPersonalProfile && <span style={{ color: theme.accent, fontSize: '14px', fontWeight: '600' }}>Token ID: {targetPersonalProfile.unique_id}</span>}
            {isGroup && <span style={{ color: theme.subText, fontSize: '13px' }}>Group Broadcast Channel ({roomMembers.length} members)</span>}
          </div>

          <div style={{ display: 'flex', gap: '14px', width: '100%', maxWidth: '400px' }}>
            <button onClick={() => { setIsViewingInfo(false); setIsSearchingChat(true); }} style={{ flex: 1, padding: '12px', borderRadius: '14px', background: theme.card, border: `1px solid ${theme.border}`, color: theme.text, display: 'flex', flexDirection: 'column', fontStyle: 'normal', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <FontAwesomeIcon icon={faSearch} style={{ color: theme.accent, fontSize: '16px' }} /> <span style={{ fontSize: '11px', fontWeight: '700' }}>Search Log</span>
            </button>
            <button onClick={toggleMuteRoom} style={{ flex: 1, padding: '12px', borderRadius: '14px', background: theme.card, border: `1px solid ${theme.border}`, color: theme.text, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <FontAwesomeIcon icon={isMuted ? faVolumeMute : faVolumeUp} style={{ color: isMuted ? '#ff9500' : theme.accent, fontSize: '16px' }} /> <span style={{ fontSize: '11px', fontWeight: '700' }}>{isMuted ? 'Unmute Alerts' : 'Mute Alerts'}</span>
            </button>
            {isGroup && (
              <button onClick={executeLeaveRoom} style={{ flex: 1, padding: '12px', borderRadius: '14px', background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.2)', color: '#ff3b30', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <FontAwesomeIcon icon={faSignOutAlt} style={{ fontSize: '16px' }} /> <span style={{ fontSize: '11px', fontWeight: '700' }}>Leave Hub</span>
              </button>
            )}
          </div>

          {/* NEW FEATURE MODALITY: Group Configuration Interactive Controls Inside Group Info Layout */}
          {isGroup && ['owner', 'admin'].includes(myRoomRole) && (
            <div style={{ width:'100%', maxWidth:'480px', background: theme.card, borderRadius:'16px', border:`1px solid ${theme.border}`, padding:'16px', display:'flex', flexDirection:'column', gap:'12px' }}>
              <h4 style={{ fontSize:'14px', color:theme.accent }}>🛡️ Group Master Roster Actions</h4>
              <button onClick={() => setIsGroupAddMemberOpen(!isGroupAddMemberOpen)} style={{ padding:'10px', background:theme.accentLight, border:`1px solid ${theme.accent}40`, color:theme.accent, borderRadius:'10px', fontWeight:'700', cursor:'pointer' }}>
                <FontAwesomeIcon icon={faUserPlus} style={{ marginRight:'6px' }} /> Add New Member Loop
              </button>
              
              <AnimatePresence>
                {isGroupAddMemberOpen && (
                  <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }} style={{ background:theme.bg, borderRadius:'10px', padding:'8px', overflow:'hidden' }}>
                    <span style={{ fontSize:'11px', fontWeight:'bold', display:'block', marginBottom:'6px' }}>CHOOSE LEDGER ACCOUNT TO INJECT:</span>
                    <div style={{ display:'flex', flexDirection:'column', gap:'4px', maxHeight:'120px', overflowY:'auto' }}>
                      {allProfilesCache.filter(p => !roomMembers.some(m => m.user_id === p.id)).map(p => (
                        <div key={p.id} onClick={() => handleAddNewGroupMember(p.id)} style={{ padding:'6px', borderRadius:'6px', background:theme.card, cursor:'pointer', fontSize:'13px', display:'flex', justifyContent:'space-between' }}>
                          <span>{p.username}</span>
                          <FontAwesomeIcon icon={faUserPlus} style={{ opacity:0.5 }} />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {!isGroup && targetPersonalProfile && (
            <div style={{ width: '100%', maxWidth: '420px', background: theme.card, borderRadius: '18px', border: `1px solid ${theme.border}`, padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', boxSizing: 'border-box' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: '800', color: theme.subText, letterSpacing: '0.3px' }}>BIOGRAPHY SCHEMA</span>
                <p style={{ margin: '4px 0 0 0', fontSize: '14.5px', color: theme.text, lineHeight: '1.4' }}>{targetPersonalProfile.privacy_bio === 'public' ? targetPersonalProfile.biography : '🔒 Vault Isolated Matrix Content'}</p>
              </div>
              <div style={{ height: '1px', background: theme.border }} />
              <div>
                <span style={{ fontSize: '11px', fontWeight: '800', color: theme.subText, letterSpacing: '0.3px' }}>BIRTHDAY STAMP</span>
                <p style={{ margin: '4px 0 0 0', fontSize: '14.5px', color: theme.text }}><FontAwesomeIcon icon={faCalendarAlt} style={{ marginRight: '6px', opacity: 0.7 }} /> {targetPersonalProfile.privacy_birthday === 'public' ? targetPersonalProfile.birthday : '🔒 Vault Isolated Matrix Content'}</p>
              </div>
            </div>
          )}

          {isGroup && (
            <div style={{ width: '100%', maxWidth: '480px', background: theme.card, borderRadius: '18px', border: `1px solid ${theme.border}`, overflow: 'hidden', boxSizing: 'border-box' }}>
              <div style={{ padding: '14px 18px', background: theme.bg, borderBottom: `1px solid ${theme.border}`, fontSize: '11px', fontWeight: '800', color: theme.subText, letterSpacing: '0.5px' }}>ROSTER NODE LEDGER MEMBERS ({roomMembers.length})</div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {roomMembers.map(member => (
                  <div key={member.user_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: `1px solid ${theme.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: getRandomColor(member.profiles?.username), display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff', fontWeight: '700', fontSize: '13px', overflow: 'hidden' }}>
                        {member.profiles?.avatar_url ? <img src={member.profiles.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : member.profiles?.username?.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: '700', fontSize: '14.5px', color: theme.text }}>
                          {member.profiles?.username} {member.user_id === currentUser.id && <span style={{ color: theme.subText, fontWeight:'normal' }}>(You)</span>}
                          {member.profiles && ['admin', 'owner'].includes(member.profiles.role) && (
                            <FontAwesomeIcon icon={faUserCheck} style={{ marginLeft: '6px', color: theme.adminMark, fontSize: '12px' }} />
                          )}
                        </span>
                        <span style={{ fontSize: '11px', color: member.status === 'banned' ? '#ff9500' : theme.accent, fontWeight: '800', marginTop: '2px' }}>
                          {member.role?.toUpperCase()} {member.status === 'banned' && '• MUTED (READ-ONLY)'}
                        </span>
                      </div>
                    </div>
                    {['owner', 'admin'].includes(myRoomRole) && member.user_id !== currentUser.id && (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {myRoomRole === 'owner' && member.role === 'admin' && (
                          <button onClick={() => handleRevokeGroupAdminRole(member.user_id)} title="Remove Admin Role" style={{ background: '#ff9500', border: 'none', color: '#fff', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer' }}><FontAwesomeIcon icon={faUserMinus} /></button>
                        )}
                        {myRoomRole === 'owner' && member.role !== 'admin' && (
                          <button onClick={() => manageMemberAction(member.user_id, 'admin')} title="Promote to Admin" style={{ background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text, padding: '8px 10px', borderRadius: '8px', cursor: 'pointer' }}><FontAwesomeIcon icon={faUserShield} /></button>
                        )}
                        {member.status === 'banned' ? (
                          <button onClick={() => manageMemberAction(member.user_id, 'unban_text')} title="Unmute/Allow Texting" style={{ background: '#34c759', border: 'none', color: '#fff', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer' }}><FontAwesomeIcon icon={faUnlock} /></button>
                        ) : (
                          <button onClick={() => manageMemberAction(member.user_id, 'ban_text')} title="Mute text access" style={{ background: '#ff9500', border: 'none', color: '#fff', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer' }}><FontAwesomeIcon icon={faBan} /></button>
                        )}
                        <button onClick={() => manageMemberAction(member.user_id, 'kick')} title="Kick Member" style={{ background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.15)', color: '#ff3b30', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer' }}><FontAwesomeIcon icon={faUserMinus} /></button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  // 📱💻 RE-ENGINEERED RESPONSIVE: Master Superuser Dashboard Configuration Control Array
  const renderAdminDashboard = () => {
    if (!['admin', 'owner'].includes(myProfile.role)) {
      return <div style={{ padding: '24px', color: '#ff3b30', fontWeight: 'bold' }}>Security Alert: Unassigned Cluster Matrix Route. Access Refused.</div>;
    }

    return (
      <div style={{ padding: isMobile ? '16px' : '24px', display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', overflowY: 'auto', boxSizing: 'border-box' }}>
        <div style={{ borderBottom: `1px solid ${theme.border}`, paddingBottom: '12px' }}>
          <h2 style={{ margin: 0, fontSize: isMobile ? '18px' : '22px', fontWeight: '900', color: theme.accent, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FontAwesomeIcon icon={faShieldHalved} /> Core Management Dashboard
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: theme.subText }}>Operational privileges level: Master Superuser Array</p>
        </div>

        {/* Dynamic Multi-Column Grid Layout for Desktop vs Stacked Mobile Viewports */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px', width: '100%' }}>
          
          {/* Server Loop Controls & Broadcast Card Block */}
          <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
            {/* Maintenance Toggle Cluster Block */}
            <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '16px', padding: '16px' }}>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', color: theme.text }}>Global App Servers Maintenance Loop</h4>
              <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: theme.subText }}> drops all connection sockets for non-admin users instantly.</p>
              <button onClick={handleToggleMaintenanceMode} style={{ width: '100%', padding: '12px', background: maintenanceMode ? '#ff3b30' : theme.accent, color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
                <FontAwesomeIcon icon={faWrench} /> {maintenanceMode ? 'Kill Maintenance System' : 'Trigger Active Maintenance'}
              </button>
            </div>

            {/* Official Noti Bot Broadcast Node Engine */}
            <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '15px', color: theme.text }}><FontAwesomeIcon icon={faRobot} style={{ marginRight: '6px', color: theme.accent }} /> ItalK Official Noti Bot Broadcast <FontAwesomeIcon icon={faCertificate} style={{color:'#007aff', fontSize:'13px'}} /></h4>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: theme.subText }}>Transmits alert notification packets to all server accounts via verified official bot system.</p>
              </div>
              <textarea value={adminBroadcastText} onChange={e => setAdminBroadcastText(e.target.value)} placeholder="Type official notification packet data stream here..." style={{ width: '100%', height: '90px', padding: '12px', background: theme.bg, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: '10px', resize: 'none', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
              <button onClick={executeGlobalBroadcast} style={{ width: '100%', padding: '12px', background: '#34c759', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
                <FontAwesomeIcon icon={faBullhorn} /> Dispatch Bot Alert Packet
              </button>
            </div>
          </div>

          {/* User Node Enforcement Hub Block */}
          <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '16px', padding: '16px', display:'flex', flexDirection:'column', gap:'14px' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '15px', color: theme.text }}><FontAwesomeIcon icon={faUserLock} style={{ marginRight: '6px', color: '#ff9500' }} /> Target Node Enforcement Hub</h4>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: theme.subText }}>
                {adminSelectedUser ? `Selected Node Target: @${adminSelectedUser.username}` : 'Select a user row from the registry ledger block list below.'}
              </p>
            </div>

            {adminSelectedUser && (
              <div style={{ display:'flex', flexDirection:'column', gap:'12px', borderTop:`1px solid ${theme.border}`, paddingTop:'12px' }}>
                <form onSubmit={handleIssueUserWarning} style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                  <span style={{ fontSize:'12px', fontWeight:'700', color:theme.text }}>Issue Targeted Warning Notice Logs</span>
                  <div style={{ display:'flex', gap:'8px' }}>
                    <input type="text" value={adminUserWarningText} onChange={e => setAdminUserWarningText(e.target.value)} placeholder="Type warning description message..." style={{ flex:1, padding:'10px 14px', borderRadius:'10px', border:`1px solid ${theme.border}`, background:theme.bg, color:theme.text, fontSize:'13px', outline:'none' }} />
                    <button type="submit" style={{ padding:'10px 14px', background:'#ff9500', color:'#fff', border:'none', borderRadius:'10px', fontWeight:'600', cursor:'pointer' }}><FontAwesomeIcon icon={faExclamationTriangle} /></button>
                  </div>
                </form>

                <div style={{ display:'flex', flexDirection:'column', gap:'6px', background:theme.bg, padding:'12px', borderRadius:'12px', marginTop:'4px' }}>
                  <span style={{ fontSize:'12px', fontWeight:'700' }}>Account Restriction Scope Control</span>
                  <div style={{ display:'flex', flexDirection: isMobile ? 'column' : 'row', gap: '8px', margin: '4px 0 8px 0' }}>
                    {['lifetime', '1day', '7days'].map(dur => (
                      <label key={dur} style={{ fontSize:'12px', display:'flex', alignItems:'center', gap:'4px', cursor:'pointer' }}>
                        <input type="radio" name="banDuration" checked={banDuration === dur} onChange={() => setBanDuration(dur)} /> {dur.toUpperCase()}
                      </label>
                    ))}
                  </div>
                  <button onClick={handleExecuteGlobalBan} style={{ width:'100%', padding:'10px', background:'#ff3b30', color:'#fff', border:'none', borderRadius:'8px', fontWeight:'700', cursor:'pointer' }}>
                    <FontAwesomeIcon icon={faBan} /> Execute Enforcement Restriction
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Global Cluster User Profiles Registry Ledger */}
        <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '16px', overflow: 'hidden', width:'100%' }}>
          <div style={{ padding: '14px 18px', background: theme.bg, fontSize: '11px', fontWeight: '800', color: theme.subText }}>TOTAL APP DATABASE REGISTERED MATRIX DATA ({allProfilesCache.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '200px', overflowY: 'auto' }}>
            {allProfilesCache.map(u => {
              const isUserTargeted = adminSelectedUser?.id === u.id;
              return (
                <div key={u.id} onClick={() => setAdminSelectedUser(u)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderBottom: `1px solid ${theme.border}`, cursor:'pointer', background: isUserTargeted ? theme.accentLight : 'transparent' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '34px', height: '36px', borderRadius: '50%', background: getRandomColor(u.username), display:'flex', justifyContent:'center', alignItems:'center', color:'#fff', fontWeight:'bold', fontSize:'13px' }}>{u.username?.charAt(0).toUpperCase()}</div>
                    <div>
                      <span style={{ fontWeight: '700', color: theme.text }}>{u.username}</span>
                      <span style={{ fontSize: '11px', color: u.role?.startsWith('banned') ? '#ff3b30' : theme.accent, display: 'block' }}>Role Status: {u.role?.toUpperCase()}</span>
                    </div>
                  </div>
                  {u.id !== currentUser.id && (
                    <div onClick={e => e.stopPropagation()}>
                      <button onClick={() => handleAlterUserGlobalRole(u.id, u.role === 'admin' ? 'member' : 'admin')} style={{ padding: '6px 12px', background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text, borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight:'600' }}>
                        {u.role === 'admin' ? 'Demote' : 'Make Admin'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  if (maintenanceMode && !['admin', 'owner'].includes(myProfile.role)) {
    return (
      <div style={{ width: '100vw', height: '100vh', background: '#0c0c0e', color: '#f3f4f6', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system, sans-serif', padding: '20px', boxSizing: 'border-box', textAlign: 'center' }}>
        <FontAwesomeIcon icon={faWrench} style={{ fontSize: '64px', color: '#ff9500', marginBottom: '20px' }} />
        <h1 style={{ fontSize: '28px', fontWeight: '900', margin: '0 0 10px 0' }}>ItalK Server Ecosystem Offline</h1>
        <p style={{ color: '#8e8e93', maxWidth: '440px', margin: 0, fontSize: '15px', lineHeight: '1.5' }}>Global maintenance routing triggers are active. Core sockets are isolated for optimization upgrades. Please hold connection link parameters.</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', background: theme.bg, color: theme.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', overflow: 'hidden', position: 'relative' }}>
      
      {/* 🔔 NEW FEATURE: Context Menu Backdrop Glassmorphism Blur Filter Overlay Container */}
      <AnimatePresence>
        {(activeMenuMessageId || activeMenuRoomId) && (
          <motion.div 
            initial={{ opacity:0, backdropFilter:'blur(0px)' }}
            animate={{ opacity:1, backdropFilter:'blur(12px)' }}
            exit={{ opacity:0, backdropFilter:'blur(0px)' }}
            style={{ position:'fixed', top:0, left:0, width:'100vw', height:'100vh', zIndex:9975, background:'rgba(0,0,0,0.35)' }} 
            onClick={() => { setActiveMenuMessageId(null); setActiveMenuRoomId(null); }} 
          />
        )}
      </AnimatePresence>

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

      {/* Chat List Item Options Press Context Menu Architecture Overlay */}
      <AnimatePresence>
        {activeMenuRoomId && (
          <div style={{ position: 'fixed', top: roomMenuPosition.y, left: roomMenuPosition.x, background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '14px', padding: '6px', width: '170px', boxShadow: '0 12px 32px rgba(0,0,0,0.4)', zIndex: 9991, display:'flex', flexDirection:'column', gap:'2px' }}>
            {(() => {
              const targetMenuRoom = rooms.find(r => r.id === activeMenuRoomId);
              if (!targetMenuRoom) return null;
              return (
                <>
                  <button onClick={() => togglePinRoomState(targetMenuRoom.id, targetMenuRoom.isPinned)} style={{ background: 'none', border: 'none', color: theme.text, padding: '10px 12px', borderRadius: '8px', textAlign: 'left', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', width:'100%' }}>
                    <FontAwesomeIcon icon={faThumbtack} style={{ width: '14px', color: theme.accent }} /> {targetMenuRoom.isPinned ? 'Unpin Room Chat' : 'Pin Room Chat'}
                  </button>
                  <button onClick={() => toggleMuteRoomState(targetMenuRoom.id, targetMenuRoom.isMuted)} style={{ background: 'none', border: 'none', color: theme.text, padding: '10px 12px', borderRadius: '8px', textAlign: 'left', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', width:'100%' }}>
                    <FontAwesomeIcon icon={targetMenuRoom.isMuted ? faVolumeUp : faVolumeMute} style={{ width: '14px', color:'#ff9500' }} /> {targetMenuRoom.isMuted ? 'Unmute Alerts' : 'Mute Room Alerts'}
                  </button>
                  {/* 🔔 NEW FEATURE: Destructive Clean Wipe Chat History Option inside Long press option bar */}
                  <button onClick={() => executeDeleteWholeChatRoom(targetMenuRoom.id)} style={{ background: 'none', border: 'none', color: '#ff3b30', padding: '10px 12px', borderRadius: '8px', textAlign: 'left', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', width:'100%', fontWeight:'bold' }}>
                    <FontAwesomeIcon icon={faTrashCan} style={{ width: '14px' }} /> Delete Chat Log
                  </button>
                </>
              );
            })()}
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeMenuMessageId && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'transparent', zIndex: 9985 }} onClick={() => setActiveMenuMessageId(null)}>
            <div 
              onClick={e => e.stopPropagation()}
              style={{ 
                position: 'absolute', top: menuPosition.y, left: menuPosition.x,
                background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '14px',
                padding: '6px', width: '160px', boxShadow: '0 12px 32px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '2px', zIndex:9999
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
          </div>
        )}
      </AnimatePresence>

      {!isMobile && (
        <div style={{ width: '100%', height: '100%', display: 'flex' }}>
          <div style={{ width: '380px', height: '100%', borderRight: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', background: theme.card }}>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', borderBottom: `1px solid ${theme.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '24px', fontWeight: '800', color: theme.accent, letterSpacing: '-0.5px' }}>ItalK</span>
                <div style={{ display: 'flex', gap: '14px', color: theme.subText, alignItems: 'center' }}>
                  {tabsConfig.map(tb => (
                    <FontAwesomeIcon 
                      key={tb.id} 
                      icon={tb.icon} 
                      title={tb.label} 
                      style={{ cursor: 'pointer', color: (currentTab === tb.id || tb.match?.includes(currentTab)) ? theme.accent : '' }} 
                      onClick={() => { setCurrentTab(tb.id); setActiveRoomId(null); setIsViewingInfo(false); }} 
                    />
                  ))}
                </div>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
              {currentTab === 'chats' && (
                <div style={{ padding: '4px 0' }}>
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
                          <span style={{ fontWeight: '600', fontSize: '14px', display: 'block' }}>
                            {u.username}
                            {['admin', 'owner'].includes(u.role) && <FontAwesomeIcon icon={faUserCheck} style={{ marginLeft: '6px', color: theme.adminMark, fontSize: '12px' }} />}
                          </span>
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

              {currentTab === 'profile-view' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '4px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>My Profile</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '16px', background: theme.bg, borderRadius: '16px' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: getRandomColor(myProfile.username), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '28px', fontWeight: '800', overflow: 'hidden' }}>
                      {myProfile.avatar_url && myProfile.avatar_url !== "" ? <img src={myProfile.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : myProfile.username?.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontSize: '18px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {myProfile.username}
                      {['admin', 'owner'].includes(myProfile.role) && <FontAwesomeIcon icon={faUserCheck} style={{ color: theme.adminMark, fontSize: '16px' }} />}
                    </span>
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

              {currentTab === 'settings' && renderSettingsScreen()}

              {currentTab === 'private-settings' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: theme.accent, cursor: 'pointer' }} onClick={() => setCurrentTab('settings')}>
                    <FontAwesomeIcon icon={faArrowLeft} /> <span style={{ fontSize: '13px', fontWeight: '700' }}>Back to Configuration Menu</span>
                  </div>
                  
                  <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h4 style={{ margin: 0, fontSize: '12px', fontWeight: '800', color: theme.accent, textTransform: 'uppercase' }}>Alert Dispatch Configurations</h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '13.5px', fontWeight: '600' }}><FontAwesomeIcon icon={faVolumeMute} style={{ marginRight: '6px', color: theme.subText }} /> Silence Out-App Push Notifications</span>
                        <p style={{ margin: 0, fontSize: '11px', color: theme.subText }}>Toggling this ON completely isolates and drops native push streams.</p>
                      </div>
                      <input type="checkbox" checked={myProfile.privacy_muted || false} onChange={e => handleSavePrivacyConfiguration('privacy_muted', e.target.checked)} style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: theme.accent }} />
                    </div>
                  </div>

                  <h4 style={{ margin: '8px 0 0 0', fontSize: '12px', textTransform: 'uppercase', color: theme.subText, fontWeight:'800' }}>Privacy Visibility Matrix</h4>
                  {['privacy_profile', 'privacy_bio', 'privacy_birthday'].map(field => (
                    <div key={field} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'capitalize', color: theme.text }}>{field.replace('privacy_', '')} Publicity Isolation Level</span>
                      <select value={myProfile[field] || 'public'} onChange={e => handleSavePrivacyConfiguration(field, e.target.value)} style={{ padding: '10px 12px', background: theme.card, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: '10px', fontSize: '13px', outline: 'none' }}>
                        <option value="public">Public Node Broadcast</option>
                        <option value="only_me">Isolated Locked Mode (Only Me)</option>
                      </select>
                    </div>
                  ))}
                  
                  <hr style={{ border: 'none', height: '1px', background: theme.border, margin:'8px 0' }} />
                  <form onSubmit={handlePasswordChangeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: theme.subText }}>ROTATE ACCESS CREDENTIALS</span>
                    <input type="password" placeholder="New structural password security key..." value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ padding: '10px 12px', borderRadius: '10px', border: `1px solid ${theme.border}`, background: theme.bg, color: theme.text, fontSize: '13px', outline:'none' }} />
                    <button type="submit" style={{ padding: '10px', background: theme.accent, border: 'none', color: '#fff', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '12px' }}>Rotate Password Key</button>
                    <button type="button" onClick={handleForgotPasswordTrigger} style={{ background: 'none', border: 'none', color: theme.accent, fontSize: '12px', textAlign: 'left', cursor: 'pointer', padding: '4px 0' }}><FontAwesomeIcon icon={faLock} /> Transmit Recovery Link Token</button>
                  </form>

                  <hr style={{ border: 'none', height: '1px', background: theme.border, margin:'8px 0' }} />
                  <form onSubmit={handleSendFeedback} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: theme.subText }}><FontAwesomeIcon icon={faCommentDots} /> SUBMIT RECURSIVE FEEDBACK REPORT</span>
                    <textarea value={feedbackText} onChange={e => setFeedbackText(e.target.value)} placeholder="Type feedback anomalies..." style={{ padding: '10px', background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: '10px', color: theme.text, fontSize: '13px', height: '60px', resize: 'none', outline:'none' }} />
                    <button type="submit" style={{ padding: '10px', background: theme.accent, border: 'none', color: '#fff', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '12px' }}>Dispatch Telemetry Report</button>
                  </form>
                  <button onClick={executeDeleteAccount} style={{ width: '100%', padding: '12px', background: 'rgba(255,59,48,0.12)', border: '1px solid rgba(255,59,48,0.2)', color: '#ff3b30', borderRadius: '12px', fontWeight: '800', fontSize: '13px', cursor: 'pointer', marginTop: '10px' }}>Delete Account permanently</button>
                </div>
              )}

              {currentTab === 'help-support' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: theme.accent, cursor: 'pointer' }} onClick={() => setCurrentTab('settings')}>
                    <FontAwesomeIcon icon={faArrowLeft} /> <span style={{ fontSize: '13px', fontWeight: '700' }}>Back to Configuration Menu</span>
                  </div>
                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}><FontAwesomeIcon icon={faCircleInfo} /> Support Center & Engine Documentation</h4>
                  <div style={{ background: theme.card, padding: '14px', borderRadius: '14px', border: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px', lineHeight: '1.5' }}>
                    <div>
                      <strong style={{ color: theme.text }}>Real-time Synchronizer System</strong>
                      <p style={{ margin: '2px 0 0 0', color: theme.subText }}>Imaginary talK updates pipelines recursively across high-fidelity WebSocket streams mapped inside Supabase channel protocols.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Injected Admin Drawer Option Module Mapping */}
              {currentTab === 'admin-dashboard' && renderAdminDashboard()}
            </div>
          </div>

          {/* MAIN COMMUNICATION CHAT VIEW AND PROFILE VIEW SPLIT ENGINE */}
          <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', background: theme.bg, position: 'relative' }}>
            {activeRoomId && currentActiveRoomData ? (
              isViewingInfo ? renderInfoPage() : (
                <>
                  {/* FLOATING HEADER CARD BLOCK */}
                  <div style={{ position: 'absolute', top: '16px', left: '20px', right: '20px', height: '70px', border: `1px solid ${theme.border}`, background: theme.floatingBg, backdropFilter: 'blur(16px)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', zIndex: 100, boxShadow: theme.shadow }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => setIsViewingInfo(true)}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: getRandomColor(currentActiveRoomData.displayName), display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff', fontWeight: '800', fontSize: '15px', overflow:'hidden', flexShrink:0 }}>
                        {currentActiveRoomData.displayAvatar && currentActiveRoomData.displayAvatar !== "" ? <img src={currentActiveRoomData.displayAvatar} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : currentActiveRoomData.displayName?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: theme.text, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          {currentActiveRoomData.displayName}
                          {currentActiveRoomData.is_bot_channel && (
                            <FontAwesomeIcon icon={faCertificate} style={{ color: '#007aff', fontSize: '13px' }} />
                          )}
                          {currentActiveRoomData.type === 'personal' && targetPersonalProfile && ['admin', 'owner'].includes(targetPersonalProfile.role) && (
                            <FontAwesomeIcon icon={faUserCheck} style={{ color: theme.adminMark, fontSize: '13px' }} />
                          )}
                        </h4>
                        {/* 🔔 NEW FEATURE: Seen / Online Presence Header Info Context Trigger Injection Layer */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: theme.subText, marginTop: '2px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>{getRoomPresenceSubheaderText()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {isSearchingChat ? (
                        <div style={{ display: 'flex', alignItems: 'center', background: theme.bg, borderRadius: '8px', padding: '2px 8px', marginRight: '6px', border: `1px solid ${theme.border}` }}>
                          <input type="text" placeholder="Search node logs..." value={chatSearchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ border: 'none', background: 'none', color: theme.text, outline: 'none', fontSize: '12px', width: '120px' }} />
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

                  {/* FLOATING PINNED COMPONENT BLOCK BANNER */}
                  {pinnedMessage && (
                    <div style={{ position: 'absolute', top: '96px', left: '24px', right: '24px', background: theme.card, borderLeft: `4px solid ${theme.accent}`, borderRadius: '8px', padding: '10px 16px', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                        <FontAwesomeIcon icon={faThumbtack} style={{ color: theme.accent, fontSize: '12px' }} />
                        <p style={{ margin: 0, fontSize: '13px', color: theme.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pinnedMessage.content}</p>
                      </div>
                      <FontAwesomeIcon icon={faXmark} style={{ cursor: 'pointer', opacity: 0.5, fontSize: '14px' }} onClick={() => togglePinMessage(pinnedMessage)} />
                    </div>
                  )}

                  {/* SCROLLABLE CONVERSATION SCROLLER PACKETS GRID */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '105px 24px 100px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {filteredMessages.map((msg) => {
                      const isMe = msg.sender_id === currentUser.id;
                      const isChosen = selectedMessages.includes(msg.id);
                      const replyTimeNode = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      const replyParentMsg = msg.reply_to_id ? messages.find(m => m.id === msg.reply_to_id) : null;
                      return (
                        <div key={msg.id} onContextMenu={(e) => handleMsgContextMenu(e, msg)} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: '8px', width: '100%' }}>
                          {isSelectMode && (
                            <input type="checkbox" checked={isChosen} onChange={() => {
                              if (isChosen) setSelectedMessages(prev => prev.filter(id => id !== msg.id));
                              else setSelectedMessages(prev => [...prev, msg.id]);
                            }} style={{ width: '18px', height: '18px', marginBottom: '12px', cursor: 'pointer' }} />
                          )}
                          
                          <motion.div 
                            drag="x"
                            dragConstraints={{ left: 0, right: 65 }}
                            dragElastic={0.15}
                            onDragEnd={(e, info) => {
                              if (info.offset.x > 45) {
                                setReplyTarget(msg);
                                setEditTarget(null);
                                showNotification("Reply target mapped via gesture tracking");
                              }
                            }}
                            style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: '8px', maxWidth: '70%', x: 0 }}
                          >
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: getRandomColor(msg.profiles?.username || 'System'), display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff', fontSize: '11px', fontWeight: '700', overflow:'hidden', flexShrink:0, cursor:'pointer' }} onClick={() => setIsViewingInfo(true)}>
                              {msg.profiles?.avatar_url && msg.profiles.avatar_url !== "" ? <img src={msg.profiles.avatar_url} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : (msg.profiles?.username?.charAt(0).toUpperCase() || 'S')}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                              <span style={{ fontSize: '11px', color: theme.subText, marginBottom: '2px', padding: '0 4px', cursor:'pointer', display:'inline-flex', alignItems:'center', gap:'4px' }} onClick={() => setIsViewingInfo(true)}>
                                {msg.profiles?.username || "ItalK Official Noti Bot"}
                                {msg.is_bot_generated && (
                                  <FontAwesomeIcon icon={faCertificate} style={{ color: '#007aff', fontSize: '11px' }} />
                                )}
                                {msg.profiles && ['admin', 'owner'].includes(msg.profiles.role) && (
                                  <FontAwesomeIcon icon={faUserCheck} style={{ color: theme.adminMark, fontSize: '10px' }} />
                                )}
                              </span>
                              
                              {replyParentMsg && (
                                <div style={{ background: theme.card, borderLeft: `3px solid ${theme.accent}`, padding: '6px 10px', borderRadius: '8px 8px 0 0', fontSize: '12px', opacity: 0.8, color: theme.text, marginBottom: '-4px', width: '100%', boxSizing: 'border-box' }}>
                                  <span style={{ fontSize: '10px', color: theme.accent, fontWeight:'700', display:'block' }}>Reply message context context</span>
                                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px', display:'block' }}>{replyParentMsg.content}</span>
                                </div>
                              )}

                              <div style={{ padding: '12px 16px', borderRadius: isMe ? (replyParentMsg ? '0 16px 16px 16px' : '24px 24px 6px 24px') : (replyParentMsg ? '16px 0 16px 16px' : '24px 24px 24px 6px'), background: isMe ? theme.bubbleMe : theme.bubbleUser, color: isMe ? theme.textMe : theme.textUser, fontSize: '14px', lineHeight: '1.4', boxShadow: '0 2px 6px rgba(0,0,0,0.05)', position: 'relative', border: isChosen ? '2px solid #fff' : 'none' }}>
                                {renderMessageContent(msg.content)}
                                {msg.is_pinned && <FontAwesomeIcon icon={faThumbtack} style={{ position: 'absolute', top: '-6px', right: '-6px', fontSize: '10px', color: theme.accent, background: theme.card, padding: '3px', borderRadius: '50%' }} />}
                              </div>
                              <span style={{ fontSize: '9px', opacity: 0.6, marginTop: '2px', padding: '0 4px' }}>{replyTimeNode}</span>
                            </div>
                          </motion.div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* ATTACHED BOTTOM DISPATCH BAR AREA INPUT INTERFACE CONTROL */}
                  <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px', background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '20px', padding: '12px', zIndex: 100, boxShadow: '0 -8px 32px rgba(0,0,0,0.05)' }}>
                    
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
                      {!currentActiveRoomData?.is_bot_channel && (
                        <button type="button" onClick={() => setIsEmojiPickerOpen(prev => !prev)} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 12px', borderRadius:'14px', background: theme.card, border: `1px solid ${theme.border}`, color: theme.text, cursor:'pointer' }}>
                          <FontAwesomeIcon icon={faFaceSmile} /> Emoji Picker
                        </button>
                      )}
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: theme.subText }}>{currentActiveRoomData?.is_bot_channel ? 'Read-only channel' : 'Swipe right or use reply menu'}</span>
                      </div>
                    </div>
                    <AnimatePresence>
                      {isEmojiPickerOpen && !currentActiveRoomData?.is_bot_channel && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ display:'flex', gap:'8px', flexWrap:'wrap', padding:'10px 0', marginBottom:'8px', borderBottom:`1px solid ${theme.border}` }}>
                          {emojiOptions.map(emoji => (
                            <button key={emoji} type="button" onClick={() => handleSelectEmoji(emoji)} style={{ padding:'8px 10px', borderRadius:'12px', border:`1px solid ${theme.border}`, background: theme.card, fontSize: '18px', cursor: 'pointer' }}>{emoji}</button>
                          ))}
                        </motion.div>
                      )}
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
                      <input 
                        type="text" 
                        placeholder={currentActiveRoomData?.is_bot_channel ? 'Official Broadcast Node: Read-Only parameters locked.' : 'Transmit secure data parameters text stream...'} 
                        value={newMessage} 
                        disabled={myMemberStatus === 'banned' || currentActiveRoomData?.is_bot_channel} 
                        onChange={handleInputTyping} 
                        style={{ flex: 1, padding: '14px 18px', borderRadius: '12px', border: `1px solid ${theme.border}`, background: theme.bg, color: theme.text, fontSize: '14px', outline: 'none' }} 
                      />
                      <button type="submit" disabled={!newMessage.trim() || myMemberStatus === 'banned' || currentActiveRoomData?.is_bot_channel} style={{ height: '46px', width: '46px', borderRadius: '12px', background: theme.accent, color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><FontAwesomeIcon icon={faPaperPlane} /></button>
                    </form>
                  </div>
                </>
              )
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: theme.subText }}>
                {currentTab === 'admin-dashboard' ? renderAdminDashboard() : (
                  <>
                    <FontAwesomeIcon icon={faMessage} style={{ fontSize: '48px', marginBottom: '16px', color: theme.border }} />
                    <h3>Select an unmonitored communication network route loop</h3>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== VIEWPORT 2: MOBILE INTERACTIVE LAYER ROUTING ==================== */}
      {isMobile && (
        <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <div style={{ flex: 1, overflowY: 'auto', width: '100%', height: 'calc(100% - 70px)', paddingBottom: '90px' }}>
            {!activeRoomId && currentTab === 'chats' && (
              <div style={{ padding: '16px 20px' }}>
                <span style={{ fontSize: '24px', fontWeight: '900', display: 'block', marginBottom: '16px', color: theme.accent }}>ItalK</span>
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
                      <span style={{ fontWeight: '600', display:'inline-flex', alignItems:'center', gap:'4px' }}>
                        {u.username}
                        {['admin', 'owner'].includes(u.role) && <FontAwesomeIcon icon={faUserCheck} style={{ color: theme.adminMark, fontSize: '12px' }} />}
                      </span>
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

            {!activeRoomId && currentTab === 'profile-view' && (
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <span style={{ fontSize: '22px', fontWeight: '800' }}>My Profile Node</span>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '24px 20px', background: theme.card, borderRadius: '20px', border: `1px solid ${theme.border}` }}>
                  <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: getRandomColor(myProfile.username), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '24px', fontWeight: 'bold', overflow: 'hidden' }}>
                    {myProfile.avatar_url && myProfile.avatar_url !== "" ? <img src={myProfile.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : myProfile.username?.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontSize: '18px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {myProfile.username}
                    {['admin', 'owner'].includes(myProfile.role) && <FontAwesomeIcon icon={faUserCheck} style={{ color: theme.adminMark, fontSize: '15px' }} />}
                  </span>
                  <span style={{ fontSize: '12px', color: theme.accent }}>ID Token: {myProfile.unique_id}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', background: theme.card, padding: '14px', borderRadius: '16px', border: `1px solid ${theme.border}` }}>
                  <div><span style={{ color: theme.subText, fontSize: '11px', fontWeight: '800' }}>BIOGRAPHY</span><p style={{ margin: '2px 0 0 0' }}>{myProfile.biography || 'Empty data trace context'}</p></div>
                  <div><span style={{ color: theme.subText, fontSize: '11px', fontWeight: '800' }}>BIRTHDAY</span><p style={{ margin: '2px 0 0 0' }}>{myProfile.birthday || 'Not calibrated'}</p></div>
                </div>
                <button onClick={() => { setCurrentTab('edit-profile'); syncEditStates(myProfile); }} style={{ width: '100%', padding: '12px', background: theme.accentLight, border: `1px solid ${theme.accent}40`, color: theme.accent, borderRadius: '12px', fontWeight: '700' }}><FontAwesomeIcon icon={faUserPen} /> Edit Profile Config</button>
              </div>
            )}

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

            {/* MOBILE SETTINGS ROUTER & PRIVACY LAYOUT */}
            {!activeRoomId && currentTab === 'settings' && renderSettingsScreen()}
            {!activeRoomId && currentTab === 'private-settings' && renderPrivateSettingsScreen()}
            {!activeRoomId && currentTab === 'help-support' && renderHelpSupportScreen()}

            {!activeRoomId && currentTab === 'admin-dashboard' && renderAdminDashboard()}
          </div>

          {/* MOBILE INTERACTIVE FULL SCREEN CHAT BLOCK PANELS VIEWPORT */}
          {activeRoomId && currentActiveRoomData && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: theme.bg, zIndex: 500, display: 'flex', flexDirection: 'column' }}>
              {isViewingInfo ? renderInfoPage() : (
                <>
                  <div style={{ position: 'absolute', top: '10px', left: '10px', right: '10px', height: '60px', background: theme.floatingBg, backdropFilter: 'blur(16px)', borderRadius: '18px', border: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', padding: '0 14px', gap: '10px', zIndex: 510, boxShadow: theme.shadow }}>
                    <FontAwesomeIcon icon={faArrowLeft} style={{ fontSize: '16px', cursor: 'pointer', paddingRight: '4px' }} onClick={() => { setActiveRoomId(null); setIsViewingInfo(false); }} />
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: getRandomColor(currentActiveRoomData.displayName), display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:'bold', fontSize:'13px', overflow:'hidden', flexShrink:0 }} onClick={() => setIsViewingInfo(true)}>
                      {currentActiveRoomData.displayAvatar && currentActiveRoomData.displayAvatar !== "" ? <img src={currentActiveRoomData.displayAvatar} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : currentActiveRoomData.displayName?.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => setIsViewingInfo(true)}>
                      <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display:'inline-flex', alignItems:'center', gap:'4px' }}>
                        {currentActiveRoomData.displayName}
                        {currentActiveRoomData.is_bot_channel && (
                          <FontAwesomeIcon icon={faCertificate} style={{ color: '#007aff', fontSize: '12px' }} />
                        )}
                        {currentActiveRoomData.type === 'personal' && targetPersonalProfile && ['admin', 'owner'].includes(targetPersonalProfile.role) && (
                          <FontAwesomeIcon icon={faUserCheck} style={{ color: theme.adminMark, fontSize: '12px' }} />
                        )}
                      </h4>
                      {/* 🔔 NEW FEATURE: Real-time Presence info sync layout inside mobile viewport top app bar header */}
                      <div style={{ fontSize: '10px', color: '#34c759', fontWeight: 'bold' }}>{getRoomPresenceSubheaderText()}</div>
                    </div>
                    <FontAwesomeIcon icon={faEllipsisVertical} onClick={() => setShowHeaderMenu(!showHeaderMenu)} style={{ padding: '6px', cursor: 'pointer' }} />
                    
                    {showHeaderMenu && (
                      <div style={{ position: 'absolute', right: '10px', top: '55px', width: '160px', background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '4px', zIndex: 600, display: 'flex', flexDirection: 'column' }}>
                        <button onClick={handleClearChatDatabase} style={{ background: 'none', border: 'none', color: '#ff3b30', padding: '8px', fontSize: '12px', textAlign: 'left', fontWeight: '700' }}><FontAwesomeIcon icon={faTrash} /> Clear History</button>
                      </div>
                    )}
                  </div>

                  {pinnedMessage && (
                    <div style={{ position: 'absolute', top: '76px', left: '14px', right: '14px', background: theme.floatingBg, backdropFilter: 'blur(10px)', borderLeft: `3px solid ${theme.accent}`, padding: '8px 12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', zIndex: 505, boxShadow: theme.shadow }}>
                      <span style={{ fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '85%' }}>📌 {pinnedMessage.content}</span>
                      <FontAwesomeIcon icon={faXmark} style={{ opacity: 0.6 }} onClick={() => togglePinMessage(pinnedMessage)} />
                    </div>
                  )}

                  <div style={{ flex: 1, overflowY: 'auto', padding: '85px 16px 85px 16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {filteredMessages.map(msg => {
                      const isMe = msg.sender_id === currentUser.id;
                      const nestedReply = msg.reply_to_id ? messages.find(m => m.id === msg.reply_to_id) : null;
                      return (
                        <div key={msg.id} onContextMenu={(e) => handleMsgContextMenu(e, msg)} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: '8px', width: '100%' }}>
                          
                          {/* Gesture Tracks Swipe to Reply integration on Mobile bubbles */}
                          <motion.div 
                            drag="x"
                            dragConstraints={{ left: 0, right: 50 }}
                            dragElastic={0.15}
                            onDragEnd={(e, info) => {
                              if (info.offset.x > 40) {
                                setReplyTarget(msg);
                                setEditTarget(null);
                                showNotification("Reply target mapped");
                              }
                            }}
                            style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: '8px', maxWidth: '80%', x: 0 }}
                          >
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: getRandomColor(msg.profiles?.username || 'System'), display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff', fontSize: '11px', fontWeight: '700', overflow:'hidden', flexShrink:0, cursor:'pointer' }} onClick={() => setIsViewingInfo(true)}>
                              {msg.profiles?.avatar_url && msg.profiles.avatar_url !== "" ? <img src={msg.profiles.avatar_url} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : (msg.profiles?.username?.charAt(0).toUpperCase() || 'S')}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                              <span style={{ fontSize: '11px', color: theme.subText, marginBottom: '2px', padding: '0 4px', cursor:'pointer', display:'inline-flex', alignItems:'center', gap:'4px' }} onClick={() => setIsViewingInfo(true)}>
                                {msg.profiles?.username || "ItalK Official Bot"}
                                {msg.is_bot_generated && (
                                  <FontAwesomeIcon icon={faCertificate} style={{ color: '#007aff', fontSize: '10px' }} />
                                )}
                                {msg.profiles && ['admin', 'owner'].includes(msg.profiles.role) && (
                                  <FontAwesomeIcon icon={faUserCheck} style={{ color: theme.adminMark, fontSize: '10px' }} />
                                )}
                              </span>
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
                          </motion.div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  <div style={{ position: 'absolute', bottom: '10px', left: '10px', right: '10px', background: theme.floatingBg, backdropFilter: 'blur(16px)', borderRadius: '18px', padding: '8px', border: `1px solid ${theme.border}`, zIndex: 510, boxShadow: theme.shadow, display: 'flex', flexDirection: 'column' }}>
                    
                    {!currentActiveRoomData?.is_bot_channel && (
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
                        <button type="button" onClick={() => setIsEmojiPickerOpen(prev => !prev)} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 12px', borderRadius:'14px', background: theme.card, border:`1px solid ${theme.border}`, color: theme.text, cursor:'pointer' }}>
                          <FontAwesomeIcon icon={faFaceSmile} /> Add Emoji
                        </button>
                        <span style={{ fontSize:'11px', color: theme.subText }}>Swipe right on a bubble to reply</span>
                      </div>
                    )}
                    <AnimatePresence>
                      {isEmojiPickerOpen && !currentActiveRoomData?.is_bot_channel && (
                        <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }} style={{ display:'flex', flexWrap:'wrap', gap:'8px', padding:'8px 0', borderBottom:`1px solid ${theme.border}`, marginBottom:'8px' }}>
                          {emojiOptions.map(emoji => (
                            <button key={emoji} type="button" onClick={() => handleSelectEmoji(emoji)} style={{ padding:'8px 10px', borderRadius:'12px', border:`1px solid ${theme.border}`, background: theme.card, fontSize:'16px', cursor:'pointer' }}>{emoji}</button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {replyTarget && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', background: theme.bg, padding: '6px 12px', fontSize: '11px', borderRadius: '8px', marginBottom: '4px' }}>
                        <span>Replying payload text trace...</span>
                        <FontAwesomeIcon icon={faXmark} onClick={() => setReplyTarget(null)} />
                      </div>
                    )}
                    <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <input 
                        type="text" 
                        placeholder={currentActiveRoomData?.is_bot_channel ? 'Official read-only array...' : 'Message trace payload...'} 
                        value={newMessage} 
                        disabled={myMemberStatus === 'banned' || currentActiveRoomData?.is_bot_channel} 
                        onChange={handleInputTyping} 
                        style={{ flex: 1, padding: '10px 12px', borderRadius: '12px', border: `1px solid ${theme.border}`, background: theme.bg, color: theme.text, fontSize: '13.5px', outline: 'none' }} 
                      />
                      <button type="submit" disabled={!newMessage.trim() || myMemberStatus === 'banned' || currentActiveRoomData?.is_bot_channel} style={{ width: '38px', height: '38px', borderRadius: '50%', background: theme.accent, border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FontAwesomeIcon icon={faPaperPlane} size="sm" /></button>
                    </form>
                  </div>
                </>
              )}
            </div>
          )}
          
          {/* LOWER MOBILE FLOATING NAVIGATION BAR */}
          {!activeRoomId && (
            <div style={{ position: 'fixed', bottom: '16px', left: '4%', width: '92%', height: '64px', background: theme.card, borderRadius: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.25)', border: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 99, padding: '0 8px', boxSizing: 'border-box' }}>
              {tabsConfig.map(tab => {
                const isSelected = tab.match ? tab.match.includes(currentTab) : currentTab === tab.id;
                return (
                  <button 
                    key={tab.id}
                    onClick={() => { setCurrentTab(tab.id); setActiveRoomId(null); setIsViewingInfo(false); }}
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

    </div>
  );
}