'use client';

import React, { useContext } from 'react';
import { TranscriptionContext } from '@/context/TranscriptionContext';

export const SummaryPanel: React.FC = () => {
  const context = useContext(TranscriptionContext);

  if (!context) {
    return null;
  }

  const {
    isSummarizing,
    summary,
    keywords,
    bulletPoints,
    summaryError,
    generateSummary,
    generateKeywords,
    generateBulletPoints,
    clearSummary,
    transcription,
  } = context;

  const hasTranscription =
    transcription &&
    !transcription.includes('Error') &&
    !transcription.includes('aparecerá');

  return (
    <div className="w-full space-y-4 p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
      {/* Header */}
      <div className="border-b pb-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          ✨ Panel de Síntesis y Análisis
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {hasTranscription
            ? 'Genera resumen, palabras clave y puntos principales'
            : 'Graba primero una transcripción para usar estas funciones'}
        </p>
      </div>

      {/* Botones de control */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={generateSummary}
          disabled={isSummarizing || !hasTranscription}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isSummarizing ? (
            <>
              <span className="animate-spin">⏳</span> Resumiendo...
            </>
          ) : (
            <>
              <span>📝</span> Generar Resumen
            </>
          )}
        </button>

        <button
          onClick={generateKeywords}
          disabled={isSummarizing || !hasTranscription}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isSummarizing ? (
            <>
              <span className="animate-spin">⏳</span> Procesando...
            </>
          ) : (
            <>
              <span>🔍</span> Palabras Clave
            </>
          )}
        </button>

        <button
          onClick={generateBulletPoints}
          disabled={isSummarizing || !hasTranscription}
          className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isSummarizing ? (
            <>
              <span className="animate-spin">⏳</span> Procesando...
            </>
          ) : (
            <>
              <span>📌</span> Puntos Clave
            </>
          )}
        </button>

        {(summary || keywords || bulletPoints) && (
          <button
            onClick={clearSummary}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
          >
            <span>🗑️</span> Limpiar
          </button>
        )}
      </div>

      {/* Error */}
      {summaryError && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="font-semibold">Error</p>
            <p className="text-sm">{summaryError}</p>
          </div>
        </div>
      )}

      {/* Contenedor de resultados */}
      <div className="grid grid-cols-1 gap-4">
        {/* Resumen */}
        {summary && (
          <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">📝</span>
              <h3 className="font-bold text-blue-900 text-lg">Resumen</h3>
            </div>
            <p className="text-gray-800 leading-relaxed mb-3">{summary.summary}</p>
            <div className="flex gap-4 text-xs text-gray-600">
              <span>⏱️ {summary.processingTime}ms</span>
              <span>📊 {summary.keywordCount} palabras</span>
            </div>
          </div>
        )}

        {/* Palabras Clave */}
        {keywords && (
          <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 border-l-4 border-green-500 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🔍</span>
              <h3 className="font-bold text-green-900 text-lg">Palabras Clave</h3>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {keywords.keywords.map((kw, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-green-200 text-green-800 rounded-full text-sm font-medium hover:bg-green-300 transition-colors"
                >
                  {kw.word}
                  <span className="ml-1 opacity-75">({kw.frequency})</span>
                </span>
              ))}
            </div>
            <div className="flex gap-4 text-xs text-gray-600">
              <span>⏱️ {keywords.processingTime}ms</span>
              <span>📊 {keywords.totalWords} palabras analizadas</span>
            </div>
          </div>
        )}

        {/* Puntos Clave */}
        {bulletPoints && (
          <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 border-l-4 border-purple-500 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">📌</span>
              <h3 className="font-bold text-purple-900 text-lg">Puntos Clave</h3>
            </div>
            <ul className="space-y-2 mb-3">
              {bulletPoints.map((point, idx) => (
                <li
                  key={idx}
                  className="flex gap-3 text-gray-800 p-2 bg-white bg-opacity-50 rounded"
                >
                  <span className="text-purple-600 font-bold flex-shrink-0">
                    {idx + 1}.
                  </span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            <div className="text-xs text-gray-600">
              ℹ️ Se muestran las {bulletPoints.length} oraciones más importantes
            </div>
          </div>
        )}
      </div>

      {/* Estado vacío */}
      {!summary && !keywords && !bulletPoints && hasTranscription && (
        <div className="p-4 bg-gray-50 border border-dashed border-gray-300 rounded-lg text-center text-gray-500">
          <p className="text-sm">👆 Usa los botones de arriba para analizar la transcripción</p>
        </div>
      )}
    </div>
  );
};
