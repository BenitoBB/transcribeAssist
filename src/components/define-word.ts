'use server';

// Esta función es una Server Action. Se ejecuta en el servidor.
export async function defineWord(word: string): Promise<string | null> {
  // Limpia la palabra de cualquier puntuación y la convierte a minúsculas.
  const cleanedWord = word.toLowerCase().replace(/[\p{P}\p{S}]/gu, '').trim();

  if (!cleanedWord) {
    return null;
  }

  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/es/${cleanedWord}`
    );

    // Si la respuesta no es exitosa (ej. 404 Not Found), no hay nada que hacer.
    if (!response.ok) {
      console.error(`Dictionary API error for "${cleanedWord}": ${response.status}`);
      return null;
    }

    const data = await response.json();

    // La API devuelve un array, incluso si hay un solo resultado.
    // Buscamos la primera definición en la primera entrada.
    // data[0] -> Primera entrada para la palabra
    // .meanings[0] -> El primer grupo de significados (ej. "sustantivo")
    // .definitions[0] -> La primera definición dentro de ese grupo
    // .definition -> El texto de la definición
    const firstDefinition = data?.[0]?.meanings?.[0]?.definitions?.[0]?.definition;

    return firstDefinition || null;
    
  } catch (error) {
    console.error(`Failed to fetch definition for "${cleanedWord}":`, error);
    // Si hay un error de red o al parsear el JSON, devolvemos null.
    return null;
  }
}
