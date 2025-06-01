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
  otherUserColors: Record<string, string>;
  messages: ChatMessage[];
  newName: string;
  showNameChange: boolean;
  theme: string;
  isConnected: boolean;
  error: string | null;
}

type ChatAction =
  | { type: 'INIT_STATE'; payload: Partial<ChatState> }
  | { type: 'SET_NICKNAME_NAME'; payload: { name: string; newName: string } }
  | { type: 'SET_NICKNAME_COLOR'; payload: { color: string } }
  | { type: 'SET_OTHER_USER_COLOR'; payload: { user: string; color: string } }
  | { type: 'SET_MESSAGES'; payload: ChatMessage[] }
  | { type: 'SET_NEW_NAME'; payload: string }
  | { type: 'TOGGLE_NAME_CHANGE'; payload: boolean }
  | { type: 'SET_THEME'; payload: string }
  | { type: 'SET_CONNECTION'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case 'INIT_STATE':
      return { ...state, ...action.payload };
    case 'SET_NICKNAME_NAME':
      return {
        ...state,
        name: action.payload.name,
        newName: action.payload.newName,
      };
    case 'SET_NICKNAME_COLOR':
      return {
        ...state,
        nicknameColor: action.payload.color,
      };
    case 'SET_OTHER_USER_COLOR':
      return {
        ...state,
        otherUserColors: { ...state.otherUserColors, [action.payload.user]: action.payload.color },
      };
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };
    case 'SET_NEW_NAME':
      return { ...state, newName: action.payload };
    case 'TOGGLE_NAME_CHANGE':
      return { ...state, showNameChange: action.payload };
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'SET_CONNECTION':
      return { ...state, isConnected: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
};

