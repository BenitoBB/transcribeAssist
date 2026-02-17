'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

// Tipos de temas
export type Theme = 'light' | 'dark' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'accessible';

// Define la estructura de los estilos personalizables
export interface CustomStyle {
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  fontFamily: string;
}

// Define la estructura del contexto
interface StyleContextType {
  style: CustomStyle;
  setStyle: React.Dispatch<React.SetStateAction<CustomStyle>>;
  theme: Theme;
  setTheme: React.Dispatch<React.SetStateAction<Theme>>;
  isBionic: boolean;
  setIsBionic: React.Dispatch<React.SetStateAction<boolean>>;  showRuler: boolean;
  setShowRuler: React.Dispatch<React.SetStateAction<boolean>>;}

// Estilos por defecto
const defaultStyle: CustomStyle = {
  fontSize: 16,
  lineHeight: 1.8,
  letterSpacing: 0.5,
  fontFamily: 'Inter, sans-serif',
};

// Crea el contexto con un valor undefined por defecto
const StyleContext = createContext<StyleContextType | undefined>(undefined);

interface StyleProviderProps {
  children: ReactNode;
}

// Crea el componente Proveedor
export const StyleProvider: React.FC<StyleProviderProps> = ({ children }) => {
  const [style, setStyle] = useState<CustomStyle>(defaultStyle);
  const [theme, setTheme] = useState<Theme>('light');
  const [isBionic, setIsBionic] = useState<boolean>(false);
  const [showRuler, setShowRuler] = useState<boolean>(false);

  const value = { style, setStyle, theme, setTheme, isBionic, setIsBionic, showRuler, setShowRuler };

  return <StyleContext.Provider value={value}>{children}</StyleContext.Provider>;
};

// Hook personalizado para usar el contexto de estilo
export const useStyle = (): StyleContextType => {
  const context = useContext(StyleContext);
  if (context === undefined) {
    throw new Error('useStyle must be used within a StyleProvider');
  }
  return context;
};
