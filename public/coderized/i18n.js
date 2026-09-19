/* KZ 1.11.0 — short lines, 1:1 EN/ES. Pictograms carry the rest. */
window.I18N = {
  en: {
    lang: "en",
    start: "Start here.",
    hint: "Watch the picture. Tap the glow. Door 1 is a win today.",
    d1: "One move", d2: "More moves", d3: "Repeat", d4: "Stop", d5: "Score",
    classCode: "Class code",
    alias: "Alias (not a legal name)",
    aliasPh: "Scout",
    ferpaJoin: "Alias only. No IEP, 504, or legal name.",
    roll: "Start",
    teacher: "Teacher",
    aide: "Aide",
    walk: "Walk with me",
    big: "Big words",
    home: "Home",
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
    ferpaAide: "Alias only. No IEP, 504, or legal name.",
    winPeriod: "Door 1 is a win today.",
    emptyList: "Empty. Add one.",
    move: "move",
    repeat: "repeat",
    end: "end",
    stop: "stop",
    score: "score",
    cost: "One cost",
    look: "Look",
    example: "Example",
    footer: "Koderized KZ 1.11.0 · alias only · not a SIS · no IEP/504",
    sit: "SIT", crate: "CRATE", rollShout: "ROLL", safe: "SAFE", bonk: "BONK",
    doors: {
      zero: {
        title: "Door 1 · One move",
        idea: "One picture. One tap. The bot does that.",
        ask: "The list is empty. What does the bot do?",
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
          predict: { say: "Empty list. Bot sits. Tap 1.", tap: "1" },
          run: { say: "Watch the picture.", tap: "Watch" },
          investigate: { say: "A command is one thing.", tap: "1, then Next" },
          modify: { say: "Tap move. Then GO.", tap: "move, then GO" }
        }
      },
      line: {
        title: "Door 2 · More moves",
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
          modify: { say: "Tap move. Then GO.", tap: "move, then GO" }
        }
      },
      loop: {
        title: "Door 3 · Repeat",
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
    ferpaJoin: "Solo apodo. No IEP, 504, ni nombre legal.",
    roll: "Empezar",
    teacher: "Maestro",
    aide: "Asistente",
    walk: "Camina conmigo",
    big: "Letras grandes",
    home: "Inicio",
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
    ferpaAide: "Solo apodo. No IEP, 504, ni nombre legal.",
    winPeriod: "La Puerta 1 ya es un logro hoy.",
    emptyList: "Vacío. Agrega uno.",
    move: "mover",
    repeat: "repetir",
    end: "fin",
    stop: "parar",
    score: "sumar",
    cost: "Un costo",
    look: "Mira",
    example: "Ejemplo",
    footer: "Koderized KZ 1.11.0 · solo apodo · no es SIS · sin IEP/504",
    sit: "SIT", crate: "CAJA", rollShout: "ROLL", safe: "SAFE", bonk: "BONK",
    doors: {
      zero: {
        title: "Puerta 1 · Un mover",
        idea: "Un dibujo. Un toque. El bot lo hace.",
        ask: "La lista está vacía. ¿Qué hace el bot?",
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
          predict: { say: "Lista vacía. El bot se queda. Toca 1.", tap: "1" },
          run: { say: "Mira el dibujo.", tap: "Mira" },
          investigate: { say: "Una orden es una cosa.", tap: "1, luego Next" },
          modify: { say: "Toca mover. Luego GO.", tap: "mover, luego GO" }
        }
      },
      line: {
        title: "Puerta 2 · Más mover",
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
  }
};
