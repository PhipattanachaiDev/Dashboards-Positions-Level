export interface PositionItem {
  id: string;
  name: string;        // Name (English)
  nameTh?: string;     // Name (Thai)
  nameCh?: string;     // Name (Chinese)
  nameVi?: string;     // Name (Vietnamese)
  section?: string;    // Section
  salaryType?: 'Normal' | 'Commission';
  code?: string;
  parentId?: string;
  permissions?: string[];
}

export interface Level {
  id: number;
  name: string;
  items: PositionItem[];
}
