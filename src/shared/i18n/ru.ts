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
    loginError: 'Не удалось войти. Проверьте почту и пароль.',
    newToNarrator: 'Впервые в Narrator?',
    password: 'Пароль',
    passwordsDoNotMatch: 'Пароли не совпадают.',
    registerError: 'Не удалось создать аккаунт. Попробуйте другую почту.',
    signIn: 'Войти',
    signInDescription: 'С возвращением в Narrator.',
    signingIn: 'Выполняем вход…',
  },
  common: {
    account: 'Аккаунт',
    goBack: 'Назад',
    signedIn: 'Выполнен вход',
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
  settings: {
    dark: 'Тёмная',
    language: 'Язык',
    light: 'Светлая',
    open: 'Открыть настройки',
    theme: 'Тема',
  },
  sidebar: {
    logOut: 'Выйти',
    toggle: 'Переключить боковую панель',
  },
} satisfies Translation;
