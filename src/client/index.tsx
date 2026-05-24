import { createRoot } from 'react-dom/client';
import { usePartySocket } from 'partysocket/react';
import React, { useReducer, useEffect, useRef, useCallback, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { nanoid } from 'nanoid';
import {
  getRandomName,
  getTranslations,
  type ChatMessage,
  MIN_NICKNAME_LENGTH,
  MAX_NICKNAME_LENGTH,
  MAX_MESSAGE_LENGTH,
  validateNickname,
  getRandomColor,
  STORAGE_KEYS,
  generateUserId,
  MESSAGE_PERSISTENCE_HOURS,
} from '../shared';

interface ChatState {
  userId: string;
  name: string;
  nicknameColor: string;
  connectedUsers: string[];
  bannedUsers: { userId: string; nickname: string; until?: number }[];
  otherUserColors: Record<string, string>;
  messages: ChatMessage[];
  newName: string;
  showNameChange: boolean;
  showAdminPanel: boolean;
  showApiKeyDialog: boolean;
  showConfirmDialog: boolean;
  confirmAction: (() => void) | null;
  confirmMessage: string;
  apiKey: string;
  isAdmin: boolean;
  isChatFrozen: boolean;
  isAdminOnly: boolean;
  showBanList: boolean;
  theme: string;
  isConnected: boolean;
  error: string | null;
  showUserList: boolean;
  showUserActions: boolean;
  targetUserId: string | null;
  targetNickname: string | null;
  userActionsPosition: { top: number; left: number } | null;
  isBanned: boolean;
  timeoutUntil: number | null;
  originalNickname: string | null;
}

type ChatAction =
  | { type: 'INIT_STATE'; payload: Partial<ChatState> }
  | { type: 'SET_NICKNAME_NAME'; payload: { name: string; newName: string } }
  | { type: 'SET_NICKNAME_COLOR'; payload: { color: string } }
  | { type: 'SET_OTHER_USER_COLOR'; payload: { user: string; color: string } }
  | { type: 'SET_MESSAGES'; payload: ChatMessage[] }
  | { type: 'SET_NEW_NAME'; payload: string }
  | { type: 'TOGGLE_NAME_CHANGE'; payload: boolean }
  | { type: 'SET_USERS'; payload: string[] }
  | { type: 'SET_BANNED_USERS'; payload: { userId: string; nickname: string; until?: number }[] }
  | { type: 'TOGGLE_ADMIN_PANEL'; payload: boolean }
  | { type: 'TOGGLE_API_KEY_DIALOG'; payload: boolean }
  | { type: 'TOGGLE_CONFIRM_DIALOG'; payload: { show: boolean; action: (() => void) | null; message: string } }
  | { type: 'SET_API_KEY'; payload: string }
  | { type: 'SET_ADMIN'; payload: boolean }
  | { type: 'TOGGLE_CHAT_FROZEN'; payload: boolean }
  | { type: 'TOGGLE_ADMIN_ONLY'; payload: boolean }
  | { type: 'TOGGLE_BAN_LIST'; payload: boolean }
  | { type: 'SET_THEME'; payload: string }
  | { type: 'SET_CONNECTION'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'TOGGLE_USER_LIST' }
  | { type: 'SHOW_USER_ACTIONS'; payload: { show: boolean; userId: string | null; nickname: string | null; position: { top: number; left: number } | null } }
  | { type: 'SET_BAN_STATUS'; payload: { isBanned: boolean; timeoutUntil: number | null } };

const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case 'INIT_STATE':
      return { ...state, ...action.payload };
    case 'SET_NICKNAME_NAME':
      return { ...state, name: action.payload.name, newName: action.payload.newName };
    case 'SET_NICKNAME_COLOR':
      return { ...state, nicknameColor: action.payload.color };
    case 'SET_OTHER_USER_COLOR':
      return { ...state, otherUserColors: { ...state.otherUserColors, [action.payload.user]: action.payload.color } };
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };
    case 'SET_NEW_NAME':
      return { ...state, newName: action.payload };
    case 'TOGGLE_NAME_CHANGE':
      return { ...state, showNameChange: action.payload };
    case 'SET_USERS':
      return { ...state, connectedUsers: action.payload };
    case 'SET_BANNED_USERS':
      return {
        ...state,
        bannedUsers: action.payload,
        isBanned: action.payload.some((u) => u.userId === state.userId && (!u.until || u.until > Date.now())),
      };
    case 'TOGGLE_ADMIN_PANEL':
      return { ...state, showAdminPanel: action.payload };
    case 'TOGGLE_API_KEY_DIALOG':
      return { ...state, showApiKeyDialog: action.payload };
    case 'TOGGLE_CONFIRM_DIALOG':
      return { ...state, showConfirmDialog: action.payload.show, confirmAction: action.payload.action, confirmMessage: action.payload.message };
    case 'SET_API_KEY':
      return { ...state, apiKey: action.payload };
    case 'SET_ADMIN':
      return { ...state, isAdmin: action.payload };
    case 'TOGGLE_CHAT_FROZEN':
      return { ...state, isChatFrozen: action.payload };
    case 'TOGGLE_ADMIN_ONLY':
      return { ...state, isAdminOnly: action.payload };
    case 'TOGGLE_BAN_LIST':
      return { ...state, showBanList: action.payload };
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'SET_CONNECTION':
      return { ...state, isConnected: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'TOGGLE_USER_LIST':
      return { ...state, showUserList: !state.showUserList };
    case 'SHOW_USER_ACTIONS':
      return { ...state, showUserActions: action.payload.show, targetUserId: action.payload.userId, targetNickname: action.payload.nickname, userActionsPosition: action.payload.position };
    case 'SET_BAN_STATUS':
      return { ...state, isBanned: action.payload.isBanned, timeoutUntil: action.payload.timeoutUntil };
    default:
      return state;
  }
};

