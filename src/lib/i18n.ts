export const LANG_KEY = "techworks-lang";

export const LANGS = [
  { id: "en", label: "English", native: "English", dir: "ltr" as const },
  { id: "es", label: "Cuban", native: "Cubano", dir: "ltr" as const },
  { id: "uk", label: "Ukrainian", native: "Українська", dir: "ltr" as const },
  { id: "ru", label: "Russian", native: "Русский", dir: "ltr" as const },
  { id: "ar", label: "Arabic", native: "العربية", dir: "rtl" as const },
  { id: "fa", label: "Farsi", native: "فارسی", dir: "rtl" as const },
] as const;

export type LangId = (typeof LANGS)[number]["id"];

const DICT: Record<LangId, Record<string, string>> = {
  en: {},
  es: {
    Themes: "Temas",
    Dashboard: "Pizarra",
    Week: "Semana",
    Admin: "Admin",
    Lunch: "Almuerzo",
    Now: "Ahora",
    Cleanup: "Recoger",
    "Apply look": "Guardar estilo",
    "Reset Solvay": "Volver a Solvay",
    Scale: "Escala",
    Titles: "Títulos",
    Chips: "Fichas",
    Corners: "Esquinas",
    Stroke: "Línea",
    Pad: "Relleno",
    Lift: "Sombra",
    Wallpaper: "Fondo",
    Type: "Letra",
    Color: "Color",
    Size: "Tamaño",
    Caps: "Mayúsculas",
    Language: "Idioma",
    "Small caps": "Versalitas",
    "All caps": "MAYÚSCULAS",
    Shadows: "Sombras",
    Glow: "Brillo",
    Today: "Hoy",
    "Hall wall": "Pizarra de estudio",
    "Tech store": "Tienda",
    "FERPA wall": "Pizarra FERPA",
    "Theme tools": "Estilo",
    Off: "No",
  },
  uk: {
    Themes: "Теми",
    Dashboard: "Дошка",
    Week: "Тиждень",
    Admin: "Адмін",
    Lunch: "Обід",
    Now: "Зараз",
    Cleanup: "Прибрати",
    "Apply look": "Зберегти стиль",
    "Reset Solvay": "Солвей знову",
    Scale: "Масштаб",
    Titles: "Заголовки",
    Chips: "Фішки",
    Corners: "Кути",
    Stroke: "Контур",
    Pad: "Відступ",
    Lift: "Тінь",
    Wallpaper: "Тло",
    Type: "Шрифт",
    Color: "Колір",
    Size: "Розмір",
    Caps: "Капітель",
    Language: "Мова",
    "Small caps": "Малі капітелі",
    "All caps": "ВЕЛИКІ",
    Shadows: "Тіні",
    Glow: "Сяйво",
    Today: "Сьогодні",
    "Hall wall": "Дошка залу",
    "Tech store": "Крамниця",
    "FERPA wall": "Дошка FERPA",
    "Theme tools": "Стиль",
    Off: "Ні",
  },
  ru: {
    Themes: "Темы",
    Dashboard: "Доска",
    Week: "Неделя",
    Admin: "Админ",
    Lunch: "Обед",
    Now: "Сейчас",
    Cleanup: "Уборка",
    "Apply look": "Сохранить стиль",
    "Reset Solvay": "Снова Солвей",
    Scale: "Масштаб",
    Titles: "Заголовки",
    Chips: "Фишки",
    Corners: "Углы",
    Stroke: "Обводка",
    Pad: "Отступ",
    Lift: "Тень",
    Wallpaper: "Фон",
    Type: "Шрифт",
    Color: "Цвет",
    Size: "Размер",
    Caps: "Капитель",
    Language: "Язык",
    "Small caps": "Малые капители",
    "All caps": "ЗАГЛАВНЫЕ",
    Shadows: "Тени",
    Glow: "Свечение",
    Today: "Сегодня",
    "Hall wall": "Доска зала",
    "Tech store": "Лавка",
    "FERPA wall": "Доска FERPA",
    "Theme tools": "Стиль",
    Off: "Нет",
  },
  ar: {
    Themes: "السمات",
    Dashboard: "اللوحة",
    Week: "الأسبوع",
    Admin: "الإدارة",
    Lunch: "الغداء",
    Now: "الآن",
    Cleanup: "ترتيب",
    "Apply look": "حفظ الشكل",
    "Reset Solvay": "سولفاي من جديد",
    Scale: "الحجم",
    Titles: "العناوين",
    Chips: "الشارات",
    Corners: "الزوايا",
    Stroke: "الخط",
    Pad: "الحشوة",
    Lift: "الظل",
    Wallpaper: "الخلفية",
    Type: "الخط",
    Color: "اللون",
    Size: "المقاس",
    Caps: "الحروف",
    Language: "اللغة",
    "Small caps": "حروف صغيرة كبيرة",
    "All caps": "كلها كبيرة",
    Shadows: "الظلال",
    Glow: "التوهج",
    Today: "اليوم",
    "Hall wall": "لوحة القاعة",
    "Tech store": "المتجر",
    "FERPA wall": "لوحة الخصوصية",
    "Theme tools": "الشكل",
    Off: "لا",
  },
  fa: {
    Themes: "پوسته‌ها",
    Dashboard: "تابلو",
    Week: "هفته",
    Admin: "مدیر",
    Lunch: "ناهار",
    Now: "الان",
    Cleanup: "جمع کردن",
    "Apply look": "ذخیره شکل",
    "Reset Solvay": "بازگشت به سولوی",
    Scale: "مقیاس",
    Titles: "عنوان‌ها",
    Chips: "برچسب‌ها",
    Corners: "گوشه‌ها",
    Stroke: "خط",
    Pad: "فاصله",
    Lift: "سایه",
    Wallpaper: "پس‌زمینه",
    Type: "قلم",
    Color: "رنگ",
    Size: "اندازه",
    Caps: "حروف",
    Language: "زبان",
    "Small caps": "حروف کوچکِ بزرگ",
    "All caps": "همه بزرگ",
    Shadows: "سایه‌ها",
    Glow: "درخشش",
    Today: "امروز",
    "Hall wall": "تابلوی سالن",
    "Tech store": "فروشگاه",
    "FERPA wall": "تابلوی حریم",
    "Theme tools": "شکل",
    Off: "نه",
  },
};

export function storedLang(): LangId {
  try {
    if (typeof window === "undefined") return "en";
    const v = window.localStorage.getItem(LANG_KEY);
    return LANGS.some((l) => l.id === v) ? (v as LangId) : "en";
  } catch {
    return "en";
  }
}

export function langOf(id: LangId) {
  return LANGS.find((l) => l.id === id) ?? LANGS[0];
}

const subs = new Set<() => void>();

export function lang(): LangId {
  return storedLang();
}

export function paintLang(id: LangId = storedLang()) {
  if (typeof document === "undefined") return;
  const row = langOf(id);
  document.documentElement.lang = id === "es" ? "es-CU" : id;
  document.documentElement.dir = row.dir;
}

export function commitLang(id: LangId) {
  if (typeof window !== "undefined") window.localStorage.setItem(LANG_KEY, id);
  paintLang(id);
  subs.forEach((fn) => fn());
}

export function onLang(fn: () => void) {
  subs.add(fn);
  return () => {
    subs.delete(fn);
  };
}

export function t(phrase: string): string {
  const pack = DICT[storedLang()];
  return pack?.[phrase] || phrase;
}

export function bootLang() {
  paintLang(storedLang());
}
