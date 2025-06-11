import { nanoid } from 'nanoid';

export type ChatMessage = {
  id: string;
  content: string;
  user: string;
  userId?: string;
  role: string;
  isSystem?: boolean;
  timestamp: number;
};

export const MIN_NICKNAME_LENGTH = 2;
export const MAX_NICKNAME_LENGTH = 15;
export const NICKNAME_REGEX = /^[a-zA-Z0-9_\-\s\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F\u0620-\u06FF\u0900-\u097F\u0980-\u09FF\u0A00-\u0A7F\u0B80-\u0BFF\u0C00-\u0C7F\u4E00-\u9FFF\u3040-\u30FF\u00C0-\u00FF\u0100-\u017F\u0400-\u04FF]+$/;
export const MAX_MESSAGE_LENGTH = 200;
export const MESSAGE_PERSISTENCE_HOURS = 24;

export const TWITCH_COLORS = [
  '#FF0000', '#00FF00', '#0000FF', '#FF69B4', '#FFD700', '#00CED1', '#FF4500', '#9400D3',
  '#32CD32', '#FF6347', '#FF5733', '#33FF57', '#3357FF', '#FF33A1', '#33FFF5', '#F5FF33',
  '#FF8C33', '#8C33FF', '#00BFFF', '#FFB733', '#4CAF50', '#E91E63', '#3F51B5', '#009688',
  '#FFC107', '#FF5722', '#9C27B0', '#607D8B', '#00BCD4', '#CDDC39', '#FF1493', '#7FFF00',
  '#6A5ACD', '#20B2AA', '#9932CC', '#228B22', '#DC143C', '#00FA9A', '#4169E1', '#FF00FF',
  '#ADFF2F', '#1E90FF', '#FF7F50', '#BA55D3', '#7CFC00', '#6495ED', '#FFDAB9', '#00FF7F',
  '#8A2BE2', '#FF4040', '#98FB98', '#4682B4', '#FFA500', '#800080', '#00FFFF', '#9ACD32',
  '#B0C4DE', '#FA8072', '#6B8E23', '#DAA520', '#5F9EA0', '#F08080', '#90EE90', '#87CEFA',
  '#DA70D6', '#FF4500', '#00FF7F', '#FF33A1', '#33FFF5', '#F5FF33', '#FF8C33', '#8C33FF',
  '#00BFFF', '#FFB733', '#4CAF50', '#E91E63', '#3F51B5', '#009688', '#FFC107', '#FF5722',
  '#9C27B0', '#607D8B', '#FF69B4', '#228B22', '#FFD700', '#9400D3', '#32CD32', '#FF5733',
  '#33FF57', '#3357FF', '#FF00FF', '#FF6347', '#7FFF00', '#6A5ACD', '#20B2AA', '#9932CC'
];

export const STORAGE_KEYS = {
  NICKNAME: 'chatNickname',
  USER_ID: 'chatUserId',
  NICKNAME_COLOR: 'chatNicknameColor',
  OTHER_USER_COLORS: 'otherUserColors',
  LAST_FILMNT_MESSAGE: 'lastFilmntMessage',
  MESSAGES: 'chatMessages',
  IS_ADMIN: 'chat_is_admin',
  API_KEY: 'chat_api_key',
  TIMEOUT_UNTIL: 'timeout_until', 
  IS_BANNED: 'is_banned',
};

export const generateUserId = () => {
  return `user_${nanoid(12)}`;
};

export const getRandomColor = (excludeColors: string[] = []) => {
  const availableColors = TWITCH_COLORS.filter((color) => !excludeColors.includes(color));
  return availableColors[Math.floor(Math.random() * availableColors.length)] || '#555555';
};

export const validateNickname = (nickname: string): boolean => {
  const trimmedNickname = nickname.trim();
  const isNotOnlySpaces = trimmedNickname.length > 0;
  const isValidLength = trimmedNickname.length >= MIN_NICKNAME_LENGTH && trimmedNickname.length <= MAX_NICKNAME_LENGTH;
  const isValidRegex = NICKNAME_REGEX.test(nickname);
  return isNotOnlySpaces && isValidLength && isValidRegex;
};

export type Message =
  | {
      type: 'add';
      id: string;
      content: string;
      user: string;
      userId?: string;
      role: string;
      timestamp: number;
      isSystem?: boolean;
    }
  | {
      type: 'update';
      id: string;
      content: string;
      user: string;
      userId?: string;
      role: string;
      timestamp: number;
      isSystem?: boolean;
    }
  | {
      type: 'sync';
      messages: ChatMessage[];
      users: string[];
      bannedUsers: { userId: string; nickname: string; until?: number }[];
      isChatFrozen: boolean;
      isAdminOnly: boolean;
    }
  | {
      type: 'requestSync';
      userId: string;
      nickname: string;
    }
  | {
      type: 'users';
      users: string[];
    }
  | {
      type: 'bannedUsers';
      bannedUsers: { userId: string; nickname: string; until?: number }[];
    }
  | {
      type: 'chatFrozen';
      isFrozen: boolean;
    }
  | {
      type: 'adminOnly';
      isAdminOnly: boolean;
    }
  | {
      type: 'clearChat';
    }
  | {
      type: 'deleteUserMessages';
      userId: string;
      targetUserId: string;
    }
  | {
      type: 'banUser';
      userId: string;
      targetUserId: string;
      nickname: string;
      duration?: number;
    }
  | {
      type: 'unbanUser';
      userId: string;
      targetUserId: string;
    }
  | {
      type: 'updateUser';
      userId: string;
      nickname: string;
    }
  | {
      type: 'authenticate';
      apiKey: string;
      userId: string;
    }
  | {
      type: 'error';
      message: string;
    };

