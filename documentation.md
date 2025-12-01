# Documentación de Requisitos: TranscribeAssist

## 1. Requisitos del Sistema

### 1.1. Requisitos de Software (Cliente)
- **Navegador Web Moderno:** Se requiere la última versión de navegadores como Google Chrome, Mozilla Firefox, Microsoft Edge o Safari.
  - **Nota importante:** Para la funcionalidad completa de transcripción en tiempo real y comandos de voz, se recomienda **Google Chrome**, ya que ofrece la implementación más robusta y compatible de la Web Speech API.
- **Conexión a Internet:** Se necesita una conexión a internet estable para la carga inicial de la aplicación y la resolución de definiciones de palabras.

### 1.2. Requisitos de Hardware (Cliente)
- **Micrófono:** Se requiere un micrófono funcional (interno o externo) para la transcripción de voz y para los comandos de la Interfaz de Usuario por Voz (VUI).
- **Dispositivo de Cómputo:** Un ordenador de escritorio, portátil, tableta o smartphone capaz de ejecutar un navegador web moderno.

## 2. Requisitos Funcionales

### 2.1. Gestión de Roles
- **RF-001:** El sistema debe presentar una pantalla de bienvenida donde el usuario pueda seleccionar su rol: "Maestro" o "Alumno".
- **RF-002:** El sistema debe redirigir al usuario a la interfaz correspondiente según el rol seleccionado.

### 2.2. Funcionalidades del Maestro
- **RF-003:** El maestro debe poder iniciar y detener la transcripción de audio en tiempo real.
- **RF-004:** El sistema debe mostrar la transcripción en un panel móvil, redimensionable y anclable en la pantalla.
- **RF-005:** El maestro debe poder activar un modo "Pizarra", que habilita un lienzo de dibujo sobre toda la pantalla.
- **RF-006:** En el modo Pizarra, el maestro debe poder cambiar el color del pincel y limpiar el lienzo.
- **RF-007:** El maestro debe poder generar un resumen del contenido de la transcripción mediante un modelo de IA.
- **RF-008:** El resumen generado por la IA debe mostrarse en un cuadro de diálogo emergente.
- **RF-009:** El maestro debe poder controlar funciones clave de la aplicación mediante comandos de voz (VUI).

### 2.3. Funcionalidades del Alumno
- **RF-010:** El alumno debe poder ver la transcripción en tiempo real generada por el maestro.
- **RF-011:** El alumno debe poder hacer doble clic en una palabra de la transcripción para obtener su definición.
- **RF-012:** La definición de la palabra debe aparecer en un panel emergente y móvil.
- **RF-013:** El alumno debe poder copiar el texto completo de la transcripción al portapapeles.
- **RF-014:** El alumno debe poder descargar la transcripción como un archivo de texto (`.txt`).

### 2.4. Personalización de la Interfaz
- **RF-015:** Tanto el maestro como el alumno deben poder acceder a un panel de ajustes de visualización.
- **RF-016:** Los usuarios deben poder ajustar el tamaño de fuente, la altura de línea y el espaciado entre letras.
- **RF-017:** Los usuarios deben poder cambiar la tipografía del texto de la transcripción (incluyendo fuentes para accesibilidad como Open Dyslexic).
- **RF-018:** Los usuarios deben poder seleccionar entre diferentes temas de color, incluyendo modos de alto contraste y para daltonismo (Protanopia, Deuteranopia, Tritanopia).

## 3. Requisitos No Funcionales

- **RNF-001 (Rendimiento):** La transcripción en tiempo real debe aparecer con una latencia mínima, idealmente menos de 2 segundos desde que se pronuncia la palabra.
- **RNF-002 (Usabilidad):** La interfaz debe ser intuitiva y fácil de usar, con controles claramente identificados mediante iconos y tooltips.
- **RNF-003 (Compatibilidad):** El sistema debe ser responsivo y funcionar correctamente en dispositivos de escritorio y móviles. La funcionalidad principal debe ser compatible con los navegadores web modernos especificados.
- **RNF-004 (Accesibilidad):** El sistema debe incluir temas de color y opciones de texto para mejorar la accesibilidad para usuarios con discapacidades visuales o dislexia. Los elementos interactivos deben tener etiquetas ARIA adecuadas para lectores de pantalla.
- **RNF-005 (Privacidad):** La transcripción de voz se procesa localmente en el navegador a través de la Web Speech API y no se almacena en un servidor central, garantizando la privacidad de la sesión.

## 4. Requisitos Específicos de Interacción Avanzada (VUI)

- **RIA-001:** El sistema debe proporcionar un mecanismo para activar y desactivar la escucha de comandos de voz.
- **RIA-002:** La escucha de comandos de voz no debe interferir con la transcripción principal de la clase.
- **RIA-003:** El sistema debe reconocer y ejecutar los siguientes comandos de voz para el rol de Maestro:
  - **`iniciar grabación`**: Comienza la transcripción de la clase.
  - **`detener grabación`**: Detiene la transcripción de la clase.
  - **`activar pizarra`**: Muestra la pizarra de dibujo.
  - **`cerrar pizarra`**: Oculta la pizarra de dibujo.
  - **`pizarra arriba`**: Ancla el panel de transcripción en la parte superior de la pantalla.
  - **`pizarra abajo`**: Ancla el panel de transcripción en la parte inferior de la pantalla.
  - **`pizarra izquierda`**: Ancla el panel de transcripción en el lado izquierdo de la pantalla.
  - **`pizarra derecha`**: Ancla el panel de transcripción en el lado derecho de la pantalla.
  - **`pizarra centro`**: Devuelve el panel de transcripción al modo flotante y lo centra en la pantalla.
