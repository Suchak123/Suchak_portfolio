import React, { useState } from "react";
import Admin from "./Admin";
import styles from "./AdminGate.module.css";

// Client-side gate for the #admin route. NOTE: this is a deterrent, not real
// security — there is no backend, so credentials are still bundled into the
// built JS. Moving them to env vars just keeps them out of the source tree.
// Configure VITE_ADMIN_USER / VITE_ADMIN_PASSWORD in .env (see .env.example).
const USERNAME = import.meta.env.VITE_ADMIN_USER;
const PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;
const AUTH_KEY = "pf_admin_auth";

export default function AdminGate({ onClose }) {
  const [authed, setAuthed] = useState(
    () => sessionStorage.getItem(AUTH_KEY) === "1"
  );
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

  if (authed) {
    return (
      <Admin
        onClose={onClose}
        onLogout={() => {
          sessionStorage.removeItem(AUTH_KEY);
          setAuthed(false);
        }}
      />
    );
  }

  const submit = (e) => {
    e.preventDefault();
    if (!USERNAME || !PASSWORD) {
      setError("Admin credentials are not configured (set VITE_ADMIN_* in .env).");
      return;
    }
    if (user.trim() === USERNAME && pass === PASSWORD) {
      sessionStorage.setItem(AUTH_KEY, "1");
      setAuthed(true);
    } else {
      setError("Access denied — invalid credentials.");
      setPass("");
    }
  };

  return (
    <div className={styles.gate}>
      <form className={styles.card} onSubmit={submit}>
        <div className={styles.head}>
          <span className={styles.mark} aria-hidden="true" />
          <div>
            <h1 className={styles.title}>authentication required</h1>
            <p className={styles.sub}>portfolio admin · restricted</p>
          </div>
        </div>

        <label className={styles.label}>
          username
          <input
            className={styles.input}
            value={user}
            onChange={(e) => { setUser(e.target.value); setError(""); }}
            autoComplete="username"
            autoFocus
            spellCheck={false}
          />
        </label>

        <label className={styles.label}>
          password
          <input
            className={styles.input}
            type="password"
            value={pass}
            onChange={(e) => { setPass(e.target.value); setError(""); }}
            autoComplete="current-password"
          />
        </label>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <button type="button" className={styles.ghost} onClick={onClose}>
            ← back to site
          </button>
          <button type="submit" className={styles.primary}>
            sign in
          </button>
        </div>
      </form>
    </div>
  );
}
