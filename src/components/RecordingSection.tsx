'use client';

import React, { useContext } from 'react';
import { TranscriptionContext } from '@/context/TranscriptionContext';
import { SummaryPanel } from './SummaryPanel';

export const RecordingSection: React.FC = () => {
  const context = useContext(TranscriptionContext);

  if (!context) {
    return null;
  }

  const {
    isRecording,
    isLoading,
    transcription,
    startRecording,
    stopRecording,
  } = context;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 p-4">
      {/* Controles de grabación */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">🎙️ Grabación</h2>

        <div className="flex gap-4 mb-6">
          <button
            onClick={startRecording}
            disabled={isRecording || isLoading}
            className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-bold text-lg"
          >
            <span className={isRecording ? 'animate-pulse' : ''}>🔴</span>
            {isRecording ? 'Grabando...' : 'Iniciar Grabación'}
          </button>

          <button
            onClick={stopRecording}
            disabled={!isRecording}
            className="flex items-center gap-2 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-bold text-lg"
          >
            <span>⏹️</span>
            Detener
          </button>
        </div>

        {isLoading && (
          <div className="p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded-lg flex items-center gap-2">
            <span className="animate-spin">⏳</span>
            Procesando...
          </div>
        )}
      </div>

      {/* Transcripción */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">📄 Transcripción</h2>
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 min-h-32 max-h-64 overflow-y-auto">
          <p className="text-gray-800 whitespace-pre-wrap">{transcription}</p>
        </div>
      </div>

      {/* Panel de Síntesis */}
      <SummaryPanel />
    </div>
  );
};
