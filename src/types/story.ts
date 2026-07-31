export type NodeCategory = 
  | 'box'
  | 'note' 
  | 'image'
  | 'heading'
  | 'character' 
  | 'event' 
  | 'place' 
  | 'secret' 
  | 'ending' 
  | 'idea';

export interface CategoryInfo {
  id: NodeCategory;
  name: string;
  namePlural: string;
  icon: string; // Lucide icon name reference
  defaultColor: string;
  lightBg: string;
  darkBg: string;
  borderColor: string;
  description: string;
}

export const NODE_CATEGORIES: Record<NodeCategory, CategoryInfo> = {
  box: {
    id: 'box',
    name: 'مربع عادي',
    namePlural: 'مربعات',
    icon: 'Square',
    defaultColor: '#3b82f6', // blue
    lightBg: 'bg-blue-50/90 hover:bg-blue-100/90',
    darkBg: 'bg-blue-950/40 hover:bg-blue-950/60',
    borderColor: 'border-blue-500',
    description: 'مربع قياسي بنص مركزي واضح قابل للتعديل والتكبير'
  },
  note: {
    id: 'note',
    name: 'مذكرة',
    namePlural: 'مذكرات',
    icon: 'FileText',
    defaultColor: '#f59e0b', // amber
    lightBg: 'bg-amber-50/90 hover:bg-amber-100/90',
    darkBg: 'bg-amber-950/40 hover:bg-amber-950/60',
    borderColor: 'border-amber-500',
    description: 'مذكرة قابلة للتوسيع لعرض مقالات ونصوص طويلة'
  },
  image: {
    id: 'image',
    name: 'صورة',
    namePlural: 'صور',
    icon: 'Image',
    defaultColor: '#10b981', // emerald
    lightBg: 'bg-emerald-50/90 hover:bg-emerald-100/90',
    darkBg: 'bg-emerald-950/40 hover:bg-emerald-950/60',
    borderColor: 'border-emerald-500',
    description: 'إطار صورة يمكن رفعها أو اختيارها من الاستوديو'
  },
  heading: {
    id: 'heading',
    name: 'عنوان رئيسي',
    namePlural: 'عناوين',
    icon: 'Type',
    defaultColor: '#f43f5e',
    lightBg: 'bg-rose-50/90 hover:bg-rose-100/90',
    darkBg: 'bg-rose-950/40 hover:bg-rose-950/60',
    borderColor: 'border-rose-500',
    description: 'عنوان رئيسي بحجم كبير لتنظيم وتفريع اللوحة'
  },
  character: {
    id: 'character',
    name: 'شخصية',
    namePlural: 'شخصيات',
    icon: 'User',
    defaultColor: '#0ea5e9',
    lightBg: 'bg-sky-50/90 hover:bg-sky-100/90',
    darkBg: 'bg-sky-950/40 hover:bg-sky-950/60',
    borderColor: 'border-sky-500',
    description: 'بطل، خصم، أو شخصية مساعدة'
  },
  event: {
    id: 'event',
    name: 'حدث',
    namePlural: 'أحداث',
    icon: 'Calendar',
    defaultColor: '#f97316',
    lightBg: 'bg-orange-50/90 hover:bg-orange-100/90',
    darkBg: 'bg-orange-950/40 hover:bg-orange-950/60',
    borderColor: 'border-orange-500',
    description: 'مشهد أو حدث رئيسي في القصة'
  },
  place: {
    id: 'place',
    name: 'مكان',
    namePlural: 'أماكن',
    icon: 'MapPin',
    defaultColor: '#8b5cf6',
    lightBg: 'bg-purple-50/90 hover:bg-purple-100/90',
    darkBg: 'bg-purple-950/40 hover:bg-purple-950/60',
    borderColor: 'border-purple-500',
    description: 'موقع جغرافي أو مسرح أحداث'
  },
  secret: {
    id: 'secret',
    name: 'سر / لغز',
    namePlural: 'أسرار',
    icon: 'Lock',
    defaultColor: '#ef4444',
    lightBg: 'bg-red-50/90 hover:bg-red-100/90',
    darkBg: 'bg-red-950/40 hover:bg-red-950/60',
    borderColor: 'border-red-500',
    description: 'حبكة خفية أو سر ينكشف'
  },
  ending: {
    id: 'ending',
    name: 'نهاية',
    namePlural: 'نهايات',
    icon: 'Flag',
    defaultColor: '#ec4899',
    lightBg: 'bg-pink-50/90 hover:bg-pink-100/90',
    darkBg: 'bg-pink-950/40 hover:bg-pink-950/60',
    borderColor: 'border-pink-500',
    description: 'نهاية القصة أو ختام الفصل'
  },
  idea: {
    id: 'idea',
    name: 'فكرة',
    namePlural: 'أفكار',
    icon: 'Lightbulb',
    defaultColor: '#06b6d4',
    lightBg: 'bg-cyan-50/90 hover:bg-cyan-100/90',
    darkBg: 'bg-cyan-950/40 hover:bg-cyan-950/60',
    borderColor: 'border-cyan-500',
    description: 'فكرة إلهام أو مسودة حوار'
  }
};

