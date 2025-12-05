
'use server';

/**
 * Esta Server Action busca la definición de una palabra en español.
 * @param word La palabra a definir.
 * @returns La definición como un string, o null si no se encuentra.
 */
export async function defineWord(word: string): Promise<string | null> {
  // Limpia la palabra de puntuación común al inicio/final y la convierte a minúsculas.
  const cleanedWord = word.trim().replace(/^[.,:;!?¿¡"']+|[.,:;!?¿¡"']+$/g, '').toLowerCase();

  if (!cleanedWord) {
    return null;
  }

  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/es/${cleanedWord}`
    );

    if (!response.ok) {
      console.error(`Error de la API del diccionario para "${cleanedWord}": Estado ${response.status}`);
      return null;
    }

    const data = await response.json();

    // La API devuelve un array. Buscamos de forma más robusta la primera definición disponible.
    if (Array.isArray(data) && data.length > 0) {
      for (const entry of data) {
        if (entry.meanings && Array.isArray(entry.meanings)) {
          for (const meaning of entry.meanings) {
            if (meaning.definitions && Array.isArray(meaning.definitions)) {
              const firstDefinition = meaning.definitions[0]?.definition;
              if (firstDefinition) {
                return firstDefinition; // Devolvemos la primera que encontremos.
              }
            }
          }
        }
      }
    }

    // Si no se encontró ninguna definición en la estructura esperada.
    return null;
    
  } catch (error) {
    console.error(`Fallo al obtener la definición para "${cleanedWord}":`, error);
    // Si hay un error de red o al parsear el JSON, devolvemos null.
    return null;
  }
}
