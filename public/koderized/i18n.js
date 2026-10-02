/* KZ 1.25.0 — short lines, 1:1 EN/ES. Pictograms carry the rest. */
window.I18N = {
  en: {
    lang: "en",
    start: "Start here.",
    hint: "Watch the picture. Tap the glow. Door 1 is a win today.",
    d1: "One move", d2: "More moves", d3: "Repeat", d4: "Stop", d5: "Score",
    classCode: "Class code",
    alias: "Alias (not a legal name)",
    aliasPh: "Scout",
    ferpaJoin: "Alias only. Not a real name.",
    roll: "Start",
    teacher: "Teacher",
    aide: "Aide",
    walk: "Walk with me",
    big: "Big words",
    home: "Doors",
    doorList: "Doors",
    hub: "Hub",
    hubSign: "Sign in",
    hubBack: "Back to the Hub",
    startLine: "Tap the moves to get the bot to the box.",
    help: "Help",
    menu: "Menu",
    guess: "Guess", watch: "Watch", find: "Find", fix: "Fix", done: "Done",
    lock: "OK",
    go: "GO",
    undo: "Undo",
    nextDoor: "Next door",
    period: "Period board",
    notes: "Notes",
    freeze: "Freeze",
    unfreeze: "Open",
    clearSpot: "Clear",
    export: "Export CSV",
    walkRed: "Help red first",
    roster: "Roster",
    log: "Log",
    heat: "HEAT",
    present: "Here",
    guessed: "Guessed",
    stuck: "Stuck",
    coach: "Ready",
    doneKpi: "Done",
    aideTitle: "Aide card",
    say: "Say",
    tap: "Tap",
    ferpaAide: "Alias only. Not a real name.",
    winPeriod: "Door 1 is a win today.",
    didIt: "You did it.",
    settings: "Settings",
    language: "Language",
    english: "English",
    simple: "Simple",
    espanol: "Español",
    arabic: "العربية",
    readAloud: "Read aloud",
    bigText: "Big text",
    fewerAnswers: "Fewer answers",
    on: "On",
    off: "Off",
    remove: "Remove",
    emptyList: "No code yet — this program is blank. Pick what the bot does.",
    zoneCode: "Current code",
    zoneOptions: "Options",
    zoneOutput: "Output",
    move: "Forward",
    repeat: "Repeat",
    end: "End",
    stop: "Stop",
    score: "Score",
    cost: "One cost",
    look: "Look",
    speak: "Read it to me",
    stopSpeak: "Stop",
    example: "Example",
    footer: "Koderized KZ 1.25.0 · alias only",
    ferpaTeacher: "Teachers only. Alias only. Do not store an IEP, a 504, or a legal name.",
    sit: "SIT", crate: "CRATE", rollShout: "ROLL", safe: "SAFE", bonk: "BONK",
    clear: "CLEAR",
    tryAgain: "TRY AGAIN",
    doors: {
      zero: {
        title: "Door 1 · One move",
        right: "sit",
        probeRight: "do",
        idea: "One picture. One tap. The bot does that.",
        ask: "",
        choices: [
          { p: "sit", t: "1 · It sits." },
          { p: "roll", t: "2 · It rolls alone." },
          { p: "vanish", t: "3 · It goes away." }
        ],
        probeAsk: "What is a command?",
        probes: [
          { v: "do", t: "1 · One thing the bot does" },
          { v: "guess", t: "2 · A guess" },
          { v: "wall", t: "3 · The wall" }
        ],
        tests: ["Bot moved", "On the crate", "One move"],
        help: {
          predict: { say: "No code yet. Tap 1.", tap: "Tap 1" },
          run: { say: "Watch the picture.", tap: "Watch" },
          investigate: { say: "A command is one thing.", tap: "1, then Next" },
          modify: { say: "Tap Forward. Then GO.", tap: "Forward, then GO" }
        }
      },
      line: {
        title: "Door 2 · More moves",
        right: "short",
        probeRight: "few",
        idea: "Top to bottom. One after one.",
        ask: "Three moves. Where does it stop?",
        choices: [
          { p: "short", t: "1 · Before the crate" },
          { p: "crate", t: "2 · On the crate" },
          { p: "past", t: "3 · Past the crate" }
        ],
        probeAsk: "Why was it short?",
        probes: [
          { v: "few", t: "1 · Need more moves" },
          { v: "order", t: "2 · Wrong order" },
          { v: "wall", t: "3 · A wall" }
        ],
        tests: ["On the crate", "One more move", "Only moves"],
        help: {
          predict: { say: "Three is not enough. Tap 1.", tap: "1" },
          run: { say: "Watch three steps.", tap: "Watch" },
          investigate: { say: "Add one more move.", tap: "1, then Next" },
          modify: { say: "Tap Forward. Then GO.", tap: "Forward, then GO" }
        }
      },
      loop: {
        title: "Door 3 · Repeat",
        right: "repeat",
        probeRight: "count",
        idea: "Repeat does the inside many times.",
        ask: "Which one is the loop?",
        choices: [
          { p: "repeat", t: "1 · Repeat" },
          { p: "line", t: "2 · Many moves" },
          { p: "stop", t: "3 · Stop" }
        ],
        probeAsk: "What is the gold number?",
        probes: [
          { v: "count", t: "1 · How many times" },
          { v: "score", t: "2 · A grade" },
          { v: "speed", t: "3 · Speed" }
        ],
        tests: ["On the crate", "Has repeat", "Number is 4"],
        help: {
          predict: { say: "The loop is Repeat. Tap 1.", tap: "1" },
          run: { say: "Watch the line.", tap: "Watch" },
          investigate: { say: "Gold number = how many.", tap: "1, then Next" },
          modify: { say: "Tap gold until 4. Then GO.", tap: "4, then GO" }
        }
      },
      wall: {
        title: "Door 4 · Stop",
        right: "stop",
        probeRight: "inside",
        idea: "Ask about the wall, or the bot hits it.",
        ask: "What happens at the wall?",
        choices: [
          { p: "stop", t: "1 · It stops" },
          { p: "through", t: "2 · It goes through" },
          { p: "forever", t: "3 · It never stops" }
        ],
        probeAsk: "Where is Stop?",
        probes: [
          { v: "inside", t: "1 · In the loop" },
          { v: "outside", t: "2 · After the loop" }
        ],
        tests: ["Stops at wall", "Does not run forever", "Asks if wall"],
        help: {
          predict: { say: "It needs Stop. Watch first.", tap: "Watch" },
          run: { say: "Watch the wall.", tap: "Watch" },
          investigate: { say: "Stop goes in the loop.", tap: "1, then Next" },
          modify: { say: "Keep Stop inside Repeat. GO.", tap: "GO" }
        }
      },
      score: {
        title: "Door 5 · Score",
        right: "score",
        probeRight: "wall",
        idea: "Stop. Then count.",
        ask: "It stops. What is missing?",
        choices: [
          { p: "score", t: "1 · Score at the wall" },
          { p: "faster", t: "2 · More speed" },
          { p: "name", t: "3 · A legal name" }
        ],
        probeAsk: "When does score run?",
        probes: [
          { v: "wall", t: "1 · If wall: score" },
          { v: "always", t: "2 · Every move" }
        ],
        tests: ["Stops at wall", "Score goes up", "Has score"],
        help: {
          predict: { say: "Need Score. Tap 1.", tap: "1" },
          run: { say: "Watch. Score is still no.", tap: "Watch" },
          investigate: { say: "Score at the wall.", tap: "1, then Next" },
          modify: { say: "Tap score. Then GO.", tap: "score, then GO" }
        }
      }
    }
  },
  es: {
    lang: "es",
    start: "Empieza aquí.",
    hint: "Mira el dibujo. Toca el brillo. La Puerta 1 ya es un logro hoy.",
    d1: "Un mover", d2: "Más mover", d3: "Repetir", d4: "Parar", d5: "Sumar",
    classCode: "Código de clase",
    alias: "Apodo (no un nombre legal)",
    aliasPh: "Scout",
    ferpaJoin: "Solo apodo. No es un nombre real.",
    roll: "Empezar",
    teacher: "Maestro",
    aide: "Asistente",
    walk: "Camina conmigo",
    big: "Letras grandes",
    home: "Puertas",
    doorList: "Puertas",
    hub: "Hub",
    hubSign: "Entrar",
    hubBack: "Volver al centro",
    startLine: "Toca los movimientos. Lleva el bot a la caja.",
    help: "Ayuda",
    menu: "Menú",
    guess: "Adivina", watch: "Mira", find: "Halla", fix: "Arregla", done: "Listo",
    lock: "OK",
    go: "GO",
    undo: "Atrás",
    nextDoor: "Siguiente",
    period: "Pizarra",
    notes: "Notas",
    freeze: "Congelar",
    unfreeze: "Abrir",
    clearSpot: "Quitar",
    export: "Exportar CSV",
    walkRed: "Ayuda al rojo",
    roster: "Lista",
    log: "Registro",
    heat: "CALOR",
    present: "Aquí",
    guessed: "Adivinó",
    stuck: "Atascado",
    coach: "Listo",
    doneKpi: "Hecho",
    aideTitle: "Tarjeta",
    say: "Di",
    tap: "Toca",
    ferpaAide: "Solo apodo. No es un nombre real.",
    winPeriod: "La Puerta 1 ya es un logro hoy.",
    didIt: "Lo lograste.",
    settings: "Ajustes",
    language: "Idioma",
    english: "English",
    simple: "Simple",
    espanol: "Español",
    readAloud: "Lectura en voz alta",
    bigText: "Letras grandes",
    fewerAnswers: "Menos respuestas",
    on: "Sí",
    off: "No",
    emptyList: "Aún no hay código — este programa está en blanco. Elige qué hace el bot.",
    zoneCode: "Código actual",
    zoneOptions: "Opciones",
    zoneOutput: "Salida",
    move: "mover",
    repeat: "repetir",
    end: "fin",
    stop: "parar",
    score: "sumar",
    cost: "Un costo",
    look: "Mira",
    speak: "Léeme",
    stopSpeak: "Parar",
    example: "Ejemplo",
    footer: "Koderized KZ 1.25.0 · solo apodo",
    ferpaTeacher: "Solo maestros. Solo apodo. No guardes un IEP, un 504, ni un nombre legal.",
    sit: "SIT", crate: "CAJA", rollShout: "ROLL", safe: "SAFE", bonk: "BONK",
    doors: {
      zero: {
        title: "Puerta 1 · Un mover",
        right: "sit",
        probeRight: "do",
        idea: "Un dibujo. Un toque. El bot lo hace.",
        ask: "",
        choices: [
          { p: "sit", t: "1 · Se queda." },
          { p: "roll", t: "2 · Rueda solo." },
          { p: "vanish", t: "3 · Se va." }
        ],
        probeAsk: "¿Qué es una orden?",
        probes: [
          { v: "do", t: "1 · Una cosa que el bot hace" },
          { v: "guess", t: "2 · Un azar" },
          { v: "wall", t: "3 · La pared" }
        ],
        tests: ["El bot se movió", "En la caja", "Un mover"],
        help: {
          predict: { say: "Aún no hay código. Toca 1.", tap: "Toca 1" },
          run: { say: "Mira el dibujo.", tap: "Mira" },
          investigate: { say: "Una orden es una cosa.", tap: "1, luego Next" },
          modify: { say: "Toca mover. Luego GO.", tap: "mover, luego GO" }
        }
      },
      line: {
        title: "Puerta 2 · Más mover",
        right: "short",
        probeRight: "few",
        idea: "De arriba a abajo. Uno tras uno.",
        ask: "Tres mover. ¿Dónde para?",
        choices: [
          { p: "short", t: "1 · Antes de la caja" },
          { p: "crate", t: "2 · En la caja" },
          { p: "past", t: "3 · Pasó la caja" }
        ],
        probeAsk: "¿Por qué quedó corto?",
        probes: [
          { v: "few", t: "1 · Faltan mover" },
          { v: "order", t: "2 · Mal orden" },
          { v: "wall", t: "3 · Una pared" }
        ],
        tests: ["En la caja", "Un mover más", "Solo mover"],
        help: {
          predict: { say: "Tres no alcanzan. Toca 1.", tap: "1" },
          run: { say: "Mira tres pasos.", tap: "Mira" },
          investigate: { say: "Agrega un mover.", tap: "1, luego Next" },
          modify: { say: "Toca mover. Luego GO.", tap: "mover, luego GO" }
        }
      },
      loop: {
        title: "Puerta 3 · Repetir",
        right: "repeat",
        probeRight: "count",
        idea: "Repetir hace lo de adentro muchas veces.",
        ask: "¿Cuál es el ciclo?",
        choices: [
          { p: "repeat", t: "1 · Repetir" },
          { p: "line", t: "2 · Muchos mover" },
          { p: "stop", t: "3 · Parar" }
        ],
        probeAsk: "¿Qué es el número dorado?",
        probes: [
          { v: "count", t: "1 · Cuántas veces" },
          { v: "score", t: "2 · Una nota" },
          { v: "speed", t: "3 · Velocidad" }
        ],
        tests: ["En la caja", "Hay repetir", "Número 4"],
        help: {
          predict: { say: "El ciclo es Repetir. Toca 1.", tap: "1" },
          run: { say: "Mira la fila.", tap: "Mira" },
          investigate: { say: "Número dorado = cuántas.", tap: "1, luego Next" },
          modify: { say: "Toca el oro hasta 4. Luego GO.", tap: "4, luego GO" }
        }
      },
      wall: {
        title: "Puerta 4 · Parar",
        right: "stop",
        probeRight: "inside",
        idea: "Pregunta por la pared, o el bot choca.",
        ask: "¿Qué pasa en la pared?",
        choices: [
          { p: "stop", t: "1 · Para" },
          { p: "through", t: "2 · Pasa" },
          { p: "forever", t: "3 · Nunca para" }
        ],
        probeAsk: "¿Dónde está Parar?",
        probes: [
          { v: "inside", t: "1 · En el ciclo" },
          { v: "outside", t: "2 · Después del ciclo" }
        ],
        tests: ["Para en la pared", "No corre siempre", "Pregunta si pared"],
        help: {
          predict: { say: "Falta Parar. Mira primero.", tap: "Mira" },
          run: { say: "Mira la pared.", tap: "Mira" },
          investigate: { say: "Parar va en el ciclo.", tap: "1, luego Next" },
          modify: { say: "Deja Parar en Repetir. GO.", tap: "GO" }
        }
      },
      score: {
        title: "Puerta 5 · Sumar",
        right: "score",
        probeRight: "wall",
        idea: "Parar. Luego contar.",
        ask: "Ya para. ¿Qué falta?",
        choices: [
          { p: "score", t: "1 · Sumar en la pared" },
          { p: "faster", t: "2 · Más velocidad" },
          { p: "name", t: "3 · Un nombre legal" }
        ],
        probeAsk: "¿Cuándo corre sumar?",
        probes: [
          { v: "wall", t: "1 · Si pared: sumar" },
          { v: "always", t: "2 · Cada mover" }
        ],
        tests: ["Para en la pared", "La suma sube", "Hay sumar"],
        help: {
          predict: { say: "Falta Sumar. Toca 1.", tap: "1" },
          run: { say: "Mira. Sumar sigue en no.", tap: "Mira" },
          investigate: { say: "Sumar en la pared.", tap: "1, luego Next" },
          modify: { say: "Toca sumar. Luego GO.", tap: "sumar, luego GO" }
        }
      }
    }
  },

  simple: {
    lang: "en",
    settings: "Settings",
    language: "Language",
    english: "English",
    simple: "Simple",
    espanol: "Español",
    arabic: "العربية",
    readAloud: "Read aloud",
    bigText: "Big text",
    fewerAnswers: "Fewer answers",
    on: "On",
    off: "Off",
    speak: "Read it to me",
    stopSpeak: "Stop",
    home: "Doors",
    doorList: "Doors",
    hubSign: "Sign in",
    hubBack: "Back to the Hub",
    startLine: "Tap moves. Get the bot to the box.",
    help: "Help",
    menu: "Menu",
    didIt: "You did it.",
    emptyList: "No code yet. Pick one.",
    footer: "Koderized KZ 1.25.0 · alias only",
    doors: {
      zero: {
        title: "Door 1.",
        idea: "One tap.",
        ask: "",
        right: "sit",
        probeRight: "do",
        choices: [
          { p: "sit", t: "It sits." },
          { p: "roll", t: "It rolls." },
          { p: "vanish", t: "It goes away." }
        ],
        probeAsk: "What is a command?",
        probes: [
          { v: "do", t: "One thing the bot does" },
          { v: "guess", t: "A guess" },
          { v: "wall", t: "The wall" }
        ],
        help: {
          predict: { say: "Tap 1.", tap: "Tap 1" },
          run: { say: "Watch.", tap: "Watch" },
          investigate: { say: "Tap 1. Then Next.", tap: "1, then Next" },
          modify: { say: "Tap Forward. Then GO.", tap: "Forward, then GO" }
        }
      },
      line: {
        title: "Door 2.",
        idea: "One after one.",
        ask: "Where does it stop?",
        right: "short",
        probeRight: "few",
        choices: [
          { p: "short", t: "Before the crate" },
          { p: "crate", t: "On the crate" },
          { p: "past", t: "Past the crate" }
        ],
        probeAsk: "Why short?",
        probes: [
          { v: "few", t: "Need more moves" },
          { v: "order", t: "Wrong order" },
          { v: "wall", t: "A wall" }
        ],
        help: { predict: { say: "Tap 1.", tap: "Tap 1" }, run: { say: "Watch.", tap: "Watch" }, investigate: { say: "Tap 1.", tap: "1" }, modify: { say: "Tap Forward.", tap: "Forward" } }
      },
      loop: {
        title: "Door 3.",
        idea: "Repeat does it again.",
        ask: "Which is the loop?",
        right: "repeat",
        probeRight: "count",
        choices: [
          { p: "repeat", t: "Repeat" },
          { p: "line", t: "Many moves" },
          { p: "stop", t: "Stop" }
        ],
        probeAsk: "What is the gold number?",
        probes: [
          { v: "count", t: "How many times" },
          { v: "score", t: "A grade" },
          { v: "speed", t: "Speed" }
        ],
        help: { predict: { say: "Tap 1.", tap: "Tap 1" }, run: { say: "Watch.", tap: "Watch" }, investigate: { say: "Tap 1.", tap: "1" }, modify: { say: "Gold to 4.", tap: "4" } }
      },
      wall: {
        title: "Door 4.",
        idea: "Ask about the wall.",
        ask: "What happens at the wall?",
        right: "stop",
        probeRight: "inside",
        choices: [
          { p: "stop", t: "It stops" },
          { p: "through", t: "It goes through" },
          { p: "forever", t: "It never stops" }
        ],
        probeAsk: "Where is Stop?",
        probes: [
          { v: "inside", t: "In the loop" },
          { v: "outside", t: "After the loop" }
        ],
        help: { predict: { say: "Watch.", tap: "Watch" }, run: { say: "Watch.", tap: "Watch" }, investigate: { say: "Tap 1.", tap: "1" }, modify: { say: "GO.", tap: "GO" } }
      },
      score: {
        title: "Door 5.",
        idea: "Then count.",
        ask: "What is missing?",
        right: "score",
        probeRight: "wall",
        choices: [
          { p: "score", t: "Score at the wall" },
          { p: "faster", t: "More speed" },
          { p: "name", t: "A name" }
        ],
        probeAsk: "When does score run?",
        probes: [
          { v: "wall", t: "If wall: score" },
          { v: "always", t: "Every move" }
        ],
        help: { predict: { say: "Tap 1.", tap: "Tap 1" }, run: { say: "Watch.", tap: "Watch" }, investigate: { say: "Tap 1.", tap: "1" }, modify: { say: "Tap score.", tap: "score" } }
      }
    }
  },

  ar: {
    lang: "ar",
    startLine: "المس الحركات. أوصل الروبوت إلى الصندوق.",
    help: "مساعدة",
    menu: "القائمة",
    doorList: "الأبواب",
    hub: "المركز",
    hubSign: "دخول",
    hubBack: "العودة إلى المركز",
    settings: "الإعدادات",
    language: "اللغة",
    english: "English",
    simple: "بسيط",
    espanol: "Español",
    arabic: "العربية",
    readAloud: "اقرأ لي",
    bigText: "نص كبير",
    fewerAnswers: "إجابات أقل",
    on: "تشغيل",
    off: "إيقاف",
    speak: "اقرأ لي",
    stopSpeak: "قف",
    look: "انظر",
    roll: "ابدأ",
    didIt: "لقد فعلتها.",
    emptyList: "لا يوجد كود بعد. هذا البرنامج فارغ. اختر ما يفعله الروبوت.",
    move: "إلى الأمام",
    repeat: "كرر",
    end: "انته",
    stop: "قف",
    score: "نقطة",
    go: "انطلق",
    teacher: "المعلم",
    notes: "ملاحظات",
    zoneCode: "الكود",
    zoneOptions: "الخيارات",
    zoneOutput: "النتيجة",
    guess: "خمّن",
    watch: "شاهد",
    find: "جد",
    fix: "أصلح",
    done: "تم",
    footer: "Koderized KZ 1.25.0 · اسم مستعار فقط",
    remove: "احذف",
    doors: {
      zero: {
        title: "الباب 1 · حركة واحدة",
        idea: "صورة واحدة. لمسة واحدة. الروبوت يفعل ذلك.",
        help: {
          predict: { say: "لا يوجد كود. المس 1.", tap: "المس 1" },
          run: { say: "شاهد الصورة.", tap: "شاهد" },
          investigate: { say: "الأمر شيء واحد يفعله الروبوت.", tap: "1 ثم التالي" },
          modify: { say: "المس إلى الأمام. ثم انطلق.", tap: "إلى الأمام ثم انطلق" }
        }
      },
      line: {
        title: "الباب 2 · حركات أكثر",
        idea: "من الأعلى إلى الأسفل. واحدة بعد واحدة.",
        ask: "ثلاث حركات. أين يتوقف؟",
        help: {
          predict: { say: "المس 1.", tap: "1" },
          run: { say: "شاهد الصورة.", tap: "شاهد" },
          investigate: { say: "نحتاج حركات أكثر.", tap: "1" },
          modify: { say: "المس إلى الأمام. ثم انطلق.", tap: "إلى الأمام" }
        }
      },
      loop: {
        title: "الباب 3 · كرر",
        idea: "كرر نفس الحركة.",
        help: { predict: { say: "المس 1.", tap: "1" }, run: { say: "شاهد.", tap: "شاهد" }, investigate: { say: "كرر.", tap: "1" }, modify: { say: "اجعل الرقم 4. ثم انطلق.", tap: "4" } }
      },
      wall: {
        title: "الباب 4 · قف",
        idea: "قف عند الجدار.",
        help: { predict: { say: "شاهد.", tap: "شاهد" }, run: { say: "شاهد.", tap: "شاهد" }, investigate: { say: "قف داخل كرر.", tap: "1" }, modify: { say: "انطلق.", tap: "انطلق" } }
      },
      score: {
        title: "الباب 5 · نقطة",
        idea: "قف. ثم عد.",
        help: { predict: { say: "المس 1.", tap: "1" }, run: { say: "شاهد.", tap: "شاهد" }, investigate: { say: "النقطة عند الجدار.", tap: "1" }, modify: { say: "المس نقطة. ثم انطلق.", tap: "نقطة" } }
      }
    }
  },

  uk: {
    lang: "uk",
    startLine: "Торкнись ходів. Доведи бота до коробки.",
    roll: "Старт",
    doorList: "Двері",
    teacher: "Вчитель",
    notes: "Нотатки",
    bigText: "Великий текст",
    fewerAnswers: "Менше відповідей",
    on: "Увімк",
    off: "Вимк",
    emptyList: "Коду ще немає. Ця програма порожня. Обери, що робить бот.",
    move: "Вперед",
    repeat: "Повтори",
    end: "Кінець",
    stop: "Стоп",
    score: "Бал",
    didIt: "Ти зміг.",
    look: "Дивись",
    speak: "Прочитай мені",
    stopSpeak: "Стоп",
    guess: "Вгадай",
    watch: "Дивись",
    find: "Знайди",
    fix: "Виправ",
    done: "Готово",
    go: "ПУСК",
    undo: "Назад",
    zoneCode: "Код",
    zoneOptions: "Варіанти",
    zoneOutput: "Результат",
    lock: "Гаразд",
    nextDoor: "Наступні двері",
    footer: "Koderized KZ 1.25.0 · лише псевдонім",
    doors: {
      zero: {
        title: "Двері 1 · Один хід",
        idea: "Одна картинка. Один дотик. Бот це робить.",
        help: {
          predict: { say: "Коду ще немає. Торкнись 1.", tap: "1" },
          run: { say: "Дивись на картинку.", tap: "Дивись" },
          investigate: { say: "Команда — це одна дія.", tap: "1" },
          modify: { say: "Торкнись Вперед. Потім ПУСК.", tap: "Вперед" }
        }
      }
    }
  },
  ru: {
    lang: "ru",
    startLine: "Нажми ходы. Доведи бота до коробки.",
    roll: "Старт",
    doorList: "Двери",
    teacher: "Учитель",
    notes: "Заметки",
    bigText: "Крупный текст",
    fewerAnswers: "Меньше ответов",
    on: "Вкл",
    off: "Выкл",
    emptyList: "Кода ещё нет. Эта программа пустая. Выбери, что делает бот.",
    move: "Вперёд",
    repeat: "Повтори",
    end: "Конец",
    stop: "Стоп",
    score: "Балл",
    didIt: "Ты смог.",
    look: "Смотри",
    speak: "Прочитай мне",
    stopSpeak: "Стоп",
    guess: "Угадай",
    watch: "Смотри",
    find: "Найди",
    fix: "Исправь",
    done: "Готово",
    go: "ПУСК",
    undo: "Назад",
    zoneCode: "Код",
    zoneOptions: "Варианты",
    zoneOutput: "Результат",
    lock: "Ок",
    nextDoor: "Следующая дверь",
    footer: "Koderized KZ 1.25.0 · только псевдоним",
    doors: {
      zero: {
        title: "Дверь 1 · Один ход",
        idea: "Одна картинка. Одно нажатие. Бот это делает.",
        help: {
          predict: { say: "Кода ещё нет. Нажми 1.", tap: "1" },
          run: { say: "Смотри на картинку.", tap: "Смотри" },
          investigate: { say: "Команда — это одно действие.", tap: "1" },
          modify: { say: "Нажми Вперёд. Потом ПУСК.", tap: "Вперёд" }
        }
      }
    }
  },
  "fa-AF": {
    lang: "fa-AF",
    startLine: "حرکت‌ها را لمس کن. ربات را به جعبه برسان.",
    roll: "شروع",
    doorList: "درها",
    teacher: "معلم",
    notes: "یادداشت",
    bigText: "متن بزرگ",
    fewerAnswers: "جواب کمتر",
    on: "روشن",
    off: "خاموش",
    emptyList: "هنوز کود نیست. این برنامه خالی است. انتخاب کن ربات چه کند.",
    move: "به پیش",
    repeat: "تکرار",
    end: "پایان",
    stop: "ایست",
    score: "نمره",
    didIt: "توانستی.",
    look: "ببین",
    speak: "برایم بخوان",
    stopSpeak: "ایست",
    guess: "حدس",
    watch: "ببین",
    find: "پیدا کن",
    fix: "درست کن",
    done: "تمام",
    go: "برو",
    undo: "برگشت",
    zoneCode: "کود",
    zoneOptions: "گزینه‌ها",
    zoneOutput: "نتیجه",
    lock: "خوب",
    nextDoor: "در بعدی",
    footer: "Koderized KZ 1.25.0 · فقط نام مستعار",
    doors: {
      zero: {
        title: "در ۱ · یک حرکت",
        idea: "یک تصویر. یک لمس. ربات همان را می‌کند.",
        help: {
          predict: { say: "هنوز کود نیست. ۱ را لمس کن.", tap: "۱" },
          run: { say: "تصویر را ببین.", tap: "ببین" },
          investigate: { say: "فرمان یک کار است.", tap: "۱" },
          modify: { say: "به پیش را لمس کن. سپس برو.", tap: "به پیش" }
        }
      }
    }
  },
  rw: {
    lang: "rw",
    startLine: "Kanda intambwe. Egeza roboti ku gasanduku.",
    roll: "Tangira",
    doorList: "Inzugi",
    teacher: "Umwarimu",
    notes: "Inyandiko",
    bigText: "Inyandiko nini",
    fewerAnswers: "Ibisubizo bike",
    on: "Kuri",
    off: "Hafi",
    emptyList: "Nta kode irahari. Iyi porogaramu irimo ubusa. Hitamo icyo roboti ikora.",
    move: "Imbere",
    repeat: "Subiramo",
    end: "Soza",
    stop: "Hagarara",
    score: "Amanota",
    didIt: "Warabikoze.",
    look: "Reba",
    speak: "Msome",
    stopSpeak: "Hagarara",
    guess: "Tekereza",
    watch: "Reba",
    find: "Shaka",
    fix: "Kosora",
    done: "Byarangiye",
    go: "Genda",
    undo: "Subira",
    zoneCode: "Kode",
    zoneOptions: "Amahitamo",
    zoneOutput: "Igisubizo",
    lock: "Sawa",
    nextDoor: "Urugi rukurikira",
    footer: "Koderized KZ 1.25.0 · izina ry'umukino gusa",
    doors: {
      zero: {
        title: "Urugi 1 · Intambwe imwe",
        idea: "Ishusho imwe. Ukanda rimwe. Roboti ikora ibyo.",
        help: {
          predict: { say: "Nta kode. Kanda 1.", tap: "1" },
          run: { say: "Reba ishusho.", tap: "Reba" },
          investigate: { say: "Itegeko ni ikintu kimwe.", tap: "1" },
          modify: { say: "Kanda Imbere. Hanyuma Genda.", tap: "Imbere" }
        }
      }
    }
  },
  ti: {
    lang: "ti",
    startLine: "እንቅስቃሰታት ጠውቕ። ነቲ ሮቦት ናብ ሳንዱቕ ኣብጽሖ።",
    roll: "ጀምር",
    doorList: "ማዕጾታት",
    teacher: "መምህር",
    notes: "መዘኻኸሪ",
    bigText: "ዓቢ ጽሑፍ",
    fewerAnswers: "ውሑዳት መልስታት",
    on: "ወልዕ",
    off: "ኣጥፍእ",
    emptyList: "ኮድ የለን። እዚ ፕሮግራም ባዶ እዩ። ነቲ ሮቦት እንታይ ከም ዝገብር ምረጽ።",
    move: "ንቕድሚት",
    repeat: "ድገም",
    end: "መወዳእታ",
    stop: "ደው ኣብል",
    score: "ነጥቢ",
    didIt: "ገይርካዮ።",
    look: "ርአ",
    speak: "ኣንብበለይ",
    stopSpeak: "ደው ኣብል",
    guess: "ግመት",
    watch: "ርአ",
    find: "ረኽብ",
    fix: "ኣዐሪ",
    done: "ተወዲኡ",
    go: "ኪድ",
    undo: "ምለስ",
    zoneCode: "ኮድ",
    zoneOptions: "ምርጫታት",
    zoneOutput: "ውጽኢት",
    lock: "ሕራይ",
    nextDoor: "ዝቕጽል ማዕጾ",
    footer: "Koderized KZ 1.25.0 · ሳጓ ብቻ",
    doors: {
      zero: {
        title: "ማዕጾ 1 · ሓደ ምንቅስቓስ",
        idea: "ሓንቲ ስእሊ። ሓንቲ ምጥዋቕ። ሮቦት እዚ ይገብር።",
        help: {
          predict: { say: "ኮድ የለን። 1 ጠውቕ።", tap: "1" },
          run: { say: "ነቲ ስእሊ ርአ።", tap: "ርአ" },
          investigate: { say: "ትእዛዝ ሓደ ነገር እዩ።", tap: "1" },
          modify: { say: "ንቕድሚት ጠውቕ። ድሕሪኡ ኪድ።", tap: "ንቕድሚት" }
        }
      }
    }
  },

};
