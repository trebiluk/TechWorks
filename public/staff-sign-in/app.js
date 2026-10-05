const boxes = document.getElementById("boxes");
const status = document.getElementById("status");
for (let i = 0; i < 6; i++) {
  const input = document.createElement("input");
  input.maxLength = 1;
  input.inputMode = "numeric";
  input.autocomplete = "one-time-code";
  input.setAttribute("aria-label", "Digit " + (i + 1));
  input.addEventListener("input", () => {
    input.value = input.value.replace(/\D/g, "").slice(-1);
    if (input.value && input.nextElementSibling) input.nextElementSibling.focus();
  });
  input.addEventListener("keydown", (event) => {
    if (event.key === "Backspace" && !input.value && input.previousElementSibling) {
      input.previousElementSibling.focus();
    }
  });
  boxes.appendChild(input);
}
function say(text) {
  status.textContent = text;
}
function notReady(body) {
  return body && (body.reason === "staff-login-not-set-up" || body.error === "missing" || body.error === "server-not-ready");
}
async function post(path, body) {
  const res = await fetch(path, {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json", "x-kn-staff": "1" },
    body: JSON.stringify(body || {}),
  });
  const data = await res.json().catch(() => ({}));
  data._status = res.status;
  return data;
}
document.getElementById("use-code").onclick = () => {
  document.getElementById("code").hidden = false;
  boxes.querySelector("input").focus();
};
document.getElementById("use-recovery").onclick = () => {
  document.getElementById("recovery").hidden = false;
};
document.getElementById("passkey").onclick = async () => {
  say("Checking the passkey…");
  try {
    const options = await post("/api/staff/login/options", {});
    if (notReady(options)) {
      say("Staff sign-in is not set up on this desk yet.");
      return;
    }
    if (options.error || options._status >= 400) throw new Error(options.error || "sign-in");
    await window.SimpleWebAuthnBrowser.startAuthentication({ optionsJSON: options });
    say("Signed in.");
  } catch {
    say("Passkey did not open. You can use a code instead.");
    document.getElementById("code").hidden = false;
  }
};
document.getElementById("code-go").onclick = async () => {
  const code = [...boxes.querySelectorAll("input")].map((el) => el.value).join("");
  const shared = document.getElementById("shared").checked;
  const body = await post("/api/staff/login/totp", { code, shared });
  const lock = document.getElementById("lock");
  if (body.error === "locked" && body.until) {
    lock.hidden = false;
    lock.textContent = "Too many tries. Try again at " + new Date(body.until).toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit" }) + ".";
    return;
  }
  if (notReady(body)) {
    lock.hidden = false;
    lock.textContent = "Code sign-in is not turned on yet.";
    return;
  }
  if (body.error || body._status >= 400) {
    lock.hidden = false;
    lock.textContent = "That code did not work.";
  }
};
