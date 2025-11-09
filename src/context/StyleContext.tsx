'use client';

import React, { createContext, useState, useContext, ReactNode, useMemo, useEffect } from 'react';

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
  themeClass: string;
}

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

  // Genera las clases y variables CSS basadas en el tema actual
  const themeClass = useMemo(() => {
    return `theme-${theme}`;
  }, [theme]);

  useEffect(() => {
    // This code now runs only on the client
    let customProperties = {};
    switch (theme) {
      case 'dark':
        customProperties = { '--custom-background-color': '#1a1a1a', '--custom-text-color': '#e0e0e0' };
        break;
      case 'protanopia': // Rojo débil
        customProperties = { '--custom-background-color': '#f0f0f0', '--custom-text-color': '#005a9e' };
        break;
      case 'deuteranopia': // Verde débil
        customProperties = { '--custom-background-color': '#f2f2f2', '--custom-text-color': '#575757' };
        break;
      case 'tritanopia': // Azul débil
        customProperties = { '--custom-background-color': '#fffbe6', '--custom-text-color': '#ff0000' };
        break;
      case 'accessible': // Alto contraste
        customProperties = { '--custom-background-color': '#000000', '--custom-text-color': '#ffff00' };
        break;
      case 'light':
      default:
        customProperties = { '--custom-background-color': '#ffffff', '--custom-text-color': '#000000' };
        break;
    }
    
    let styleTag = document.getElementById('custom-theme-styles');
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'custom-theme-styles';
      document.head.appendChild(styleTag);
    }
    const css = `:root { ${Object.entries(customProperties).map(([key, value]) => `${key}: ${value};`).join(' ')} }`;
    styleTag.innerHTML = css;

  }, [theme]);
  
  useEffect(() => {
    // This code also now runs only on the client
    let fontLink = document.querySelector('link[href*="fonts.googleapis.com"]');
    if (!fontLink) {
        fontLink = document.createElement('link');
        (fontLink as HTMLLinkElement).href = "https://fonts.googleapis.com/css2?family=Open+Sans&family=Roboto&family=Inter&display=swap";
        (fontLink as HTMLLinkElement).rel = "stylesheet";
        document.head.appendChild(fontLink);
    }
    // Open Dyslexic es más dificil de encontrar en CDNs, se recomienda tenerla local
  }, []);


  const value = { style, setStyle, theme, setTheme, themeClass };

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
