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

/**
 * ============================================================================================
 * VALORES ÓPTIMOS DE TIPOGRAFÍA PARA LECTURA
 * ============================================================================================
 * Basados en investigaciones de legibilidad digital.
 * Puedes cambiar estos valores a tu gusto — se usan como "Restablecer todo" en Configuración.
 *
 * 📖 Fuentes y referencias:
 *
 *   TAMAÑO DE FUENTE (fontSize):
 *   - Rango recomendado: 16–18px para pantallas digitales.
 *   - Texto menor a 14px incrementa significativamente la fatiga visual.
 *   - En móviles, mínimo 16px para cuerpo de texto.
 *     Ref: greadme.com, uxpin.com
 *
 *   INTERLINEADO (lineHeight):
 *   - Rango ideal: 1.4–1.6 veces el tamaño de fuente.
 *   - Textos largos se benefician de valores más altos (~1.6–1.8).
 *   - Para lectores con dislexia, mayor espaciado vertical mejora la lectura.
 *     Ref: theeditorsuite.com, researchgate.net, kickpoint.ca
 *
 *   ESPACIADO DE LETRAS (letterSpacing):
 *   - Para cuerpo de texto, el espaciado nativo suele bastar.
 *   - Un ajuste sutil de 0.5px mejora legibilidad en fuentes pequeñas.
 *   - Para lectores con dislexia, un espaciado ligeramente mayor es beneficioso.
 *     Ref: legible-typography.com, readabilitymatters.org
 *
 *   TIPOGRAFÍA (fontFamily):
 *   - Sans-serif (Inter, Arial, Verdana) se leen mejor en pantalla.
 *   - Fuentes con x-height grande mejoran legibilidad en tamaños pequeños.
 *     Ref: arvojournals.org, swiftkickweb.com
 * ============================================================================================
 */

// ──── CONSTANTES DE VALORES POR DEFECTO (modifícalas a tu gusto) ────
export const DEFAULT_FONT_SIZE    = 18;                    // px — Tamaño de fuente
export const DEFAULT_LINE_HEIGHT  = 1.6;                   // factor — Interlineado
export const DEFAULT_LETTER_SPACING = 0.5;                 // px — Espaciado entre letras
export const DEFAULT_FONT_FAMILY  = 'Inter, sans-serif';   // Tipografía
export const DEFAULT_THEME: Theme = 'light';               // Tema de color
export const DEFAULT_BIONIC       = false;                 // Lectura biónica
export const DEFAULT_RULER        = false;                 // Regla de lectura

// Estilos por defecto (construidos desde las constantes)
export const defaultStyle: CustomStyle = {
  fontSize: DEFAULT_FONT_SIZE,
  lineHeight: DEFAULT_LINE_HEIGHT,
  letterSpacing: DEFAULT_LETTER_SPACING,
  fontFamily: DEFAULT_FONT_FAMILY,
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
