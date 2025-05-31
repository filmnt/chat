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
export const MAX_NICKNAME_LENGTH = 10;
export const NICKNAME_REGEX = /^[a-zA-Z0-9_\-.가-힣ㄱ-ㅎㅏ-ㅣ]+$|^$/;

export const MAX_MESSAGE_LENGTH = 500;
export const MESSAGE_PERSISTENCE_HOURS = 24;

export const TWITCH_COLORS = [
  '#FF0000', '#00FF00', '#0000FF', '#FF69B4', '#FFD700', '#00CED1', '#FF4500', '#9400D3',
  '#32CD32', '#FF6347', '#FF5733', '#33FF57', '#3357FF', '#FF33A1', '#33FFF5', '#F5FF33',
  '#FF8C33', '#8C33FF', '#00BFFF', '#FFB733', '#4CAF50', '#E91E63', '#3F51B5', '#009688',
  '#FFC107', '#FF5722', '#9C27B0', '#607D8B', '#00BCD4', '#CDDC39', '#FF1493', '#7FFF00',
  '#6A5ACD', '#20B2AA', '#FF4500', '#9932CC', '#228B22', '#DC143C', '#00FA9A', '#4169E1',
  '#FF00FF', '#ADFF2F', '#1E90FF', '#FF7F50', '#BA55D3', '#7CFC00', '#6495ED', '#FFDAB9',
  '#00FF7F', '#8A2BE2', '#FF4040', '#98FB98', '#4682B4', '#FFA500', '#800080', '#00FFFF',
  '#FF6347', '#9ACD32', '#B0C4DE', '#FA8072', '#6B8E23', '#FF00FF', '#20B2AA', '#DAA520',
  '#5F9EA0', '#F08080', '#90EE90', '#9932CC', '#87CEFA', '#FF4500', '#DA70D6', '#98FB98',
  '#00CED1', '#FF69B4', '#228B22', '#FFD700', '#9400D3', '#32CD32', '#FF5733', '#33FF57',
  '#3357FF', '#FF33A1', '#33FFF5', '#F5FF33', '#FF8C33', '#8C33FF', '#00BFFF', '#FFB733',
  '#4CAF50', '#E91E63', '#3F51B5', '#009688', '#FFC107', '#FF5722', '#9C27B0', '#607D8B'
];

export const STORAGE_KEYS = {
  NICKNAME: 'chatNickname',
  USER_ID: 'chatUserId',
  NICKNAME_COLOR: 'chatNicknameColor',
  OTHER_USER_COLORS: 'otherUserColors',
  LAST_FILMNT_MESSAGE: 'lastFilmntMessage',
  MESSAGES: 'chatMessages',
};

export const generateUserId = () => {
  return `user_${nanoid(12)}`;
};

export const getRandomColor = (excludeColors: string[] = []) => {
  const availableColors = TWITCH_COLORS.filter((color) => !excludeColors.includes(color));
  return availableColors[Math.floor(Math.random() * availableColors.length)] || '#555555';
};

export const validateNickname = (nickname: string): boolean => {
  const baseNickname = nickname.split(' ')[0];
  return (
    baseNickname.length >= MIN_NICKNAME_LENGTH &&
    baseNickname.length <= MAX_NICKNAME_LENGTH &&
    NICKNAME_REGEX.test(baseNickname)
  );
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
    }
  | {
      type: 'requestSync';
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
    '花', '蓮', '結衣', '海斗', '葵', '陽翔', '桜', '悠斗', '陽向', '空',
    '美咲', '大和', '愛', '翔', '雫', '悠', '凛', '翼', '真央', '颯',
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
    '지훈', '서연', '민준', '하윤', '준우', '지원', '현우', '예린', '도윤', '지민',
    '시우', '소연', '하준', '유진', '준서', '지아', '연우', '민서', '정우', '채원',
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
  },
  pa: {
    placeholder: 'ਆਪਣਾ ਸੁਨੇਹਾ ਦਰਜ ਕਰੋ...',
    send: 'ਭੇਜੋ',
    changeNickname: 'ਉਪਨਾਮ ਬਦਲੋ',
    confirm: 'ਪੁਸ਼ਟੀ ਕਰੋ',
    cancel: 'ਰੱਦ ਕਰੋ',
    morningGreeting: 'ਸ਼ੁਭ ਸਵੇਰ!',
    dayGreeting: 'ਤੁਹਾਡਾ ਦਿਨ ਵਧੀਆ ਹੋਵੇ!',
    eveningGreeting: 'ਸ਼ੁਭ ਸੰਧਿਆ!',
    nicknameLabel: 'ਉਪਨਾਮ',
    nicknameChanged: 'ਉਪਨਾਮ ਬਦਲਿਆ ਗਿਆ।',
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
    nicknameChanged: 'మారుపేరు మార్చబడింది।',
  },
  mr: {
    placeholder: 'आपला संदेश प्रविष्ट करा...',
    send: 'पाठवा',
    changeNickname: 'टोपणनाव बदला',
    confirm: 'पुष्टी करा',
    cancel: 'रद्द करा',
    morningGreeting: 'सुप्रभात!',
    dayGreeting: 'तुमचा दिवस चांगला जावो!',
    eveningGreeting: 'शुभ संध्या!',
    nicknameLabel: 'टोपणनाव',
    nicknameChanged: 'टोपणनाव बदलले.',
  },
  ta: {
    placeholder: 'உங்கள் செய்தியை உள்ளிடவும்...',
    send: 'அனுப்பு',
    changeNickname: 'புனைப்பெயர் மாற்று',
    confirm: 'உறுதிப்படுத்து',
    cancel: 'ரத்து செய்',
    morningGreeting: 'காலை வணக்கம்!',
    dayGreeting: 'நல்ல நாளாக அமையட்டும்!',
    eveningGreeting: 'மாலை வணக்கம்!',
    nicknameLabel: 'புனைப்பெயர்',
    nicknameChanged: 'புனைப்பெயர் மாற்றப்பட்டது.',
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