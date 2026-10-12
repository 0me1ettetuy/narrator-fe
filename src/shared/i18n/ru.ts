import type { Translation } from './en';

export const ru = {
  about: {
    eyebrow: 'О Narrator',
    title: 'О нас',
    description: 'Подробнее о Narrator — скоро.',
  },
  auth: {
    alreadyHaveAccount: 'Уже есть аккаунт?',
    confirmPassword: 'Подтвердите пароль',
    createAccount: 'Создать аккаунт',
    createAccountDescription:
      'Начните пользоваться Narrator за несколько секунд.',
    creatingAccount: 'Создаём аккаунт…',
    email: 'Электронная почта',
    newToNarrator: 'Впервые в Narrator?',
    password: 'Пароль',
    passwordsDoNotMatch: 'Пароли не совпадают.',
    signIn: 'Войти',
    signInDescription: 'С возвращением в Narrator.',
    signingIn: 'Выполняем вход…',
  },
  common: {
    account: 'Аккаунт',
    goBack: 'Назад',
    retry: 'Повторить',
    signedIn: 'Выполнен вход',
  },
  errors: {
    conflict:
      'Этот запрос конфликтует с существующими данными. Попробуйте ещё раз.',
    emailAlreadyRegistered: 'Аккаунт с такой почтой уже существует.',
    forbidden: 'У вас нет прав для этого действия.',
    invalidCredentials: 'Проверьте почту и пароль и попробуйте ещё раз.',
    network:
      'Не удалось связаться с Narrator. Проверьте подключение и попробуйте ещё раз.',
    notFound: 'Запрошенный ресурс не найден.',
    rateLimited:
      'Слишком много попыток. Подождите немного и попробуйте ещё раз.',
    server: 'В Narrator возникла проблема. Повторите попытку чуть позже.',
    unauthorized: 'Сессия истекла. Войдите снова.',
    unknown: 'Что-то пошло не так. Попробуйте ещё раз.',
    validation: 'Проверьте введённые данные и попробуйте ещё раз.',
  },
  header: {
    primaryNavigation: 'Основная навигация',
  },
  hero: {
    createAccountDescription:
      'Создайте аккаунт, чтобы начать пользоваться Narrator.',
    createAccount: 'Создать аккаунт',
    openWorkspace: 'Открыть рабочее пространство',
    signedInAs: 'Выполнен вход: {{email}}.',
    title: 'Превращайте идеи в ясные истории.',
    yourAccount: 'ваш аккаунт',
  },
  home: {
    description: 'Ваше рабочее пространство готово.',
    title: 'Добро пожаловать',
  },
  navigation: {
    about: 'О нас',
    home: 'Главная',
  },
  notFound: {
    description: 'Запрошенная страница не существует или была перемещена.',
    title: 'Страница не найдена',
  },
  notifications: {
    accountCreated: 'Аккаунт создан',
    signedIn: 'Выполнен вход',
    signedOut: 'Выполнен выход',
    signOutFailed: 'Не удалось выйти',
  },
  settings: {
    dark: 'Тёмная',
    language: 'Язык',
    light: 'Светлая',
    open: 'Открыть настройки',
    theme: 'Тема',
  },
  states: {
    emptyDescription: 'Пока здесь нет данных.',
    emptyTitle: 'Пока ничего нет',
    errorDescription: 'Попробуйте ещё раз через некоторое время.',
    errorTitle: 'Не удалось загрузить данные',
    loading: 'Загрузка…',
  },
  sidebar: {
    logOut: 'Выйти',
    toggle: 'Переключить боковую панель',
  },
} satisfies Translation;