export const namesByLanguage: Record<string, string[]> = {
  en: [
    'Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank', 'Grace', 'Heidi', 'Ivan', 'Judy',
    'Kevin', 'Linda', 'Mallory', 'Nancy', 'Oscar', 'Peggy', 'Quentin', 'Randy', 'Steve', 'Trent',
  ],
  es: [
    'Ana', 'Carlos', 'María', 'Juan', 'Sofía', 'Luis', 'Laura', 'Diego', 'Valentina', 'Pedro',
    'Isabella', 'Miguel', 'Camila', 'José', 'Lucía', 'Gabriel', 'Elena', 'Manuel', 'Carmen', 'Javier',
  ],
  zh: [
    '伟', '丽', '静', '敏', '浩', '晨', '洋', '梅', '俊', '欣',
    '慧', '涛', '强', '玲', '峰', '芳', '杰', '霞', '勇', '燕',
  ],
  hi: [
    'आरव', 'विवान', 'आदित्य', 'विहान', 'अर्जुन', 'सान्वी', 'आन्या', 'आध्या', 'अनन्या', 'राहुल',
    'प्रिया', 'रिया', 'काव्या', 'दिव्या', 'रोहन', 'सूरज', 'नेहा', 'विकास', 'पूजा', 'अमित',
  ],
  ar: [
    'محمد', 'فاطمة', 'أحمد', 'عائشة', 'علي', 'زينب', 'عمر', 'نور', 'حسن', 'سارة',
    'إبراهيم', 'خديجة', 'يوسف', 'مريم', 'عبدالله', 'ريم', 'خالد', 'ليلى', 'زيد', 'هدى',
  ],
  fr: [
    'Emma', 'Louis', 'Chloé', 'Hugo', 'Léa', 'Lucas', 'Manon', 'Raphaël', 'Jade', 'Gabriel',
    'Sophie', 'Paul', 'Camille', 'Thomas', 'Zoé', 'Antoine', 'Clara', 'Mathis', 'Julie', 'Nathan',
  ],
  ru: [
    'София', 'Александр', 'Анастасия', 'Дмитрий', 'Екатерина', 'Иван', 'Мария', 'Никита', 'Ольга', 'Сергей',
    'Юлия', 'Андрей', 'Анна', 'Владимир', 'Елена', 'Михаил', 'Ксения', 'Артём', 'Наталья', 'Игорь',
  ],
  pt: [
    'João', 'Maria', 'Pedro', 'Ana', 'Lucas', 'Beatriz', 'Mateus', 'Sofia', 'Gabriel', 'Laura',
    'Rafael', 'Isabela', 'Gustavo', 'Camila', 'Miguel', 'Carolina', 'Diogo', 'Alice', 'Tiago', 'Vitória',
  ],
  de: [
    'Sophie', 'Alexander', 'Julia', 'Maximilian', 'Anna', 'Leon', 'Emma', 'Paul', 'Mia', 'Ben',
    'Hannah', 'Lukas', 'Lisa', 'Jonas', 'Laura', 'Finn', 'Lea', 'Noah', 'Marie', 'Felix',
  ],
  ja: [
    'はな', 'れん', 'ゆい', 'かいと', 'あおい', 'はると', 'さくら', 'ゆうと', 'ひなた', 'そら',
    'みさき', 'やまと', 'あい', 'しょう', 'しずく', 'ゆう', 'りん', 'つばさ', 'まお', 'はやて'
  ],
  bn: [
    'আয়েশা', 'রাহুল', 'ফাতিমা', 'আরিফ', 'সাদিয়া', 'মাহমুদ', 'নুসরাত', 'তানভীর', 'শারমিন', 'ইমরান',
    'রিয়া', 'আশিক', 'জান্নাত', 'সোহাগ', 'মৌ', 'রাকিব', 'সুমাইয়া', 'ফারহান', 'নাজমা', 'শাকিল',
  ],
  pa: [
    'ਗੁਰਪ੍ਰੀਤ', 'ਹਰਮਨ', 'ਸਿਮਰਨ', 'ਅਮਰ', 'ਜਸਪ੍ਰੀਤ', 'ਕੌਰ', 'ਮਨਪ੍ਰੀਤ', 'ਹਰਜੀਤ', 'ਰਵਿੰਦਰ', 'ਗੁਤ',
    'ਅਮਨਦੀਪ', 'ਸੁਖਜੀਤ', 'ਪਰਮਜੀਤ', 'ਕਮਲਜੀਤ', 'ਸਰਬਜੀਤ', 'ਜਸਵਿੰਦਰ', 'ਬਲਜੀਤ', 'ਹਰਪ੍ਰੀਤ', 'ਰਣਜੀਤ', 'ਅਮਰਜੀਤ',
  ],
  te: [
    'సాయి', 'అంజలి', 'వెంకట్', 'ప్రియ', 'రాహుల్', 'శ్రీజ', 'కిరణ్', 'లక్ష్మీ', 'విజయ్', 'సునీత',
    'మోహన్', 'స్వాతి', 'శ్రీనివాస్', 'పూజ', 'హరి', 'రమ్య', 'అర్జున్', 'సంధ్య', 'నాగేశ్', 'దీపిక',
  ],
  mr: [
    'आरव', 'स्नेहा', 'रोहन', 'पूजा', 'आदित्य', 'श्रुति', 'विकास', 'प्रिया', 'अमित', 'नेहा',
    'सूरज', 'काव्या', 'राहुल', 'दिव्या', 'सचिन', 'आकांक्षा', 'मयूर', 'रिया', 'प्रकाश', 'स्वाती',
  ],
  ta: [
    'அருண்', 'பிரியா', 'விஜய்', 'காவ்யா', 'சுரேஷ்', 'அனிதா', 'ராஜேஷ்', 'நந்தினி', 'கார்த்திக்', 'மீனா',
    'சிவா', 'லட்சுமி', 'வினோத்', 'சரண்யா', 'முருகன்', 'பவித்ரா', 'அஜய்', 'கீர்த்தனா', 'ரமேஷ்', 'ஸ்ரீதர்',
  ],
  ur: [
    'علی', 'عائشہ', 'حسن', 'زارا', 'بلال', 'ثناء', 'محمد', 'فاطمہ', 'عمران', 'نادیہ',
    'احمد', 'مریم', 'یوسف', 'رابعہ', 'خالد', 'عمر', 'زینب', 'شاہد', 'صبا', 'طارق',
  ],
  ko: [
    '석환', '지은', '진호', '소연', '민준', '은지', '태양', '지현', '현준', '예진',
    '상우', '민지', '현우', '서연', '진혁', '하린', '원우', '유나', '지수', '채원',
  ],
  it: [
    'Giulia', 'Leonardo', 'Sofia', 'Alessandro', 'Aurora', 'Francesco', 'Emma', 'Matteo', 'Chiara', 'Lorenzo',
    'Alice', 'Gabriele', 'Martina', 'Davide', 'Giorgia', 'Riccardo', 'Sara', 'Andrea', 'Beatrice', 'Luca',
  ],
  vi: [
    'Anh', 'Huy', 'Mai', 'Nam', 'Lan', 'Tuấn', 'Hà', 'Đức', 'Ngọc', 'Phong',
    'Thảo', 'Bình', 'Linh', 'Khoa', 'Trang', 'Minh', 'Hương', 'Việt', 'Thu', 'Long',
  ],
  tr: [
    'Zeynep', 'Ahmet', 'Elif', 'Mehmet', 'Ayşe', 'Mustafa', 'Fatma', 'Ali', 'Ece', 'Emre',
    'Sude', 'İbrahim', 'Hüseyin', 'Esra', 'Yusuf', 'Merve', 'Ömer', 'Selin', 'Hasan', 'Derya',
  ],
  default: [
    'Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank', 'Grace', 'Heidi', 'Ivan', 'Judy',
    'Kevin', 'Linda', 'Mallory', 'Nancy', 'Oscar', 'Peggy', 'Quentin', 'Randy', 'Steve', 'Trent',
  ],
};

export const translations: Record<
  string,
  {
    placeholder: string;
    send: string;
    changeNickname: string;
    confirm: string;
    cancel: string;
    morningGreeting: string;
    dayGreeting: string;
    eveningGreeting: string;
    nicknameLabel: string;
    nicknameChanged: string;
    banMessage: string;
    timeoutMessage: string;
    errorMessages: {
      invalidNickname: string;
      filmntNickname: string;
      postMessageFailed: string;
      updateMessagesFailed: string;
      colorChangeFailed: string;
      saveChatFailed: string;
      waitMoment: string;
      connectionClosed: string;
      processMessageFailed: string;
      serverDisconnected: string;
      chatFrozen: string;
      adminOnly: string;
      bannedOrTimedOut: string;
      adminCannotBanSelf: string;
    };
  }
