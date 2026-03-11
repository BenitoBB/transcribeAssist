# Diagrama de Actividad — TranscribeAssist

El siguiente diagrama de actividad modela el flujo esperado y natural de uso del sistema. Cubre desde el momento en que el maestro inicia una clase (creando la sala y generando un código de sesión), hasta que los alumnos se conectan, consumen la transcripción, toman notas personales y, al finalizar la clase, proceden a descargar el material (transcripción + notas).

```mermaid
---
title: Flujo Principal de Operación en TranscribeAssist
---
stateDiagram-v2
    direction TB
    
    %% Nudos de inicio y fin
    state "Inicio (Pantalla Principal)" as Inicio
    state "Fin (Clase Terminada)" as Fin

    %% Subprocesos del Maestro
    state "MAESTRO (Host)" as Maestro {
        state "Seleccionar 'Nueva Sala'" as M_NuevaSala
        state "Servidor Render genera ID (Ej. m4x8p)" as M_GenID
        state "Compartir código con la clase" as M_Compartir
        state "Hablar al micrófono" as M_Hablar
        state "Web Speech API transcribe a texto" as M_Transcribir
        state "Emitir texto por WebSocket (Render)" as M_Emitir

        M_NuevaSala --> M_GenID
        M_GenID --> M_Compartir
        M_Compartir --> M_Hablar
        M_Hablar --> M_Transcribir
        M_Transcribir --> M_Emitir
    }

    %% Subprocesos del Alumno
    state "ALUMNO (Peer)" as Alumno {
        state "Seleccionar 'Unirse a Sala'" as A_UnionSala
        state "Ingresar código (Ej. m4x8p)" as A_InputID
        state "Conectarse al servidor Render" as A_Conectar
        state "Recibir transcripción en vivo" as A_Recibir
        
        state "Herramientas de Estudio" as A_Estudio {
            state "Leer panel de transcripción" as A_Leer
            state "Resaltar texto (Marcatextos)" as A_Resaltar
            state "Escribir apuntes en Panel de Notas" as A_EscribirNotas
            
            A_Leer --> A_Resaltar
            A_Leer --> A_EscribirNotas
        }

        A_UnionSala --> A_InputID
        A_InputID --> A_Conectar
        A_Conectar --> A_Recibir
        A_Recibir --> A_Estudio
    }
    
    %% Subprocesos de Cierre
    state "Cierre de Sesión" as Cierre {
        state "El maestro finaliza la reunión" as C_FinMaestro
        state "Seleccionar 'Exportar a PDF'" as C_Exportar
        state "Descargar documento de estudio\n(Transcripción + Notas Resaltadas)" as C_Descargar
        
        C_FinMaestro --> C_Exportar
        C_Exportar --> C_Descargar
    }

    %% Conexiones Globales de Flujo
    [*] --> Inicio
    Inicio --> M_NuevaSala
    Inicio --> A_UnionSala
    
    %% Sincronización entre actividades
    M_Compartir --> A_InputID : "El maestro dicta/proyecta el código"
    M_Emitir --> A_Recibir : "Transferencia milisegundos (Socket.io)"
    
    %% Finalización
    M_Hablar --> C_FinMaestro : "Termina el horario de clase"
    A_Estudio --> C_Exportar : "Alumno desea guardar la información"
    
    C_Descargar --> Fin
    Fin --> [*]
```

## Explicación del Flujo
1. **Inicio de la Dinámica**: Ambos usuarios (Maestro y Alumno) parten de la pantalla principal. El Maestro opta por hostear la sala; el sistema mediante *Socket.io* conectando con *Render* le asigna una sala exclusiva, devolviéndole un código alfanumérico corto.
2. **Distribución del Código**: El Maestro dicta o proyecta el código a su clase.
3. **Unión de Alumnos**: Cada Alumno ingresa a la opción *Unirse a Sala*, digita el código corto, y en tiempo récord su dispositivo abre la conexión WebSocket.
4. **Flujo de Trabajo (Real-Time)**:
    * El Maestro imparte su materia normalmente. El micrófono, junto con *Web Speech API*, detecta su voz y la transforma en texto.
    * Ese texto es subido al servidor en Render y retransmitido a toda la sala de alumnos casi instantáneamente.
5. **Estudio Activo**: Los alumnos ven el texto llegar. Si algo les parece importante, utilizan su *marcatextos virtual*. Si recuerdan un concepto clave de la lectura o quieren agregar algo, usan el *Panel de Notas*. Las notas se guardan de forma volátil en la RAM interactuando simultáneamente con la transcripción en vivo.
6. **Cierre de Ciclo**: Al terminar la sesión, el alumno (o incluso el maestro) procede a usar el módulo de *Exportación PDF*. En tan solo un clic, la herramienta encapsula sus resaltados de colores y sus notas privadas en un documento local descargable. Ningún dato queda alojado en un servidor externo. Todo cumple su propósito, de la voz al papel (digital).
