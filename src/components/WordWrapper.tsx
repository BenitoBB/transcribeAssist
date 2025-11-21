'use server';

import React from 'react';

// Esta función es una Server Action. Se ejecuta en el servidor.
export async function defineWord(word: string): Promise<string | null> {
  const cleanedWord = word.toLowerCase().trim();
  if (!cleanedWord) return null;

  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/es/${cleanedWord}`
    );

    if (!response.ok) {
      // Si la API devuelve un 404 u otro error, la palabra no fue encontrada.
      console.error(`Dictionary API error for "${cleanedWord}": ${response.status}`);
      return null;
    }

    const data = await response.json();

    // La API devuelve un array, incluso si hay un solo resultado.
    // Buscamos la primera definición en la primera entrada.
    const firstDefinition = data[0]?.meanings[0]?.definitions[0]?.definition;

    return firstDefinition || null;
  } catch (error) {
    console.error('Failed to fetch definition:', error);
    return null;
  }
}
