export const SUPPORTED_LANGUAGES = ['en', 'kr'] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const normalizeLanguage = (value?: string | null): Language => {
  if (!value) return 'en';
  const lowered = value.toLowerCase();
  if (SUPPORTED_LANGUAGES.includes(lowered as Language)) {
    return lowered as Language;
  }
  return 'en';
};

export const translations = {
  en: {
    nav: {
      marketplace: 'Marketplace',
      sellCard: 'Sell Card',
      profile: 'Profile',
      signOut: 'Sign Out',
      signIn: 'Sign In',
    },
    home: {
      titlePrefix: 'Welcome to',
      titleName: 'CardLink',
      subtitle:
        'The premier marketplace for trading cards. Buy, sell, and trade cards from your favorite games.',
      browseMarketplace: 'Browse Marketplace',
      browseCatalog: 'Browse Catalog',
      getStarted: 'Get Started',
      featuresTitle1: 'Wide Selection',
      featuresBody1:
        'Find cards from various games including Magic: The Gathering, Pokemon, Yu-Gi-Oh!, and more.',
      featuresTitle2: 'Secure Transactions',
      featuresBody2:
        'Buy and sell with confidence using our secure platform powered by Supabase.',
      featuresTitle3: 'Easy to Use',
      featuresBody3:
        'List your cards in minutes and start selling to collectors worldwide.',
    },
    marketplace: {
      title: 'Marketplace',
      subtitle: 'Discover listings from sellers across the community.',
      empty: 'Marketplace listings will appear here soon.',
    },
    auth: {
      loginTitle: 'Sign In to CardLink',
      signupTitle: 'Sign Up for CardLink',
      email: 'Email',
      password: 'Password',
      signIn: 'Sign In',
      signUp: 'Sign Up',
      signingIn: 'Signing in...',
      creatingAccount: 'Creating account...',
      noAccount: "Don't have an account?",
      haveAccount: 'Already have an account?',
      success: 'Account created successfully! Redirecting...',
      signInFailed: 'Failed to sign in',
      signUpFailed: 'Failed to sign up',
    },
    catalog: {
      title: 'Catalog',
      subtitle: 'Browse by game to explore sets and cards.',
      errorTitle: 'Unable to load games',
      empty: 'No games have been added yet.',
      viewSets: 'View sets and cards',
    },
    languageNames: {
      en: 'English',
      jp: 'Japanese',
      kr: 'Korean',
    } as Record<string, string>,
    games: {} as Record<string, string>,
  },
  kr: {
    nav: {
      marketplace: '마켓플레이스',
      sellCard: '카드 판매',
      profile: '프로필',
      signOut: '로그아웃',
      signIn: '로그인',
    },
    home: {
      titlePrefix: '환영합니다',
      titleName: 'CardLink',
      subtitle:
        '트레이딩 카드의 대표 마켓플레이스. 좋아하는 게임의 카드를 사고, 팔고, 교환하세요.',
      browseMarketplace: '마켓플레이스 보기',
      browseCatalog: '카탈로그 보기',
      getStarted: '시작하기',
      featuresTitle1: '폭넓은 선택',
      featuresBody1:
        'Magic: The Gathering, Pokemon, Yu-Gi-Oh! 등 다양한 게임의 카드를 찾아보세요.',
      featuresTitle2: '안전한 거래',
      featuresBody2: 'Supabase 기반의 안전한 플랫폼에서 안심하고 거래하세요.',
      featuresTitle3: '쉬운 사용',
      featuresBody3: '몇 분 만에 카드를 등록하고 전 세계 컬렉터에게 판매하세요.',
    },
    marketplace: {
      title: '마켓플레이스',
      subtitle: '커뮤니티 판매자들의 등록 상품을 확인하세요.',
      empty: '마켓플레이스 상품이 곧 표시됩니다.',
    },
    auth: {
      loginTitle: 'CardLink 로그인',
      signupTitle: 'CardLink 회원가입',
      email: '이메일',
      password: '비밀번호',
      signIn: '로그인',
      signUp: '회원가입',
      signingIn: '로그인 중...',
      creatingAccount: '계정 생성 중...',
      noAccount: '계정이 없나요?',
      haveAccount: '이미 계정이 있나요?',
      success: '계정이 생성되었습니다! 이동 중...',
      signInFailed: '로그인에 실패했습니다',
      signUpFailed: '회원가입에 실패했습니다',
    },
    catalog: {
      title: '카탈로그',
      subtitle: '게임을 선택해 세트와 카드를 확인하세요.',
      errorTitle: '게임을 불러올 수 없습니다',
      empty: '아직 등록된 게임이 없습니다.',
      viewSets: '세트와 카드 보기',
    },
    languageNames: {
      en: '영어',
      jp: '일본어',
      kr: '한국어',
    } as Record<string, string>,
    games: {
      'one-piece': '원피스',
      pokemon: '포켓몬',
    } as Record<string, string>,
  },
} as const;

export type Translations = (typeof translations)[Language];
