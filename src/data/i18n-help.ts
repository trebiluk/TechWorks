/** Wall Help at grade-6 reading. Shop words stay English. */

export type HelpBit = { title: string; body: string };

export const HELP_I18N: Record<"uk" | "ru" | "es" | "ar" | "fa-AF" | "rw" | "ti" | "simple", Record<string, HelpBit>> = {
  uk: {
    "welcome-levels": {
      title: "Рівні вміння 1–4",
      body: "Рівні вміння: 1 = Beginning, потрібен показ. 2 = Developing, може з перевіркою. 3 = Proficient, сам, норма є. 4 = Distinguished, може навчити товариша.",
    },
    "welcome-what": {
      title: "Що таке TechWorks?",
      body: "TechWorks — клас технологій містера Куліберта. Це майстерня, яку видно всім. Ти працюєш у малій команді. Ти вчишся міряти, різати, обробляти і ділитися. Золото (XP) — за вміння. Це головне. Гроші класу — гра за роботу. Це не оцінка. На стіні — шкільні імена, не паспортні. Так безпечно дивитись разом.",
    },
    "welcome-day": {
      title: "Урок у чотири кроки",
      body: "1) Увійди і сядь зі своєю командою. 2) Слухай завдання дня — питай по суті. 3) Робота команди: будуй, малюй, шліфуй, плануй. 4) Прибери: інструменти, обрізки, стільці. Коли стіна стає кораловою — це останній крок. Берті показує роботу. Якщо ти допомагаєш більше — можна отримати бонус, не XP.",
    },
    "welcome-numbers": {
      title: "Що значать числа",
      body: "Золото = XP за вміння. Ти стаєш кращим у справі. $ = бонуси класу. Це гра. Їх можна витратити в крамниці. Лідер команди ставить 3 (на роботі), 2 (треба підказка) або 1 (не з командою). Сімейний звіт — оцінка проєкту простими словами. Гаманець і Lucky Bench туди не йдуть.",
    },
    "welcome-people": {
      title: "Хто що робить",
      body: "Ти: будуй, прибирай, допомагай товаришу. Лідер команди: ставить 3 / 2 / 1 тільки на цей урок. Учитель: справжні оцінки, вміння, крамниця. Родина: відкрий ім’я → Family, щоб побачити звіт. Паспортне ім’я не повинно бути на проєкторі.",
    },
    "welcome-help": {
      title: "Для кого ця допомога",
      body: "Учні: Вітання і Стіна. Лідери команди: Ролі → Лідер команди. Родина: натисни ім’я → Family, або напиши Family в пошуку. Учитель: Старт, Урок, Deck, Оцінка, Admin. Заміна: не відкривай цей застосунок. Допомога є в Меню, внизу.",
    },
    "wall-read": {
      title: "Як читати цю дошку",
      body: "Це стіна класу. Імена тут — шкільні, не паспортні. Золоті числа — XP за вміння. $ — бонуси, гра. Кільце — скільки хвилин лишилось. Корал — час прибирати: інструменти, стільці, підлога.",
    },
    "wall-teach": {
      title: "Дошка і Урок",
      body: "Дошка висить увесь день: завдання, розклад, школа. Урок — коли вчитель стоїть перед класом. Велике «Зроби це зараз» і слоти уроку. Ті самі інструменти на обох (таймер, вибрати учня, вибрати команду). Відкрий Урок, щоб показати чи сховати слоти.",
    },
    "wall-menu": {
      title: "Меню (Dash · Learn · Crew · Admin)",
      body: "Внизу чотири кнопки. Dash — стіна. Learn — книга, проєкти, вміння, слова. Crew — команда (код). Admin — стіл учителя (PIN). Це одне меню на стіні і на телефоні. Admin — це кнопка 🛠️ внизу Меню. Вона питає PIN учителя.",
    },
    "wall-polls": {
      title: "Живі опити",
      body: "Учитель відкриває опит (Так/Ні, A–D, 1–4). Стіна показує стовпчики. Імен немає. Команда натискає на планшеті. Закрити і зберегти — лишає історію. Опит не змінює оцінки, XP чи гроші.",
    },
    "wall-xp": {
      title: "XP, бонуси і акції",
      body: "XP приходить від умінь майстерні (Beginning → Distinguished). $ бонуси — за роботу мінус крамниця. Акції — окрема гра. Сімейний звіт — оцінка проєкту, не гаманець.",
    },
    "wall-effort": {
      title: "3, 2, 1 — що ставить лідер",
      body: "3 = робиш справу. 2 = треба підказка. 1 = не з командою. Absent / Excused / Personal — тебе немає. Це не оцінка вміння. 4 (Distinguished) ставить тільки вчитель.",
    },
    "wall-week": {
      title: "Гонка тижня",
      body: "Dash → Тиждень. Класи і команди змагаються за вчорашню роботу. Сьогодні ще йде — його немає на табло. 3 — повна частка. A/E не шкодять. Золотий клас — лідер майстерні. Золота команда — перша. Тримай місце. Рядки погоні кажуть, наскільки ти позаду.",
    },
    "wall-skills": {
      title: "Рівні вміння 1–4",
      body: "Вміння: учитель торкається тебе і ставить рівень. 1️⃣ Beginning — потрібен показ. 2️⃣ Developing — можу з перевіркою. 3️⃣ Proficient — сам, норма є. 4️⃣ Distinguished — можу навчити товариша. Ціль — 3.",
    },
    "wall-family": {
      title: "Сімейний звіт",
      body: "Відкрий учня (натисни ім’я) → Family. Одна оцінка проєкту. Вміння простими словами. Час у класі є, але не входить у середню оцінку. Бонуси і акції на цей лист не йдуть.",
    },
    "wall-berty": {
      title: "BertyBot",
      body: "Берті — маскот майстерні. Махає на ENTER, думає на LISTEN, стоїть на CREW WORK, показує на CLEAN UP і між уроками, радіє SHARE. Прибирання і перерва завжди показують його. Урок використовує ті самі пози.",
    },
    "wall-cleanup": {
      title: "Прибрати",
      body: "Останні п’ять хвилин: кораловий екран. Берті показує роботу. Майстерня: інструменти, обрізки, місця. Клас: стільці і проходи. Якщо допомагаєш більше — можна бонус, не XP. Між уроками Берті показує ENTER → LISTEN → CREW WORK → CLEAN UP.",
    },
    "dash-teach": {
      title: "Режим уроку",
      body: "Дошка → Урок. Велике «Зроби це зараз» іде за дзвінком: Увійди, Слухай, Робота, Прибери. Слоти тягнуться на весь урок. Прибирання завжди перемагає. Імен на цій стіні немає.",
    },
    "dash-public": {
      title: "Проєктор",
      body: "Вбудована стіна показує тільки дошку: шкільні імена і XP або бонуси. Коралове ПРИБРАТИ в останні 5 хвилин. Немає столу вчителя. Немає прізвищ.",
    },
    "dash-tools": {
      title: "Інструменти на стіні",
      body: "Відкрий → Інструменти. Таймер, вибрати учня (шкільне ім’я), вибрати команду. Вимкни, щоб сховати. Імена — шкільні.",
    },
    "roles-crew": {
      title: "Шлях лідера команди",
      body: "PIN 2222, тільки цей урок. Привіт, Team Leader. Натисни 3 / 2 / 1 або Absent / Excused / Personal. Далі команда йде сама. Ти не чіпаєш гаманець і оцінки.",
    },
    "roles-worker": {
      title: "Шлях учня",
      body: "Читай стіну: золото — XP, $ — бонуси. Натисни своє шкільне ім’я для сімейного листа. Корал = прибрати. Ти не вводиш гроші.",
    },
    "roles-family": {
      title: "Шлях родини",
      body: "Профіль → Family. Одна оцінка проєкту. Вміння словами. Без гаманця, акцій і Lucky Bench.",
    },
    "wall-jobs": {
      title: "Роботи на стіні",
      body: "Два списки. Agenda — робота уроку. Cleanup — кораловий список (інструменти чи стільці). Need (окуляри / матеріал) видно на вході.",
    },
    "wall-looks": {
      title: "Вигляд стіни",
      body: "Вигляд міняє фарбу стіни. Shop wall — звичний синій. Back row — більші літери. Святкові вигляди — для веселих днів. Твої бали лишаються. Золото — XP. Корал — прибрати. Верхні кнопки (Help, Lock, Web) працюють.",
    },
    "chrome-hud": {
      title: "Верхня панель",
      body: "Верхня смуга — один ряд. Wall · Teach · Deck · Week · Club · Hall лишаються. More (кишеня) ховає Fake data, Find, NOW, Lock, Cog, Help, Web і мову — натисни, не наводь. Теми не можуть закрити ці кнопки.",
    },
    "period-now": {
      title: "Уроки і годинник",
      body: "NOW — живий урок. Фішки періодів ведуть на ту годину. P6 — Study Hall. Корал — прибрати.",
    },
    "wall-lang": {
      title: "Англійська, українська, російська",
      body: "Глобус біля знака питання. Ця чверть: англійська, українська, російська. Обери мову. Допомога і Слова читаються на рівні 6 класу. Слова майстерні (kerf, grit, XP) лишаються англійською — так ти їх вчиш. Учитель → Тема → Мова ще має Cubano, арабську і фарсі, якщо треба.",
    },
  },
  ru: {
    "welcome-levels": {
      title: "Уровни умения 1–4",
      body: "Уровни умения: 1 = Beginning, нужен показ. 2 = Developing, может с проверкой. 3 = Proficient, сам, норма есть. 4 = Distinguished, может научить товарища.",
    },
    "welcome-what": {
      title: "Что такое TechWorks?",
      body: "TechWorks — класс технологий мистера Кулиберта. Это мастерская, которую видно всем. Ты работаешь в маленькой команде. Ты учишься мерить, резать, обрабатывать и делиться. Золото (XP) — за умение. Это главное. Деньги класса — игра за работу. Это не оценка. На стене — школьные имена, не паспортные. Так безопасно смотреть вместе.",
    },
    "welcome-day": {
      title: "Урок в четыре шага",
      body: "1) Войди и сядь со своей командой. 2) Слушай задание дня — спрашивай по делу. 3) Работа команды: строй, рисуй, шлифуй, планируй. 4) Убери: инструменты, обрезки, стулья. Когда стена становится коралловой — это последний шаг. Берти показывает работу. Если ты помогаешь больше — можно бонус, не XP.",
    },
    "welcome-numbers": {
      title: "Что значат числа",
      body: "Золото = XP за умение. Ты становишься лучше в деле. $ = бонусы класса. Это игра. Их можно потратить в лавке. Лидер команды ставит 3 (на работе), 2 (нужна подсказка) или 1 (не с командой). Семейный отчёт — оценка проекта простыми словами. Кошелёк и Lucky Bench туда не идут.",
    },
    "welcome-people": {
      title: "Кто что делает",
      body: "Ты: строй, убирай, помогай товарищу. Лидер команды: ставит 3 / 2 / 1 только на этот урок. Учитель: настоящие оценки, навыки, лавка. Семья: открой имя → Family, чтобы увидеть отчёт. Паспортное имя не должно быть на проекторе.",
    },
    "welcome-help": {
      title: "Для кого эта справка",
      body: "Ученики: Приветствие и Стена. Лидеры команды: Роли → Лидер команды. Семья: нажми имя → Family или напиши Family в поиске. Учитель: Старт, Урок, Deck, Оценка, Admin. Замена: не открывай это приложение. Справка в Меню, внизу.",
    },
    "wall-read": {
      title: "Как читать эту доску",
      body: "Это стена класса. Имена здесь — школьные, не паспортные. Золотые числа — XP за умение. $ — бонусы, игра. Кольцо — сколько минут осталось. Коралл — время убирать: инструменты, стулья, пол.",
    },
    "wall-teach": {
      title: "Доска и Урок",
      body: "Доска висит весь день: задания, расписание, школа. Урок — когда учитель стоит перед классом. Большое «Сделай это сейчас» и слоты урока. Те же инструменты на обоих (таймер, выбрать ученика, выбрать команду).",
    },
    "wall-menu": {
      title: "Меню (Dash · Learn · Crew · Admin)",
      body: "Внизу четыре кнопки. Dash — стена. Learn — книга, проекты, навыки, слова. Crew — команда (код). Admin — стол учителя (PIN). Это одно меню на стене и на телефоне. Admin — это кнопка 🛠️ внизу Меню. Она спрашивает PIN учителя.",
    },
    "wall-polls": {
      title: "Живые опросы",
      body: "Учитель открывает опрос (Да/Нет, A–D, 1–4). Стена показывает столбики. Имён нет. Команда нажимает на планшете. Закрыть и сохранить — оставляет историю. Опрос не меняет оценки, XP или деньги.",
    },
    "wall-xp": {
      title: "XP, бонусы и акции",
      body: "XP приходит от навыков мастерской (Beginning → Distinguished). $ бонусы — за работу минус лавка. Акции — отдельная игра. Семейный отчёт — оценка проекта, не кошелёк.",
    },
    "wall-effort": {
      title: "3, 2, 1 — что ставит лидер",
      body: "3 = делаешь дело. 2 = нужна подсказка. 1 = не с командой. Absent / Excused / Personal — тебя нет. Это не оценка навыка. 4 (Distinguished) ставит только учитель.",
    },
    "wall-week": {
      title: "Гонка недели",
      body: "Dash → Неделя. Классы и команды соревнуются за вчерашнюю работу. Сегодня ещё идёт — его нет на табло. 3 — полная доля. A/E не вредят. Золотой класс — лидер мастерской. Золотая команда — первая. Держи место.",
    },
    "wall-skills": {
      title: "Уровни умения 1–4",
      body: "Умения: учитель нажимает на тебя и ставит уровень. 1️⃣ Beginning — нужен показ. 2️⃣ Developing — могу с проверкой. 3️⃣ Proficient — сам, норма есть. 4️⃣ Distinguished — могу научить товарища. Цель — 3.",
    },
    "wall-family": {
      title: "Семейный отчёт",
      body: "Открой ученика (нажми имя) → Family. Одна оценка проекта. Навыки простыми словами. Время в классе есть, но не входит в среднюю оценку. Бонусы и акции на этот лист не идут.",
    },
    "wall-berty": {
      title: "BertyBot",
      body: "Берти — маскот мастерской. Машет на ENTER, думает на LISTEN, стоит на CREW WORK, указывает на CLEAN UP и между уроками, радуется SHARE. Уборка и перемена всегда показывают его.",
    },
    "wall-cleanup": {
      title: "Убрать",
      body: "Последние пять минут: коралловый экран. Берти показывает работу. Мастерская: инструменты, обрезки, места. Класс: стулья и проходы. Если помогаешь больше — можно бонус, не XP.",
    },
    "dash-teach": {
      title: "Режим урока",
      body: "Доска → Урок. Большое «Сделай это сейчас» идёт за звонком: Войди, Слушай, Работа, Убери. Слоты тянутся на весь урок. Уборка всегда побеждает. Имён на этой стене нет.",
    },
    "dash-public": {
      title: "Проектор",
      body: "Встроенная стена показывает только доску: школьные имена и XP или бонусы. Коралловое УБРАТЬ в последние 5 минут. Нет стола учителя. Нет фамилий.",
    },
    "dash-tools": {
      title: "Инструменты на стене",
      body: "Открой → Инструменты. Таймер, выбрать ученика (школьное имя), выбрать команду. Выключи, чтобы спрятать. Имена — школьные.",
    },
    "roles-crew": {
      title: "Путь лидера команды",
      body: "PIN 2222, только этот урок. Привет, Team Leader. Нажми 3 / 2 / 1 или Absent / Excused / Personal. Дальше команда идёт сама. Ты не трогаешь кошелёк и оценки.",
    },
    "roles-worker": {
      title: "Путь ученика",
      body: "Читай стену: золото — XP, $ — бонусы. Нажми своё школьное имя для семейного листа. Коралл = убрать. Ты не вводишь деньги.",
    },
    "roles-family": {
      title: "Путь семьи",
      body: "Профиль → Family. Одна оценка проекта. Навыки словами. Без кошелька, акций и Lucky Bench.",
    },
    "wall-jobs": {
      title: "Работы на стене",
      body: "Два списка. Agenda — работа урока. Cleanup — коралловый список (инструменты или стулья). Need (очки / материал) видно на входе.",
    },
    "wall-looks": {
      title: "Вид стены",
      body: "Вид меняет краску стены. Shop wall — обычный синий. Back row — буквы крупнее. Праздничные виды — для весёлых дней. Твои баллы остаются. Золото — XP. Коралл — убрать. Верхние кнопки (Help, Lock, Web) работают.",
    },
    "chrome-hud": {
      title: "Верхняя панель",
      body: "Верхняя полоса — один ряд. Wall · Teach · Deck · Week · Club · Hall остаются. More (карман) прячет Fake data, Find, NOW, Lock, Cog, Help, Web и язык — нажми, не наводи. Темы не могут закрыть эти кнопки.",
    },
    "period-now": {
      title: "Уроки и часы",
      body: "NOW — живой урок. Фишки периодов ведут на тот час. P6 — Study Hall. Коралл — убрать.",
    },
    "wall-lang": {
      title: "Английский, украинский, русский",
      body: "Глобус рядом со знаком вопроса. Эта четверть: английский, украинский, русский. Выбери язык. Помощь и Слова читаются на уровне 6 класса. Слова мастерской (kerf, grit, XP) остаются на английском — так ты их учишь. Учитель → Тема → Язык ещё имеет Cubano, арабский и фарси, если нужно.",
    },
  },
  es: {
    "welcome-levels": {
      title: "Niveles de destreza 1–4",
      body: "Niveles de destreza: 1 = Beginning, necesita una muestra. 2 = Developing, puede hacerlo con una revisión. 3 = Proficient, lo hace solo y cumple la meta. 4 = Distinguished, puede enseñar a un compañero.",
    },
    "welcome-what": {
      title: "¿Qué es TechWorks?",
      body: "TechWorks es la clase de taller del Sr. Kulibert. Trabajas en un equipo pequeño. Practicas medir, cortar, acabar y compartir. El oro (XP) significa que mejoraste. Eso es lo importante. El dinero de clase es un juego. No es tu nota. Los nombres de la pared son alias, no nombres legales.",
    },
    "welcome-day": {
      title: "Una clase en cuatro pasos",
      body: "1) Entra y siéntate con tu equipo. 2) Escucha la meta del día y haz una pregunta de verdad. 3) Trabajo de equipo: construye, dibuja, lija, planea. 4) Limpieza: herramientas, restos, sillas. Si la pared se pone coral, ese paso es ahora. Berty señala los trabajos. Ayudar de más puede dar un premio, no XP.",
    },
    "welcome-numbers": {
      title: "Qué significan los números",
      body: "Oro = XP de destreza. Vas mejorando en el oficio. $ = premios de clase, un juego. El líder del equipo marca 3 (en el trabajo), 2 (necesita un empujón) o 1 (no está con el equipo). El informe de familia es la nota del proyecto en palabras. El monedero y Lucky Bench no van en esa hoja.",
    },
    "welcome-people": {
      title: "Quién hace qué",
      body: "Tú: construye, limpia, ayuda a un compañero. Líder: pone 3 / 2 / 1 solo en esta clase. Maestro: las notas de verdad, las destrezas y la tienda. Familia: abre un nombre → Family. El nombre legal no va en el proyector.",
    },
    "welcome-help": {
      title: "Para quién es esta Ayuda",
      body: "Alumnos: Bienvenida y Pared. Líderes: Roles → Líder. Familia: toca un alias → Family, o escribe Family en la búsqueda. Maestro: Inicio, Teach, Deck, Nota, Admin. Sustituto: no abras esta app. La Ayuda está en el Menú, abajo.",
    },
    "wall-read": {
      title: "Cómo leer esta pared",
      body: "Esta es la pared de la clase. Los nombres son alias, no nombres legales. Los números de oro son XP. $ son premios, un juego. El anillo son los minutos que quedan. Coral significa limpiar: herramientas, sillas, piso.",
    },
    "wall-teach": {
      title: "Pared y Teach",
      body: "La pared está todo el día: la tarea, el horario, la clase. Teach es cuando el maestro está al frente. El letrero grande dice qué hacer ahora. Las mismas herramientas están en las dos (reloj, elegir alumno, elegir equipo).",
    },
    "wall-menu": {
      title: "Menú (Dash · Learn · Crew · Admin)",
      body: "Abajo: Dash · Learn · Crew · Rosters · Admin. La franja Dash: Wall · Teach · Deck · Week · Club · Hall. Teach es la lección. Deck la muestra. Después de clase, Wall es el proyector. Admin es el botón 🛠️ al final del Menú. Pide el PIN del maestro.",
    },
    "wall-polls": {
      title: "Encuestas en vivo",
      body: "El maestro abre una encuesta (Sí/No, A–D, 1–4, emoji o propia). La pared muestra barras, sin nombres. Cada alumno toca en el equipo. Cerrar y guardar deja un historial. Las encuestas no cambian notas, XP ni dinero.",
    },
    "wall-xp": {
      title: "XP, premios y acciones",
      body: "XP sale de las destrezas del taller (Beginning → Distinguished). Los $ salen de venir y hacer el trabajo, menos la tienda. Las acciones son un juego aparte. El informe de familia es la nota del proyecto, no tu monedero.",
    },
    "wall-effort": {
      title: "3, 2, 1 — lo que marca el líder",
      body: "3 = está en el trabajo. 2 = necesita un empujón. 1 = no está con el equipo. Absent / Excused / Personal son por no estar aquí. No son una nota de destreza. Un 4 (Distinguished) lo pone el maestro, no el líder.",
    },
    "wall-week": {
      title: "Carrera de la semana",
      body: "Dash → Week. Clases y equipos corren con el trabajo de ayer. Hoy todavía se anota, así que no sale en el tablero. Un 3 es la parte completa. A/E no te restan. La clase de oro va primera. El equipo de oro va primero. Los renglones de alcance dicen qué tan atrás vas.",
    },
    "wall-skills": {
      title: "Niveles de destreza 1–4",
      body: "Destrezas: el maestro te toca y elige un nivel. 1️⃣ Beginning — necesitas una muestra. 2️⃣ Developing — puedes hacerlo con una revisión. 3️⃣ Proficient — solo, cumples la meta. 4️⃣ Distinguished — puedes enseñar a un compañero. Un 3 es la meta.",
    },
    "wall-family": {
      title: "Informe de familia",
      body: "Abre un alumno (toca el nombre) → Family. Una nota de proyecto. Destrezas en palabras. El tiempo en clase se ve, pero no entra en el promedio. Premios y acciones no van en esa hoja.",
    },
    "wall-berty": {
      title: "BertyBot",
      body: "Berty es la mascota del taller. Saluda en ENTER, piensa en LISTEN, está de pie en CREW WORK, señala CLEAN UP y entre clases, y festeja SHARE. Las dos manos se ven en cada pose. Limpieza y el cambio de clase siempre lo muestran. Ábrelo desde el chip de versión.",
    },
    "wall-cleanup": {
      title: "Limpieza",
      body: "Últimos cinco minutos: pantalla coral. Berty señala los trabajos. Taller: herramientas, restos, puestos. Aula: sillas y pasillos. Ayudar de más puede dar un premio, no XP. Entre clases Berty señala ENTER → LISTEN → CREW WORK → CLEAN UP.",
    },
    "dash-teach": {
      title: "Modo Teach",
      body: "Dash → Teach. El letrero grande sigue el timbre: Entra, Escucha, Trabajo, Limpia. La limpieza siempre gana. En esa pared no hay nombres.",
    },
    "dash-public": {
      title: "Proyector",
      body: "La pared embebida muestra solo el tablero: alias y XP o premios. Coral LIMPIEZA en los últimos 5 minutos. No hay escritorio del maestro. No hay apellidos.",
    },
    "dash-tools": {
      title: "Herramientas en la pared",
      body: "Abre → Herramientas. Reloj, elegir un alumno (alias), elegir un equipo. Apágalo para esconderlo. Los nombres son alias.",
    },
    "roles-crew": {
      title: "Camino del líder",
      body: "PIN 2222, solo esta clase. Hola, líder. Marca 3 / 2 / 1 o Absent / Excused / Personal. Luego el equipo sigue solo. No tocas el monedero ni las notas.",
    },
    "roles-worker": {
      title: "Camino del alumno",
      body: "Lee la pared: oro es XP, $ son premios. Toca tu alias para la hoja de familia. Coral = limpiar. Tú no escribes dinero.",
    },
    "roles-family": {
      title: "Camino de la familia",
      body: "Perfil → Family. Una nota de proyecto. Destrezas en palabras. Sin monedero, sin acciones y sin Lucky Bench.",
    },
    "wall-jobs": {
      title: "Trabajos en la pared",
      body: "Dos listas. Agenda es el trabajo de la hora. Cleanup es la lista coral (herramientas o sillas). Need (gafas / material) se ve al entrar.",
    },
    "wall-looks": {
      title: "Aspecto de la pared",
      body: "El aspecto cambia el color de la pared. Shop wall es el azul de siempre. Back row usa letras más grandes. Los aspectos de fiesta son para días alegres. Tus puntos se quedan. El oro es XP. El coral es limpiar. Los botones de arriba (Help, Lock, Web) siguen.",
    },
    "chrome-hud": {
      title: "Barra de arriba",
      body: "La barra de arriba es una fila. Wall · Teach · Deck · Week · Club · Hall se quedan. More (el bolsillo) guarda Fake data, Find, NOW, Lock, Cog, Help, Web y el idioma. Toca, no pases el mouse. Los temas no pueden tapar esos botones.",
    },
    "period-now": {
      title: "Periodos y el reloj",
      body: "NOW es la clase de ahora. Las fichas de periodo te llevan a esa hora. P6 es Study Hall. Coral es limpiar.",
    },
    "wall-lang": {
      title: "Inglés, ucraniano, ruso, español",
      body: "El globo sigue el idioma del Hub: inglés, ucraniano, ruso, español, árabe, darí, kinyarwanda y tigriña. XP y las palabras del taller se quedan en inglés. Árabe y darí se leen de derecha a izquierda.",
    },
  },
  ar: {
    "welcome-levels": {
      title: "مستويات المهارة 1–4",
      body: "مستويات المهارة: 1 = Beginning، تحتاج عرضاً. 2 = Developing، تستطيع مع مراجعة. 3 = Proficient، وحدك وتبلغ المعيار. 4 = Distinguished، تستطيع أن تعلّم زميلاً.",
    },
    "welcome-what": {
      title: "ما هو TechWorks؟",
      body: "TechWorks صف الورشة للسيد Kulibert. تعمل مع فريق صغير. تتدرب على القياس والقص والإنهاء والمشاركة. الذهب (XP) يعني أنك تحسنت. هذا هو المهم. نقود الصف لعبة، وليست درجتك. الأسماء على الحائط أسماء ورشة، لا أسماء قانونية.",
    },
    "welcome-day": {
      title: "حصة في أربع خطوات",
      body: "1) ادخل واجلس مع فريقك. 2) اسمع هدف اليوم واسأل سؤالاً حقيقياً. 3) عمل الفريق: ابنِ، ارسم، صنفر، خطط. 4) التنظيف: أدوات، بقايا، مقاعد. إذا صار الحائط مرجانياً، هذه الخطوة الآن. Berty يشير إلى الأعمال. المساعدة الزائدة قد تعطي مكافأة، لا XP.",
    },
    "welcome-numbers": {
      title: "ماذا تعني الأرقام",
      body: "الذهب = XP للمهارة. أنت تتحسن في الحرفة. $ = مكافآت الصف، لعبة. قائد الفريق يضع 3 (في العمل)، 2 (يحتاج دفعة)، أو 1 (ليس مع الفريق). تقرير العائلة هو درجة المشروع بكلمات. المحفظة و Lucky Bench لا يدخلان تلك الورقة.",
    },
    "wall-read": {
      title: "كيف تقرأ هذه اللوحة",
      body: "هذه لوحة الصف. الأسماء هنا أسماء ورشة، لا أسماء قانونية. أرقام الذهب هي XP. $ مكافآت، لعبة. الحلقة هي الدقائق الباقية. المرجان يعني التنظيف: أدوات، مقاعد، أرض.",
    },
    "wall-skills": {
      title: "مستويات المهارة 1–4",
      body: "المهارات: يلمس المعلم اسمك ويختار مستوى. 1️⃣ Beginning — تحتاج عرضاً. 2️⃣ Developing — تستطيع مع مراجعة. 3️⃣ Proficient — وحدك، تبلغ المعيار. 4️⃣ Distinguished — تستطيع أن تعلّم زميلاً. الهدف هو 3.",
    },
  },
  "fa-AF": {
    "welcome-levels": {
      title: "سطح‌های مهارت ۱ تا ۴",
      body: "سطح‌های مهارت: 1 = Beginning، به نمایش نیاز داری. 2 = Developing، با یک بررسی می‌توانی. 3 = Proficient، تنها به معیار می‌رسی. 4 = Distinguished، می‌توانی به هم‌گروهی بیاموزی.",
    },
    "welcome-what": {
      title: "TechWorks چیست؟",
      body: "TechWorks صنف کارگاه آقای Kulibert است. با یک گروه کوچک کار می‌کنی. اندازه، برش، پرداخت و شریک شدن را تمرین می‌کنی. طلا (XP) یعنی بهتر شدی. این مهم است. پول صنف یک بازی است، نمره نیست. نام‌ها روی دیوار نام کارگاه‌اند، نه نام قانونی.",
    },
    "welcome-day": {
      title: "یک ساعت در چهار گام",
      body: "۱) داخل شو و با گروه‌ات بنشین. ۲) هدف امروز را بشنو و یک سؤال واقعی بپرس. ۳) کار گروه: بساز، رسم کن، سنباده بزن، نقشه بکش. ۴) پاک‌کاری: ابزار، ریزه‌ها، چوکی‌ها. اگر دیوار مرجانی شد، همان گام اکنون است. Berty به کارها اشاره می‌کند. کمک اضافه جایزه می‌دهد، نه XP.",
    },
    "welcome-numbers": {
      title: "عددها چه معنی دارند",
      body: "طلا = XP مهارت. در کار بهتر می‌شوی. $ = جایزهٔ صنف، یک بازی. رهبر گروه ۳ (سر کار)، ۲ (به یک تکان نیاز دارد)، یا ۱ (با گروه نیست) می‌زند. گزارش خانواده نمرهٔ پروژه به زبان ساده است. کیف پول و Lucky Bench به آن ورق نمی‌روند.",
    },
    "wall-read": {
      title: "این تخته را چطور بخوانی",
      body: "این دیوار صنف است. نام‌ها نام کارگاه‌اند، نه نام قانونی. عددهای طلا XP اند. $ جایزه است، یک بازی. حلقه دقیقه‌های مانده است. مرجانی یعنی پاک‌کاری: ابزار، چوکی، زمین.",
    },
    "wall-skills": {
      title: "سطح‌های مهارت ۱ تا ۴",
      body: "مهارت‌ها: معلم نامت را می‌زند و یک سطح برمی‌گزیند. 1️⃣ Beginning — به نمایش نیاز داری. 2️⃣ Developing — با یک بررسی می‌توانی. 3️⃣ Proficient — تنها، به معیار می‌رسی. 4️⃣ Distinguished — می‌توانی به هم‌گروهی بیاموزی. هدف ۳ است.",
    },
  },
  rw: {
    "welcome-levels": {
      title: "Inzego z'ubumenyi 1–4",
      body: "Inzego z'ubumenyi: 1 = Beginning, ukeneye kwerekwa. 2 = Developing, ushobora n'ubugenzuzi. 3 = Proficient, wenyine ugeraho. 4 = Distinguished, ushobora kwigisha mugenzi.",
    },
    "welcome-what": {
      title: "TechWorks ni iki?",
      body: "TechWorks ni ishuri ry'umwuga rya Bwana Kulibert. Ukora mu itsinda rito. Wigira gupima, gucapa, kurangiza, no gusangira. Zahabu (XP) bivuze ko warushijeho. Ibyo ni byo ngombwa. Amafaranga y'ishuri ni umukino, si amanota. Amazina ku kibaho ni amazina y'ubwuga, si amazina y'umurage.",
    },
    "welcome-day": {
      title: "Isomo mu ntambwe enye",
      body: "1) Injira wicare n'itsinda ryawe. 2) Umva intego y'uyu munsi, ubaze ikibazo cy'ukuri. 3) Akazi k'itsinda: ubake, ushushanye, usige, utegure. 4) Isuku: ibikoresho, ibisigarira, intebe. Iyo kibaho kiba coral, iyo ntambwe ni none. Berty yerekana akazi. Gufasha byinshi bishobora gutanga impano, si XP.",
    },
    "welcome-numbers": {
      title: "Imibare ivuga iki",
      body: "Zahabu = XP y'ubumenyi. Urushiriza mu mwuga. $ = impano z'ishuri, umukino. Umuyobozi w'itsinda ashyira 3 (ku kazi), 2 (akeneye gufashwa), cyangwa 1 (ntari mu itsinda). Raporo y'umuryango ni amanota y'umushinga mu magambo. Wallet na Lucky Bench ntibijya kuri iyo mpapuro.",
    },
    "wall-read": {
      title: "Uko usoma iki kibaho",
      body: "Iki ni kibaho cy'ishuri. Amazina ni ay'ubwuga, si ay'umurage. Imibare y'zahabu ni XP. $ ni impano, umukino. Impeta ni iminota isigaye. Coral bivuze isuku: ibikoresho, intebe, hasi.",
    },
    "wall-skills": {
      title: "Inzego z'ubumenyi 1–4",
      body: "Ubumenyi: umwarimu akanda izina ryawe akahitamo urwego. 1️⃣ Beginning — ukeneye kwerekwa. 2️⃣ Developing — ushobora n'ubugenzuzi. 3️⃣ Proficient — wenyine, ugeraho. 4️⃣ Distinguished — ushobora kwigisha mugenzi. Intego ni 3.",
    },
  },
  ti: {
    "welcome-levels": {
      title: "ደረጃታት ክእለት 1–4",
      body: "ደረጃታት ክእለት፡ 1 = Beginning፣ ምርኢት የድልየካ። 2 = Developing፣ ምስ ምርመራ ትኽእል። 3 = Proficient፣ ብገዛእ ርእስኻ ትበጽሕ። 4 = Distinguished፣ ንጓሓይ ትምህር።",
    },
    "welcome-what": {
      title: "TechWorks እንታይ እዩ?",
      body: "TechWorks ናይ ክፍሊ ስራሕ ኣቶ Kulibert እዩ. ምስ ንእሽቶ ጉጅለ ትሰርሕ። ምልካዕ፡ ምቑራጽ፡ ምዝዛም፡ ምክፋል ትለማመድ። ወርቂ (XP) ማለት ረቢሕካ ማለት እዩ። እዚ እዩ ነገር። ገንዘብ ክፍሊ ጸወታ እዩ፡ ውጽኢት ኣይኮነን። ኣብ መንደቕ ዘለዉ ኣስማት ናይ ዕደጋ እዮም፡ ሕጋዊ ኣስማት ኣይኮኑን።",
    },
    "welcome-day": {
      title: "ክፍሊ ኣብ ኣርባዕተ ስጉምትታት",
      body: "1) እቶ ንጉጅለኻ ተቐመጥ። 2) ዕላማ ሎሚ ስማዕ፡ ሓቀኛ ሕቶ ሕተት። 3) ስራሕ ጉጅለ፡ ህነጽ፡ ስኣል፡ ሰንድ፡ ውጥን። 4) ጽሬት፡ መሳርሒ፡ ተረፍ፡ መንበር። መንደቕ ኮራል ምስ ኮነ እቲ ስጉምቲ ሕጂ እዩ። Berty ነቲ ስራሕ የመልክት። ተወሳኺ ሓገዝ ሽልማት ይህብ፡ XP ኣይኮነን።",
    },
    "welcome-numbers": {
      title: "ቁጽርታት እንታይ ይብሉ",
      body: "ወርቂ = XP ክእለት። ኣብ ዕደጋ ትመሓየሽ። $ = ሽልማት ክፍሊ፡ ጸወታ። መራሒ ጉጅለ 3 (ኣብ ስራሕ)፡ 2 (ድፍኢት የድሊ)፡ ወይ 1 (ምስ ጉጅለ የለን) ይስምር። ጸብጻብ ስድራ ደረጃ ፕሮጀክት ብቃላት እዩ። Walletን Lucky Benchን ኣብታ ወረቐት ኣይኣትዉን።",
    },
    "wall-read": {
      title: "ነዚ ሰሌዳ ከመይ ትንብቦ",
      body: "እዚ መንደቕ ክፍሊ እዩ። ኣስማት ናይ ዕደጋ እዮም፡ ሕጋዊ ኣይኮኑን። ቁጽሪ ወርቂ XP እዩ። $ ሽልማት እዩ፡ ጸወታ። ቀለቤት ዝተረፈ ደቓይቕ እዩ። ኮራል ማለት ጽሬት፡ መሳርሒ፡ መንበር፡ መሬት።",
    },
    "wall-skills": {
      title: "ደረጃታት ክእለት 1–4",
      body: "ክእለታት፡ መምህር ስምካ ይጠውቕ ደረጃ ይመርጽ። 1️⃣ Beginning — ምርኢት የድልየካ። 2️⃣ Developing — ምስ ምርመራ ትኽእል። 3️⃣ Proficient — ብገዛእ ርእስኻ መለክዒ ትበጽሕ። 4️⃣ Distinguished — ንጓሓይ ትምህር። 3 እዩ ዕላማ።",
    },
  },
  simple: {
    "welcome-levels": {
      title: "Skill levels 1 to 4",
      body: "Skill levels: 1 = Beginning, you need a demo. 2 = Developing, you can do it with a check. 3 = Proficient, you can do it alone. 4 = Distinguished, you can teach a friend.",
    },
    "welcome-what": {
      title: "What is this class?",
      body: "This is shop class. You work with a small crew. Gold XP means you got better. Class cash is a game, not your grade. Names on the wall are shop names.",
    },
    "welcome-day": {
      title: "Four steps in class",
      body: "Sit with your crew and listen. Then build, draw, or sand. Clean up when the board turns coral.",
    },
    "welcome-numbers": {
      title: "What the numbers mean",
      body: "Gold is skill XP. $ is a game, not your grade. A 3 is on the job, a 2 needs a nudge, and a 1 is not with the crew.",
    },
    "wall-read": {
      title: "How to read this board",
      body: "Names are shop names, not legal names. Gold is XP and $ is a game. Coral means clean up.",
    },
    "wall-skills": {
      title: "Skill levels 1 to 4",
      body: "The teacher taps your name and picks 1, 2, 3, or 4. 1️⃣ Beginning — you need a demo. 2️⃣ Developing — you can do it with a check. 3️⃣ Proficient — you can do it alone. 4️⃣ Distinguished — you can teach a friend. 3 is the goal.",
    },
  },
};
