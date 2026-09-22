interface PillTabsProps<T extends string> {
  tabs: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

export function PillTabs<T extends string>({ tabs, value, onChange }: PillTabsProps<T>) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
            value === tab.value ? "bg-brand-700 text-white shadow-sm" : "bg-white text-brand-700 hover:bg-brand-50"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
