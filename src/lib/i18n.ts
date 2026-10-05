import { CHROME_RU, CHROME_UK } from "../data/i18n-chrome.ts";
import { EXTRA_AR, EXTRA_ES, EXTRA_FA, EXTRA_RW, EXTRA_TI, SIMPLE, WALL_AR, WALL_ES, WALL_FA, WALL_RU, WALL_RW, WALL_TI, WALL_UK } from "../data/i18n-extra.ts";
import { GLOSS_I18N } from "../data/i18n-glossary.ts";
import { HELP_I18N } from "../data/i18n-help.ts";
import { ensureLangFont, packOf, storedFont } from "./fonts.ts";

export const LANG_KEY = "techworks-lang";

export const LANGS = [
  { id: "en", label: "English", native: "English", short: "EN", dir: "ltr" as const, classLang: true },
  { id: "uk", label: "Ukrainian", native: "Українська", short: "УК", dir: "ltr" as const, classLang: true },
  { id: "ru", label: "Russian", native: "Русский", short: "РУ", dir: "ltr" as const, classLang: true },
  { id: "es", label: "Spanish", native: "Español", short: "ES", dir: "ltr" as const, classLang: true },
  { id: "ar", label: "Arabic", native: "العربية", short: "ع", dir: "rtl" as const, classLang: true },
  { id: "fa-AF", label: "Dari", native: "دری", short: "دری", dir: "rtl" as const, classLang: true },
  { id: "rw", label: "Kinyarwanda", native: "Ikinyarwanda", short: "RW", dir: "ltr" as const, classLang: true },
  { id: "ti", label: "Tigrinya", native: "ትግርኛ", short: "ትግ", dir: "ltr" as const, classLang: true },
] as const;

export type LangId = (typeof LANGS)[number]["id"];
export type HubLang = LangId | "simple";

export const CLASS_LANGS = LANGS.filter((l) => l.classLang);

const HUB_OK = new Set<string>([...LANGS.map((l) => l.id), "simple", "fa"]);

const SHARED_KEY: Record<string, string> = {
  Home: "home",
  "Sign in": "signIn",
  Settings: "settings",
  Play: "play",
  Pause: "pause",
  Resume: "resume",
  Retry: "retry",
  Exit: "exit",
  Sound: "sound",
  Music: "music",
  Volume: "volume",
  Next: "next",
  Back: "back",
  Help: "help",
  "What's new": "whatsNew",
  Scores: "scores",
  Levels: "levels",
  Language: "language",
};

const DICT: Record<LangId, Record<string, string>> = {
  en: {},
  uk: { ...WALL_UK, ...CHROME_UK },
  ru: { ...WALL_RU, ...CHROME_RU },
  es: { ...EXTRA_ES, ...WALL_ES },
  ar: { ...EXTRA_AR, ...WALL_AR },
  "fa-AF": { ...EXTRA_FA, ...WALL_FA },
  rw: { ...EXTRA_RW, ...WALL_RW },
  ti: { ...EXTRA_TI, ...WALL_TI },
};

function normalize(raw: string | null | undefined): HubLang | null {
  if (!raw || !HUB_OK.has(raw)) return null;
  if (raw === "fa") return "fa-AF";
  return raw as HubLang;
}

export function classicOn(): boolean {
  if (typeof window === "undefined") return false;
  const q = new URLSearchParams(window.location.search);
  return q.get("theme") === "classic" || q.get("hub") === "classic";
}

