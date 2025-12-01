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

## 5. Arquitectura y Diseño de Interacción

### 5.1. Mapa del Sistema
La aplicación se compone de las siguientes pantallas principales:
1.  **Pantalla de Bienvenida (`/`)**: Página de inicio donde el usuario elige su rol. Es el punto de entrada a la aplicación.
2.  **Vista del Maestro (`/teacher`)**: Interfaz principal para el rol de docente. Contiene los controles para la transcripción, la pizarra, el resumen por IA y los comandos de voz.
3.  **Vista del Alumno (`/student`)**: Interfaz principal para el rol de estudiante. Permite visualizar la transcripción en tiempo real, obtener definiciones, copiar y descargar el texto.

### 5.2. Flujo de Usuario
El recorrido típico del usuario se describe a continuación:
1.  **Llegada y Selección de Rol**: El usuario accede a la página principal (`/`) y se le presentan dos opciones claras: "Entrar como Maestro" o "Entrar como Alumno".
2.  **Redirección**: Al hacer clic en una de las opciones, es redirigido a la URL correspondiente (`/teacher` o `/student`).
3.  **Interacción según el Rol**:
    - **Maestro**:
        - Inicia la transcripción para que la clase pueda seguirla.
        - Activa la VUI para controlar la aplicación con la voz.
        - Utiliza la pizarra para dibujar o resaltar puntos importantes.
        - Mueve el panel de transcripción para que no estorbe en la pantalla.
        - Al final de la clase, genera un resumen con IA para compartir.
    - **Alumno**:
        - Observa la transcripción en vivo.
        - Si no conoce una palabra, hace doble clic sobre ella para ver su definición.
        - Al finalizar, puede copiar la transcripción completa o descargarla como un archivo de texto.
4.  **Ajustes de Visualización**: En cualquier momento, tanto el maestro como el alumno pueden hacer clic en el icono de "Ajustes" para personalizar la apariencia del texto y el tema de color según sus necesidades de accesibilidad o preferencia.
5.  **Regreso**: Desde ambas vistas (Maestro y Alumno), hay un botón para volver a la pantalla principal de selección de rol.

### 5.3. Diseño de Interacción
El sistema combina múltiples modalidades de interacción para crear una experiencia de usuario flexible y accesible:
- **Interacción Directa (GUI)**: La interfaz gráfica de usuario es la modalidad principal. Se basa en botones con iconos claros (`<Button>`), menús desplegables (`<DropdownMenu>`) y diálogos (`<Dialog>`) para todas las funciones principales. El uso de `tooltips` en cada control ayuda a clarificar su función.
- **Interacción por Voz (VUI)**: Para el maestro, se implementa una VUI que funciona en paralelo a la transcripción. Un "escucha" de comandos específico (`useVoiceCommands`) se activa para reconocer frases clave (ej. "activar pizarra") y traducirlas en acciones dentro de la aplicación, permitiendo un control "manos libres".
- **Interacción Basada en Puntero (Doble Clic)**: Para el alumno, se habilita una interacción específica con el texto. Al hacer doble clic en una palabra, el sistema la aísla, la envía a una API de diccionario y muestra la definición en un panel emergente y móvil (`<Rnd>`), permitiendo una consulta rápida sin interrumpir la lectura.
- **Manipulación Directa (Arrastrar y Redimensionar)**: El panel de transcripción del maestro y el panel de definición del alumno son ventanas flotantes que pueden ser arrastradas y redimensionadas por el usuario, dándole control total sobre la disposición de su espacio de trabajo.

### 5.4. Infraestructura
Para el correcto funcionamiento del sistema, se requiere el siguiente conjunto de tecnologías y hardware:
- **Software (Cliente)**:
    - **Navegador Web Moderno**: Compatible con HTML5, CSS3 y JavaScript (ES6+).
    - **Web Speech API**: Es una dependencia crucial para la transcripción y los comandos de voz. Su implementación es más robusta en navegadores basados en Chromium como Google Chrome.
- **Software (Frameworks y Librerías)**:
    - **Next.js/React**: Para la construcción de la interfaz de usuario reactiva.
    - **Tailwind CSS & ShadCN UI**: Para el diseño y los componentes de la interfaz.
    - **Genkit (Google AI)**: Para la funcionalidad de resumen de texto.
    - **Lucide React**: Para la iconografía.
    - **react-rnd**: Para los paneles móviles y redimensionables.
- **Hardware**:
    - **Micrófono**: Requerido para la transcripción y los comandos de voz. Puede ser el micrófono integrado de un portátil o uno externo.
    - **Dispositivo de Cómputo**: Un ordenador, tableta o smartphone con la capacidad de ejecutar un navegador moderno y procesar audio en tiempo real.
- **Servicios Externos**:
    - **Free Dictionary API (`dictionaryapi.dev`)**: API pública utilizada para obtener las definiciones de las palabras.
    - **Google AI Platform**: Proporciona el modelo de lenguaje para la generación de resúmenes.
