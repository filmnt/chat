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
        timeoutUntil: action.payload.find((u) => u.userId === state.userId)?.until || null,
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
      return {
        ...state,
        isAdmin: action.payload,
        name: action.payload ? '🪴Filmnt' : state.originalNickname || getRandomName(),
        newName: action.payload ? '🪴Filmnt' : state.originalNickname || getRandomName(),
        showAdminPanel: action.payload,
      };
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
      return {
        ...state,
        showUserActions: action.payload.show,
        targetUserId: action.payload.userId,
        targetNickname: action.payload.nickname,
        userActionsPosition: action.payload.position,
      };
    case 'SET_BAN_STATUS':
      return { ...state, isBanned: action.payload.isBanned, timeoutUntil: action.payload.timeoutUntil };
    default:
      return state;
  }
};

function App() {
  const lastNicknameChangeId = useRef(null);
  const [state, dispatch] = useReducer(chatReducer, {
    userId: (() => {
      let id = localStorage.getItem(STORAGE_KEYS.USER_ID);
      if (!id) {
        id = generateUserId();
        localStorage.setItem(STORAGE_KEYS.USER_ID, id);
      }
      return id;
    })(),
    name: (() => {
      const isAdmin = localStorage.getItem(STORAGE_KEYS.IS_ADMIN) === 'true';
      if (isAdmin) return '🪴Filmnt';
      let storedName = localStorage.getItem(STORAGE_KEYS.NICKNAME);
      if (!storedName || storedName === 'undefined' || storedName === '🪴Filmnt') {
        storedName = getRandomName();
        localStorage.setItem(STORAGE_KEYS.NICKNAME, storedName);
      }
      return storedName;
    })(),
    nicknameColor: getRandomColor(['#64b5f6']),
    connectedUsers: [],
    bannedUsers: [],
    otherUserColors: {},
    messages: (() => {
      const stored = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      return stored ? JSON.parse(stored).filter((msg: ChatMessage) => !msg.isSystem) : [];
    })(),
    newName: (() => {
      const isAdmin = localStorage.getItem(STORAGE_KEYS.IS_ADMIN) === 'true';
      return isAdmin ? '🪴Filmnt' : localStorage.getItem(STORAGE_KEYS.NICKNAME) || getRandomName();
    })(),
    showNameChange: false,
    showAdminPanel: false,
    showApiKeyDialog: false,
    showConfirmDialog: false,
    confirmAction: null,
    confirmMessage: '',
    apiKey: '',
    isAdmin: localStorage.getItem(STORAGE_KEYS.IS_ADMIN) === 'true',
    isChatFrozen: false,
    isAdminOnly: false,
    showBanList: false,
    theme: localStorage.getItem('theme') || 'dark',
    isConnected: false,
    error: null,
    showUserList: false,
    showUserActions: false,
    targetUserId: null,
    targetNickname: null,
    userActionsPosition: null,
    isBanned: localStorage.getItem(STORAGE_KEYS.IS_BANNED) === 'true' || false,
    timeoutUntil: localStorage.getItem(STORAGE_KEYS.TIMEOUT_UNTIL)
      ? Number(localStorage.getItem(STORAGE_KEYS.TIMEOUT_UNTIL))
      : null,
    originalNickname: localStorage.getItem(STORAGE_KEYS.NICKNAME) || getRandomName(),
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
    originalNickname,
  } = state;

  const [isInitialSyncComplete, setInitialSyncComplete] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [remainingTime, setRemainingTime] = useState(null);
  const [messageTimestamps, setMessageTimestamps] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [showScrollButtons, setShowScrollButtons] = useState(false);
  const room = 'main';
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const nameInputRef = useRef(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const apiKeyInputRef = useRef(null);
  const systemMessages = useRef([]);
  const { placeholder, changeNickname, confirm, nicknameLabel, nicknameChanged, morningGreeting, dayGreeting, eveningGreeting } = getTranslations();
  const MAX_MESSAGES = 10000;

  const websocketHost = window.location.hostname.includes('localhost')
    ? `ws://${window.location.hostname}:3600/chat`
    : 'wss://chat.filmnt.workers.dev/chat';

  const allowedOrigins = [
    'http://localhost:3600',
    'http://localhost:8787',
    'http://localhost:8080',
    'https://filmnt.github.io',
    'https://filmnt.pages.dev',
    'https://chat.filmnt.workers.dev',
    'http://mac:8080',
    'http://tab:8080',
  ];

  const socket = usePartySocket({
    host: websocketHost,
    party: 'chat',
    room,
    onOpen: () => {
      dispatch({ type: 'SET_CONNECTION', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      const currentNickname = isAdmin ? '🪴Filmnt' : name;
      socket.send(JSON.stringify({ type: 'requestSync', userId, nickname: currentNickname }));
      const storedApiKey = localStorage.getItem(STORAGE_KEYS.API_KEY);
      const storedIsAdmin = localStorage.getItem(STORAGE_KEYS.IS_ADMIN);
      if (storedApiKey && storedIsAdmin === 'true') {
        socket.send(JSON.stringify({ type: 'authenticate', apiKey: storedApiKey, userId }));
      }
    },
    onMessage: (evt) => {
      try {
        const message = JSON.parse(evt.data);
        if (message.type === 'SET_ADMIN') {
          dispatch({ type: 'SET_ADMIN', payload: message.payload });
          if (message.payload) {
            localStorage.setItem(STORAGE_KEYS.API_KEY, apiKey);
            localStorage.setItem(STORAGE_KEYS.IS_ADMIN, 'true');
            localStorage.setItem(STORAGE_KEYS.NICKNAME, '🪴Filmnt');
            socket.send(JSON.stringify({ type: 'updateUser', userId, nickname: '🪴Filmnt' }));
          } else {
            localStorage.setItem(STORAGE_KEYS.IS_ADMIN, 'false');
            localStorage.removeItem(STORAGE_KEYS.API_KEY);
            const storedNickname = state.originalNickname || getRandomName();
            dispatch({ type: 'SET_NICKNAME_NAME', payload: { name: storedNickname, newName: storedNickname } });
            localStorage.setItem(STORAGE_KEYS.NICKNAME, storedNickname);
            socket.send(JSON.stringify({ type: 'updateUser', userId, nickname: storedNickname }));
          }
        } else if (message.type === 'add') {
          const exists = messages.some((msg) => msg.id === message.id);
          if (!exists) {
            const newMessage = {
              id: message.id,
              content: message.content,
              user: message.user,
              userId: message.userId,
              role: message.role,
              timestamp: message.timestamp || Date.now(),
              isSystem: false,
            };
            if (message.userId !== userId) {
              assignOtherUserColor(message.user);
            }
            updateMessages([...messages, newMessage], true);
          }
        } else if (message.type === 'update') {
          const updatedMessages = messages.map((msg) =>
            msg.id === message.id
              ? { id: message.id, content: message.content, user: msg.user, userId: message.userId, role: message.role, timestamp: message.timestamp, isSystem: false }
              : msg
          );
          updateMessages(updatedMessages, true);
        } else if (message.type === 'sync') {
          const now = Date.now();
          const cutoff = now - MESSAGE_PERSISTENCE_HOURS * 3600 * 1000;
          const serverMessages = message.messages
            .filter((msg) => msg.timestamp >= cutoff && !msg.isSystem)
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, MAX_MESSAGES);
          const existingIds = new Set(messages.filter((msg) => !msg.isSystem).map((msg) => msg.id));
          const newMessages = serverMessages.filter((msg) => !existingIds.has(msg.id));
          const combinedMessages = [...messages.filter((msg) => !msg.isSystem), ...newMessages]
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, MAX_MESSAGES);
          updateMessages([...systemMessages.current, ...combinedMessages], true);
          serverMessages.forEach((msg) => {
            if (msg.userId !== userId && !otherUserColors[msg.user]) {
              assignOtherUserColor(msg.user);
            }
          });
          dispatch({ type: 'SET_USERS', payload: Array.from(new Set(message.users)) });
          dispatch({ type: 'SET_BANNED_USERS', payload: message.bannedUsers });
          const userBan = message.bannedUsers.find((u) => u.userId === userId);
          if (userBan) {
            dispatch({ type: 'SET_BAN_STATUS', payload: { isBanned: !userBan.until, timeoutUntil: userBan.until || null } });
            localStorage.setItem(STORAGE_KEYS.TIMEOUT_UNTIL, userBan.until?.toString() || '');
            localStorage.setItem(STORAGE_KEYS.IS_BANNED, (!userBan.until).toString());
          } else {
            const storedTimeout = localStorage.getItem(STORAGE_KEYS.TIMEOUT_UNTIL);
            const storedIsBanned = localStorage.getItem(STORAGE_KEYS.IS_BANNED) === 'true';
            if (storedTimeout && Number(storedTimeout) > Date.now()) {
              dispatch({ type: 'SET_BAN_STATUS', payload: { isBanned: storedIsBanned, timeoutUntil: Number(storedTimeout) } });
            } else {
              localStorage.removeItem(STORAGE_KEYS.TIMEOUT_UNTIL);
              localStorage.setItem(STORAGE_KEYS.IS_BANNED, 'false');
            }
          }
          dispatch({ type: 'TOGGLE_CHAT_FROZEN', payload: message.isChatFrozen });
          dispatch({ type: 'TOGGLE_ADMIN_ONLY', payload: message.isAdminOnly });
          setInitialSyncComplete(true);
        } else if (message.type === 'users') {
          dispatch({ type: 'SET_USERS', payload: Array.from(new Set(message.users)) });
        } else if (message.type === 'bannedUsers') {
          dispatch({ type: 'SET_BANNED_USERS', payload: message.bannedUsers });
          const userBan = message.bannedUsers.find((u) => u.userId === userId);
          if (userBan) {
            dispatch({ type: 'SET_BAN_STATUS', payload: { isBanned: !userBan.until, timeoutUntil: userBan.until || null } });
            localStorage.setItem(STORAGE_KEYS.TIMEOUT_UNTIL, userBan.until?.toString() || '');
            localStorage.setItem(STORAGE_KEYS.IS_BANNED, (!userBan.until).toString());
          } else {
            localStorage.removeItem(STORAGE_KEYS.TIMEOUT_UNTIL);
            localStorage.setItem(STORAGE_KEYS.IS_BANNED, 'false');
          }
        } else if (message.type === 'chatFrozen') {
          dispatch({ type: 'TOGGLE_CHAT_FROZEN', payload: message.isFrozen });
        } else if (message.type === 'adminOnly') {
          dispatch({ type: 'TOGGLE_ADMIN_ONLY', payload: message.isAdminOnly });
        } else if (message.type === 'clearChat') {
          systemMessages.current = [];
          updateMessages([]);
        } else if (message.type === 'deleteUserMessages') {
          const filteredMessages = messages.filter((msg) => msg.userId !== message.userId || msg.isSystem);
          updateMessages(filteredMessages, true);
        } else if (message.type === 'error') {
          const translations = getTranslations().errorMessages;
          if (message.message === 'invalidApiKey') {
            alert("Invalid API Key.");
          } else if (message.message === 'timeout') {
            dispatch({ type: 'SET_BAN_STATUS', payload: { isBanned: false, timeoutUntil: message.until } });
            localStorage.setItem(STORAGE_KEYS.TIMEOUT_UNTIL, message.until?.toString() || '');
            localStorage.setItem(STORAGE_KEYS.IS_BANNED, 'false');
            setMessageInput('');
            adjustInputHeight();
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
        }
      } catch {
        dispatch({ type: 'SET_ERROR', payload: getTranslations().errorMessages.processMessageFailed });
      }
    },
    onError: () => {
      dispatch({ type: 'SET_CONNECTION', payload: false });
      dispatch({ type: 'SET_ERROR', payload: getTranslations().errorMessages.waitMoment });
      setMessageInput('');
      adjustInputHeight();
    },
    onClose: () => {
      dispatch({ type: 'SET_CONNECTION', payload: false });
      dispatch({ type: 'SET_ERROR', payload: getTranslations().errorMessages.connectionClosed });
      setMessageInput('');
      adjustInputHeight();
    },
  });

  const safePostMessage = (message, targetOrigin = 'https://chat.filmnt.workers.dev') => {
    try {
      window.top?.postMessage(message, targetOrigin);
      allowedOrigins.forEach((origin) => {
        window.top?.postMessage(message, origin);
      });
    } catch {
      dispatch({ type: 'SET_ERROR', payload: getTranslations().errorMessages.postMessageFailed });
    }
  };

  const adjustInputHeight = useCallback(() => {
    if (messageInputRef.current) {
      const textarea = messageInputRef.current;
      textarea.style.height = '38px';
      const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight);
      const maxLines = 5;
      const maxHeight = lineHeight * maxLines;
      const scrollHeight = textarea.scrollHeight;
      const newHeight = Math.min(scrollHeight, maxHeight);
      textarea.style.height = `${newHeight}px`;
      textarea.style.overflowY = newHeight >= maxHeight ? 'auto' : 'hidden';
    }
  }, []);

  const assignOtherUserColor = useCallback(
    (user) => {
      if (otherUserColors[user] && otherUserColors[user] !== '#64B5F6') return otherUserColors[user];
      const excludeColors = ['#64B5F6', nicknameColor, ...Object.values(otherUserColors)];
      const color = getRandomColor(excludeColors);
      dispatch({ type: 'SET_OTHER_USER_COLOR', payload: { user, color } });
      return color;
    },
    [otherUserColors, nicknameColor]
  );

  const updateMessages = useCallback(
    (newMessages, fromExternal = false) => {
      try {
        const now = Date.now();
        const cutoff = now - MESSAGE_PERSISTENCE_HOURS * 60 * 60 * 1000;
        const uniqueMessages = newMessages
          .filter((msg, index, self) => self.findIndex((m) => m.id === msg.id) === index)
          .filter((msg) => msg.isSystem || msg.timestamp >= cutoff);

        const nonSystemMessages = uniqueMessages
          .filter((msg) => !msg.isSystem)
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, MAX_MESSAGES);

        systemMessages.current = uniqueMessages
          .filter((msg) => msg.isSystem)
          .concat(systemMessages.current.filter((msg) => !uniqueMessages.some((m) => m.id === msg.id)));

        const combinedMessages = [...nonSystemMessages, ...systemMessages.current].sort((a, b) => b.timestamp - a.timestamp);

        dispatch({ type: 'SET_MESSAGES', payload: combinedMessages });
        localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(nonSystemMessages));
        if (messagesContainerRef.current && !isUserScrolling) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      } catch {
        dispatch({ type: 'SET_ERROR', payload: getTranslations().errorMessages.updateMessagesFailed });
      }
    },
    [isUserScrolling]
  );

  const handleInputChange = useCallback(
    (e) => {
      setMessageInput(e.target.value);
      adjustInputHeight();
    },
    [adjustInputHeight]
  );

  const handleMessageSubmit = useCallback(() => {
    if (!socket) return;
    if (messageInput.trim() && isConnected) {
      if (isChatFrozen || (isAdminOnly && !isAdmin) || (!isAdmin && (isBanned || (timeoutUntil && timeoutUntil > Date.now())))) {
        const translations = getTranslations().errorMessages;
        dispatch({
          type: 'SET_ERROR',
          payload: isChatFrozen ? translations.chatFrozen : isAdminOnly && !isAdmin ? translations.adminOnly : translations.bannedOrTimedOut,
        });
        setMessageInput('');
        adjustInputHeight();
        return;
      }
      const now = Date.now();
      const recentMessages = messageTimestamps.filter((ts) => now - ts < 10000);
      if (!isAdmin && recentMessages.length >= 5) {
        const duration = 60 * 1000;
        socket.send(JSON.stringify({ type: 'banUser', userId, targetUserId: userId, nickname: name, duration }));
        dispatch({ type: 'SET_BAN_STATUS', payload: { isBanned: false, timeoutUntil: now + duration } });
        localStorage.setItem(STORAGE_KEYS.TIMEOUT_UNTIL, (now + duration).toString());
        localStorage.setItem(STORAGE_KEYS.IS_BANNED, 'false');
        setMessageInput('');
        adjustInputHeight();
        return;
      }
      setMessageTimestamps([...recentMessages, now]);
      const content = (messageInput.trim() || '').slice(0, MAX_MESSAGE_LENGTH);
      const chatMessage = {
        id: nanoid(),
        content,
        user: name,
        userId,
        role: isAdmin ? 'filmnt' : name,
        timestamp: now,
        isSystem: false,
      };
      socket.send(JSON.stringify({ type: 'add', ...chatMessage }));
      setMessageInput('');
      adjustInputHeight();
      dispatch({ type: 'SET_ERROR', payload: null });
    } else if (!isConnected) {
      dispatch({ type: 'SET_ERROR', payload: getTranslations().errorMessages.serverDisconnected });
      setMessageInput('');
      adjustInputHeight();
    }
  }, [
    socket,
    isConnected,
    name,
    userId,
    isAdmin,
    messageTimestamps,
    isChatFrozen,
    isAdminOnly,
    isBanned,
    timeoutUntil,
    messageInput,
    adjustInputHeight,
  ]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USER_ID, userId);
    if (!isAdmin) {
      localStorage.setItem(STORAGE_KEYS.NICKNAME, name);
    } else {
      localStorage.setItem(STORAGE_KEYS.NICKNAME, '🪴Filmnt');
    }
    localStorage.setItem(STORAGE_KEYS.IS_ADMIN, isAdmin.toString());
  }, [userId, name, isAdmin]);

  useEffect(() => {
    systemMessages.current = [];
    const storedMessages = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    let initialMessages = [];
    if (storedMessages) {
      initialMessages = JSON.parse(storedMessages).filter((msg) => !msg.isSystem);
    }
    const hour = new Date().getHours();
    let greeting;
    if (hour >= 5 && hour < 10) {
      greeting = `${morningGreeting} ${name}`;
    } else if (hour >= 10 && hour < 18) {
      greeting = `${dayGreeting} ${name}`;
    } else {
      greeting = `${eveningGreeting} ${name}`;
    }
    const greetingMessage = {
      id: nanoid(),
      content: greeting,
      user: '🪴Filmnt',
      userId: 'system',
      role: 'filmnt',
      timestamp: Date.now(),
      isSystem: true,
    };
    systemMessages.current = [greetingMessage];
    updateMessages([...initialMessages, greetingMessage]);
  }, [updateMessages, morningGreeting, dayGreeting, eveningGreeting]);

  useEffect(() => {
      document.documentElement.setAttribute('saved-theme', theme);
      localStorage.setItem('theme', theme);

      const handleMessage = (event) => {
        if (!allowedOrigins.includes(event.origin)) return;
        try {
          if (event.data.type === 'themeChange' && ['light', 'dark'].includes(event.data.theme)) {
            dispatch({ type: 'SET_THEME', payload: event.data.theme });
          } else if (event.data.type === 'nicknameChange') {
            const { newName, userId: incomingUserId } = event.data;
            if (incomingUserId === userId && newName && !isAdmin) {
              dispatch({ type: 'SET_NICKNAME_NAME', payload: { name: newName, newName } });
              localStorage.setItem(STORAGE_KEYS.NICKNAME, newName);
              socket.send(JSON.stringify({ type: 'updateUser', userId, nickname: newName }));
            }
          } else if (event.data.type === 'systemMessage') {
            const { message } = event.data;
            if (!messages.some((msg) => msg.id === message.id)) {
              systemMessages.current = [...systemMessages.current, message];
              updateMessages([...messages, message]);
            }
          } else if (event.data.type === 'users') {
            dispatch({ type: 'SET_USERS', payload: Array.from(new Set(event.data.users)) });
          }
        } catch {
          dispatch({ type: 'SET_ERROR', payload: getTranslations().errorMessages.processMessageFailed });
        }
      };

    const handleStorage = (event) => {
      if (event.key === STORAGE_KEYS.NICKNAME && !isAdmin) {
        const newName = event.newValue;
        if (newName && newName !== name) {
          dispatch({ type: 'SET_NICKNAME_NAME', payload: { name: newName, newName } });
          socket.send(JSON.stringify({ type: 'updateUser', userId, nickname: newName }));
        }
      }
    };

    window.addEventListener('message', handleMessage);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('storage', handleStorage);
    };
  }, [userId, theme, messages, updateMessages, socket, isAdmin, name]);

  useEffect(() => {
    if (showNameChange && nameInputRef.current) nameInputRef.current.focus();
    if (showApiKeyDialog && apiKeyInputRef.current) apiKeyInputRef.current.focus();
  }, [showNameChange, showApiKeyDialog]);

  useEffect(() => {
    if (showNameChange) {
      dispatch({ type: 'SET_NEW_NAME', payload: name });
    }
  }, [showNameChange, name]);

  useEffect(() => {
    const handleScroll = () => {
      if (messagesContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 10;
        setIsUserScrolling(!isAtBottom);
        setShowScrollButtons(messages.length > 100 && scrollTop > 100);
      }
    };
    messagesContainerRef.current?.addEventListener('scroll', handleScroll);
    return () => messagesContainerRef.current?.removeEventListener('scroll', handleScroll);
  }, [messages.length]);

  useEffect(() => {
    if (timeoutUntil) {
      const interval = setInterval(() => {
        const remaining = timeoutUntil - Date.now();
        if (remaining <= 0) {
          dispatch({ type: 'SET_BAN_STATUS', payload: { isBanned: false, timeoutUntil: null } });
          localStorage.removeItem(STORAGE_KEYS.TIMEOUT_UNTIL);
          localStorage.setItem(STORAGE_KEYS.IS_BANNED, 'false');
          setRemainingTime(null);
          clearInterval(interval);
        } else {
          setRemainingTime(Math.ceil(remaining / 1000));
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timeoutUntil]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      const target = e.target;
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
      }
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
    const storedNickname = originalNickname || getRandomName();
    dispatch({ type: 'SET_ADMIN', payload: false });
    localStorage.setItem(STORAGE_KEYS.IS_ADMIN, 'false');
    localStorage.removeItem(STORAGE_KEYS.API_KEY);
    localStorage.setItem(STORAGE_KEYS.NICKNAME, storedNickname);
    dispatch({ type: 'TOGGLE_ADMIN_PANEL', payload: false });
    dispatch({ type: 'SET_NICKNAME_NAME', payload: { name: storedNickname, newName: storedNickname } });
    socket.send(JSON.stringify({ type: 'logoutAdmin', userId, nickname: storedNickname }));
    socket.send(JSON.stringify({ type: 'updateUser', userId, nickname: storedNickname }));
    safePostMessage({ type: 'nicknameChange', userId, newName: storedNickname });
  }, [userId, socket, originalNickname]);

  const handleBanUser = useCallback(
    (targetUserId, nickname, duration) => {
      socket.send(JSON.stringify({ type: 'banUser', userId, targetUserId, nickname, duration }));
      dispatch({ type: 'SHOW_USER_ACTIONS', payload: { show: false, userId: null, nickname: null, position: null } });
    },
    [userId, socket]
  );

  const handleUnbanUser = useCallback(
    (targetUserId) => {
      socket.send(JSON.stringify({ type: 'unbanUser', userId, targetUserId }));
    },
    [userId, socket]
  );

  const handleDeleteUserMessages = useCallback(
    (targetUserId) => {
      socket.send(JSON.stringify({ type: 'deleteUserMessages', userId, targetUserId }));
      dispatch({ type: 'SHOW_USER_ACTIONS', payload: { show: false, userId: null, nickname: null, position: null } });
    },
    [userId, socket]
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleMessageSubmit();
      }
    },
    [handleMessageSubmit]
  );

  const handleUserClick = useCallback(
    (e, userId, nickname) => {
      if (!isAdmin || !userId || !nickname) return;
      const rect = e.currentTarget.getBoundingClientRect();
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
          <i className="fa-solid fa-id-card"></i>
        </button>
        <button
          className="admin-toggle"
          onClick={() => (isAdmin ? dispatch({ type: 'TOGGLE_ADMIN_PANEL', payload: !showAdminPanel }) : dispatch({ type: 'TOGGLE_API_KEY_DIALOG', payload: true }))}
        >
          <i className="fa-solid fa-gear"></i>
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
            <button onClick={() => handleBanUser(targetUserId, targetNickname, 24 * 60 * 1000)}>Timeout 24h</button>
          </div>
        </div>
      )}
    </div>
  );
}

const root = createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);