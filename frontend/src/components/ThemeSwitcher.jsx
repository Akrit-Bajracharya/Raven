import { useState, useRef, useEffect } from "react";
import { Palette, X, Check, ChevronDown } from "lucide-react";

import { themeCategories } from "../lib/theme";
import useThemeStore from "../store/useThemestore";

const ThemeSwitcher = () => {
  const { currentTheme, themes, setTheme } = useThemeStore();
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const panelRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  const filtered =
    activeCategory === "all"
      ? themes
      : themes.filter((t) => t.category === activeCategory);

  return (
    <div className="theme-switcher-wrapper" ref={panelRef}>

      {/* ── Full-width trigger button ── */}
      <button
        className="theme-trigger-btn"
        onClick={() => setIsOpen((v) => !v)}
        title="Switch theme"
        aria-label="Open theme switcher"
        aria-expanded={isOpen}
      >
        {/* Left side: icon + colour dots + name */}
        <div className="theme-trigger-left">
          <Palette size={15} />
          <div className="theme-trigger-dots">
            {currentTheme.preview.map((color, i) => (
              <span
                key={i}
                className="theme-trigger-dot"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <span className="theme-trigger-name">{currentTheme.name}</span>
        </div>

        {/* Right side: chevron */}
        <ChevronDown
          size={14}
          style={{
            flexShrink: 0,
            transition: "transform 0.18s ease",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {/* ── Dropdown panel ── */}
      {isOpen && (
        <div className="theme-panel" role="dialog" aria-label="Theme switcher">

          {/* Header */}
          <div className="theme-panel-header">
            <span className="theme-panel-title">Choose Theme</span>
            <button
              className="theme-panel-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close"
            >
              <X size={15} />
            </button>
          </div>

          {/* Category filter pills */}
          <div className="theme-categories">
            {themeCategories.map((cat) => (
              <button
                key={cat.id}
                className={`theme-cat-btn ${activeCategory === cat.id ? "active" : ""}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* 3-column theme grid */}
          <div className="theme-grid">
            {filtered.map((theme) => {
              const isActive = currentTheme.id === theme.id;
              return (
                <button
                  key={theme.id}
                  className={`theme-card ${isActive ? "active" : ""}`}
                  onClick={() => {
                    setTheme(theme);
                    setIsOpen(false);
                  }}
                  title={theme.name}
                  aria-pressed={isActive}
                >
                  <div className="theme-preview">
                    {theme.preview.map((color, i) => (
                      <span
                        key={i}
                        className="theme-swatch"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <span className="theme-card-name">{theme.name}</span>
                  {isActive && (
                    <span className="theme-card-check">
                      <Check size={11} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <p className="theme-count">
            {filtered.length} of {themes.length} themes
          </p>
        </div>
      )}
    </div>
  );
};

export default ThemeSwitcher;