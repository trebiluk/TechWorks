import { useEffect, useState } from "react";

type World = { alias: string; world: string; rev: number; bytes: number; updatedAt: number; alias_ref: string };
type Rev = { rev: number; at: number; why: string };

export function BtWorldsStaff() {
  const [worlds, setWorlds] = useState<World[]>([]);
  const [revs, setRevs] = useState<Rev[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ world: string; alias_ref: string; rev: number; current: number } | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/staff/bertopia/worlds", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => { if (j.ok) setWorlds(j.worlds || []); })
      .catch(() => {});
  }, []);

  async function loadRevs(w: World) {
    setOpen(w.alias_ref + ":" + w.world);
    const res = await fetch(`/api/staff/bertopia/revs?world=${encodeURIComponent(w.world)}&alias_ref=${encodeURIComponent(w.alias_ref)}`, { credentials: "include" });
    const j = await res.json();
    if (j.ok) setRevs(j.revs || []);
  }

  async function doRestore() {
    if (!confirm) return;
    const res = await fetch("/api/staff/bertopia/restore", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ world: confirm.world, alias_ref: confirm.alias_ref, rev: confirm.rev, if_match: String(confirm.current) }),
    });
    const j = await res.json();
    setMsg(j.ok ? `Restored. New head rev ${j.rev}. Old head kept.` : "Restore failed");
    setConfirm(null);
  }

  return (
    <section className="bt-worlds-staff" style={{ margin: "16px 0", padding: "12px", background: "#f8fafc", borderRadius: 12 }}>
      <h3 style={{ margin: "0 0 12px", fontSize: 16 }}>TechWorks staff › Bertopia worlds (read-only)</h3>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ textAlign: "left", color: "#64748b" }}>
            <th>Alias</th><th>World</th><th>Rev</th><th>Saved</th><th></th>
          </tr>
        </thead>
        <tbody>
          {worlds.map((w) => (
            <tr key={w.alias_ref + w.world} style={{ borderTop: "1px solid #e2e8f0" }}>
              <td style={{ padding: "8px 4px" }}>{w.alias}</td>
              <td>{w.world}</td>
              <td>{w.rev}</td>
              <td>{new Date(w.updatedAt).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</td>
              <td>
                <button type="button" onClick={() => loadRevs(w)} style={{ minHeight: 44, padding: "8px 12px", border: "1px solid #2563eb", background: "#fff", color: "#2563eb", borderRadius: 8, cursor: "pointer" }}>
                  Revs · Restore…
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {open && revs.length > 0 && (
        <div style={{ marginTop: 12, padding: 12, background: "#fff", borderRadius: 8 }}>
          <p style={{ margin: "0 0 8px", fontWeight: 600 }}>Revs for this world</p>
          {revs.map((r) => (
            <div key={r.rev} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
              <span>rev {r.rev} · {new Date(r.at).toLocaleString()} · {r.why}</span>
              <button type="button" onClick={() => setConfirm({ world: open.split(":")[1], alias_ref: open.split(":")[0], rev: r.rev, current: worlds.find(w => w.alias_ref + ":" + w.world === open)?.rev || 0 })} style={{ minHeight: 44, padding: "6px 12px" }}>
                Restore
              </button>
            </div>
          ))}
        </div>
      )}
      {confirm && (
        <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ background: "#fff", padding: 24, borderRadius: 12, maxWidth: 420 }}>
            <p style={{ margin: "0 0 8px", fontWeight: 600 }}>Restore rev {confirm.rev} as the new head?</p>
            <p style={{ margin: "0 0 16px", color: "#475569" }}>Rev {confirm.current} is kept. This is logged.</p>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button type="button" onClick={doRestore} style={{ minHeight: 44, padding: "10px 20px", background: "#2563eb", color: "#fff", border: 0, borderRadius: 8 }}>Restore</button>
              <button type="button" onClick={() => setConfirm(null)} style={{ minHeight: 44, padding: "10px 20px", background: "#fff", border: "1px solid #cbd5e1", borderRadius: 8 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {msg && <p style={{ marginTop: 8, color: "#166534" }}>{msg}</p>}
    </section>
  );
}
