// src/utils/groupByChecklist.ts
export type ChecklistArea = {
  id: string;
  title: string;
  items: { id: string; title: string }[];
};

export type Finding = {
  id: string;
  label: string;
  state: 'ok' | 'obs' | 'kritisk';
  criticality?: number;
  costIndicator?: number;
  note?: string;
  thumb?: string;
  photoFull?: string;
};

export type Group = {
  id: string;
  label: string;
  items: Finding[];
};

export function buildGroupsFromChecklist(rows: Finding[], checklist: { areas: ChecklistArea[] }): Group[] {
  const rowsById = new Map(rows.map(r => [r.id, r]));
  const groups: Group[] = [];

  for (const area of checklist.areas) {
    const items = area.items
      .map(it => rowsById.get(it.id))
      .filter((x): x is Finding => !!x);

    if (items.length > 0) {
      groups.push({ id: area.id, label: area.title, items });
    }
  }

  const assigned = new Set(groups.flatMap(g => g.items.map(i => i.id)));
  const unassigned = rows.filter(r => !assigned.has(r.id));
  if (unassigned.length > 0) {
    groups.push({ id: 'other', label: 'Other', items: unassigned });
  }

  return groups;
}