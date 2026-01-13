// Ruby theme colors - Deep, Rich, Vibrant
export const Colors = {
  light: {
    background: '#FDF2F2', // Warm rose white
    surface: '#FFFFFF',
    surfaceVariant: '#FEE2E2', // Rose-100
    elevated: '#FFFFFF',
    primary: '#B91C1C', // Deep ruby red-700
    primaryLight: '#DC2626', // Ruby red-600
    primaryDark: '#7F1D1D', // Ruby red-900
    accent: '#F43F5E', // Rose-500 for highlights
    text: '#1F2937', // Gray-800
    textSecondary: '#6B7280', // Gray-500
    textTertiary: '#9CA3AF', // Gray-400
    textOnPrimary: '#FFFFFF',
    border: '#FCA5A5', // Rose-300
    error: '#DC2626',
    success: '#059669',
    warning: '#D97706',
    // Note type colors
    typePdf: '#EF4444',
    typeWord: '#3B82F6',
    typeText: '#8B5CF6',
    typeImage: '#10B981',
  },
  dark: {
    background: '#1C1010', // Deep charcoal with red tint
    surface: '#2D1B1B', // Dark rose surface
    surfaceVariant: '#3D2424', // Slightly lighter
    elevated: '#4D2E2E',
    primary: '#F87171', // Ruby red-400
    primaryLight: '#FCA5A5', // Ruby red-300
    primaryDark: '#DC2626', // Ruby red-600
    accent: '#FB7185', // Rose-400
    text: '#FEF2F2', // Rose-50
    textSecondary: '#FECACA', // Rose-200
    textTertiary: '#FCA5A5', // Rose-300
    textOnPrimary: '#1C1010',
    border: '#5C3A3A',
    error: '#FCA5A5',
    success: '#6EE7B7',
    warning: '#FCD34D',
    // Note type colors
    typePdf: '#F87171',
    typeWord: '#60A5FA',
    typeText: '#A78BFA',
    typeImage: '#34D399',
  },
};

export type Theme = typeof Colors.light;

// Note content types
export const NOTE_TYPES = {
  text: { label: 'Text', icon: 'FileText', color: 'typeText' },
  pdf: { label: 'PDF', icon: 'FileType', color: 'typePdf' },
  document: { label: 'Word', icon: 'FileText2', color: 'typeWord' },
  image: { label: 'Image', icon: 'Image', color: 'typeImage' },
} as const;

export type NoteContentType = keyof typeof NOTE_TYPES;
