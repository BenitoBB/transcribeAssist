/**
 * @fileOverview Algoritmo de resumen de texto extractivo del lado del cliente.
 * Este enfoque es de costo cero y no requiere llamadas a API externas.
 */

/**
 * Genera un resumen extractivo de un texto dado.
 * @param text El texto completo a resumir.
 * @param sentenceCount El número de frases que se incluirán en el resumen.
 * @returns Una cadena con las frases más importantes del texto.
 */
export function generateExtractiveSummary(
  text: string,
  sentenceCount: number = 3
): string {
  if (!text) return '';

  // 1. Tokenización: Dividir el texto en frases.
  // Se usa una expresión regular para dividir por puntos, signos de exclamación e interrogación.
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  if (sentences.length <= sentenceCount) {
    return text; // Si hay muy pocas frases, devuelve el texto original.
  }

  // 2. Preprocesamiento: Limpiar el texto y obtener las palabras "importantes".
  const stopWords = new Set([
    'a', 'ante', 'bajo', 'con', 'contra', 'de', 'desde', 'en', 'entre',
    'hacia', 'hasta', 'para', 'por', 'según', 'sin', 'sobre', 'tras', 'y', 'e',
    'o', 'u', 'la', 'los', 'el', 'las', 'un', 'una', 'unos', 'unas', 'es', 'son',
    'del', 'al', 'lo', 'le', 'les', 'se', 'que', 'qué', 'como', 'cómo', 'pero', 'mas',
    'si', 'sí', 'no', 'su', 'sus', 'yo', 'tu', 'él', 'ella', 'nosotros', 'vosotros', 'ellos'
  ]);

  const wordFrequencies: { [key: string]: number } = {};
  const allWords = text.toLowerCase().replace(/[^a-zA-Záéíóúüñ\s]/g, '').split(/\s+/);
  
  allWords.forEach(word => {
    if (word && !stopWords.has(word)) {
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
    sentenceScores.push({ sentence: sentence.trim(), score, index });
  });

  // 4. Selección: Ordenar las frases por puntuación y escoger las mejores.
  sentenceScores.sort((a, b) => b.score - a.score);

  // Seleccionar el número deseado de las mejores frases.
  const topSentences = sentenceScores.slice(0, sentenceCount);

  // 5. Ensamblaje del Resumen: Ordenar las frases seleccionadas por su aparición original.
  topSentences.sort((a, b) => a.index - b.index);

  const summary = topSentences.map(item => item.sentence).join(' ');

  return summary;
}