> = {
  en: {
    placeholder: 'Enter your message...',
    send: 'Send',
    changeNickname: 'Change Nickname',
    confirm: 'Confirm',
    cancel: 'Cancel',
    morningGreeting: 'Good morning!',
    dayGreeting: 'Have a nice day!',
    eveningGreeting: 'Good evening!',
    nicknameLabel: 'Nickname',
    nicknameChanged: 'Nickname changed.',
    banMessage: 'You have been banned.',
    timeoutMessage: 'Time out!',
    errorMessages: {
      invalidNickname: `Nickname must be between ${MIN_NICKNAME_LENGTH} and ${MAX_NICKNAME_LENGTH} characters and can only contain letters, numbers, _, -, and supported language characters.`,
      filmntNickname: 'Nickname cannot contain "filmnt".',
      postMessageFailed: 'Failed to send message.',
      updateMessagesFailed: 'Failed to update messages.',
      colorChangeFailed: 'Failed to change color.',
      saveChatFailed: 'Failed to save chat.',
      waitMoment: 'Please wait a moment.',
      connectionClosed: 'Server connection closed.',
      processMessageFailed: 'Failed to process message.',
      serverDisconnected: 'Disconnected from server.',
      chatFrozen: 'Chat is frozen.',
      adminOnly: 'Only admins can chat.',
      bannedOrTimedOut: 'You are banned or timed out.',
      adminCannotBanSelf: 'Admins cannot ban themselves.',
    },
  },
  es: {
    placeholder: 'Ingresa tu mensaje...',
    send: 'Enviar',
    changeNickname: 'Cambiar apodo',
    confirm: 'Confirmar',
    cancel: 'Cancelar',
    morningGreeting: '¡Buenos días!',
    dayGreeting: '¡Que tengas un buen día!',
    eveningGreeting: '¡Buenas noches!',
    nicknameLabel: 'Apodo',
    nicknameChanged: 'Apodo cambiado.',
    banMessage: 'Has sido expulsado.',
    timeoutMessage: '¡Tiempo agotado!',
    errorMessages: {
      invalidNickname: `El apodo debe tener entre ${MIN_NICKNAME_LENGTH} y ${MAX_NICKNAME_LENGTH} caracteres y solo puede contener letras, números, _, -, y caracteres de idiomas soportados.`,
      filmntNickname: 'El apodo no puede contener "filmnt".',
      postMessageFailed: 'No se pudo enviar el mensaje.',
      updateMessagesFailed: 'No se pudieron actualizar los mensajes.',
      colorChangeFailed: 'No se pudo cambiar el color.',
      saveChatFailed: 'No se pudo guardar el chat.',
      waitMoment: 'Por favor, espera un momento.',
      connectionClosed: 'Conexión con el servidor cerrada.',
      processMessageFailed: 'No se pudo procesar el mensaje.',
      serverDisconnected: 'Desconectado del servidor.',
      chatFrozen: 'El chat está congelado.',
      adminOnly: 'Solo los administradores pueden chatear.',
      bannedOrTimedOut: 'Estás expulsado o suspendido temporalmente.',
      adminCannotBanSelf: 'Los administradores no pueden expulsarse a sí mismos.',
    },
  },
  zh: {
    placeholder: '输入您的消息...',
    send: '发送',
    changeNickname: '更改昵称',
    confirm: '确认',
    cancel: '取消',
    morningGreeting: '早上好！',
    dayGreeting: '祝你一天愉快！',
    eveningGreeting: '晚上好！',
    nicknameLabel: '昵称',
    nicknameChanged: '昵称已更改。',
    banMessage: '您已被封禁。',
    timeoutMessage: '超时！',
    errorMessages: {
      invalidNickname: `昵称必须在${MIN_NICKNAME_LENGTH}到${MAX_NICKNAME_LENGTH}个字符之间，仅可包含字母、数字、_、-和支持的语言字符。`,
      filmntNickname: '昵称不能包含“filmnt”。',
      postMessageFailed: '消息发送失败。',
      updateMessagesFailed: '消息更新失败。',
      colorChangeFailed: '更改颜色失败。',
      saveChatFailed: '保存聊天失败。',
      waitMoment: '请稍等片刻。',
      connectionClosed: '服务器连接已关闭。',
      processMessageFailed: '消息处理失败。',
      serverDisconnected: '与服务器断开连接。',
      chatFrozen: '聊天已被冻结。',
      adminOnly: '仅管理员可以聊天。',
      bannedOrTimedOut: '您已被封禁或暂时禁言。',
      adminCannotBanSelf: '管理员不能封禁自己。',
    },
  },
  hi: {
    placeholder: 'अपना संदेश दर्ज करें...',
    send: 'भेजें',
    changeNickname: 'उपनाम बदलें',
    confirm: 'पुष्टि करें',
    cancel: 'रद्द करें',
    morningGreeting: 'सुप्रभात!',
    dayGreeting: 'आपका दिन अच्छा हो!',
    eveningGreeting: 'शुभ संध्या!',
    nicknameLabel: 'उपनाम',
    nicknameChanged: 'उपनाम बदला गया।',
    banMessage: 'आपको प्रतिबंधित किया गया है।',
    timeoutMessage: 'समय समाप्त!',
    errorMessages: {
      invalidNickname: `उपनाम ${MIN_NICKNAME_LENGTH} से ${MAX_NICKNAME_LENGTH} अक्षरों के बीच होना चाहिए और इसमें केवल अक्षर, संख्याएँ, _, -, और समर्थित भाषा के अक्षर शामिल हो सकते हैं।`,
      filmntNickname: 'उपनाम में "filmnt" शामिल नहीं हो सकता।',
      postMessageFailed: 'संदेश भेजने में विफल।',
      updateMessagesFailed: 'संदेश अपडेट करने में विफल।',
      colorChangeFailed: 'रंग बदलने में विफल।',
      saveChatFailed: 'चैट सहेजने में विफल।',
      waitMoment: 'कृपया एक क्षण प्रतीक्षा करें।',
      connectionClosed: 'सर्वर कनेक्शन बंद हो गया।',
      processMessageFailed: 'संदेश संसाधित करने में विफल।',
      serverDisconnected: 'सर्वर से डिस्कनेक्ट हो गया।',
      chatFrozen: 'चैट जम गया है।',
      adminOnly: 'केवल व्यवस्थापक चैट कर सकते हैं।',
      bannedOrTimedOut: 'आपको प्रतिबंधित या अस्थायी रूप से मूक किया गया है।',
      adminCannotBanSelf: 'व्यवस्थापक स्वयं को प्रतिबंधित नहीं कर सकते।',
    },
  },
  ar: {
    placeholder: 'أدخل رسالتك...',
    send: 'إرسال',
    changeNickname: 'تغيير الاسم المستعار',
    confirm: 'تأكيد',
    cancel: 'إلغاء',
    morningGreeting: 'صباح الخير!',
    dayGreeting: 'أتمنى لك يوماً سعيداً!',
    eveningGreeting: 'مساء الخير!',
    nicknameLabel: 'الاسم المستعار',
    nicknameChanged: 'تم تغيير الاسم المستعار.',
    banMessage: 'تم حظرك.',
    timeoutMessage: 'انتهى الوقت!',
    errorMessages: {
      invalidNickname: `يجب أن يكون الاسم المستعار بين ${MIN_NICKNAME_LENGTH} و${MAX_NICKNAME_LENGTH} حرفًا ويمكن أن يحتوي فقط على حروف، أرقام، _، -، وأحرف اللغات المدعومة.`,
      filmntNickname: 'لا يمكن أن يحتوي الاسم المستعار على "filmnt".',
      postMessageFailed: 'فشل إرسال الرسالة.',
      updateMessagesFailed: 'فشل تحديث الرسائل.',
      colorChangeFailed: 'فشل تغيير اللون.',
      saveChatFailed: 'فشل حفظ الدردشة.',
      waitMoment: 'يرجى الانتظار لحظة.',
      connectionClosed: 'تم إغلاق اتصال الخادم.',
      processMessageFailed: 'فشل معالجة الرسالة.',
      serverDisconnected: 'تم قطع الاتصال بالخادم.',
      chatFrozen: 'الدردشة مجمدة.',
      adminOnly: 'يمكن للمشرفين فقط الدردشة.',
      bannedOrTimedOut: 'تم حظرك أو تعليقك مؤقتًا.',
      adminCannotBanSelf: 'لا يمكن للمشرفين حظر أنفسهم.',
    },
  },
  fr: {
    placeholder: 'Entrez votre message...',
    send: 'Envoyer',
    changeNickname: 'Changer de pseudo',
    confirm: 'Confirmer',
    cancel: 'Annuler',
    morningGreeting: 'Bonjour !',
    dayGreeting: 'Bonne journée !',
    eveningGreeting: 'Bonsoir !',
    nicknameLabel: 'Pseudo',
    nicknameChanged: 'Pseudo changé.',
    banMessage: 'Vous avez été banni.',
    timeoutMessage: 'Temps écoulé !',
    errorMessages: {
      invalidNickname: `Le pseudo doit comporter entre ${MIN_NICKNAME_LENGTH} et ${MAX_NICKNAME_LENGTH} caractères et ne peut contenir que des lettres, des chiffres, _, -, et des caractères des langues prises en charge.`,
      filmntNickname: 'Le pseudo ne peut pas contenir "filmnt".',
      postMessageFailed: 'Échec de l’envoi du message.',
      updateMessagesFailed: 'Échec de la mise à jour des messages.',
      colorChangeFailed: 'Échec du changement de couleur.',
      saveChatFailed: 'Échec de la sauvegarde du chat.',
      waitMoment: 'Veuillez patienter un instant.',
      connectionClosed: 'Connexion au serveur fermée.',
      processMessageFailed: 'Échec du traitement du message.',
      serverDisconnected: 'Déconnecté du serveur.',
      chatFrozen: 'Le chat est gelé.',
      adminOnly: 'Seuls les administrateurs peuvent discuter.',
      bannedOrTimedOut: 'Vous êtes banni ou temporairement désactivé.',
      adminCannotBanSelf: 'Les administrateurs ne peuvent pas se bannir eux-mêmes.',
    },
  },
  ru: {
    placeholder: 'Введите ваше сообщение...',
    send: 'Отправить',
    changeNickname: 'Изменить ник',
    confirm: 'Подтвердить',
    cancel: 'Отмена',
    morningGreeting: 'Доброе утро!',
    dayGreeting: 'Хорошего дня!',
    eveningGreeting: 'Добрый вечер!',
    nicknameLabel: 'Ник',
    nicknameChanged: 'Ник изменён.',
    banMessage: 'Вы были забанены.',
    timeoutMessage: 'Время вышло!',
    errorMessages: {
      invalidNickname: `Ник должен содержать от ${MIN_NICKNAME_LENGTH} до ${MAX_NICKNAME_LENGTH} символов и может включать только буквы, цифры, _, -, и символы поддерживаемых языков.`,
      filmntNickname: 'Ник не может содержать "filmnt".',
      postMessageFailed: 'Не удалось отправить сообщение.',
      updateMessagesFailed: 'Не удалось обновить сообщения.',
      colorChangeFailed: 'Не удалось изменить цвет.',
      saveChatFailed: 'Не удалось сохранить чат.',
      waitMoment: 'Пожалуйста, подождите немного.',
      connectionClosed: 'Соединение с сервером закрыто.',
      processMessageFailed: 'Не удалось обработать сообщение.',
      serverDisconnected: 'Отключено от сервера.',
      chatFrozen: 'Чат заморожен.',
      adminOnly: 'Чат доступен только администраторам.',
      bannedOrTimedOut: 'Вы забанены или временно заглушены.',
      adminCannotBanSelf: 'Администраторы не могут банить себя.',
    },
  },
  pt: {
    placeholder: 'Digite sua mensagem...',
    send: 'Enviar',
    changeNickname: 'Alterar apelido',
    confirm: 'Confirmar',
    cancel: 'Cancelar',
    morningGreeting: 'Bom dia!',
    dayGreeting: 'Tenha um bom dia!',
    eveningGreeting: 'Boa noite!',
    nicknameLabel: 'Apelido',
    nicknameChanged: 'Apelido alterado.',
    banMessage: 'Você foi banido.',
    timeoutMessage: 'Tempo esgotado!',
    errorMessages: {
      invalidNickname: `O apelido deve ter entre ${MIN_NICKNAME_LENGTH} e ${MAX_NICKNAME_LENGTH} caracteres e pode conter apenas letras, números, _, -, e caracteres de idiomas suportados.`,
      filmntNickname: 'O apelido não pode conter "filmnt".',
      postMessageFailed: 'Falha ao enviar a mensagem.',
      updateMessagesFailed: 'Falha ao atualizar as mensagens.',
      colorChangeFailed: 'Falha ao mudar a cor.',
      saveChatFailed: 'Falha ao salvar o chat.',
      waitMoment: 'Por favor, aguarde um momento.',
      connectionClosed: 'Conexão com o servidor fechada.',
      processMessageFailed: 'Falha ao processar a mensagem.',
      serverDisconnected: 'Desconectado do servidor.',
      chatFrozen: 'O chat está congelado.',
      adminOnly: 'Apenas administradores podem conversar.',
      bannedOrTimedOut: 'Você foi banido ou temporariamente silenciado.',
      adminCannotBanSelf: 'Administradores não podem banir a si mesmos.',
    },
  },
  de: {
    placeholder: 'Geben Sie Ihre Nachricht ein...',
    send: 'Senden',
    changeNickname: 'Spitznamen ändern',
    confirm: 'Bestätigen',
    cancel: 'Abbrechen',
    morningGreeting: 'Guten Morgen!',
    dayGreeting: 'Einen schönen Tag!',
    eveningGreeting: 'Guten Abend!',
    nicknameLabel: 'Spitzname',
    nicknameChanged: 'Spitzname geändert.',
    banMessage: 'Sie wurden gesperrt.',
    timeoutMessage: 'Zeit abgelaufen!',
    errorMessages: {
      invalidNickname: `Der Spitzname muss zwischen ${MIN_NICKNAME_LENGTH} und ${MAX_NICKNAME_LENGTH} Zeichen lang sein und darf nur Buchstaben, Zahlen, _, -, und Zeichen unterstützter Sprachen enthalten.`,
      filmntNickname: 'Der Spitzname darf "filmnt" nicht enthalten.',
      postMessageFailed: 'Nachricht konnte nicht gesendet werden.',
      updateMessagesFailed: 'Nachrichten konnten nicht aktualisiert werden.',
      colorChangeFailed: 'Farbe konnte nicht geändert werden.',
      saveChatFailed: 'Chat konnte nicht gespeichert werden.',
      waitMoment: 'Bitte warten Sie einen Moment.',
      connectionClosed: 'Serververbindung geschlossen.',
      processMessageFailed: 'Nachricht konnte nicht verarbeitet werden.',
      serverDisconnected: 'Vom Server getrennt.',
      chatFrozen: 'Chat ist eingefroren.',
      adminOnly: 'Nur Administratoren können chatten.',
      bannedOrTimedOut: 'Sie sind gesperrt oder vorübergehend stummgeschaltet.',
      adminCannotBanSelf: 'Administratoren können sich selbst nicht sperren.',
    },
  },
  ja: {
    placeholder: 'メッセージを入力...',
    send: '送信',
    changeNickname: 'ニックネームを変更',
    confirm: '確認',
    cancel: 'キャンセル',
    morningGreeting: 'おはようございます！',
    dayGreeting: '良い一日を！',
    eveningGreeting: 'こんばんは！',
    nicknameLabel: 'ニックネーム',
    nicknameChanged: 'ニックネームが変更されました。',
    banMessage: 'あなたはBANされています。',
    timeoutMessage: 'タイムアウト！',
    errorMessages: {
      invalidNickname: `ニックネームは${MIN_NICKNAME_LENGTH}から${MAX_NICKNAME_LENGTH}文字の間で、字母、数字、_、-、およびサポートされている言語の文字のみを含むことができます。`,
      filmntNickname: 'ニックネームに「filmnt」を含めることはできません。',
      postMessageFailed: 'メッセージの送信に失敗しました。',
      updateMessagesFailed: 'メッセージの更新に失敗しました。',
      colorChangeFailed: '色の変更に失敗しました。',
      saveChatFailed: 'チャットの保存に失敗しました。',
      waitMoment: 'しばらくお待ちください。',
      connectionClosed: 'サーバー接続が閉じられました。',
      processMessageFailed: 'メッセージの処理に失敗しました。',
      serverDisconnected: 'サーバーから切断されました。',
      chatFrozen: 'チャットが凍結されています。',
      adminOnly: '管理者のみがチャットできます。',
      bannedOrTimedOut: 'あなたはBANまたは一時制限されています。',
      adminCannotBanSelf: '管理者は自分自身をBANできません。',
    },
  },
  bn: {
    placeholder: 'আপনার বার্তা লিখুন...',
    send: 'পাঠান',
    changeNickname: 'ডাকনাম পরিবর্তন করুন',
    confirm: 'নিশ্চিত করুন',
    cancel: 'বাতিল করুন',
    morningGreeting: 'শুভ সকাল!',
    dayGreeting: 'আপনার দিনটি ভালো হোক!',
    eveningGreeting: 'শুভ সন্ধ্যা!',
    nicknameLabel: 'ডাকনাম',
    nicknameChanged: 'ডাকনাম পরিবর্তিত হয়েছে।',
    banMessage: 'আপনাকে নিষিদ্ধ করা হয়েছে।',
    timeoutMessage: 'সময় শেষ!',
    errorMessages: {
      invalidNickname: `ডাকনাম ${MIN_NICKNAME_LENGTH} থেকে ${MAX_NICKNAME_LENGTH} অক্ষরের মধ্যে হতে হবে এবং শুধুমাত্র অক্ষর, সংখ্যা, _, -, এবং সমর্থিত ভাষার অক্ষর থাকতে পারে।`,
      filmntNickname: 'ডাকনামে "filmnt" থাকতে পারবে না।',
      postMessageFailed: 'বার্তা পাঠাতে ব্যর্থ।',
      updateMessagesFailed: 'বার্তা আপডেট করতে ব্যর্থ।',
      colorChangeFailed: 'রঙ পরিবর্তন করতে ব্যর্থ।',
      saveChatFailed: 'চ্যাট সংরক্ষণ করতে ব্যর্থ।',
      waitMoment: 'অনুগ্রহ করে একটু অপেক্ষা করুন।',
      connectionClosed: 'সার্ভার সংযোগ বন্ধ হয়েছে।',
      processMessageFailed: 'বার্তা প্রক্রিয়াকরণে ব্যর্থ।',
      serverDisconnected: 'সার্ভার থেকে সংযোগ বিচ্ছিন্ন।',
      chatFrozen: 'চ্যাট জমে গেছে।',
      adminOnly: 'শুধুমাত্র অ্যাডমিনরা চ্যাট করতে পারেন।',
      bannedOrTimedOut: 'আপনাকে নিষিদ্ধ বা সাময়িকভাবে নিষিদ্ধ করা হয়েছে।',
      adminCannotBanSelf: 'অ্যাডমিনরা নিজেদের নিষিদ্ধ করতে পারেন না।',
    },
  },
  pa: {
    placeholder: 'ਆਪਣਾ ਸੁਨੇਹਾ ਦਰਜ ਕਰੋ...',
    send: 'ਭੇਜੋ',
    changeNickname: 'ਉਪਨਾਮ ਬਦਲੋ',
    confirm: 'ਪੁਸ਼ਟੀ ਕਰੋ',
    cancel: 'ਰੱਦ ਕਰੋ',
    morningGreeting: 'ਸ਼ੁਭ ਸਵੇਰ!',
    dayGreeting: 'ਤੁਹਾਡਾ ਦਿਨ ਵਧੀਆ ਹੋਵੇ!',
    eveningGreeting: 'ਸੁਭ ਸੰਧਿਆ!',
    nicknameLabel: 'ਉਪਨਾਮ',
    nicknameChanged: 'ਉਪਨਾਮ ਬਦਲਿਆ ਗਿਆ।',
    banMessage: 'ਤੁਸੀਂ ਪਾਬੰਦੀ ਲਗਾਈ ਗਈ ਹੈ।',
    timeoutMessage: 'ਸਮਾਂ ਖਤਮ!',
    errorMessages: {
      invalidNickname: `ਉਪਨਾਮ ${MIN_NICKNAME_LENGTH} ਤੋਂ ${MAX_NICKNAME_LENGTH} ਅੱਖਰਾਂ ਦੇ ਵਿੱਚ ਹੋਣਾ ਚਾਹੀਦਾ ਹੈ ਅਤੇ ਸਿਰਫ ਅੱਖਰ, ਅੰਕ, _, -, ਅਤੇ ਸਮਰਥਿਤ ਭਾਸ਼ਾਵਾਂ ਦੇ ਅੱਖਰ ਸ਼ਾਮਲ ਕਰ ਸਕਦਾ ਹੈ।`,
      filmntNickname: 'ਉਪਨਾਮ ਵਿੱਚ "filmnt" ਨਹੀਂ ਹੋ ਸਕਦਾ।',
      postMessageFailed: 'ਸੁਨੇਹਾ ਭੇਜਣ ਵਿੱਚ ਅਸਫਲ।',
      updateMessagesFailed: 'ਸੁਨਿਹਿਆਂ ਨੂੰ ਅੱਪਡੇਟ ਕਰਨ ਵਿੱਚ ਅਸਫਲ।',
      colorChangeFailed: 'ਰੰਗ ਬਦਲਣ ਵਿੱਚ ਅਸਫਲ।',
      saveChatFailed: 'ਚੈਟ ਸੁਰੱਖਿਅਤ ਕਰਨ ਵਿੱਚ ਅਸਫਲ।',
      waitMoment: 'ਕਿਰਪਾ ਕਰਕੇ ਇੱਕ ਪਲ ਉਡੀਕ ਕਰੋ।',
      connectionClosed: 'ਸਰਵਰ ਕੁਨੈਕਸ਼ਨ ਬੰਦ ਹੋ ਗਿਆ।',
      processMessageFailed: 'ਸੁਨੇਹਾ ਪ੍ਰੋਸੈਸ ਕਰਨ ਵਿੱਚ ਅਸਫਲ।',
      serverDisconnected: 'ਸਰਵਰ ਨਾਲ ਸੰਪਰਕ ਟੁੱਟ ਗਿਆ।',
      chatFrozen: 'ਚੈਟ ਜੰਮ ਗਈ ਹੈ।',
      adminOnly: 'ਸਿਰਫ ਐਡਮਿਨ ਹੀ ਚੈਟ ਕਰ ਸਕਦੇ ਹਨ।',
      bannedOrTimedOut: "ਤੁਸੀਂ ਪਾਬੰਦੀ ਜਾਂ ਅਸਥਾਈ ਤੌਰ 'ਤੇ ਮੌਨ ਕੀਤੇ ਗਏ ਹੋ।",
      adminCannotBanSelf: 'ਐਡਮਿਨ ਆਪਣੇ ਆਪ ਨੂੰ ਪਾਬੰਦੀ ਨਹੀਂ ਕਰ ਸਕਦੇ।',
    },
  },
  te: {
    placeholder: 'మీ సందేశాన్ని నమోదు చేయండి...',
    send: 'పంపండి',
    changeNickname: 'మారుపేరు మార్చండి',
    confirm: 'నిర్ధారించండి',
    cancel: 'రద్దు చేయండి',
    morningGreeting: 'శుభోదయం!',
    dayGreeting: 'మీ రోజు బాగుండాలి!',
    eveningGreeting: 'శుభ సాయంత్రం!',
    nicknameLabel: 'మారుపేరు',
    nicknameChanged: 'మారుపేరు మార్చబడింది.',
    banMessage: 'మీరు నిషేధించబడ్డారు.',
    timeoutMessage: 'సమయం ముగిసింది!',
    errorMessages: {
      invalidNickname: `మారుపేరు ${MIN_NICKNAME_LENGTH} నుండి ${MAX_NICKNAME_LENGTH} అక్షరాల మధ్య ఉండాలి మరియు అక్షరాలు, సంఖ్యలు, _, -, మరియు సమర్థిత భాషల అక్షరాలు మాత్రమే ఉండవచ్చు.`,
      filmntNickname: 'మారుపేరులో "filmnt" ఉండకూడదు.',
      postMessageFailed: 'సందేశం పంపడంలో విఫలమైంది.',
      updateMessagesFailed: 'సందేశాలను అప్‌డేట్ చేయడంలో విఫలమైంది.',
      colorChangeFailed: 'రంగు మార్చడంలో విఫలమైంది.',
      saveChatFailed: 'చాట్ సేవ్ చేయడంలో విఫలమైంది.',
      waitMoment: 'దయచేసి క్షణం ఆగండి.',
      connectionClosed: 'సర్వర్ కనెక్షన్ మూసివేయబడింది.',
      processMessageFailed: 'సందేశం ప్రాసెస్ చేయడంలో విఫలమైంది.',
      serverDisconnected: 'సర్వర్ నుండి డిస్‌క్టైండి.',
      chatFrozen: 'చాట్ ఫ్రీజ్ అయింది.',
      adminOnly: 'అడ్మిన్‌లు మాత్రమే చాట్ చేయవచ్చు.',
      bannedOrTimedOut: 'మీరు నిషేధించబడ్డారు లేదా తాత్కాలికంగా నిశ్శబ్దం చేయబడ్డారు.',
      adminCannotBanSelf: 'అడ్మిన్‌లు తమను తాము నిషేధించుకోలేరు.',
    },
  },
    mr: {
      placeholder: 'आपला संदेश प्रविष्ट करा...',
      send: 'Prाठव',
      changeNickname: 'टोणननाव बदला',
      confirm: 'पुश्टिी',
      cancel: 'रदद',
      morningGreeting: 'सुप्रभात!',
      dayGreeting: 'तुमचा रिवस चांगला जाव!',
      eveningGreeting: 'शुभ संध्या!',
      nicknameLabel: 'टोणपण',
      nicknameChanged: 'टॉपणनांम बदलल.',
      banMessage: 'तुम्हाला बंदी घालण्यात आली आहे.',
      timeoutMessage: 'वेळ संपली!',
      errorMessages: {
        invalidNickname: "टोणनाव ${MIN_NICKNAME_LENGTH} ते ${MAX_NICKNAME_LENGTH} अक्षरांदरम्यान असावं आणि त्यात फक्त अक््, अंक, _, -, आणि समरधित भाषा अक्षर असं.",
        filmntNickname: 'टोणनावात "filmnt" अस्स्नं नशकत.',
        postMessageFailed: 'संद पाठवण्ययात अयशस्वी.',
        updateMessagesFailed: 'संद अपडटट करणयात अयशस्वी.',
        colorChangeFailed: 'रंग बदलण्ययात अयशस्वी.',
        saveChatFailed: 'Failed to save chat.',
        waitMoment: 'कृपया एक क्षण प्रतीक्षा.',
        connectionClosed: 'सर्व्हर ससंयग बंध झ.',
        processMessageFailed: 'संद प्रक्रिया करणयात अयशस्वी.',
        serverDisconnected: 'सर्व्हरपासून डिस्कनकट झाले.',
        chatFrozen: 'चॅट गोठवले आहे.',
        adminOnly: 'फक्त प्रशासकच चॅट करू शकतात.',
        bannedOrTimedOut: 'तुम्हाला बंदी घालण्ययात आली आहे किंवा तात्पुरते मूक.',
        adminCannotBanSelf: 'प्रशासक स्वतःला बंदी घालू शकत नाहीत.'
      },
  },
  ta: {
    placeholder: 'உஙங்கள் செயதியை உள்ளிடவும்...',
    send: 'அனுப்பு',
    changeNickname: 'புனைப்பெயர் மாறறு',
    confirm: 'உறுதியப்படுத்து',
    cancel: 'ரத்து செய்',
    morningGreeting: 'காலை வணக்கம்!',
    dayGreeting: 'நல்ல நாளாக அமையட்டும்!',
    eveningGreeting: 'மாலை வணக்கம்!',
    nicknameLabel: 'புனைப்பெயர்',
    nicknameChanged: 'புனைப்பெயர் மாறறப்பட்டது.',
    banMessage: 'நீஙங்கள் தடை செயயப்பட்டுள்ளீரங்கள்.',
    timeoutMessage: 'நேரம் முடிந்தது!',
    errorMessages: {
      invalidNickname: `புனைப்பெயர் ${MIN_NICKNAME_LENGTH} முதல் ${MAX_NICKNAME_LENGTH} எழுத்துககள வரை இருக்க வேணடும் மறறும் எழுத்துககள், எணககள், _, -, மறறியும் சமரதித்த மொழி எழுத்துககள் மடடுமே உளளாக வேணடக.`,
      filmntNickname: 'புனைப்பெயரில் "filmnt" இருக்கககூடாது.',
      postMessageFailed: 'செயதி அனுப்புவதில் தோலவி.',
      updateMessagesFailed: 'செயதிககளைப் புதுப்பிப்பதில் தோலவி.',
      colorChangeFailed: 'நிறம் மாறறுவதில் தோலவி.',
      saveChatFailed: 'அரடடையைச சேமிப்பதில் தோலவி.',
      waitMoment: 'தயவுசெயது ஒரு கணணம் காததிராகவும்.',
      connectionClosed: 'சரவர் இணைப்பு மூடப்பட்டது.',
      processMessageFailed: 'செயதியைச செயலாககுவதில் தோலவி.',
      serverDisconnected: 'சரவரிலிருணது துணடிக்கப்பட்டது.',
      chatFrozen: 'அரடடை உறைந்துவிடடது.',
      adminOnly: 'நிரவாகிககள் மடடுமே அரடடை செயய முடியும்.',
      bannedOrTimedOut: 'நீஙங்கள் தடை செயயப்பட்டுள்ளீரங்கள் அல்லது தறககாலிகமாக முடக்கப்பட்டுள்ளீரங்கள்.',
      adminCannotBanSelf: 'நிரவாகிககள் தஙகங்களைத தாஙகளே தடை செயய முடியாது.',
    },
  },
  ur: {
    placeholder: 'اپنا پیغام درج کریں...',
    send: 'بھیجیں',
    changeNickname: 'عرفیت تبدیل کریں',
    confirm: 'تصدیق کریں',
    cancel: 'منسوخ کریں',
    morningGreeting: 'صبح بخیر!',
    dayGreeting: 'آپ کا دن اچھا گزرے!',
    eveningGreeting: 'شام بخیر!',
    nicknameLabel: 'عرفیت',
    nicknameChanged: 'عرفیت تبدیل ہوگئی۔',
    banMessage: 'آپ پر پابندی لگائی گئی ہے۔',
    timeoutMessage: 'وقت ختم!',
    errorMessages: {
      invalidNickname: `عرفیت ${MIN_NICKNAME_LENGTH} سے ${MAX_NICKNAME_LENGTH} حروف کے درمیان ہونی چاہیے اور اس میں صرف حروف، اعداد، _، -، اور سپورٹ کی گئی زبانوں کے حروف شامل ہو سکتے ہیں۔`,
      filmntNickname: 'عرفیت میں "filmnt" شامل نہیں ہو سکتا۔',
      postMessageFailed: 'پیغام بھیجنے میں ناکام۔',
      updateMessagesFailed: 'پیغامات اپ ڈیٹ کرنے میں ناکام۔',
      colorChangeFailed: 'رنگ تبدیل کرنے میں ناکام۔',
      saveChatFailed: 'چیٹ محفوظ کرنے میں ناکام۔',
      waitMoment: 'براہ کرم ایک لمحہ انتظار کریں۔',
      connectionClosed: 'سرور کنکشن بند ہو گیا۔',
      processMessageFailed: 'پیغام پراسیس کرنے میں ناکام۔',
      serverDisconnected: 'سرور سے منقطع ہو گیا۔',
      chatFrozen: 'چیٹ منجمد ہو گئی ہے۔',
      adminOnly: 'صرف ایڈمن چیٹ کر سکتے ہیں۔',
      bannedOrTimedOut: 'آپ پر پابندی لگائی گئی یا عارضی طور پر خاموش کیا گیا ہے۔',
      adminCannotBanSelf: 'ایڈمن خود پر پابندی نہیں لگا سکتے۔',
    },
  },
  ko: {
    placeholder: '메시지를 입력하세요...',
    send: '보내기',
    changeNickname: '닉네임 변경',
    confirm: '확인',
    cancel: '취소',
    morningGreeting: '좋은 아침입니다!',
    dayGreeting: '좋은 하루 되세요!',
    eveningGreeting: '좋은 저녁이에요!',
    nicknameLabel: '닉네임',
    nicknameChanged: '닉네임이 변경되었습니다.',
    banMessage: '밴 되었습니다.',
    timeoutMessage: '타임아웃됨!',
    errorMessages: {
      invalidNickname: `닉네임은 ${MIN_NICKNAME_LENGTH}자 이상 ${MAX_NICKNAME_LENGTH}자 이하여야 하며, 특수문자는 _와 -만 허용됩니다.`,
      filmntNickname: '닉네임에 "filmnt"는 사용할 수 없습니다.',
      postMessageFailed: '메시지 전송에 실패했습니다.',
      updateMessagesFailed: '메시지 업데이트에 실패했습니다.',
      colorChangeFailed: '색상 변경에 실패했습니다.',
      saveChatFailed: '채팅 저장에 실패했습니다.',
      waitMoment: '잠시 기다려주세요.',
      connectionClosed: '서버 연결이 끊겼습니다.',
      processMessageFailed: '메시지 처리에 실패했습니다.',
      serverDisconnected: '서버와 연결이 끊겼습니다.',
      chatFrozen: '채팅창이 얼려졌습니다.',
      adminOnly: '관리자만 채팅할 수 있습니다.',
      bannedOrTimedOut: '밴 또는 타임아웃 상태입니다.',
      adminCannotBanSelf: '관리자는 자신을 밴할 수 없습니다.',
    },
  },
  it: {
    placeholder: 'Inserisci il tuo messaggio...',
    send: 'Invia',
    changeNickname: 'Cambia nickname',
    confirm: 'Conferma',
    cancel: 'Annulla',
    morningGreeting: 'Buongiorno!',
    dayGreeting: 'Buona giornata!',
    eveningGreeting: 'Buonasera!',
    nicknameLabel: 'Nickname',
    nicknameChanged: 'Nickname cambiato.',
    banMessage: 'Sei stato bannato.',
    timeoutMessage: 'Tempo scaduto!',
    errorMessages: {
      invalidNickname: `Il nickname deve essere compreso tra ${MIN_NICKNAME_LENGTH} e ${MAX_NICKNAME_LENGTH} caratteri e può contenere solo lettere, numeri, _, -, e caratteri delle lingue supportate.`,
      filmntNickname: 'Il nickname non può contenere "filmnt".',
      postMessageFailed: 'Invio del messaggio fallito.',
      updateMessagesFailed: 'Aggiornamento dei messaggi fallito.',
      colorChangeFailed: 'Cambio colore fallito.',
      saveChatFailed: 'Salvataggio della chat fallito.',
      waitMoment: 'Attendi un momento.',
      connectionClosed: 'Connessione al server chiusa.',
      processMessageFailed: 'Elaborazione del messaggio fallita.',
      serverDisconnected: 'Disconnesso dal server.',
      chatFrozen: 'La chat è congelata.',
      adminOnly: 'Solo gli amministratori possono chattare.',
      bannedOrTimedOut: 'Sei stato bannato o temporaneamente silenziato.',
      adminCannotBanSelf: 'Gli amministratori non possono bannare sé stessi.',
    },
  },
  vi: {
    placeholder: 'Nhập tin nhắn của bạn...',
    send: 'Gửi',
    changeNickname: 'Thay đổi biệt danh',
    confirm: 'Xác nhận',
    cancel: 'Hủy',
    morningGreeting: 'Chào buổi sáng!',
    dayGreeting: 'Chúc một ngày tốt lành!',
    eveningGreeting: 'Chào buổi tối!',
    nicknameLabel: 'Biệt danh',
    nicknameChanged: 'Biệt danh đã thay đổi.',
    banMessage: 'Bạn đã bị cấm.',
    timeoutMessage: 'Hết thời gian!',
    errorMessages: {
      invalidNickname: `Biệt danh phải có từ ${MIN_NICKNAME_LENGTH} đến ${MAX_NICKNAME_LENGTH} ký tự và chỉ có thể chứa chữ cái, số, _, -, và ký tự của các ngôn ngữ được hỗ trợ.`,
      filmntNickname: 'Biệt danh không được chứa "filmnt".',
      postMessageFailed: 'Gửi tin nhắn thất bại.',
      updateMessagesFailed: 'Cập nhật tin nhắn thất bại.',
      colorChangeFailed: 'Thay đổi màu sắc thất bại.',
      saveChatFailed: 'Lưu cuộc trò chuyện thất bại.',
      waitMoment: 'Vui lòng đợi một lát.',
      connectionClosed: 'Kết nối máy chủ đã đóng.',
      processMessageFailed: 'Xử lý tin nhắn thất bại.',
      serverDisconnected: 'Ngắt kết nối với máy chủ.',
      chatFrozen: 'Cuộc trò chuyện đã bị đóng băng.',
      adminOnly: 'Chỉ quản trị viên mới có thể trò chuyện.',
      bannedOrTimedOut: 'Bạn đã bị cấm hoặc bị tạm thời cấm nói.',
      adminCannotBanSelf: 'Quản trị viên không thể tự cấm chính mình.',
    },
  },
  tr: {
    placeholder: 'Mesajınızı girin...',
    send: 'Gönder',
    changeNickname: 'Takma adı değiştir',
    confirm: 'Onayla',
    cancel: 'İptal',
    morningGreeting: 'Günaydın!',
    dayGreeting: 'İyi günler!',
    eveningGreeting: 'İyi akşamlar!',
    nicknameLabel: 'Takma ad',
    nicknameChanged: 'Takma ad değiştirildi.',
    banMessage: 'Yasaklandınız.',
    timeoutMessage: 'Süre doldu!',
    errorMessages: {
      invalidNickname: `Takma ad ${MIN_NICKNAME_LENGTH} ile ${MAX_NICKNAME_LENGTH} karakter arasında olmalı ve yalnızca harf, rakam, _, -, ve desteklenen dil karakterleri içerebilir.`,
      filmntNickname: 'Takma ad "filmnt" içeremez.',
      postMessageFailed: 'Mesaj gönderilemedi.',
      updateMessagesFailed: 'Mesajlar güncellenemedi.',
      colorChangeFailed: 'Renk değiştirilemedi.',
      saveChatFailed: 'Sohbet kaydedilemedi.',
      waitMoment: 'Lütfen bir an bekleyin.',
      connectionClosed: 'Sunucu bağlantısı kapandı.',
      processMessageFailed: 'Mesaj işlenemedi.',
      serverDisconnected: 'Sunucudan bağlantı kesildi.',
      chatFrozen: 'Sohbet donduruldu.',
      adminOnly: 'Yalnızca yöneticiler sohbet edebilir.',
      bannedOrTimedOut: 'Yasaklandınız veya geçici olarak susturuldunuz.',
      adminCannotBanSelf: 'Yöneticiler kendilerini yasaklayamaz.',
    },
  },
  default: {
    placeholder: 'Enter your message...',
    send: 'Send',
    changeNickname: 'Change Nickname',
    confirm: 'Confirm',
    cancel: 'Cancel',
    morningGreeting: 'Good morning!',
    dayGreeting: 'Have a nice day!',
    eveningGreeting: 'Good evening!',
    nicknameLabel: 'Nickname',
    nicknameChanged: 'Nickname changed.',
    banMessage: 'You have been banned.',
    timeoutMessage: 'You have been timed out. Remaining time:',
    errorMessages: {
      invalidNickname: `Nickname must be between ${MIN_NICKNAME_LENGTH} and ${MAX_NICKNAME_LENGTH} characters and can only contain letters, numbers, _, -, and supported language characters.`,
      filmntNickname: 'Nickname cannot contain "filmnt".',
      postMessageFailed: 'Failed to send message.',
      updateMessagesFailed: 'Failed to update messages.',
      colorChangeFailed: 'Failed to change color.',
      saveChatFailed: 'Failed to save chat.',
      waitMoment: 'Please wait a moment.',
      connectionClosed: 'Server connection closed.',
      processMessageFailed: 'Failed to process message.',
      serverDisconnected: 'Disconnected from server.',
      chatFrozen: 'Chat is frozen.',
      adminOnly: 'Only admins can chat.',
      bannedOrTimedOut: 'You are banned or timed out.',
      adminCannotBanSelf: 'Admins cannot ban themselves.',
    },
  },
};

export const getRandomName = () => {
  const lang = navigator.language.split('-')[0];
  const names = namesByLanguage[lang] || namesByLanguage['default'];
  const baseName = names[Math.floor(Math.random() * names.length)].slice(0, MAX_NICKNAME_LENGTH);
  const suffix = Math.floor(1000 + Math.random() * 9000).toString();
  return `${baseName} ${suffix}`;
};

export const getTranslations = () => {
  const lang = navigator.language.split('-')[0];
  return translations[lang] || translations['default'];
};