# Estructura de Arquitectura (Feature-Sliced Design)

El proyecto utiliza una arquitectura basada en características (FSD - Feature-Sliced Design) adaptada para Next.js App Router. Esta estructura garantiza una alta cohesión técnica y un bajo acoplamiento entre módulos, facilitando la escalabilidad del sistema.

```text
src/
├── app/                  # (Capa de Enrutamiento)
│   ├── page.tsx          # Landing page principal y enrutador (Vercel)
│   ├── teacher/page.tsx  # Ensambla: RoomHost + Transcription + Whiteboard
│   ├── student/page.tsx  # Ensambla: RoomPeer + TranscriptionDisplay + Notes
│   └── solo/page.tsx     # Ensambla: Transcription + Whiteboard + Notes
│
├── features/             # (Capa de Dominios / Lógica de Negocio)
│   ├── transcription/    # TODO lo relacionado a escuchar y mostrar texto
│   │   ├── hooks/useSpeechRecognition.ts # Solo interactúa con el micrófono
│   │   ├── store/transcriptionStore.ts   # Estado global (Zustand/Context)
│   │   └── components/TranscriptionPanel.tsx
│   │
│   ├── room/             # TODO lo relacionado a la conexión entre usuarios
│   │   ├── hooks/useRoomHost.ts          # Lógica específica del maestro
│   │   ├── hooks/useRoomPeer.ts          # Lógica específica del alumno
│   │   ├── services/p2p.service.ts       # Servicio de Render 
│   │   └── components/ConnectionBadge.tsx
│   │
│   ├── whiteboard/       # TODO lo relacionado a la pizarra
│   │   ├── hooks/useCanvasDrawing.ts
│   │   └── components/DrawingCanvas.tsx
│   │
│   └── notes/            # TODO lo relacionado al panel de notas
│       └── components/NotesPanel.tsx
│
└── shared/               # (Capa Base)
    ├── ui/               # Componentes tontos (Botones, Tooltips de shadcn)
    ├── lib/              # Utilidades puras (cn, formatTime)
    └── types/            # Interfaces globales compartidas
```

## Beneficios
- **Mantenibilidad:** La lógica del servidor de red (P2P), el procesamiento de voz y los componentes de UI están perfectamente delimitados.
- **Escalabilidad:** Añadir una nueva característica (e.g. resúmenes con IA) solo requiere crear un nuevo folder en `features/`, sin interferir con dominios existentes.
- **Limpieza de Páginas:** Las rutas de Next.js (`app/`) actúan estrictamente como ensambladoras, dejando la lógica pesada a las features.
