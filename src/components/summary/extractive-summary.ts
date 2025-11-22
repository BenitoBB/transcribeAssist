/**
 * @fileOverview Algoritmo de resumen de texto extractivo del lado del cliente.
 * Este enfoque es de costo cero y no requiere llamadas a API externas.
 */

/**
 * Genera un resumen extractivo de un texto dado.
 * @param text El texto completo a resumir.
 * @param summaryPercentage El porcentaje del texto original que debe tener el resumen (0-1).
 * @returns Una cadena con las frases más importantes del texto.
 */
export function generateExtractiveSummary(
  text: string,
  summaryPercentage: number = 0.4
): string {
  if (!text || text.trim().length === 0) return '';

  // 1. Tokenización por bloques de habla (usando saltos de línea dobles como delimitador).
  // Estos saltos de línea se generan en web-speech-api.ts cuando el usuario hace una pausa.
  const sentences = text.split(/\n\n+/).filter(sentence => sentence.trim().length > 0);
  
  if (sentences.length <= 2) {
    return text; // Si hay muy pocas frases/bloques, devuelve el texto original.
  }

  // 2. Preprocesamiento: Limpiar el texto y obtener las palabras "importantes".
  const stopWords = new Set([
    'a', 'ante', 'bajo', 'cabe', 'con', 'contra', 'de', 'desde', 'durante', 'en', 
    'entre', 'hacia', 'hasta', 'mediante', 'para', 'por', 'según', 'sin', 'so', 
    'sobre', 'tras', 'versus', 'vía', 'y', 'e', 'o', 'u', 'que', 'el', 'la', 'los', 
    'las', 'un', 'una', 'unos', 'unas', 'es', 'son', 'del', 'al', 'lo', 'le', 'les', 
    'se', 'pero', 'mas', 'si', 'sí', 'no', 'su', 'sus', 'mi', 'mis', 'tu', 'tus',
    'yo', 'tú', 'él', 'ella', 'nosotros', 'vosotros', 'ellos', 'ellas', 'esto', 'eso',
    'aquel', 'aquella', 'aquellos', 'aquellas', 'como', 'dónde', 'cuando', 'porque',
    'entonces', 'también', 'muy', 'mucho', 'poco', 'pues', 'pero', 'entonces'
  ]);

  const wordFrequencies: { [key: string]: number } = {};
  const normalizedText = text.replace(/[\n\r]+/g, ' ').replace(/\s+/g, ' ').trim();
  const allWords = normalizedText.toLowerCase().replace(/[^a-zA-Záéíóúüñ\s]/g, '').split(/\s+/);
  
  allWords.forEach(word => {
    if (word && !stopWords.has(word) && word.length > 2) {
      wordFrequencies[word] = (wordFrequencies[word] || 0) + 1;
    }
  });

  // 3. Puntuación de Frases: Asignar una puntuación a cada frase.
  const sentenceScores: { sentence: string; score: number, index: number }[] = [];
  sentences.forEach((sentence, index) => {
    let score = 0;
    const wordsInSentence = sentence.toLowerCase().replace(/[^a-zA-Záéíóúüñ\s]/g, '').split(/\s+/);
    
    wordsInSentence.forEach(word => {
      if (wordFrequencies[word]) {
        score += wordFrequencies[word];
      }
    });

    // Ponderar por longitud de la frase (evita frases muy cortas e irrelevantes)
    if (wordsInSentence.length < 5 || wordsInSentence.length > 40) {
        score *= 0.5;
    }

    // Ponderar por posición (las primeras frases suelen ser más importantes)
    const positionWeight = 1 - (index / sentences.length) * 0.5; // De 1 a 0.5
    score *= positionWeight;

    sentenceScores.push({ sentence: sentence.trim(), score, index });
  });

  // 4. Selección: Ordenar las frases por puntuación y escoger las mejores.
  sentenceScores.sort((a, b) => b.score - a.score);

  // Calcular cuántas frases incluir en el resumen
  const sentenceCount = Math.max(1, Math.round(sentences.length * summaryPercentage));
  const topSentences = sentenceScores.slice(0, sentenceCount);
  
  if(topSentences.length === 0) {
      return "No se pudo generar un resumen. El texto es demasiado corto o no contiene frases significativas.";
  }

  // 5. Ensamblaje del Resumen: Ordenar las frases seleccionadas por su aparición original.
  topSentences.sort((a, b) => a.index - b.index);

  const summary = topSentences.map(item => item.sentence).join('\n\n');

  return summary.length > 0 ? summary : "No se pudo generar un resumen.";
}