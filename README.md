# TranscribeAssist - Sistema de Transcripción Multi-Modelo

## 📋 Arquitectura General

Sistema modular que soporta múltiples motores de transcripción (local y cloud) con configuración centralizada.

---

## 🔧 Componentes Principales

### 1. **models-config.ts** ⚙️
Archivo centralizado que define todos los modelos disponibles.

**Características:**
- Tipos de modelos: `local` (dispositivo) vs `cloud` (servidor)
- Peso de modelos: `light` ⚡ (rápido), `medium` ⚙️, `heavy` 🔥 (lento)
- Metadata: Descripción y tiempo estimado de carga
- Helper functions: `getModelLabel()`, `getAvailableModels()`

**Propósito**: Permitir que diferentes alumnos elijan según sus dispositivos.

**Modelos disponibles:**
| Modelo | Tipo | Peso | Ubicación | Tiempo |
|--------|------|------|-----------|--------|
| web-speech-api | Local | Light | 📱 Navegador | instant |
| whisper-wasm | Local | Heavy | 📱 Navegador | ~30s |
| whisper-server | Cloud | Light | ☁️ Servidor | ~2-5s |
| whisper-translate | Cloud | Medium | ☁️ Servidor | ~5-10s |
| vosk-server | Cloud | Light | ☁️ Servidor | ~1-3s |
| silero-server | Cloud | Medium | ☁️ Servidor | ~2-4s |

---

### 2. Escenarios

**Escenario 1**
1. Modelos Locales (navegador)
    * El estudiante da click en "Iniciar grabación". Usando "Whisper WASM" / "Weeb Speech API"
    * Todo ocurre en el dispositivo del estudiante
    * No requiere servidor
    * Funciona offline

2. Modelos en Servidor Propio -- necesita servidor corriendo en PC/nube
    * El estudiante da click en "Iniciar grabación".
    * Envía audio a Servidor (propio)
    * El Servidor procesa con Whisper/Vosk/Silero
    * Retorna transcripción

3. Modelos en Servidor de Terceros (nube)
    * El estudiante da click en "Iniciar grabación".
    * Envía audio a OpenAI/Google/etc
    * Ellos procesan
    * Retorna transcripción
    * Requiere API key + paga dinero


### 3. **TranscriptionContext.tsx** 📡
Contexto React que orquesta la transcripción.

**Estados:**
- `transcription`: Texto transcrito
- `isRecording`: Indica si está grabando
- `isLoading`: Indica carga del modelo
- `transcriptionModel`: Modelo seleccionado

**Métodos:**
- `startRecording()`: Inicia grabación con modelo seleccionado
- `stopRecording()`: Detiene grabación y procesa

**Lógica:**
```
