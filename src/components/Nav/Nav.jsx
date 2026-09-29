import React, { useEffect, useState } from "react";
import styles from "./Nav.module.css";

const LINKS = [
  { id: "about", label: "About" },
  { id: "skills", label: "Skills" },
  { id: "projects", label: "Projects" },
  { id: "experience", label: "Experience" },
  { id: "contact", label: "Contact" },
];

export default function Nav({ theme, onToggleTheme }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ""}`}>
      <div className={styles.links}>
        {LINKS.map((l) => (
          <a key={l.id} href={`#${l.id}`} className={styles.link}>
            {l.label}
          </a>
        ))}
      </div>

      <button
        className={styles.themeBtn}
        onClick={onToggleTheme}
        title={theme === "dark" ? "Switch to light" : "Switch to dark"}
        aria-label="Toggle color theme"
      >
        {theme === "dark" ? "☀" : "☾"}
      </button>
    </nav>
  );
}
