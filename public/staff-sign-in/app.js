const boxes = document.getElementById("boxes");
for (let i = 0; i < 6; i++) {
  const input = document.createElement("input");
  input.maxLength = 1;
  input.inputMode = "numeric";
  input.setAttribute("aria-label", "Digit " + (i + 1));
  boxes.appendChild(input);
}
async function post(path, body) {
  const res = await fetch(path, {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json", "x-kn-staff": "1" },
    body: JSON.stringify(body || {}),
  });
  return res.json();
}
document.getElementById("use-code").onclick = () => {
  document.getElementById("code").hidden = false;
};
document.getElementById("passkey").onclick = async () => {
  try {
    const options = await post("/api/staff/login/options", {});
    if (options.error) throw new Error(options.error);
    await window.SimpleWebAuthnBrowser.startAuthentication({ optionsJSON: options });
  } catch {
    document.getElementById("code").hidden = false;
  }
};
document.getElementById("code-go").onclick = async () => {
  const code = [...boxes.querySelectorAll("input")].map((el) => el.value).join("");
  const shared = document.getElementById("shared").checked;
  const body = await post("/api/staff/login/totp", { code, shared });
  if (body.error === "locked" && body.until) {
    const lock = document.getElementById("lock");
    lock.hidden = false;
    lock.textContent = "Too many tries. Try again at " + new Date(body.until).toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit" }) + ".";
  }
};
