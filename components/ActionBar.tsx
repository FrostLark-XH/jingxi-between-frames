"use client";

type Props = {
  text: string;
  onSave: () => void;
  isDeveloping?: boolean;
};

export default function ActionBar({ text, onSave, isDeveloping = false }: Props) {
  return (
    <div className="flex items-center gap-3">
      {/* Save button — "开始显影" */}
      <button
        onClick={onSave}
        disabled={!text.trim() || isDeveloping}
        className="flex h-12 flex-1 items-center justify-center text-sm font-medium tracking-wider text-text-primary transition-all active:scale-[0.98] disabled:opacity-25"
        style={{
          borderRadius: "8px",
          background: text.trim() && !isDeveloping
            ? "linear-gradient(135deg, var(--accent) 0%, var(--accent-soft) 100%)"
            : "var(--surface-2)",
          boxShadow: text.trim() && !isDeveloping
            ? "var(--shadow-glow)"
            : "none",
          opacity: isDeveloping ? 0.5 : undefined,
        }}
      >
        {isDeveloping ? "显影中..." : "开始显影"}
      </button>
    </div>
  );
}
