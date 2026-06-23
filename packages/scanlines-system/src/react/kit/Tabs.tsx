export interface TabItem { id: string; label: string }
export interface TabsProps {
  tabs: TabItem[]
  activeId: string
  onSelect: (id: string) => void
}

export function Tabs({ tabs, activeId, onSelect }: TabsProps) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={t.id === activeId}
          className="tabs__tab"
          onClick={() => onSelect(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
