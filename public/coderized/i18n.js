/* KZ 1.9.0 chrome — EN/ES. Alias only. No IEP/504 fields. */
window.I18N = {
  en: {
    lang: "en",
    start: "Start at zero.",
    hint: "One command. Then a line. Then a loop. Door 1 this period is a win.",
    d1: "One command", d2: "A line of steps", d3: "Repeat", d4: "Don’t wreck the bot", d5: "Stop and score",
    classCode: "Class code",
    alias: "Alias (not your legal name)",
    aliasPh: "Scout",
    ferpaJoin: "Chrome on a Chromebook. Alias only. Do not type IEP, 504, or a legal name.",
    roll: "Roll out",
    teacher: "Teacher",
    aide: "Aide",
    walk: "Walk with me",
    big: "Big words",
    home: "Home",
    guess: "Guess", watch: "Watch", find: "Find it", fix: "Fix", done: "Done",
    lock: "Lock it",
    go: "GO",
    undo: "Undo",
    nextDoor: "Next door",
    period: "Period board",
    notes: "Notes",
    freeze: "Freeze",
    unfreeze: "Unfreeze",
    clearSpot: "Clear spotlight",
    export: "Export CSV",
    walkRed: "Walk red first",
    roster: "Roster",
    log: "Log",
    heat: "HEAT",
    present: "Present",
    guessed: "Guessed",
    stuck: "Stuck",
    coach: "Coach",
    doneKpi: "Done",
    aideTitle: "Aide card",
    say: "Say",
    tap: "Tap next",
    ferpaAide: "Alias only. Do not type IEP, 504, ELL labels, or legal names. This is not a SIS.",
    winPeriod: "Door 1 this period is a win. Stop there if time is short.",
    emptyList: "Empty list. Add a command.",
    move: "move",
    repeat: "repeat",
    end: "end",
    stop: "if wall: stop",
    score: "score",
    cost: "One cost you accepted",
    footer: "Koderized KZ 1.9.0 · alias only · not a district SIS · no IEP/504 in this cart",
    doors: {
      zero: {
        title: "Door 1 · One command",
        idea: "A command is one thing the bot does.",
        ask: "The list is empty. What does the bot do?",
        choices: [
          { p: "sit", t: "1 · It sits. Nothing happens." },
          { p: "roll", t: "2 · It rolls by itself." },
          { p: "vanish", t: "3 · It vanishes." }
        ],
        probeAsk: "What is a command?",
        probes: [
          { v: "do", t: "1 · One thing the bot does" },
          { v: "guess", t: "2 · A lucky guess" },
          { v: "wall", t: "3 · The saw wall" }
        ],
        tests: ["The bot moved", "One step onto the crate", "Exactly one move"],
        help: {
          predict: { say: "The list is empty. Nothing happens. Pick 1.", tap: "1 · It sits" },
          run: { say: "Watch. The bot should sit.", tap: "Watch" },
          investigate: { say: "A command is one thing the bot does.", tap: "1, then Next" },
          modify: { say: "Tap move. Then GO. That is a program.", tap: "move, then GO" }
        }
      },
      line: {
        title: "Door 2 · A line of steps",
        idea: "Commands run in order, top to bottom.",
        ask: "Watch three moves. Where does the bot stop?",
        choices: [
          { p: "short", t: "1 · Short of the crate" },
          { p: "crate", t: "2 · On the crate" },
          { p: "past", t: "3 · Past the crate" }
        ],
        probeAsk: "Why was it short?",
        probes: [
          { v: "few", t: "1 · Not enough moves" },
          { v: "order", t: "2 · The order was backwards" },
          { v: "wall", t: "3 · A hidden wall" }
        ],
        tests: ["Stops on the crate", "Added at least one more move", "Only moves — a line"],
        help: {
          predict: { say: "Three moves is not enough. Pick 1.", tap: "1 · Short of the crate" },
          run: { say: "Watch the three moves.", tap: "Watch" },
          investigate: { say: "We need more moves in a line.", tap: "1, then Next" },
          modify: { say: "Tap move one more time. Then GO.", tap: "move, then GO" }
        }
      },
      loop: {
        title: "Door 3 · Repeat",
        idea: "Repeat does the inside many times. Poke the gold number.",
        ask: "A long line of moves, or one repeat. Which is the loop?",
        choices: [
          { p: "repeat", t: "1 · Repeat · move · end" },
          { p: "line", t: "2 · Move, move, move, move…" },
          { p: "stop", t: "3 · If wall: stop" }
        ],
        probeAsk: "What does the gold number mean?",
        probes: [
          { v: "count", t: "1 · How many times to do the inside" },
          { v: "score", t: "2 · Your grade" },
          { v: "speed", t: "3 · How fast it rolls" }
        ],
        tests: ["Stops on the crate", "Used a repeat", "Poked repeat to 4"],
        help: {
          predict: { say: "A loop is repeat. Pick 1.", tap: "1 · Repeat" },
          run: { say: "Watch a line of moves. Next we will use a loop.", tap: "Watch" },
          investigate: { say: "The gold number is how many times.", tap: "1, then Next" },
          modify: { say: "Tap the gold 2 until it says 4. Then GO.", tap: "gold number → 4, then GO" }
        }
      },
      wall: {
        title: "Door 4 · Don’t wreck the bot",
        idea: "The bot cannot see the wall unless you ask.",
        ask: "What happens at the wall?",
        choices: [
          { p: "stop", t: "1 · It slams the brakes" },
          { p: "through", t: "2 · It ghosts through" },
          { p: "forever", t: "3 · It never stops" }
        ],
        probeAsk: "Where is STOP?",
        probes: [
          { v: "inside", t: "1 · In the loop" },
          { v: "outside", t: "2 · After the loop" }
        ],
        tests: ["Stops at wall", "Doesn’t run forever", "Asks if wall"],
        help: {
          predict: { say: "It needs a sensor. We will add if wall: stop.", tap: "Watch, then Fix" },
          run: { say: "Watch. Does it wreck?", tap: "Watch" },
          investigate: { say: "STOP belongs in the loop.", tap: "1, then Next" },
          modify: { say: "Keep if wall: stop inside the repeat. Then GO.", tap: "GO" }
        }
      },
      score: {
        title: "Door 5 · Stop and score",
        idea: "A sensor can stop and count.",
        ask: "It already stops. What is still missing?",
        choices: [
          { p: "score", t: "1 · Score when it sees the wall" },
          { p: "faster", t: "2 · More speed" },
          { p: "name", t: "3 · The bot’s legal name" }
        ],
        probeAsk: "When should score run?",
        probes: [
          { v: "wall", t: "1 · If wall: score" },
          { v: "always", t: "2 · Every move" }
        ],
        tests: ["Stops at wall", "Score goes up", "If wall: score is in the list"],
        help: {
          predict: { say: "We need score at the wall. Pick 1. Never a legal name.", tap: "1" },
          run: { say: "Watch. It stops but score is still no.", tap: "Watch" },
          investigate: { say: "Score runs if wall.", tap: "1, then Next" },
          modify: { say: "Tap score so it is in the list. Then GO.", tap: "score, then GO" }
        }
      }
    }
  },
  es: {
    lang: "es",
    start: "Empieza en cero.",
    hint: "Una orden. Luego una fila. Luego un ciclo. La Puerta 1 ya es un logro hoy.",
    d1: "Una orden", d2: "Una fila de pasos", d3: "Repetir", d4: "No rompas el bot", d5: "Parar y sumar",
    classCode: "Código de clase",
    alias: "Apodo (no tu nombre legal)",
    aliasPh: "Scout",
    ferpaJoin: "Chrome en Chromebook. Solo apodo. No escribas IEP, 504, ni un nombre legal.",
    roll: "Salir",
    teacher: "Maestro",
    aide: "Asistente",
    walk: "Camina conmigo",
    big: "Letras grandes",
    home: "Inicio",
    guess: "Adivina", watch: "Mira", find: "Encuéntralo", fix: "Arregla", done: "Listo",
    lock: "Fijar",
    go: "GO",
    undo: "Deshacer",
    nextDoor: "Siguiente puerta",
    period: "Pizarra del período",
    notes: "Notas",
    freeze: "Congelar",
    unfreeze: "Abrir",
    clearSpot: "Quitar foco",
    export: "Exportar CSV",
    walkRed: "Ve primero a los rojos",
    roster: "Lista",
    log: "Registro",
    heat: "CALOR",
    present: "Presentes",
    guessed: "Adivinaron",
    stuck: "Atascados",
    coach: "Listos",
    doneKpi: "Hecho",
    aideTitle: "Tarjeta del asistente",
    say: "Di",
    tap: "Toca ahora",
    ferpaAide: "Solo apodo. No escribas IEP, 504, ELL, ni nombres legales. Esto no es el SIS.",
    winPeriod: "La Puerta 1 ya es un logro. Si el tiempo es corto, paren ahí.",
    emptyList: "Lista vacía. Agrega una orden.",
    move: "mover",
    repeat: "repetir",
    end: "fin",
    stop: "si pared: parar",
    score: "sumar",
    cost: "Un costo que aceptaste",
    footer: "Koderized KZ 1.9.0 · solo apodo · no es el SIS · sin IEP/504 en este carro",
    doors: {
      zero: {
        title: "Puerta 1 · Una orden",
        idea: "Una orden es una cosa que el bot hace.",
        ask: "La lista está vacía. ¿Qué hace el bot?",
        choices: [
          { p: "sit", t: "1 · Se queda. No pasa nada." },
          { p: "roll", t: "2 · Rueda solo." },
          { p: "vanish", t: "3 · Desaparece." }
        ],
        probeAsk: "¿Qué es una orden?",
        probes: [
          { v: "do", t: "1 · Una cosa que el bot hace" },
          { v: "guess", t: "2 · Una suerte" },
          { v: "wall", t: "3 · La sierra" }
        ],
        tests: ["El bot se movió", "Un paso a la caja", "Solo un mover"],
        help: {
          predict: { say: "La lista está vacía. No pasa nada. Elige 1.", tap: "1 · Se queda" },
          run: { say: "Mira. El bot debe quedarse.", tap: "Mira" },
          investigate: { say: "Una orden es una cosa que el bot hace.", tap: "1, luego Next" },
          modify: { say: "Toca mover. Luego GO. Eso es un programa.", tap: "mover, luego GO" }
        }
      },
      line: {
        title: "Puerta 2 · Una fila de pasos",
        idea: "Las órdenes van de arriba hacia abajo.",
        ask: "Mira tres mover. ¿Dónde para el bot?",
        choices: [
          { p: "short", t: "1 · Antes de la caja" },
          { p: "crate", t: "2 · En la caja" },
          { p: "past", t: "3 · Pasó la caja" }
        ],
        probeAsk: "¿Por qué quedó corto?",
        probes: [
          { v: "few", t: "1 · Faltan mover" },
          { v: "order", t: "2 · El orden estaba al revés" },
          { v: "wall", t: "3 · Había una pared" }
        ],
        tests: ["Para en la caja", "Agregó al menos un mover", "Solo mover — una fila"],
        help: {
          predict: { say: "Tres no alcanzan. Elige 1.", tap: "1 · Antes de la caja" },
          run: { say: "Mira los tres pasos.", tap: "Mira" },
          investigate: { say: "Necesitamos más mover en fila.", tap: "1, luego Next" },
          modify: { say: "Toca mover una vez más. Luego GO.", tap: "mover, luego GO" }
        }
      },
      loop: {
        title: "Puerta 3 · Repetir",
        idea: "Repetir hace lo de adentro muchas veces. Toca el número dorado.",
        ask: "¿Cuál es el ciclo?",
        choices: [
          { p: "repeat", t: "1 · Repetir · mover · fin" },
          { p: "line", t: "2 · Mover, mover, mover…" },
          { p: "stop", t: "3 · Si pared: parar" }
        ],
        probeAsk: "¿Qué significa el número dorado?",
        probes: [
          { v: "count", t: "1 · Cuántas veces hacer lo de adentro" },
          { v: "score", t: "2 · Tu nota" },
          { v: "speed", t: "3 · Qué tan rápido rueda" }
        ],
        tests: ["Para en la caja", "Usó repetir", "Número en 4"],
        help: {
          predict: { say: "El ciclo es repetir. Elige 1.", tap: "1 · Repetir" },
          run: { say: "Mira una fila. Luego usamos un ciclo.", tap: "Mira" },
          investigate: { say: "El número dorado es cuántas veces.", tap: "1, luego Next" },
          modify: { say: "Toca el 2 dorado hasta 4. Luego GO.", tap: "número → 4, luego GO" }
        }
      },
      wall: {
        title: "Puerta 4 · No rompas el bot",
        idea: "El bot no ve la pared si no preguntas.",
        ask: "¿Qué pasa en la pared?",
        choices: [
          { p: "stop", t: "1 · Frena" },
          { p: "through", t: "2 · Pasa a través" },
          { p: "forever", t: "3 · Nunca para" }
        ],
        probeAsk: "¿Dónde está PARAR?",
        probes: [
          { v: "inside", t: "1 · Dentro del ciclo" },
          { v: "outside", t: "2 · Después del ciclo" }
        ],
        tests: ["Para en la pared", "No corre para siempre", "Pregunta si pared"],
        help: {
          predict: { say: "Necesita un sensor: si pared: parar.", tap: "Mira, luego Arregla" },
          run: { say: "Mira. ¿Se rompe?", tap: "Mira" },
          investigate: { say: "PARAR va dentro del ciclo.", tap: "1, luego Next" },
          modify: { say: "Deja si pared: parar dentro de repetir. Luego GO.", tap: "GO" }
        }
      },
      score: {
        title: "Puerta 5 · Parar y sumar",
        idea: "Un sensor puede parar y contar.",
        ask: "Ya para. ¿Qué falta?",
        choices: [
          { p: "score", t: "1 · Sumar cuando ve la pared" },
          { p: "faster", t: "2 · Más velocidad" },
          { p: "name", t: "3 · El nombre legal del bot" }
        ],
        probeAsk: "¿Cuándo corre sumar?",
        probes: [
          { v: "wall", t: "1 · Si pared: sumar" },
          { v: "always", t: "2 · En cada mover" }
        ],
        tests: ["Para en la pared", "La suma sube", "Si pared: sumar está en la lista"],
        help: {
          predict: { say: "Falta sumar en la pared. Elige 1. Nunca un nombre legal.", tap: "1" },
          run: { say: "Mira. Para, pero la suma sigue en no.", tap: "Mira" },
          investigate: { say: "Sumar corre si pared.", tap: "1, luego Next" },
          modify: { say: "Toca sumar para ponerlo en la lista. Luego GO.", tap: "sumar, luego GO" }
        }
      }
    }
  }
};
