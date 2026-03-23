"use client";

interface StatusToastProps {
  message: string | null;
  type: string;
}

export default function StatusToast({ message, type }: StatusToastProps) {
  if (!message) return null;

  const colorMap: Record<string, string> = {
    success: "bg-hub-success/20 text-hub-success border-hub-success/30",
    error: "bg-hub-error/20 text-hub-error border-hub-error/30",
    warning: "bg-hub-warning/20 text-hub-warning border-hub-warning/30",
    info: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-up">
      <div
        className={`px-5 py-3 rounded-xl border text-sm font-semibold shadow-lg backdrop-blur-sm ${colorMap[type] || colorMap.info}`}
      >
        {message}
      </div>
    </div>
  );
}
