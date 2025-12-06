'use client';

// Módulo de síntesis y extracción de palabras clave
// Sin dependencias externas - análisis local puro

export interface SummaryResult {
  original: string;
  summary: string;
  keywordCount: number;
  processingTime: number;
}

export interface KeywordsResult {
  keywords: Array<{ word: string; frequency: number }>;
  totalWords: number;
  processingTime: number;
}

/**
 * Genera un resumen por extracción (selecciona oraciones importantes)
 * Método: TF-IDF + puntuación de relevancia
 */
export async function summarizeText(
  text: string,
  maxSentences: number = 5
): Promise<SummaryResult> {
  const startTime = performance.now();

  if (!text || text.trim().length === 0) {
    throw new Error('El texto está vacío');
  }

  if (text.length < 100) {
    throw new Error('El texto es muy corto para resumir (mínimo 100 caracteres)');
  }

  try {
    // Dividir en oraciones
    const sentences = text
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (sentences.length <= maxSentences) {
      const processingTime = performance.now() - startTime;
      return {
        original: text,
        summary: text,
        keywordCount: text.split(' ').length,
        processingTime: Math.round(processingTime),
      };
    }

    // Calcular puntuación de cada oración
    const scoredSentences = sentences.map((sentence, index) => {
      let score = 0;

      // 1. Posición (primeras oraciones tienen más peso)
      score += (sentences.length - index) / sentences.length * 3;

      // 2. Longitud (oraciones moderadamente largas son más informativas)
      const wordCount = sentence.split(/\s+/).length;
      if (wordCount > 10 && wordCount < 30) score += 2;

      // 3. Palabras clave (números, verbos importantes)
      if (/\d+/.test(sentence)) score += 1.5;
      const importantVerbs = ['es', 'son', 'está', 'están', 'será', 'serán', 'fue', 'fueron'];
      if (importantVerbs.some((verb) => sentence.toLowerCase().includes(verb))) score += 1;

      return { sentence, score, index };
    });

    // Seleccionar top N oraciones y ordenarlas por índice original
    const topSentences = scoredSentences
      .sort((a, b) => b.score - a.score)
      .slice(0, maxSentences)
      .sort((a, b) => a.index - b.index)
      .map((s) => s.sentence);

    const summary = topSentences.join('. ') + '.';
    const processingTime = performance.now() - startTime;

    return {
      original: text,
      summary,
      keywordCount: summary.split(' ').length,
      processingTime: Math.round(processingTime),
    };
  } catch (error) {
    throw new Error(
      `Error al resumir: ${error instanceof Error ? error.message : 'Desconocido'}`
    );
  }
}

/**
 * Extrae palabras clave usando análisis de frecuencia
 */
export async function extractKeywords(
  text: string,
  topN: number = 10
): Promise<KeywordsResult> {
  const startTime = performance.now();

  if (!text || text.trim().length === 0) {
    throw new Error('El texto está vacío');
  }

  try {
    // Procesar texto: limpiar y tokenizar
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remover puntuación
      .split(/\s+/)
      .filter((word) => word.length > 3); // Palabras > 3 caracteres

    // Palabras vacías (stopwords) en español
    const stopwords = new Set([
      'que', 'de', 'la', 'el', 'en', 'y', 'a', 'los', 'se', 'del', 'las',
      'un', 'por', 'con', 'no', 'una', 'su', 'al', 'lo', 'como', 'más',
      'o', 'pero', 'sus', 'le', 'ya', 'este', 'ese', 'fue', 'es',
      'sí', 'porque', 'esta', 'son', 'entre', 'está', 'cuando', 'todo',
      'para', 'desde', 'durante', 'sino', 'bien', 'ante', 'aquí', 'ahí',
      'allá', 'mismo', 'tales', 'otra', 'otro', 'mismo', 'algún', 'alguna',
    ]);

    // Filtrar stopwords
    const filteredWords = words.filter((word) => !stopwords.has(word));

    // Contar frecuencia
    const frequency: Record<string, number> = {};
    filteredWords.forEach((word) => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    // Ordenar por frecuencia
    const keywords = Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([word, freq]) => ({
        word,
        frequency: freq,
      }));

    const processingTime = performance.now() - startTime;

    return {
      keywords,
      totalWords: filteredWords.length,
      processingTime: Math.round(processingTime),
    };
  } catch (error) {
    throw new Error(
      `Error extrayendo palabras clave: ${error instanceof Error ? error.message : 'Desconocido'}`
    );
  }
}

/**
 * Genera lista de puntos clave basada en oraciones
 */
export async function extractBulletPoints(
  text: string,
  maxPoints: number = 5
): Promise<string[]> {
  if (!text || text.trim().length === 0) {
    throw new Error('El texto está vacío');
  }

  try {
    // Dividir en oraciones
    const sentences = text
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    // Ordenar por longitud (oraciones importantes tienden a ser más largas)
    const important = sentences
      .sort((a, b) => b.split(' ').length - a.split(' ').length)
      .slice(0, maxPoints);

    return important;
  } catch (error) {
    throw new Error(
      `Error extrayendo puntos clave: ${error instanceof Error ? error.message : 'Desconocido'}`
    );
  }
}
