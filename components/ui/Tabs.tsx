"use client";

import React, { useState } from "react";

interface Tab {
  key: string;
  label: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (key: string) => void;
  children?: (activeTab: string) => React.ReactNode;
}

export function Tabs({ tabs, defaultTab, onChange, children }: TabsProps) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.key ?? "");

  function select(key: string) {
    setActive(key);
    onChange?.(key);
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid var(--bd)",
          padding: "0 16px",
          background: "#fff",
          flexWrap: "wrap",
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => select(tab.key)}
            style={{
              padding: "9px 13px",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
              color: active === tab.key ? "var(--accent)" : "var(--tm)",
              background: "none",
              border: "none",
              borderBottom: active === tab.key ? "2px solid var(--accent)" : "2px solid transparent",
              transition: "all 0.12s",
              whiteSpace: "nowrap",
              marginBottom: -1,
              fontFamily: "inherit",
            } as React.CSSProperties}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {children && children(active)}
    </div>
  );
}