export type FontStyleOption = 'cairo' | 'amiri' | 'tajawal' | 'ibm' | 'courier';
export type FontSizeOption = 'sm' | 'base' | 'lg' | 'xl' | '2xl';

export interface StoryNode {
  id: string;
  title: string;
  content: string; // المحتوى الكامل للقصة أو الحدث
  internalNotes?: string; // ملاحظات داخلية خاصة بالمؤلف
  type: NodeCategory;
  color: string; // Hex color for custom badge & border
  textColor?: string;
  backgroundColor?: string;
  fontFamily?: FontStyleOption;
  fontSize?: FontSizeOption;
  imageUrl?: string; // for image element
  x: number;
  y: number;
  width?: number; // custom card width
  height?: number; // custom card height
  parentId?: string; // If this node was spawned as a child/branch from another node
  tags?: string[];
  createdAt: number;
  updatedAt: number;
}

export type RelationType = 
  | 'سبب' 
  | 'نتيجة' 
  | 'سر' 
  | 'مرتبط بـ' 
  | 'يظهر لاحقًا' 
  | 'يقتل' 
  | 'يكتشف' 
  | 'حليف'
  | 'عدو'
  | 'موقع الحدث'
  | 'مفتاح اللغز'
  | 'custom';

export interface PresetRelation {
  label: string;
  defaultColor: string;
  style: 'solid' | 'dashed' | 'dotted';
}

export const PRESET_RELATIONS: Record<string, PresetRelation> = {
  'سبب': { label: 'سبب', defaultColor: '#f59e0b', style: 'solid' },
  'نتيجة': { label: 'نتيجة', defaultColor: '#3b82f6', style: 'solid' },
  'سر': { label: 'سر', defaultColor: '#ef4444', style: 'dashed' },
  'مرتبط بـ': { label: 'مرتبط بـ', defaultColor: '#64748b', style: 'solid' },
  'يظهر لاحقًا': { label: 'يظهر لاحقًا', defaultColor: '#8b5cf6', style: 'dotted' },
  'يقتل': { label: 'يقتل', defaultColor: '#dc2626', style: 'solid' },
  'يكتشف': { label: 'يكتشف', defaultColor: '#10b981', style: 'solid' },
  'حليف': { label: 'حليف', defaultColor: '#0ea5e9', style: 'solid' },
  'عدو': { label: 'عدو', defaultColor: '#f97316', style: 'dashed' },
  'موقع الحدث': { label: 'موقع الحدث', defaultColor: '#10b981', style: 'dotted' },
  'مفتاح اللغز': { label: 'مفتاح اللغز', defaultColor: '#ec4899', style: 'dashed' },
};

export interface StoryConnection {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  label: string; // e.g., 'سبب', 'يقتل', or custom string
  color: string; // Hex color for arrow line
  style?: 'solid' | 'dashed' | 'dotted';
  bidirectional?: boolean;
  createdAt: number;
}

export interface StoryProject {
  id: string;
  title: string;
  description: string;
  nodes: StoryNode[];
  connections: StoryConnection[];
  canvasView: {
    x: number;
    y: number;
    zoom: number;
  };
  lastSavedAt: number;
  version: number;
}

export const NODE_PALETTE_COLORS = [
  { name: 'أزرق (شخصية)', hex: '#3b82f6' },
  { name: 'كهرماني (حدث)', hex: '#f59e0b' },
  { name: 'زمردي (مكان)', hex: '#10b981' },
  { name: 'أحمر (سر / لغز)', hex: '#ef4444' },
  { name: 'بنفسجي (نهاية)', hex: '#8b5cf6' },
  { name: 'وردي (فكرة)', hex: '#ec4899' },
  { name: 'رمادي (ملاحظة)', hex: '#64748b' },
  { name: 'سماوي', hex: '#06b6d4' },
  { name: 'برتقالي', hex: '#f97316' },
  { name: 'ذهبي', hex: '#eab308' },
  { name: 'أخضر داكن', hex: '#059669' },
  { name: 'قرمزي', hex: '#be123c' },
];