const App = () => {
  const [state, dispatch] = useReducer(chatReducer, {
    userId: generateUserId(),
    name: '',
    nicknameColor: '#64B5F6',
    connectedUsers: [],
    bannedUsers: [],
    otherUserColors: {},
    messages: [],
    newName: '',
    showNameChange: false,
    showAdminPanel: false,
    showApiKeyDialog: false,
    showConfirmDialog: false,
    confirmAction: null,
    confirmMessage: '',
    apiKey: '',
    isAdmin: false,
    isChatFrozen: false,
    isAdminOnly: false,
    showBanList: false,
    theme: 'light',
    isConnected: false,
    error: null,
    showUserList: false,
    showUserActions: false,
    targetUserId: null,
    targetNickname: null,
    userActionsPosition: null,
    isBanned: false,
    timeoutUntil: null,
    originalNickname: null,
  });

  const {
    userId,
    name,
    nicknameColor,
    connectedUsers,
    bannedUsers,
    otherUserColors,
    messages,
    newName,
    showNameChange,
    showAdminPanel,
    showApiKeyDialog,
    showConfirmDialog,
    confirmAction,
    confirmMessage,
    apiKey,
    isAdmin,
    isChatFrozen,
    isAdminOnly,
    showBanList,
    theme,
    isConnected,
    error,
    showUserList,
    showUserActions,
    targetUserId,
    targetNickname,
    userActionsPosition,
    isBanned,
    timeoutUntil,
  } = state;

  const [messageInput, setMessageInput] = useState('');
  const [placeholder, setPlaceholder] = useState('');
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [showScrollButtons, setShowScrollButtons] = useState(false);

  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const apiKeyInputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const systemMessages = useRef<ChatMessage[]>([]);
  const lastNicknameChangeId = useRef<string | null>(null);

  const translations = getTranslations();
  const { nicknameLabel, placeholder: defaultPlaceholder, confirm, nicknameChanged } = translations;

  const updateMessages = useCallback((newMessages: ChatMessage[]) => {
    dispatch({ type: 'SET_MESSAGES', payload: newMessages });
  }, []);

  const socket = usePartySocket({
    host: window.location.origin,
    room: 'chat',
    onOpen: () => {
      dispatch({ type: 'SET_CONNECTION', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      const storedNickname = localStorage.getItem(STORAGE_KEYS.NICKNAME) || getRandomName();
      const storedColor = localStorage.getItem(STORAGE_KEYS.NICKNAME_COLOR) || '#64B5F6';
      const storedApiKey = localStorage.getItem(STORAGE_KEYS.API_KEY) || '';
      const storedIsAdmin = localStorage.getItem(STORAGE_KEYS.IS_ADMIN) === 'true';
      const storedOriginalNickname = localStorage.getItem(STORAGE_KEYS.ORIGINAL_NICKNAME) || storedNickname;
      dispatch({ type: 'SET_NICKNAME_NAME', payload: { name: storedNickname, newName: storedNickname } });
      dispatch({ type: 'SET_NICKNAME_COLOR', payload: { color: storedColor } });
      dispatch({ type: 'SET_API_KEY', payload: storedApiKey });
      dispatch({ type: 'SET_ADMIN', payload: storedIsAdmin });
      dispatch({ type: 'SET_THEME', payload: document.documentElement.getAttribute('data-theme') || 'light' });
      if (storedIsAdmin) {
        dispatch({ type: 'SET_NICKNAME_NAME', payload: { name: storedNickname, newName: storedNickname } });
      }
      dispatch({ type: 'SET_BAN_STATUS', payload: { isBanned: false, timeoutUntil: null } });
      dispatch({ type: 'SET_ORIGINAL_NICKNAME', payload: storedOriginalNickname });
      socket.send(JSON.stringify({ type: 'join', userId, nickname: storedNickname, isAdmin: storedIsAdmin }));
    },
    onMessage: (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'init') {
        updateMessages([...message.messages, ...systemMessages.current]);
        dispatch({ type: 'SET_USERS', payload: message.users });
        dispatch({ type: 'SET_BANNED_USERS', payload: message.bannedUsers || [] });
        dispatch({ type: 'SET_CONNECTION', payload: true });
      } else if (message.type === 'message') {
        updateMessages([...messages.filter((msg) => !msg.isSystem), message.message, ...systemMessages.current]);
      } else if (message.type === 'userList') {
        dispatch({ type: 'SET_USERS', payload: message.users });
      } else if (message.type === 'bannedUsers') {
        dispatch({ type: 'SET_BANNED_USERS', payload: message.bannedUsers });
      } else if (message.type === 'banStatus') {
        dispatch({ type: 'SET_BAN_STATUS', payload: { isBanned: message.isBanned, timeoutUntil: message.timeoutUntil } });
      } else if (message.type === 'error') {
        dispatch({ type: 'SET_ERROR', payload: message.message });
      } else if (message.type === 'chatFrozen') {
        dispatch({ type: 'TOGGLE_CHAT_FROZEN', payload: message.isFrozen });
      } else if (message.type === 'adminOnly') {
        dispatch({ type: 'TOGGLE_ADMIN_ONLY', payload: message.isAdminOnly });
      } else if (message.type === 'clearChat') {
        updateMessages(systemMessages.current);
      } else if (message.message === 'banned') {
        dispatch({ type: 'SET_BAN_STATUS', payload: { isBanned: true, timeoutUntil: null } });
        localStorage.removeItem(STORAGE_KEYS.TIMEOUT_UNTIL);
        localStorage.setItem(STORAGE_KEYS.IS_BANNED, 'true');
        setMessageInput('');
        adjustInputHeight();
      } else if (message.message === 'frozen') {
        dispatch({ type: 'SET_ERROR', payload: translations.chatFrozen });
        setMessageInput('');
        adjustInputHeight();
      } else if (message.message === 'adminOnly') {
        dispatch({ type: 'SET_ERROR', payload: translations.adminOnly });
        setMessageInput('');
        adjustInputHeight();
      } else if (message.message === 'invalidData') {
        dispatch({ type: 'SET_ERROR', payload: translations.processMessageFailed });
      }
    },
    onClose: () => {
      dispatch({ type: 'SET_CONNECTION', payload: false });
      dispatch({ type: 'SET_ERROR', payload: getTranslations().errorMessages.connectionClosed });
      setMessageInput('');
      adjustInputHeight();
    },
  });

  const adjustInputHeight = useCallback(() => {
    if (messageInputRef.current) {
      const textarea = messageInputRef.current;
      textarea.style.height = '38px';
      const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight);
      const maxLines = 5;
      const maxHeight = lineHeight * maxLines;
      const scrollHeight = textarea.scrollHeight;
      const newHeight = Math.min(Math.max(scrollHeight, 38), maxHeight);
      textarea.style.height = `${newHeight}px`;
      textarea.style.overflowY = newHeight >= maxHeight ? 'auto' : 'hidden';
    }
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageInput(e.target.value);
  }, []);

  const handleMessageSubmit = useCallback(async () => {
    if (!messageInput.trim() || !isConnected) return;
    try {
      const message = {
        id: nanoid(),
        content: messageInput.trim(),
        user: name,
        userId,
        role: 'user',
        timestamp: Date.now(),
      };
      socket.send(JSON.stringify({ type: 'message', message }));
      setMessageInput('');
      adjustInputHeight();
    } catch {
      dispatch({ type: 'SET_ERROR', payload: getTranslations().errorMessages.postMessageFailed });
    }
  }, [messageInput, isConnected, name, userId, socket, adjustInputHeight]);

  useEffect(() => {
    if (messageInputRef.current) {
      messageInputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    setPlaceholder(defaultPlaceholder);
  }, [defaultPlaceholder]);

  useEffect(() => {
    if (timeoutUntil && timeoutUntil > Date.now()) {
      const interval = setInterval(() => {
        const remaining = Math.max(0, Math.floor((timeoutUntil - Date.now()) / 1000));
        setRemainingTime(remaining);
        if (remaining <= 0) {
          clearInterval(interval);
          dispatch({ type: 'SET_BAN_STATUS', payload: { isBanned: false, timeoutUntil: null } });
        }
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setRemainingTime(null);
    }
  }, [timeoutUntil]);

  useEffect(() => {
    const checkScroll = () => {
      if (messagesContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
        setShowScrollButtons(scrollHeight > clientHeight + 100);
      }
    };
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
      checkScroll();
    }
    return () => {
      if (container) container.removeEventListener('scroll', checkScroll);
    };
  }, [messages]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        !target.closest('.nickname-dialog') &&
        !target.closest('.admin-panel') &&
        !target.closest('.ban-list') &&
        !target.closest('.user-actions-dropdown') &&
        !target.closest('.confirm-dialog') &&
        !target.closest('.admin-dialog')
      ) {
        dispatch({ type: 'TOGGLE_NAME_CHANGE', payload: false });
        dispatch({ type: 'TOGGLE_ADMIN_PANEL', payload: false });
        dispatch({ type: 'TOGGLE_BAN_LIST', payload: false });
        dispatch({ type: 'SHOW_USER_ACTIONS', payload: { show: false, userId: null, nickname: null, position: null } });
        dispatch({ type: 'TOGGLE_CONFIRM_DIALOG', payload: { show: false, action: null, message: '' } });
        dispatch({ type: 'TOGGLE_API_KEY_DIALOG', payload: false });
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (messageInputRef.current) {
      const textarea = messageInputRef.current;
      textarea.addEventListener('input', adjustInputHeight);
      adjustInputHeight();
      return () => {
        textarea.removeEventListener('input', adjustInputHeight);
      };
    }
  }, [adjustInputHeight, messageInput]);

  const handleNameChange = useCallback(() => {
    if (!newName.trim()) {
      alert(getTranslations().errorMessages.invalidNickname);
      return;
    }
    if (!validateNickname(newName)) {
      alert(getTranslations().errorMessages.invalidNickname);
      return;
    }
    if (newName.toLowerCase().includes('filmnt')) {
      alert(getTranslations().errorMessages.filmntNickname);
      return;
    }
    const trimmedName = newName.trim().slice(0, MAX_NICKNAME_LENGTH);
    if (trimmedName === name) {
      dispatch({ type: 'TOGGLE_NAME_CHANGE', payload: false });
      return;
    }
    dispatch({ type: 'SET_NICKNAME_NAME', payload: { name: trimmedName, newName: trimmedName } });
    localStorage.setItem(STORAGE_KEYS.NICKNAME, trimmedName);
    const nicknameChangeMessage = {
      id: nanoid(),
      content: nicknameChanged,
      user: '🪴Filmnt',
      userId: 'system',
      role: 'filmnt',
      timestamp: Date.now(),
      isSystem: true,
    };
    if (lastNicknameChangeId.current !== nicknameChangeMessage.id) {
      systemMessages.current = [...systemMessages.current, nicknameChangeMessage];
      updateMessages([...messages.filter((msg) => !msg.isSystem), ...systemMessages.current]);
      lastNicknameChangeId.current = nicknameChangeMessage.id;
    }
    dispatch({ type: 'TOGGLE_NAME_CHANGE', payload: false });
    socket.send(JSON.stringify({ type: 'updateUser', userId, nickname: trimmedName }));
    safePostMessage({ type: 'nicknameChange', userId, newName: trimmedName });
  }, [newName, name, userId, nicknameChanged, messages, socket, updateMessages]);

  const handleRandomName = useCallback(() => {
    const randomName = getRandomName();
    dispatch({ type: 'SET_NEW_NAME', payload: randomName });
  }, []);

  const handleColorChange = useCallback(() => {
    try {
      const excludeColors = ['#64B5F6', ...Object.values(otherUserColors)];
      const newColor = getRandomColor(excludeColors);
      dispatch({ type: 'SET_NICKNAME_COLOR', payload: { color: newColor } });
      localStorage.setItem(STORAGE_KEYS.NICKNAME_COLOR, newColor);
    } catch {
      dispatch({ type: 'SET_ERROR', payload: getTranslations().errorMessages.colorChangeFailed });
    }
  }, [otherUserColors]);

  const handleApiKeySubmit = useCallback(() => {
    socket.send(JSON.stringify({ type: 'authenticate', apiKey, userId }));
    dispatch({ type: 'TOGGLE_API_KEY_DIALOG', payload: false });
  }, [apiKey, userId, socket]);

  const handleFreezeChat = useCallback(() => {
    socket.send(JSON.stringify({ type: 'freezeChat', isFrozen: !isChatFrozen, userId }));
  }, [isChatFrozen, userId, socket]);

  const handleChatAdminOnly = useCallback(() => {
    socket.send(JSON.stringify({ type: 'adminOnly', isAdminOnly: !isAdminOnly, userId }));
  }, [isAdminOnly, userId, socket]);

  const handleClearChat = useCallback(() => {
    dispatch({
      type: 'TOGGLE_CONFIRM_DIALOG',
      payload: { show: true, action: () => socket.send(JSON.stringify({ type: 'clearChat', userId })), message: 'Are you sure you want to clear all chat history?' },
    });
  }, [userId, socket]);

  const handleSaveChat = useCallback(() => {
    try {
      const chatContent = messages.map((msg) => `${msg.user}: ${msg.content}\n`).join('');
      const blob = new Blob([chatContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat_${new Date().toISOString()}.txt`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      dispatch({ type: 'SET_ERROR', payload: getTranslations().errorMessages.saveChatFailed });
    }
  }, [messages]);

  const handleLogout = useCallback(() => {
    const storedNickname = localStorage.getItem(STORAGE_KEYS.ORIGINAL_NICKNAME) || getRandomName();
    dispatch({ type: 'SET_ADMIN', payload: false });
    localStorage.setItem(STORAGE_KEYS.IS_ADMIN, 'false');
    localStorage.removeItem(STORAGE_KEYS.API_KEY);
    localStorage.setItem(STORAGE_KEYS.NICKNAME, storedNickname);
    dispatch({ type: 'TOGGLE_ADMIN_PANEL', payload: false });
    dispatch({ type: 'SET_NICKNAME_NAME', payload: { name: storedNickname, newName: storedNickname } });
    socket.send(JSON.stringify({ type: 'logoutAdmin', userId, nickname: storedNickname }));
    socket.send(JSON.stringify({ type: 'updateUser', userId, nickname: storedNickname }));
    safePostMessage({ type: 'nicknameChange', userId, newName: storedNickname });
  }, [userId, socket]);

  const handleBanUser = useCallback(
    (targetUserId: string, nickname: string, duration?: number) => {
      socket.send(JSON.stringify({ type: 'banUser', userId, targetUserId, nickname, duration }));
      dispatch({ type: 'SHOW_USER_ACTIONS', payload: { show: false, userId: null, nickname: null, position: null } });
    },
    [userId, socket]
  );

  const handleUnbanUser = useCallback(
    (targetUserId: string) => {
      socket.send(JSON.stringify({ type: 'unbanUser', userId, targetUserId }));
    },
    [userId, socket]
  );

  const handleDeleteUserMessages = useCallback(
    (targetUserId: string) => {
      socket.send(JSON.stringify({ type: 'deleteUserMessages', userId, targetUserId }));
      dispatch({ type: 'SHOW_USER_ACTIONS', payload: { show: false, userId: null, nickname: null, position: null } });
    },
    [userId, socket]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleMessageSubmit();
      }
    },
    [handleMessageSubmit]
  );

  const handleUserClick = useCallback(
    (e: React.MouseEvent, userId: string, nickname: string) => {
      if (!isAdmin || !userId || !nickname) return;
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const chatContainer = messagesContainerRef.current?.getBoundingClientRect();
      if (!chatContainer) return;

      let top = rect.top + window.scrollY;
      let left = rect.right + window.scrollX;

      const maxWidth = 300;
      const maxHeight = 200;

      if (left + maxWidth > chatContainer.right) {
        left = rect.left - maxWidth + window.scrollX;
      }
      if (top + maxHeight > chatContainer.bottom + window.scrollY) {
        top = rect.top - maxHeight + window.scrollY;
      }

      dispatch({
        type: 'SHOW_USER_ACTIONS',
        payload: { show: true, userId, nickname, position: { top, left } },
      });
    },
    [isAdmin]
  );

  const handleScrollToTop = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = 0;
    }
  }, []);

  const handleScrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, []);

  return (
    <div className="chat">
      <div className="nickname-form">
        <div className="user-count" onClick={() => dispatch({ type: 'TOGGLE_USER_LIST' })}>
          <i className="fa-solid fa-users"></i> {connectedUsers.length}
          {showUserList && (
            <div className="user-dropdown">
              {connectedUsers.map((user) => (
                <div key={user} className="user-dropdown-item" style={{ color: otherUserColors[user] || assignOtherUserColor(user) }}>
                  {user}
                </div>
              ))}
            </div>
          )}
        </div>
        <button
          className="change-nickname"
          onClick={() => dispatch({ type: 'TOGGLE_NAME_CHANGE', payload: true })}
          disabled={isAdmin}
        >
          <i className="fa-solid fa-gear"></i>
        </button>
        <button
          className="admin-toggle"
          onClick={() => (isAdmin ? dispatch({ type: 'TOGGLE_ADMIN_PANEL', payload: !showAdminPanel }) : dispatch({ type: 'TOGGLE_API_KEY_DIALOG', payload: true }))}
        >
          <i className="fa-solid fa-key"></i>
        </button>
      </div>
      <div className="messages" ref={messagesContainerRef}>
        {showScrollButtons && (
          <div className="scroll-buttons">
            <button className="scroll-button" onClick={handleScrollToTop}>
              <i className="fa-solid fa-arrow-up"></i>
            </button>
            <button className="scroll-button" onClick={handleScrollToBottom}>
              <i className="fa-solid fa-arrow-down"></i>
            </button>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className="message">
            <div
              className="user-content"
              style={{
                color: msg.isSystem ? '#64B5F6' : msg.userId === userId ? nicknameColor : otherUserColors[msg.user] || assignOtherUserColor(msg.user),
              }}
              onClick={(e) => handleUserClick(e, msg.userId, msg.user)}
            >
              {msg.user}
            </div>
            <div className="message-content" style={{ fontWeight: msg.userId === userId ? 'bold' : 'normal' }}>
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form
        className="chat-form"
        onSubmit={(e) => {
          e.preventDefault();
          handleMessageSubmit();
        }}
      >
        <button
          className="nickname-box"
          style={{ color: nicknameColor, textTransform: 'none' }}
          onClick={handleColorChange}
          onTouchStart={handleColorChange}
        >
          {name || 'Guest'}
        </button>
        <textarea
          name="content"
          className="message-input"
          placeholder={
            error
              ? error
              : isBanned
              ? getTranslations().errorMessages.banned
              : timeoutUntil && timeoutUntil > Date.now() && remainingTime !== null
              ? `${getTranslations().timeoutMessage} (${Math.floor(remainingTime / 60)}:${(remainingTime % 60).toString().padStart(2, '0')})`
              : isChatFrozen
              ? getTranslations().errorMessages.chatFrozen
              : isAdminOnly && !isAdmin
              ? getTranslations().errorMessages.adminOnly
              : placeholder
          }
          autoComplete="off"
          autoCorrect="off"
          maxLength={MAX_MESSAGE_LENGTH}
          disabled={!isConnected || isChatFrozen || (isAdminOnly && !isAdmin) || isBanned || (timeoutUntil && timeoutUntil > Date.now())}
          ref={messageInputRef}
          value={messageInput}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          style={{ whiteSpace: 'pre-wrap' }}
        />
      </form>
      {showNameChange && (
        <div className="nickname-dialog">
          <div className="nickname-dialog-content">
            <i className="fa-solid fa-xmark fa-xl close-icon" onClick={() => dispatch({ type: 'TOGGLE_NAME_CHANGE', payload: false })}></i>
            <p>{nicknameLabel}</p>
            <div className="input-container">
              <input
                type="text"
                value={newName}
                onChange={(e) => dispatch({ type: 'SET_NEW_NAME', payload: e.target.value })}
                className="my-input-text"
                ref={nameInputRef}
                maxLength={MAX_NICKNAME_LENGTH}
                minLength={MIN_NICKNAME_LENGTH}
                autoComplete="off"
              />
            </div>
            <div className="dialog-buttons">
              <button type="button" className="confirm-button" onClick={handleRandomName}>
                <i className="fa-solid fa-rotate"></i>
              </button>
              <button type="button" className="confirm-button" onClick={handleNameChange}>
                {confirm}
              </button>
            </div>
          </div>
        </div>
      )}
      {showApiKeyDialog && (
        <div className="admin-dialog">
          <div className="admin-dialog-content">
            <i className="fa-solid fa-xmark fa-xl close-icon" onClick={() => dispatch({ type: 'TOGGLE_API_KEY_DIALOG', payload: false })}></i>
            <p>Enter API Key</p>
            <div className="input-container">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => dispatch({ type: 'SET_API_KEY', payload: e.target.value })}
                className="my-input-text"
                ref={apiKeyInputRef}
                autoComplete="off"
              />
            </div>
            <div className="dialog-buttons">
              <button type="button" className="confirm-button" onClick={handleApiKeySubmit}>
                {confirm}
              </button>
            </div>
          </div>
        </div>
      )}
      {showAdminPanel && isAdmin && (
        <div className="admin-panel">
          <div className="admin-panel-item" onClick={handleFreezeChat}>
            <i className="fa-solid fa-snowflake"></i> {isChatFrozen ? 'Unfreeze Chat' : 'Freeze Chat'}
          </div>
          <div className="admin-panel-item" onClick={handleChatAdminOnly}>
            <i className="fa-solid fa-lock"></i> {isAdminOnly ? 'Allow All Chat' : 'Admin Only Chat'}
          </div>
          <div className="admin-panel-item" onClick={handleClearChat}>
            <i className="fa-solid fa-trash"></i> Clear All Chat
          </div>
          <div className="admin-panel-item" onClick={handleSaveChat}>
            <i className="fa-solid fa-download"></i> Save Chat
          </div>
          <div className="admin-panel-item" onClick={() => dispatch({ type: 'TOGGLE_BAN_LIST', payload: true })}>
            <i className="fa-solid fa-ban"></i> View Ban List
          </div>
          <div className="admin-panel-item" onClick={handleLogout}>
            <i className="fa-solid fa-sign-out"></i> Logout
          </div>
        </div>
      )}
      {showConfirmDialog && (
        <div className="confirm-dialog">
          <div className="confirm-dialog-content">
            <i
              className="fa-solid fa-xmark fa-xl close-icon"
              style={{ position: 'absolute', right: '15px', top: '15px' }}
              onClick={() => dispatch({ type: 'TOGGLE_CONFIRM_DIALOG', payload: { show: false, action: null, message: '' } })}
            ></i>
            <p className="confirm-text">{confirmMessage}</p>
            <div className="dialog-buttons">
              <button
                type="button"
                className="confirm-button"
                onClick={() => {
                  confirmAction && confirmAction();
                  dispatch({ type: 'TOGGLE_CONFIRM_DIALOG', payload: { show: false, action: null, message: '' } });
                }}
              >
                {confirm}
              </button>
            </div>
          </div>
        </div>
      )}
      {showBanList && isAdmin && (
        <div className="ban-list">
          <div className="ban-list-content">
            <i className="fa-solid fa-xmark fa-xl close-icon" onClick={() => dispatch({ type: 'TOGGLE_BAN_LIST', payload: false })}></i>
            <p>Banned Users</p>
            {bannedUsers.filter((user) => (!user.until || user.until > Date.now())).map((user) => (
              <div className="ban-list-item" key={user.userId}>
                <span style={{ color: theme === 'light' ? '#000000' : '#ffffff' }}>
                  {user.nickname} {user.until ? `(Until: ${new Date(user.until).toLocaleString()})` : ''}
                </span>
                <div className="ban-options-list">
                  <button onClick={() => handleUnbanUser(user.userId)}>Unban</button>
                  <button onClick={() => handleBanUser(user.userId, user.nickname, 60 * 1000)}>1m</button>
                  <button onClick={() => handleBanUser(user.userId, user.nickname, 5 * 60 * 1000)}>5m</button>
                  <button onClick={() => handleBanUser(user.userId, user.nickname, 15 * 60 * 1000)}>15m</button>
                  <button onClick={() => handleBanUser(user.userId, user.nickname, 60 * 60 * 1000)}>1h</button>
                  <button onClick={() => handleBanUser(user.userId, user.nickname, 24 * 60 * 60 * 1000)}>24h</button>
                  <button onClick={() => handleBanUser(user.userId, user.nickname)}>Ban</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {showUserActions && isAdmin && targetUserId && targetNickname && userActionsPosition && (
        <div
          className="user-actions-dropdown"
          style={{
            top: userActionsPosition.top,
            left: userActionsPosition.left,
            background: theme === 'dark' ? '#333333' : '#ffffff',
            border: `1px solid ${theme === 'dark' ? '#555555' : '#dddddd'}`,
          }}
        >
          <div className="user-actions-content">
            <button onClick={() => handleDeleteUserMessages(targetUserId)}>Delete All Messages</button>
            <button onClick={() => handleBanUser(targetUserId, targetNickname)}>Ban</button>
            <button onClick={() => handleBanUser(targetUserId, targetNickname, 60 * 1000)}>Timeout 1m</button>
            <button onClick={() => handleBanUser(targetUserId, targetNickname, 5 * 60 * 1000)}>Timeout 5m</button>
            <button onClick={() => handleBanUser(targetUserId, targetNickname, 15 * 60 * 1000)}>Timeout 15m</button>
            <button onClick={() => handleBanUser(targetUserId, targetNickname, 60 * 60 * 1000)}>Timeout 1h</button>
            <button onClick={() => handleBanUser(targetUserId, targetNickname, 24 * 60 * 60 * 1000)}>Timeout 24h</button>
          </div>
        </div>
      )}
    </div>
  );
};

const root = createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);