export function readHubLang(): HubLang | null {
  if (typeof window === "undefined" || classicOn()) return classicOn() ? "en" : null;
  const q = normalize(new URLSearchParams(window.location.search).get("lang"));
  if (q) return q;
  const hash = window.location.hash || "";
  const m = hash.match(/(?:^#|&)kp=([^&]+)/);
  if (m) {
    try {
      const parts = decodeURIComponent(m[1]).split(".");
      const fromCode = parts.length >= 7 ? normalize(parts[6]) : null;
      if (fromCode) return fromCode;
    } catch {
      /* ignore a bad hash */
    }
  }
  const prefs = (window as Window & { KulibertPrefs?: { lang?: string } }).KulibertPrefs;
  return normalize(prefs?.lang ?? null);
}

export function storedLang(): LangId {
  try {
    if (typeof window === "undefined") return "en";
    if (classicOn()) return "en";
    const hub = readHubLang();
    if (hub && hub !== "simple") return hub;
    const v = window.localStorage.getItem(LANG_KEY);
    const local = normalize(v);
    return local && local !== "simple" ? local : "en";
  } catch {
    return "en";
  }
}

export function copyMode(): HubLang {
  if (typeof document !== "undefined" && document.documentElement.dataset.lang === "simple") return "simple";
  return storedLang();
}

export function langOf(id: LangId) {
  return LANGS.find((l) => l.id === id) ?? LANGS[0];
}

const subs = new Set<() => void>();

export function lang(): LangId {
  return storedLang();
}

function paintCyrillicFallback() {
  if (typeof document === "undefined") return;
  ensureLangFont("noto");
  const pack = packOf(storedFont());
  if (pack.id === "noto" || pack.id === "naskh") return;
  const root = document.documentElement;
  root.style.setProperty("--font-sans", `"Noto Sans", ${pack.sans}`);
  root.style.setProperty("--font-display", `"Noto Sans", ${pack.display}`);
}

function paintRtlFallback() {
  if (typeof document === "undefined") return;
  ensureLangFont("naskh");
  const pack = packOf(storedFont());
  const root = document.documentElement;
  root.style.setProperty("--font-sans", `var(--kp-font), "Noto Sans Arabic", ${pack.sans}`);
  root.style.setProperty("--font-display", `var(--kp-font), "Noto Sans Arabic", ${pack.display}`);
}

function paintEthiopic() {
  if (typeof document === "undefined") return;
  ensureEthiopic();
  const root = document.documentElement;
  root.style.setProperty("--font-sans", `var(--kp-font), "Noto Sans Ethiopic", "Noto Sans", system-ui, sans-serif`);
  root.style.setProperty("--font-display", `var(--kp-font), "Noto Sans Ethiopic", "Noto Sans", system-ui, sans-serif`);
}

function ensureEthiopic() {
  if (typeof document === "undefined" || document.getElementById("tw-font-ethiopic")) return;
  const l = document.createElement("link");
  l.id = "tw-font-ethiopic";
  l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Noto+Sans+Ethiopic:wght@400;600;700&display=swap";
  document.head.appendChild(l);
}

function restoreFont() {
  if (typeof document === "undefined") return;
  const pack = packOf(storedFont());
  const root = document.documentElement;
  root.style.setProperty("--font-sans", `var(--kp-font), ${pack.sans}`);
  root.style.setProperty("--font-display", `var(--kp-font), ${pack.display}`);
}

export function paintLang(id: HubLang = storedLang()) {
  if (typeof document === "undefined") return;
  const simple = id === "simple";
  const langId: LangId = simple ? "en" : id;
  const row = langOf(langId);
  document.documentElement.lang = simple ? "en" : langId;
  document.documentElement.dir = simple ? "ltr" : row.dir;
  document.documentElement.dataset.lang = simple ? "simple" : langId;
  if (langId === "uk" || langId === "ru") paintCyrillicFallback();
  else if (langId === "ar" || langId === "fa-AF") paintRtlFallback();
  else if (langId === "ti") paintEthiopic();
  else restoreFont();
}

export function commitLang(id: HubLang) {
  const stored = id === "simple" ? "en" : id;
  if (typeof window !== "undefined" && !classicOn()) window.localStorage.setItem(LANG_KEY, stored);
  paintLang(classicOn() ? "en" : id);
  subs.forEach((fn) => fn());
}

export function onLang(fn: () => void) {
  subs.add(fn);
  return () => {
    subs.delete(fn);
  };
}

function sharedLine(phrase: string, id: HubLang): string {
  const key = SHARED_KEY[phrase];
  if (!key || typeof window === "undefined") return "";
  const api = (window as Window & { KulibertI18n?: { t?: (k: string) => string } }).KulibertI18n;
  const line = api?.t?.(key) || "";
  if (!line || line === key) return "";
  if (id === "en" || id === "simple") return line;
  return line;
}

const PASS_NOTE = "Staff now sign in with a phone passkey or a code. Kids sign in again once. The phone menu scrolls and Admin is always in reach.";
const CLEAN_NOTE = "Cleanup no longer covers the Menu. The Menu button stays on the cleanup screen.";
const LOGO_NOTE = "The TechWorks logo is the real lockup again.";
const HUB_NOTE = "My settings works inside the Hub too.";
const REST = "Sign-in is resting. Tell Mr. K.";
const MENU_NOTE = "The Menu opens below the top bar. My settings is in the Menu.";
const BAR: Record<LangId, Record<string, string>> = {
  en: {},
  uk: {
    [PASS_NOTE]: "Персонал входить ключем телефону або кодом. Діти входять ще раз. Меню на телефоні гортається, і Адмін завжди під рукою.",
    [CLEAN_NOTE]: "Прибирання більше не ховає меню. Кнопка меню лишається на екрані прибирання.",
    [LOGO_NOTE]: "Логотип TechWorks знову справжній.",
    [REST]: "Вхід відпочиває. Скажи пану К.",
    [HUB_NOTE]: "Мої налаштування працюють і всередині Хаба.",
    [MENU_NOTE]: "Меню відкривається під верхньою смугою. Мої налаштування є в меню.",
    "My settings": "Мої налаштування",
    Close: "Закрити",
  },
  ru: {
    [PASS_NOTE]: "Сотрудники входят ключом телефона или кодом. Дети входят ещё раз. Меню на телефоне листается, и Админ всегда рядом.",
    [CLEAN_NOTE]: "Уборка больше не закрывает меню. Кнопка меню остаётся на экране уборки.",
    [LOGO_NOTE]: "Логотип TechWorks снова настоящий.",
    [REST]: "Вход отдыхает. Скажи мистеру К.",
    [HUB_NOTE]: "Мои настройки работают и внутри Хаба.",
    [MENU_NOTE]: "Меню открывается под верхней полосой. Мои настройки — в меню.",
    "My settings": "Мои настройки",
    Close: "Закрыть",
  },
  es: {
    [PASS_NOTE]: "El personal entra con una llave del teléfono o un código. Los chicos entran otra vez. El menú del teléfono se desplaza y Admin siempre está a mano.",
    [CLEAN_NOTE]: "La limpieza ya no tapa el menú. El botón Menú se queda en la pantalla de limpieza.",
    [LOGO_NOTE]: "El logo de TechWorks vuelve a ser el de verdad.",
    [REST]: "La entrada descansa. Dile al Sr. K.",
    [HUB_NOTE]: "Mis ajustes también funcionan dentro del Hub.",
    [MENU_NOTE]: "El menú se abre bajo la barra de arriba. Mis ajustes están en el menú.",
    "My settings": "Mis ajustes",
    Close: "Cerrar",
  },
  ar: {
    [PASS_NOTE]: "المعلمون يدخلون بمفتاح الهاتف أو برمز. الطلاب يدخلون مرة أخرى. قائمة الهاتف تتحرك والمدير دائماً في المتناول.",
    [CLEAN_NOTE]: "الترتيب لم يعد يغطي القائمة. زر القائمة يبقى على شاشة الترتيب.",
    [LOGO_NOTE]: "شعار TechWorks عاد إلى الشعار الأصلي.",
    [REST]: "الدخول يرتاح. أخبر السيد ك.",
    [HUB_NOTE]: "إعداداتي تعمل داخل المحور أيضاً.",
    [MENU_NOTE]: "القائمة تفتح تحت الشريط العلوي. إعداداتي في القائمة.",
    "My settings": "إعداداتي",
    Close: "إغلاق",
  },
  "fa-AF": {
    [PASS_NOTE]: "کارکنان با کلید تلفن یا کود وارد می‌شوند. شاگردان یک بار دیگر وارد می‌شوند. فهرست تلفن حرکت می‌کند و مدیر همیشه در دسترس است.",
    [CLEAN_NOTE]: "پاک‌کاری دیگر فهرست را نمی‌پوشاند. دکمهٔ فهرست روی صفحهٔ پاک‌کاری می‌ماند.",
    [LOGO_NOTE]: "نشان TechWorks دوباره همان نشان اصلی است.",
    [REST]: "ورود آرام است. به آقای ک بگویید.",
    [HUB_NOTE]: "تنظیمات من در هاب هم کار می‌کند.",
    [MENU_NOTE]: "فهرست زیر نوار بالا باز می‌شود. تنظیمات من در فهرست است.",
    "My settings": "تنظیمات من",
    Close: "بستن",
  },
  rw: {
    [PASS_NOTE]: "Abakozi binjira n'urufunguzo rw'iterefone cyangwa kode. Abana binjira incuro imwe. Ibikubiyemo by'iterefone birasokoroka kandi Admin iri hafi.",
    [CLEAN_NOTE]: "Isuku ntikubuza menu. Buto ya Menu iguma ku rupapuro rw'isuku.",
    [LOGO_NOTE]: "Ikirango cya TechWorks cyaragarutse nk'icy'ukuri.",
    [REST]: "Kwinjira kiraruhuka. Bwira Bwana K.",
    [HUB_NOTE]: "Igenamiterere ryanjye rikora no mu Hub.",
    [MENU_NOTE]: "Ibikubiyemo bifunguka munsi y'umurongo wo hejuru. Igenamiterere ryanjye riri mu bikubiyemo.",
    "My settings": "Igenamiterere ryanjye",
    Close: "Funga",
  },
  ti: {
    [PASS_NOTE]: "ሰራሕተኛታት ብመፍትሕ ተሌፎን ወይ ቁጽሪ ይኣትዉ። ቆልዑ ደጊሞም ይኣትዉ። ናይ ተሌፎን ዝርዝር ይንቀሳቐስ፣ ኣድሚን ድማ ኩሉ ግዜ ኣብ ኢድ ኣሎ።",
    [CLEAN_NOTE]: "ጽሬት ዝርዝር ኣይሽፍን። ናይ ዝርዝር መልጎም ኣብ ገጽ ጽሬት ይቕመጥ።",
    [LOGO_NOTE]: "ናይ TechWorks ምልክት ነቲ ናይ ቀደም ምልክት ተመሊሱ።",
    [REST]: "ምእታው ይዕርፍ ኣሎ። ንሚስተር ኬ ንገሮ።",
    [HUB_NOTE]: "ናተይ ቅንጅት ኣብ ውሽጢ ሃብ እውን ይሰርሕ።",
    [MENU_NOTE]: "ዝርዝር ኣብ ትሕቲ ናይ ላዕሊ መስመር ይኽፈት። ናተይ ቅንጅት ኣብ ዝርዝር ኣሎ።",
    "My settings": "ናተይ ቅንጅት",
    Close: "ዕጸው",
  },
};

const PICK = "Let\u2019s pick";
const GOT = "you\u2019ve got this";
const HALL_NEWS = "Study Hall speaks your language, and the Dari clean-up screen is in Dari.";
const HALL: Record<LangId, Record<string, string>> = {
  en: {},
  uk: {
    [HALL_NEWS]: "Навчальна зала говорить вашою мовою, а екран прибирання дарі — дарі.",
    "Study Hall": "Навчальна зала",
    "Study Hall Today": "Зала сьогодні",
    "Productive or peaceful.": "Працюй або тихо.",
    "Work, rest quietly, or both. Kind voices. Calm bodies.": "Працюй, тихо відпочивай, або і те й те. Добрі голоси. Спокійні тіла.",
    "Helper this week": "Помічник тижня",
    [PICK]: "Оберемо",
    "Tap Fair, XP, or Draw": "Торкнись Чесно, XP або Жереб",
    "Watch the draw. Be ready if your name pops.": "Дивись жереб. Будь готовий, якщо вигулькне твоє ім’я.",
    "Still time": "Ще є час",
    "to shine": "щоб сяяти",
    "With us": "З нами",
    [GOT]: "ти впораєшся",
    "With someone else": "З кимось іншим",
    "Pack up": "Збирайся",
    "Hall next": "Зала далі",
    "Five-minute glow": "П’ять хвилин",
    "Hang tight": "Зачекай",
    "Line leader · one job, kind voice": "Черговий · одна справа, добрий голос",
    Fair: "Чесно",
    Draw: "Жереб",
    helper: "помічник",
    reset: "наново",
  },
  ru: {
    [HALL_NEWS]: "Учебный зал говорит на твоём языке, а уборка дари — на дари.",
    "Study Hall": "Учебный зал",
    "Study Hall Today": "Зал сегодня",
    "Productive or peaceful.": "Работай или тихо.",
    "Work, rest quietly, or both. Kind voices. Calm bodies.": "Работай, тихо отдыхай или и то и другое. Добрые голоса. Спокойные тела.",
    "Helper this week": "Помощник недели",
    [PICK]: "Выберем",
    "Tap Fair, XP, or Draw": "Нажми Честно, XP или Жребий",
    "Watch the draw. Be ready if your name pops.": "Смотри жребий. Будь готов, если всплывёт твоё имя.",
    "Still time": "Ещё есть время",
    "to shine": "чтобы сиять",
    "With us": "С нами",
    [GOT]: "ты справишься",
    "With someone else": "С кем-то ещё",
    "Pack up": "Собирайся",
    "Hall next": "Зал дальше",
    "Five-minute glow": "Пять минут",
    "Hang tight": "Подожди",
    "Line leader · one job, kind voice": "Дежурный · одно дело, добрый голос",
    Fair: "Честно",
    Draw: "Жребий",
    helper: "помощник",
    reset: "заново",
  },
  es: {
    [HALL_NEWS]: "El salón de estudio habla tu idioma, y la pantalla de recoger en darí está en darí.",
    "Study Hall": "Salón de estudio",
    "Study Hall Today": "Salón de hoy",
    "Productive or peaceful.": "Trabaja o en calma.",
    "Work, rest quietly, or both. Kind voices. Calm bodies.": "Trabaja, descansa en silencio, o las dos. Voces amables. Cuerpos en calma.",
    "Helper this week": "Ayudante de la semana",
    [PICK]: "Elijamos",
    "Tap Fair, XP, or Draw": "Toca Justo, XP o Sorteo",
    "Watch the draw. Be ready if your name pops.": "Mira el sorteo. Listo si sale tu nombre.",
    "Still time": "Aún hay tiempo",
    "to shine": "para brillar",
    "With us": "Con nosotros",
    [GOT]: "tú puedes",
    "With someone else": "Con otra persona",
    "Pack up": "Recoge",
    "Hall next": "Luego el salón",
    "Five-minute glow": "Cinco minutos",
    "Hang tight": "Espera un poco",
    "Line leader · one job, kind voice": "Líder de fila · un trabajo, voz amable",
    Fair: "Justo",
    Draw: "Sorteo",
    helper: "ayudante",
    reset: "de nuevo",
  },
  ar: {
    [HALL_NEWS]: "حصة الدراسة تتكلم لغتك، وشاشة الترتيب بالدري صارت دري.",
    "Study Hall": "حصة الدراسة",
    "Study Hall Today": "حصة الدراسة اليوم",
    "Productive or peaceful.": "اعمل أو اهدأ",
    "Work, rest quietly, or both. Kind voices. Calm bodies.": "اعمل، أو استرح بهدوء، أو الاثنان. أصوات لطيفة. أجسام هادئة",
    "Helper this week": "المساعد هذا الأسبوع",
    [PICK]: "نختار",
    "Tap Fair, XP, or Draw": "اضغط عادل أو XP أو سحب",
    "Watch the draw. Be ready if your name pops.": "شاهد السحب. كن جاهزاً إذا ظهر اسمك",
    "Still time": "ما زال وقت",
    "to shine": "لتتألق",
    "With us": "معنا",
    [GOT]: "أنت قادر",
    "With someone else": "مع شخص آخر",
    "Pack up": "اجمع أغراضك",
    "Hall next": "القاعة بعد قليل",
    "Five-minute glow": "خمس دقائق",
    "Hang tight": "انتظر قليلاً",
    "Line leader · one job, kind voice": "قائد الصف · مهمة واحدة وصوت لطيف",
    Fair: "عادل",
    Draw: "سحب",
    helper: "مساعد",
    reset: "من جديد",
  },
  "fa-AF": {
    [HALL_NEWS]: "ساعت مطالعه به زبان شما است، و صفحهٔ پاک‌کاری دری است.",
    "Study Hall": "ساعت مطالعه",
    "Study Hall Today": "ساعت مطالعه امروز",
    "Productive or peaceful.": "مفید یا آرام",
    "Work, rest quietly, or both. Kind voices. Calm bodies.": "کار کنید، آرام استراحت کنید، یا هر دو. صدای مهربان. بدن آرام",
    "Helper this week": "کمک این هفته",
    [PICK]: "انتخاب کنیم",
    "Tap Fair, XP, or Draw": "عادل، XP، یا قرعه را بزنید",
    "Watch the draw. Be ready if your name pops.": "قرعه را ببینید. اگر نام‌تان آمد آماده باشید",
    "Still time": "هنوز وقت است",
    "to shine": "برای درخشیدن",
    "With us": "با ما",
    [GOT]: "تو می‌توانی",
    "With someone else": "با کس دیگر",
    "Pack up": "جمع کنید",
    "Hall next": "بعد دهلیز",
    "Five-minute glow": "پنج دقیقه",
    "Hang tight": "کمی صبر کنید",
    "Line leader · one job, kind voice": "رهبر صف · یک کار، صدای مهربان",
    Fair: "عادل",
    Draw: "قرعه",
    helper: "کمک",
    reset: "از نو",
  },
  rw: {
    [HALL_NEWS]: "Isomo ryo kwiga rivuga ururimi rwawe, n'isuku ya Dari iri mu Dari.",
    "Study Hall": "Isomo ryo kwiga",
    "Study Hall Today": "Isomo ryo kwiga uyu munsi",
    "Productive or peaceful.": "Kora cyangwa wiceceke",
    "Work, rest quietly, or both. Kind voices. Calm bodies.": "Kora, uhurure bucece, cyangwa byombi. Amajwi meza. Imibiri ituze",
    "Helper this week": "Umufasha w'iki cyumweru",
    [PICK]: "Reka duhitamo",
    "Tap Fair, XP, or Draw": "Kanda Ubwunge, XP, cyangwa Itsinda",
    "Watch the draw. Be ready if your name pops.": "Reba itsinda. Witegure niba izina ryawe ribonetse",
    "Still time": "Igihe kiracyariho",
    "to shine": "kugira urabagirane",
    "With us": "Turi kumwe",
    [GOT]: "urabishobora",
    "With someone else": "Uri kumwe n'undi",
    "Pack up": "Tegura ibintu",
    "Hall next": "Urubuga rukurikira",
    "Five-minute glow": "Iminota itanu",
    "Hang tight": "Tegereza gato",
    "Line leader · one job, kind voice": "Umuyobozi w'umurongo · akazi kamwe, ijwi ryiza",
    Fair: "Ubwunge",
    Draw: "Itsinda",
    helper: "umufasha",
    reset: "tangira",
  },
  ti: {
    [HALL_NEWS]: "ናይ መጽናዕቲ ክፍሊ ብቋንቋኻ ይዛረብ፣ ናይ ጽሬት ደሪ ድማ ደሪ እዩ።",
    "Study Hall": "ናይ መጽናዕቲ ክፍሊ",
    "Study Hall Today": "ሎሚ ናይ መጽናዕቲ",
    "Productive or peaceful.": "ስራሕ ወይ ሰላም",
    "Work, rest quietly, or both. Kind voices. Calm bodies.": "ስራሕ፣ ብስክት ዕረፍ، ወይ ክልቲኡ። ሕያው ድምጺ። ርጉእ ኣካላት",
    "Helper this week": "ሓጋዚ ናይዚ ሰሙን",
    [PICK]: "ንመርጽ",
    "Tap Fair, XP, or Draw": "ፍትሒ፣ XP፣ ወይ ዕጫ ጠውቕ",
    "Watch the draw. Be ready if your name pops.": "ነቲ ዕጫ ርአ። ስምካ እንተ ወጽአ ድሉው ኩን",
    "Still time": "ግዜ ኣሎ",
    "to shine": "ንምብራህ",
    "With us": "ምሳና",
    [GOT]: "ትኽእል ኢኻ",
    "With someone else": "ምስ ካልእ",
    "Pack up": "ኣክብ",
    "Hall next": "ድሕሪኡ ኣዳራሽ",
    "Five-minute glow": "ሓሙሽተ ደቒቕ",
    "Hang tight": "ቁሩብ ተጸበ",
    "Line leader · one job, kind voice": "መራሒ መስመር · ሓደ ስራሕ، ሕያው ድምጺ",
    Fair: "ፍትሒ",
    Draw: "ዕጫ",
    helper: "ሓጋዚ",
    reset: "ካብ ሓድሽ",
  },
};

const NEWS = "The clean-up screen speaks your language.";
const CLEAN: Record<LangId, Record<string, string>> = {
  en: {},
  uk: {
    [NEWS]: "Екран прибирання говорить вашою мовою.",
    "Clean up now": "Прибирай зараз",
    Left: "Лишилось",
    "Last bell": "Останній дзвінок",
    Classroom: "Клас",
    "Still in the shop": "Ще в майстерні",
    "Waiting in the room": "Чекають у класі",
    "Tools back on the shadow board": "Інструменти на тіньову дошку",
    "Bits and scrap in the bin": "Обрізки в кошик",
    "Sweep your station": "Підмети своє місце",
    "Goggles hung": "Окуляри на гачок",
    "Project on the shelf — not the bench": "Проєкт на полицю — не на стіл",
    "Chairs in": "Стільці на місце",
    "Desks clear": "Парти чисті",
    "Aisles clear": "Проходи вільні",
    "Sit with your crew": "Сядь зі своєю командою",
    "Ready for the bell": "Готовий до дзвінка",
    Idea: "Ідея",
    "Hall tidy": "Порядок у залі",
  },
  ru: {
    [NEWS]: "Экран уборки говорит на твоём языке.",
    "Clean up now": "Убирай сейчас",
    Left: "Осталось",
    "Last bell": "Последний звонок",
    Classroom: "Класс",
    "Still in the shop": "Ещё в мастерской",
    "Waiting in the room": "Ждут в классе",
    "Tools back on the shadow board": "Инструменты на теневую доску",
    "Bits and scrap in the bin": "Обрезки в корзину",
    "Sweep your station": "Подмети своё место",
    "Goggles hung": "Очки на крючок",
    "Project on the shelf — not the bench": "Проект на полку — не на стол",
    "Chairs in": "Стулья на место",
    "Desks clear": "Парты чистые",
    "Aisles clear": "Проходы свободны",
    "Sit with your crew": "Сядь со своей командой",
    "Ready for the bell": "Готов к звонку",
    Idea: "Идея",
    "Hall tidy": "Порядок в зале",
  },
  es: {
    [NEWS]: "La pantalla de recoger habla tu idioma.",
    "Clean up now": "Recoge ahora",
    Left: "Queda",
    "Last bell": "Último timbre",
    Classroom: "Aula",
    "Still in the shop": "Aún en el taller",
    "Waiting in the room": "Esperando en el aula",
    "Tools back on the shadow board": "Herramientas en el tablero",
    "Bits and scrap in the bin": "Restos en el bote",
    "Sweep your station": "Barre tu puesto",
    "Goggles hung": "Lentes colgados",
    "Project on the shelf — not the bench": "Proyecto en el estante — no en la mesa",
    "Chairs in": "Sillas adentro",
    "Desks clear": "Mesas libres",
    "Aisles clear": "Pasillos libres",
    "Sit with your crew": "Siéntate con tu equipo",
    "Ready for the bell": "Listo para el timbre",
    Idea: "Idea",
    "Hall tidy": "Orden en el salón",
  },
  ar: {
    [NEWS]: "شاشة الترتيب تتكلم لغتك.",
    "Clean up now": "رتّب الآن",
    Left: "بقي",
    "Last bell": "آخر جرس",
    Classroom: "الصف",
    "Still in the shop": "ما زال في الورشة",
    "Waiting in the room": "ينتظر في الغرفة",
    "Tools back on the shadow board": "الأدوات على لوحة الظل",
    "Bits and scrap in the bin": "الفضلات في السلة",
    "Sweep your station": "اكنس مكانك",
    "Goggles hung": "النظارات معلّقة",
    "Project on the shelf — not the bench": "المشروع على الرف — ليس على الطاولة",
    "Chairs in": "الكراسي في الداخل",
    "Desks clear": "الطاولات فارغة",
    "Aisles clear": "الممرات فارغة",
    "Sit with your crew": "اجلس مع فريقك",
    "Ready for the bell": "جاهز للجرس",
    Idea: "فكرة",
    "Hall tidy": "ترتيب القاعة",
    "Chromebooks closed": "الحواسيب مغلقة",
    "Chairs in · floor clear": "الكراسي داخل · الأرض نظيفة",
    "Voices off": "الأصوات هادئة",
    "Line ready": "الصف جاهز",
  },
  "fa-AF": {
    Menu: "فهرست",
    [NEWS]: "صفحهٔ پاک‌کاری به دری است.",
    "Clean up now": "حالا پاک‌کاری کنید",
    Left: "باقی‌مانده",
    "Last bell": "زنگ آخر",
    Classroom: "صنف",
    "Still in the shop": "هنوز در ورکشاپ",
    "Waiting in the room": "منتظر در صنف",
    "Tools back on the shadow board": "ابزار دوباره سر تختهٔ سایه",
    "Bits and scrap in the bin": "ریزه‌ها در سطل",
    "Sweep your station": "جای خود را جارو کنید",
    "Goggles hung": "عینک‌ها آویزان",
    "Project on the shelf — not the bench": "پروژه سر الماری — نه سر میز",
    "Chairs in": "چوکی‌ها داخل",
    "Desks clear": "میزها خالی",
    "Aisles clear": "راه‌ها خالی",
    "Sit with your crew": "با گروپ خود بنشینید",
    "Ready for the bell": "آماده برای زنگ",
    Idea: "فکر",
    "Hall tidy": "دهلیز مرتب",
    "Chromebooks closed": "کروم‌بوک‌ها بسته",
    "Chairs in · floor clear": "چوکی‌ها داخل · فرش پاک",
    "Voices off": "صداها خاموش",
    "Line ready": "صف آماده",
  },
  rw: {
    [NEWS]: "Ikirahure cyo gusukura kivuga ururimi rwawe.",
    "Clean up now": "Sukura ubu",
    Left: "Bisigaye",
    "Last bell": "Inzogera ya nyuma",
    Classroom: "Icyumba",
    "Still in the shop": "Biracyari mu workshop",
    "Waiting in the room": "Bategereje mu cyumba",
    "Tools back on the shadow board": "Ibikoresho ku rubaho rw'igicucu",
    "Bits and scrap in the bin": "Ibisigazwa mu mufuka",
    "Sweep your station": "Kubura",
    "Goggles hung": "Amadarubindi amanitse",
    "Project on the shelf — not the bench": "Umushinga ku kabati — ntabwo ari ku meza",
    "Chairs in": "Intebe imbere",
    "Desks clear": "Ameza atarimo ikintu",
    "Aisles clear": "Inzira zirafunguye",
    "Sit with your crew": "Icara n'itsinda",
    "Ready for the bell": "Witeguye insengera",
    Idea: "Igitekerezo",
    "Hall tidy": "Isuku y'urubuga",
  },
  ti: {
    [NEWS]: "ናይ ጽሬት ስክሪን ብቋንቋኻ ይዛረብ።",
    "Clean up now": "ሕጂ ጽረ",
    Left: "ተሪፉ",
    "Last bell": "ናይ መወዳእታ ደወል",
    Classroom: "ክፍሊ",
    "Still in the shop": "ገና ኣብ ወርክሾፕ",
    "Waiting in the room": "ኣብ ክፍሊ ይጽበ",
    "Tools back on the shadow board": "መሳርሒ ናብ ሰሌዳ ጽላሎት",
    "Bits and scrap in the bin": "ቁርጻራት ኣብ መጻረዪ",
    "Sweep your station": "ቦታኻ ጠርግ",
    "Goggles hung": "መነጽር ሰቕሎም",
    "Project on the shelf — not the bench": "ፕሮጀክት ኣብ መደርደሪ — ኣይኮነን ኣብ ሰደቓ",
    "Chairs in": "ኩርሲ ኣቱ",
    "Desks clear": "መኣዲ ንጹር",
    "Aisles clear": "መንገዲ ንጹር",
    "Sit with your crew": "ምስ ጉጅለኻ ቁመ",
    "Ready for the bell": "ንደወል ድሉው",
    Idea: "ሓሳብ",
    "Hall tidy": "ናይ ኣዳራሽ ጽሬት",
    "Chromebooks closed": "ኮምፒተር ተዓጽዩ",
    "Chairs in · floor clear": "ኩርሲ ኣቱ · መሬት ንጹር",
    "Voices off": "ድምጺ ሕልው",
    "Line ready": "መስመር ድሉው",
  },
};

const LINE = "Menu stays top left in every language, and the last buttons have names.";

const MORE: Record<LangId, Record<string, string>> = {
  en: {},
  uk: {
    "This hour": "Ця година",
    "What's new": "Що нового",
    [LINE]: "Меню лишається зліва в кожній мові, і в останніх кнопок є назви.",
    "choice stations": "станції на вибір",
  },
  ru: {
    "This hour": "Этот час",
    "What's new": "Что нового",
    [LINE]: "Меню остаётся слева на любом языке, и у последних кнопок есть названия.",
    "choice stations": "станции на выбор",
  },
  es: {
    "This hour": "Esta hora",
    "What's new": "Novedades",
    [LINE]: "El menú se queda arriba a la izquierda en cada idioma, y los últimos botones tienen nombre.",
    "choice stations": "estaciones para elegir",
    Drizzle: "Llovizna",
    Overcast: "Nublado",
  },
  ar: {
    "This hour": "هذه الحصة",
    "What's new": "ما الجديد",
    [LINE]: "القائمة تبقى أعلى اليسار في كل لغة، والأزرار الأخيرة لها أسماء.",
    "choice stations": "محطات اختيار",
    Drizzle: "رذاذ",
    Overcast: "غائم",
    Sunshine: "شمس",
    Fair: "صاف",
    Hazy: "غائم قليلاً",
    Rain: "مطر",
    Snow: "ثلج",
    Fog: "ضباب",
    Storm: "عاصفة",
    Showers: "زخات",
    Ice: "جليد",
    Hail: "برد",
    Flurries: "ثلج خفيف",
    Blustery: "ريح",
    Need: "تحتاج",
  },
  "fa-AF": {
    "This hour": "این ساعت",
    "What's new": "چه خبر",
    [LINE]: "منو در هر زبان بالا چپ می‌ماند و دکمه‌های آخر نام دارند.",
    "choice stations": "جای انتخاب",
    Drizzle: "نم‌نم باران",
    Overcast: "ابری",
    Sunshine: "آفتاب",
    Fair: "صاف",
    Hazy: "کمی ابر",
    Rain: "باران",
    Snow: "برف",
    Fog: "مه",
    Storm: "طوفان",
    Showers: "رگبار",
    Ice: "یخ",
    Hail: "ژاله",
    Flurries: "برف ریز",
    Blustery: "باد",
    Need: "ضرورت",
  },
  rw: {
    "This hour": "Iyi saha",
    "What's new": "Ibishya",
    [LINE]: "Ibikubiyemo biguma ibumoso hejuru mu ndimi zose, kandi buto zanyuma zifite amazina.",
    "choice stations": "aho uhitiramo",
    Drizzle: "Imvura yoroheje",
    Overcast: "Ibicu",
  },
  ti: {
    "This hour": "እዚ ሰዓት",
    "What's new": "ሓድሽ",
    [LINE]: "ዝርዝር ኣብ ኩሉ ቋንቋ ኣብ ላዕሊ ጸጋም ይቕመጥ፣ ናይ መወዳእታ መጠወቒታት ድማ ስም ኣለዎም።",
    "choice stations": "ናይ ምምራጽ ቦታታት",
    Drizzle: "ጽንጽዋይ",
    Overcast: "ደመና",
    Sunshine: "ጸሓይ",
    Fair: "ንጹር",
    Hazy: "ዝተሸፈነ",
    Rain: "ዝናብ",
    Snow: "በረድ",
    Fog: "ጉመና",
    Storm: "ዐውሎ",
    Showers: "ዝናብ",
    Ice: "በረድ",
    Hail: "በረድ",
    Flurries: "ንእሽቶ በረድ",
    Blustery: "ንፋስ",
    Need: "የድሊ",
  },
};

export function t(phrase: string, id: HubLang = copyMode()): string {
  const shared = sharedLine(phrase, id);
  if (id === "en") return shared || phrase;
  if (id === "simple") return SIMPLE[phrase] || shared || phrase;
  return BAR[id]?.[phrase] || HALL[id]?.[phrase] || CLEAN[id]?.[phrase] || MORE[id]?.[phrase] || DICT[id]?.[phrase] || shared || phrase;
}

export function articleCopy(id: string, title: string, body: string, langId: LangId = storedLang()): { title: string; body: string } {
  if (langId !== "uk" && langId !== "ru") return { title, body };
  const pack = HELP_I18N[langId][id];
  return pack ?? { title, body };
}

export function glossCopy(id: string, def: string, use: string, langId: LangId = storedLang()): { def: string; use: string } {
  if (langId !== "uk" && langId !== "ru") return { def, use };
  const pack = GLOSS_I18N[langId][id];
  return pack ?? { def, use };
}

const NO_VOICE = new Set(["rw", "ti"]);

export function sayLine(text: string) {
  if (typeof window === "undefined") return;
  const words = text.replace(/\s+/g, " ").trim().slice(0, 180);
  if (!words || classicOn()) return;
  const prefs = (window as Window & { KulibertPrefs?: { say?: (s: string) => void; voiceFor?: (lang: string) => unknown; lang?: string } }).KulibertPrefs;
  if (prefs?.say) {
    prefs.say(words);
    return;
  }
  const langId = copyMode();
  const node = document.getElementById("tw-say") || document.createElement("p");
  node.id = "tw-say";
  node.setAttribute("role", "status");
  const quiet = NO_VOICE.has(langId) || !window.speechSynthesis;
  node.textContent = quiet ? `${words} ${t("No voice yet", langId)}` : words;
  if (!node.parentElement) document.body.appendChild(node);
  if (quiet || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(words);
    u.lang = langId === "simple" ? "en-US" : langId;
    window.speechSynthesis.speak(u);
  } catch {
    node.textContent = `${words} ${t("No voice yet", langId)}`;
  }
}

function applyIncoming(raw: string | null | undefined) {
  const next = classicOn() ? "en" : normalize(raw);
  if (!next) return;
  commitLang(next);
}

export function bootLang() {
  const hub = readHubLang();
  paintLang(classicOn() ? "en" : hub ?? storedLang());
  if (typeof window === "undefined" || (window as Window & { __twLang?: number }).__twLang) return;
  (window as Window & { __twLang?: number }).__twLang = 1;
  window.addEventListener("kulibert-lang", (ev) => {
    const detail = (ev as CustomEvent<{ lang?: string }>).detail;
    applyIncoming(detail?.lang);
  });
  window.addEventListener("hashchange", () => applyIncoming(readHubLang()));
  window.addEventListener("message", (ev) => {
    const data = ev.data as { type?: string; lang?: string } | null;
    if (!data || (data.type !== "kulibert-lang" && data.type !== "kw-lang")) return;
    applyIncoming(data.lang);
  });
  const root = document.documentElement;
  if (window.MutationObserver) {
    new MutationObserver(() => {
      const attr = root.getAttribute("data-kp-lang");
      if (attr && attr !== root.dataset.lang) applyIncoming(attr);
    }).observe(root, { attributes: true, attributeFilter: ["data-kp-lang"] });
  }
}