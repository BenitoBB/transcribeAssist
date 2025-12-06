// src/lib/summarization/textrank.ts
/**
 * Resumidor extractivo ligero tipo TextRank.
 * - Divide en oraciones.
 * - Calcula similitud basada en overlap de palabras (stopwords en ES).
 * - Ejecuta PageRank iterativo sobre la matriz de similitud.
 * - Devuelve las N oraciones mejor puntuadas en el orden original.
 */

const SPANISH_STOPWORDS = new Set([
  'de','la','que','el','en','y','a','los','se','del','las','por','un','para','con',
  'no','una','su','al','lo','como','más','pero','sus','le','ya','o','este','sí',
  'porque','esta','entre','cuando','muy','sin','sobre','también','me','hasta','hay',
  'donde','quien','desde','todo','nos','durante','todos','uno','les','ni','contra',
  'otros','ese','eso','ante','ellos','e','esto','mí','antes','algunos','qué','unos',
  'yo','otro','otras','otra','él','tanto','esa','estos','mucho','quienes','nada',
  'muchos','cual','poco','ella','estar','estas','algunas','algo','nosotros','mi',
  'mis','tú','te','ti','tu','tus','ellas','nosotras','vosotros','vosotras','os','mío',
  'mía','míos','mías','tuyo','tuya','tuyos','tuyas'
]);

function splitSentences(text: string): string[] {
  // Split on punctuation followed by space/newline; preserve sentence punctuation
  const raw = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{2,}/g, '\n\n')
    .trim();

  const sentences = raw
    .split(/(?<=[.?!])\s+(?=[A-ZÁÉÍÓÚÜÑ¿¡0-9"'])/u)
    .map(s => s.trim())
    .filter(Boolean);

  // Fallback: si no se detectaron oraciones, divide por saltos de línea
  if (sentences.length === 0) {
    return raw.split(/\n+/).map(s => s.trim()).filter(Boolean);
  }
  return sentences;
}

function tokenize(sentence: string): string[] {
  return sentence
    .toLowerCase()
    .replace(/[^a-záéíóúüñ0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w && !SPANISH_STOPWORDS.has(w));
}

function buildSimilarityMatrix(sentTokens: string[][]): number[][] {
  const n = sentTokens.length;
  const sim: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const setA = new Set(sentTokens[i]);
      const setB = new Set(sentTokens[j]);
      let common = 0;
      for (const w of setA) if (setB.has(w)) common++;
      if (common === 0) continue;

      // Similaridad normalizada por longitud
      const score = common / (Math.log(1 + setA.size) + Math.log(1 + setB.size));
      sim[i][j] = score;
      sim[j][i] = score;
    }
  }
  return sim;
}

function pagerank(sim: number[][], d = 0.85, maxIter = 50, tol = 1e-6): number[] {
  const n = sim.length;
  if (n === 0) return [];
  const scores = Array(n).fill(1 / n);
  const outSum = sim.map(row => row.reduce((a, b) => a + b, 0));

  for (let iter = 0; iter < maxIter; iter++) {
    let diff = 0;
    const newScores = Array(n).fill((1 - d) / n);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (sim[j][i] <= 0) continue;
        const denom = outSum[j] || 1;
        newScores[i] += d * (sim[j][i] / denom) * scores[j];
      }
    }
    for (let i = 0; i < n; i++) diff += Math.abs(newScores[i] - scores[i]);
    scores.splice(0, n, ...newScores);
    if (diff < tol) break;
  }
  return scores;
}

/**
 * summarize
 * @param text Texto completo
 * @param maxSentences número máximo de oraciones en el resumen. Si no se especifica,
 *                     se toma 15% del total (mínimo 1, máximo 8).
 */
export function summarize(text: string, maxSentences?: number): string {
  if (!text || text.trim().length === 0) return '';

  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length < 50) return cleaned; // demasiado corto

  const sentences = splitSentences(text);
  if (sentences.length <= 1) return sentences.join(' ');

  const sentTokens = sentences.map(s => tokenize(s));
  const sim = buildSimilarityMatrix(sentTokens);
  const scores = pagerank(sim);

  const defaultCount = Math.min(Math.max(1, Math.ceil(sentences.length * 0.15)), 8);
  const k = typeof maxSentences === 'number' ? Math.max(1, maxSentences) : defaultCount;

  // Indices mejor puntuados
  const idxs = scores
    .map((s, i) => ({ s, i }))
    .sort((a, b) => b.s - a.s)
    .slice(0, k)
    .map(x => x.i)
    .sort((a, b) => a - b); // orden original

  const summary = idxs.map(i => sentences[i]).join(' ');
  return summary;
}