function App() {
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
      let storedName = localStorage.getItem(STORAGE_KEYS.NICKNAME);
      if (!storedName) {
        storedName = getRandomName();
        localStorage.setItem(STORAGE_KEYS.NICKNAME, storedName);
      }
      return storedName;
    })(),
    nicknameColor: (() => {
      let color = localStorage.getItem(STORAGE_KEYS.NICKNAME_COLOR);
      if (!color) {
        color = getRandomColor(['#64B5F6']);
        localStorage.setItem(STORAGE_KEYS.NICKNAME_COLOR, color);
      }
      return color;
    })(),
    otherUserColors: (() => {
      const stored = localStorage.getItem(STORAGE_KEYS.OTHER_USER_COLORS);
      return stored ? JSON.parse(stored) : {};
    })(),
    messages: (() => {
      const stored = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      return stored ? JSON.parse(stored).filter((msg: ChatMessage) => !msg.isSystem) : [];
    })(),
    newName: localStorage.getItem(STORAGE_KEYS.NICKNAME) || getRandomName(),
    showNameChange: false,
    theme: localStorage.getItem('theme') || 'dark',
    isConnected: false,
    error: null,
  });

  const { userId, name, nicknameColor, otherUserColors, messages, newName, showNameChange, theme, isConnected, error } = state;
  const [isInitialSyncComplete, setSyncStatus] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const room = 'main';
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const processedMessages = useRef<Set<string>>(new Set());
  const systemMessages = useRef<ChatMessage[]>([]);
  const { placeholder, changeNickname, confirm, nicknameLabel, morningGreeting, dayGreeting, eveningGreeting, nicknameChanged } = getTranslations();
  const MAX_MESSAGES = 1000;

  const websocketHost = window.location.hostname.includes('localhost')
    ? `ws://${window.location.hostname}:3600/chat`
    : 'wss://chat.filmnt.workers.dev/chat';

  const allowedOrigins = [
    'http://localhost:3600',
    'http://localhost:8080',
    'https://filmnt.github.io',
    'https://filmnt.pages.dev',
    'https://chat.filmnt.workers.dev',
    'http://mac:8080',
    'http://tab:8080',
  ];

  const safePostMessage = (message: any, targetOrigin: string = '*') => {
    try {
      window.top?.postMessage(message, targetOrigin);
    } catch (e) {
      console.error('Failed to post message:', e);
    }
  };

  const assignOtherUserColor = useCallback(
    (user: string) => {
      if (otherUserColors[user] && otherUserColors[user] !== '#64B5F6') return otherUserColors[user];
      const excludeColors = ['#64B5F6', nicknameColor, ...Object.values(otherUserColors).filter(c => c !== '#64B5F6')];
      const color = getRandomColor(excludeColors);
      dispatch({ type: 'SET_OTHER_USER_COLOR', payload: { user, color } });
      localStorage.setItem(STORAGE_KEYS.OTHER_USER_COLORS, JSON.stringify({ ...otherUserColors, [user]: color }));
      return color;
    },
    [otherUserColors, nicknameColor]
  );

  const updateMessages = useCallback((newMessages: ChatMessage[], fromExternal = false) => {
    try {
      const now = Date.now();
      const cutoff = now - MESSAGE_PERSISTENCE_HOURS * 60 * 60 * 1000;
      const uniqueMessages = newMessages
        .filter((msg, index, self) => self.findIndex(m => m.id === msg.id) === index)
        .filter(msg => msg.isSystem || msg.timestamp >= cutoff);

      const nonSystemMessages = uniqueMessages
        .filter(msg => !msg.isSystem)
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, MAX_MESSAGES);

      systemMessages.current = uniqueMessages
        .filter(msg => msg.isSystem)
        .concat(systemMessages.current.filter(msg => !uniqueMessages.some(m => m.id === msg.id)));

      const combinedMessages = [...nonSystemMessages, ...systemMessages.current]
        .sort((a, b) => b.timestamp - a.timestamp);

      dispatch({ type: 'SET_MESSAGES', payload: combinedMessages });
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(nonSystemMessages));
      if (messagesContainerRef.current && !isUserScrolling) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    } catch (error) {
      console.error('Error updating messages:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update messages' });
    }
  }, [isUserScrolling]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USER_ID, userId);
    localStorage.setItem(STORAGE_KEYS.NICKNAME, name);
    localStorage.setItem(STORAGE_KEYS.NICKNAME_COLOR, nicknameColor);
    localStorage.setItem(STORAGE_KEYS.OTHER_USER_COLORS, JSON.stringify(otherUserColors));
  }, [userId, name, nicknameColor, otherUserColors]);

  useEffect(() => {
    systemMessages.current = [];
    const storedMessages = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    if (storedMessages) {
      const parsedMessages = JSON.parse(storedMessages).filter((msg: ChatMessage) => !msg.isSystem);
      updateMessages(parsedMessages);
    }
  }, [updateMessages]);

  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();
    let greetingMessageContent;
    if (hour >= 5 && hour < 12) {
      greetingMessageContent = `${morningGreeting} ${name}`;
    } else if (hour >= 12 && hour < 18) {
      greetingMessageContent = `${dayGreeting} ${name}`;
    } else {
      greetingMessageContent = `${eveningGreeting} ${name}`;
    }
    const greetingMessage: ChatMessage = {
      id: nanoid(),
      content: greetingMessageContent,
      user: '🪴Filmnt',
      role: 'Filmnt',
      timestamp: now.getTime(),
      isSystem: true,
    };
    systemMessages.current = [greetingMessage];
    updateMessages([...messages, greetingMessage]);
  }, []);

  const socket = usePartySocket({
    host: websocketHost,
    party: 'chat',
    room,
    onOpen: () => {
      dispatch({ type: 'SET_CONNECTION', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      socket.send(JSON.stringify({ type: 'requestSync' }));
    },
    onMessage: (evt) => {
      try {
        const message = JSON.parse(evt.data);
        if (message.type === 'add') {
          const exists = messages.some((m) => m.id === message.id);
          if (!exists) {
            const newMessage: ChatMessage = {
              id: message.id,
              content: message.content,
              user: message.user,
              userId: message.userId,
              role: message.user,
              timestamp: message.timestamp || Date.now(),
              isSystem: false,
            };
            if (message.userId !== userId) {
              assignOtherUserColor(message.user);
            }
            updateMessages([...messages, newMessage], true);
          }
        } else if (message.type === 'update') {
          const updatedMessages = messages.map((m) =>
            m.id === message.id
              ? {
                  id: message.id,
                  content: message.content,
                  user: message.user,
                  userId: message.userId,
                  role: message.user,
                  timestamp: message.timestamp,
                  isSystem: false,
                }
              : m
          );
          updateMessages(updatedMessages, true);
        } else if (message.type === 'sync') {
          const now = Date.now();
          const cutoff = now - MESSAGE_PERSISTENCE_HOURS * 60 * 60 * 1000;
          const serverMessages = message.messages
            .filter((msg: ChatMessage) => msg.timestamp >= cutoff && !msg.isSystem)
            .sort((a: ChatMessage, b: ChatMessage) => b.timestamp - a.timestamp)
            .slice(0, MAX_MESSAGES);
          const existingIds = new Set(messages.filter(m => !m.isSystem).map(m => m.id));
          const newMessages = serverMessages.filter((msg: ChatMessage) => !existingIds.has(msg.id));
          const combinedMessages = [...messages.filter(m => !m.isSystem), ...newMessages]
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, MAX_MESSAGES);
          updateMessages([...systemMessages.current, ...combinedMessages], true);
          serverMessages.forEach((msg: ChatMessage) => {
            if (msg.userId !== userId && !otherUserColors[msg.user]) {
              assignOtherUserColor(msg.user);
            }
          });
          setSyncStatus(true);
        } else if (message.type === 'error') {
          dispatch({ type: 'SET_ERROR', payload: message.message });
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to process server message' });
      }
    },
    onError: () => {
      dispatch({ type: 'SET_CONNECTION', payload: false });
      dispatch({ type: 'SET_ERROR', payload: 'Please wait a moment...' });
    },
    onClose: () => {
      dispatch({ type: 'SET_CONNECTION', payload: false });
      dispatch({ type: 'SET_ERROR', payload: 'WebSocket connection closed' });
    },
  });

  useEffect(() => {
    document.documentElement.setAttribute('saved-theme', theme);
    localStorage.setItem('theme', theme);

    const handleMessage = (event: MessageEvent) => {
      if (!allowedOrigins.includes(event.origin)) {
        return;
      }

      try {
        if (event.data.type === 'themeChange' && ['light', 'dark'].includes(event.data.theme)) {
          dispatch({ type: 'SET_THEME', payload: event.data.theme });
        } else if (event.data.type === 'nicknameChange') {
          const { newName, newColor, userId: incomingUserId } = event.data;
          if (!processedMessages.current.has(newName + newColor)) {
            dispatch({
              type: 'SET_NICKNAME_NAME',
              payload: { name: newName, newName },
            });
            dispatch({
              type: 'SET_NICKNAME_COLOR',
              payload: { color: newColor },
            });
            localStorage.setItem(STORAGE_KEYS.NICKNAME, newName);
            localStorage.setItem(STORAGE_KEYS.NICKNAME_COLOR, newColor);
            processedMessages.current.add(newName + newColor);
            const nicknameChangeMessage: ChatMessage = {
              id: nanoid(),
              content: nicknameChanged,
              user: '🪴Filmnt',
              role: 'Filmnt',
              timestamp: Date.now(),
              isSystem: true,
            };
            systemMessages.current = [...systemMessages.current, nicknameChangeMessage];
            updateMessages([...messages, nicknameChangeMessage]);
          }
        } else if (event.data.type === 'systemMessage') {
          const { message } = event.data;
          if (!messages.some((msg) => msg.id === message.id) && !processedMessages.current.has(message.id)) {
            systemMessages.current = [...systemMessages.current, message];
            updateMessages([...messages, message]);
            processedMessages.current.add(message.id);
          }
        }
      } catch (error) {
        console.error('Error handling postMessage:', error);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [userId, theme, messages, updateMessages, nicknameChanged]);

  useEffect(() => {
    if (showNameChange && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [showNameChange]);

  useEffect(() => {
    const handleScroll = () => {
      if (messagesContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 10;
        setIsUserScrolling(!isAtBottom);
      }
    };
    messagesContainerRef.current?.addEventListener('scroll', handleScroll);
    return () => {
      messagesContainerRef.current?.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleNameChange = useCallback(() => {
    if (!newName.trim() || !validateNickname(newName)) {
      dispatch({ type: 'SET_ERROR', payload: 'Invalid nickname' });
      return;
    }
    const trimmedName = newName.trim().slice(0, MAX_NICKNAME_LENGTH);
    if (trimmedName === name) {
      dispatch({ type: 'TOGGLE_NAME_CHANGE', payload: false });
      return;
    }
    const newColor = getRandomColor(['#64B5F6']);
    dispatch({
      type: 'SET_NICKNAME_NAME',
      payload: { name: trimmedName, newName: trimmedName },
    });
    dispatch({
      type: 'SET_NICKNAME_COLOR',
      payload: { color: newColor },
    });
    localStorage.setItem(STORAGE_KEYS.NICKNAME, trimmedName);
    localStorage.setItem(STORAGE_KEYS.NICKNAME_COLOR, newColor);
    const nicknameChangeMessage: ChatMessage = {
      id: nanoid(),
      content: nicknameChanged,
      user: '🪴Filmnt',
      role: 'Filmnt',
      timestamp: Date.now(),
      isSystem: true,
    };
    systemMessages.current = [...systemMessages.current, nicknameChangeMessage];
    updateMessages([...messages, nicknameChangeMessage]);
    safePostMessage({
      type: 'systemMessage',
      message: nicknameChangeMessage,
    });
    dispatch({ type: 'TOGGLE_NAME_CHANGE', payload: false });
    if (!processedMessages.current.has(trimmedName + newColor)) {
      safePostMessage({
        type: 'nicknameChange',
        userId,
        newName: trimmedName,
        newColor,
      });
      processedMessages.current.add(trimmedName + newColor);
    }
  }, [newName, name, userId, nicknameChanged, messages, updateMessages]);

  const handleColorChange = useCallback(() => {
    try {
      const excludeColors = ['#64B5F6', ...Object.values(otherUserColors).filter(c => c !== '#64B5F6')];
      const newColor = getRandomColor(excludeColors);
      dispatch({
        type: 'SET_NICKNAME_COLOR',
        payload: { color: newColor },
      });
      localStorage.setItem(STORAGE_KEYS.NICKNAME_COLOR, newColor);
      const updatedOtherUserColors = { ...otherUserColors };
      Object.keys(updatedOtherUserColors).forEach((user) => {
        if (updatedOtherUserColors[user] === newColor) {
          const userExcludeColors = ['#64B5F6', newColor, ...Object.values(updatedOtherUserColors).filter(c => c !== '#64B5F6' && c !== newColor)];
          updatedOtherUserColors[user] = getRandomColor(userExcludeColors);
        }
      });
      dispatch({ type: 'INIT_STATE', payload: { otherUserColors: updatedOtherUserColors } });
      localStorage.setItem(STORAGE_KEYS.OTHER_USER_COLORS, JSON.stringify(updatedOtherUserColors));
    } catch (error) {
      console.error('Error in handleColorChange:', error);
    }
  }, [otherUserColors]);

  const handleRandomName = () => {
    const randomName = getRandomName();
    dispatch({ type: 'SET_NEW_NAME', payload: randomName });
  };

  const handleMessageSubmit = useCallback(() => {
    if (messageInputRef.current && messageInputRef.current.value.trim() && isConnected) {
      const content = messageInputRef.current.value.trim().slice(0, MAX_MESSAGE_LENGTH);
      const chatMessage: ChatMessage = {
        id: nanoid(),
        content,
        user: name,
        userId,
        role: name,
        timestamp: Date.now(),
        isSystem: false,
      };
      updateMessages([...messages, chatMessage]);
      socket.send(JSON.stringify({ type: 'add', ...chatMessage }));
      messageInputRef.current.value = '';
      adjustInputHeight();
    } else if (!isConnected) {
      dispatch({ type: 'SET_ERROR', payload: 'Cannot send message: server disconnected' });
    }
  }, [isConnected, name, userId, messages, socket, updateMessages]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleMessageSubmit();
      }
    },
    [handleMessageSubmit]
  );

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

  useEffect(() => {
    if (messageInputRef.current) {
      messageInputRef.current.addEventListener('input', adjustInputHeight);
      adjustInputHeight();
    }
    return () => {
      if (messageInputRef.current) {
        messageInputRef.current.removeEventListener('input', adjustInputHeight);
      }
    };
  }, [adjustInputHeight]);

  return (
    <div className="chat">
      {error && <div className="error-message">{error}</div>}
      <div className="nickname-form">
        <button className="change-nickname" onClick={() => dispatch({ type: 'TOGGLE_NAME_CHANGE', payload: true })}>
          {changeNickname}
        </button>
      </div>
      <div className="messages" ref={messagesContainerRef}>
        {messages.map((message) => (
          <div key={message.id} className="message">
            <div
              className="user"
              style={{
                color: message.isSystem
                  ? '#64B5F6'
                  : message.userId === userId
                  ? nicknameColor
                  : otherUserColors[message.user] || assignOtherUserColor(message.user),
              }}
            >
              {message.user}
            </div>
            <div
              className="message-content"
              style={{ fontWeight: message.userId === userId ? 'bold' : 'normal' }}
            >
              {message.content}
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
          style={{ color: nicknameColor }}
          onClick={handleColorChange}
          onTouchStart={handleColorChange}
        >
          {name}
        </button>
        <textarea
          name="content"
          className="message-input"
          placeholder={placeholder}
          autoComplete="off"
          maxLength={MAX_MESSAGE_LENGTH}
          disabled={!isConnected}
          ref={messageInputRef}
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
              <button type="button" className="refresh-button" onClick={handleRandomName}>
                <i className="fa-solid fa-rotate fa-lg"></i>
              </button>
              <button type="button" className="confirm-button" onClick={handleNameChange}>
                {confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);