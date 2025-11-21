'use server';

/**
 * Esta Server Action busca la definición de una palabra en español.
 * @param word La palabra a definir.
 * @returns La definición como un string, o null si no se encuentra.
 */
export async function defineWord(word: string): Promise<string | null> {
  const cleanedWord = word.toLowerCase().replace(/[\p{P}\p{S}]/gu, '').trim();

  if (!cleanedWord) {
    return null;
  }

  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/es/${cleanedWord}`
    );

    if (!response.ok) {
      // Si la respuesta es 404, la palabra no fue encontrada. Para otros errores,
      // la consola del servidor mostrará el código de estado.
      console.error(`Dictionary API error for "${cleanedWord}": Status ${response.status}`);
      return null;
    }

    const data = await response.json();

    // La API devuelve un array. Buscamos la primera definición en la primera entrada.
    const firstDefinition = data?.[0]?.meanings?.[0]?.definitions?.[0]?.definition;

    return firstDefinition || null;
    
  } catch (error) {
    console.error(`Failed to fetch definition for "${cleanedWord}":`, error);
    // Si hay un error de red o al parsear el JSON, devolvemos null.
    return null;
  }
}
