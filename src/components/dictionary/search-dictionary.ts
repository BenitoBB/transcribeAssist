'use server';

// Estructura de la respuesta de la API (simplificada)
export interface DictionaryEntry {
    word: string;
    phonetic?: string;
    meanings: {
      partOfSpeech: string;
      definitions: {
        definition: string;
        example?: string;
      }[];
    }[];
  }
  
  interface DictionaryAPIError {
    title: string;
    message: string;
    resolution: string;
  }
  
  interface SearchResult {
      data: DictionaryEntry[] | null;
      error: string | null;
  }
  
  /**
   * Esta Server Action busca la definición de una palabra en español usando una API gratuita.
   * @param word La palabra a definir.
   * @returns Un objeto con la definición o un error.
   */
  export async function searchDictionary(word: string): Promise<SearchResult> {
    const cleanedWord = word.toLowerCase().trim();
  
    if (!cleanedWord) {
      return { data: null, error: "Por favor, introduce una palabra." };
    }
  
    try {
      const response = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/es/${cleanedWord}`
      );
  
      if (!response.ok) {
        if (response.status === 404) {
            // La API devuelve un objeto de error específico para 404.
            const errorData: DictionaryAPIError = await response.json();
            return { data: null, error: errorData.title || "No se encontró una definición para esta palabra." };
        }
        // Para otros errores HTTP (500, etc.)
        return { data: null, error: `Error de la API: ${response.statusText}` };
      }
  
      const data: DictionaryEntry[] = await response.json();
      
      return { data, error: null };
  
    } catch (error) {
      console.error(`Error al buscar la definición de "${cleanedWord}":`, error);
      return { data: null, error: "Error de red o al procesar la respuesta. Inténtalo de nuevo." };
    }
  }
