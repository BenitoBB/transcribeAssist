'use client';

/**
 * ===================================================================================
 * Lógica de Conexión con Socket.io
 * ===================================================================================
 * Se reemplaza PeerJS por Socket.io (WebSocket over HTTP) para saltar Firewalls como el
 * de la RIUV. Se mantienen las firmas de los métodos para no romper los componentes.
 */

import { io, Socket } from 'socket.io-client';
import { customAlphabet } from 'nanoid';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

// Liga del servidor de Socket.io en Render
const SOCKET_URL = 'https://transcribeassist-server.onrender.com';

let socket: Socket | null = null;
let currentSessionId: string | null = null;

// --- Sistema de Eventos para la UI ---
type DataCallback = (data: any) => void;
const dataListeners: DataCallback[] = [];

type StatusCallback = (status: ConnectionStatus) => void;
const statusListeners: StatusCallback[] = [];

type PeerStatusCallback = (peerCount: number) => void;
const peerStatusListeners: PeerStatusCallback[] = [];

export function onDataReceived(callback: DataCallback) {
  dataListeners.push(callback);
  return () => {
    const index = dataListeners.indexOf(callback);
    if (index > -1) dataListeners.splice(index, 1);
  };
}

export function onConnectionStatusChange(callback: StatusCallback) {
  statusListeners.push(callback);
  return () => {
    const index = statusListeners.indexOf(callback);
    if (index > -1) statusListeners.splice(index, 1);
  };
}

export function onPeerStatusChange(callback: PeerStatusCallback) {
  peerStatusListeners.push(callback);
  return () => {
    const index = peerStatusListeners.indexOf(callback);
    if (index > -1) peerStatusListeners.splice(index, 1);
  };
}

function notifyDataListeners(data: any) {
  dataListeners.forEach(listener => listener(data));
}

function notifyStatusListeners(status: ConnectionStatus) {
  statusListeners.forEach(listener => listener(status));
}

function notifyPeerStatusListeners(count: number) {
  peerStatusListeners.forEach(listener => listener(count));
}

/**
 * Inicializa la conexión con el servidor Socket.io en vez de crear un Peer P2P local
 */
function initializeSocket(roomId: string, isHost: boolean = false) {
  if (socket) {
    socket.disconnect();
  }

  // Socket.io maneja HTTP long-polling automáticamente si fallan los websockets (perfecto para la RIUV)
  // Socket.io maneja HTTP long-polling automáticamente si fallan los websockets (perfecto para la RIUV)
  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    reconnectionAttempts: Infinity, // Nunca dejar de reintentar
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000,
    timeout: 20000,
  });

  notifyStatusListeners('connecting');

  socket.on('connect', () => {
    console.log('[Socket] Conectado al servidor de sincronización:', socket?.id);

    // Al conectar, unirse a la sala
    socket?.emit('join_room', roomId);
    currentSessionId = roomId;

    if (isHost) {
      notifyStatusListeners('connected'); // El maestro está listo de inmediato tras entrar
    }
  });

  // Los errores transitorios (timeouts de Render despertando) NO deben mostrar error al usuario.
  // Socket.io reintentará automáticamente. Solo logeamos un warning.
  socket.on('connect_error', (err) => {
    console.warn('[Socket] Error de conexión transitorio:', err.message, '— Reintentando...');
    // NO notificamos 'error' aquí; dejamos que Socket.io maneje la reconexión.
    // Solo cambiamos a 'connecting' para que la UI refleje el reintento.
    notifyStatusListeners('connecting');
  });

  // Este evento se dispara cuando Socket.io agota TODOS los reintentos (con Infinity, nunca pasa)
  socket.on('reconnect_failed', () => {
    console.error('[Socket] Todos los reintentos agotados. Conexión fallida definitivamente.');
    notifyStatusListeners('error');
  });

  // Cuando Socket.io reconecta exitosamente, re-unirse a la sala
  socket.on('reconnect', () => {
    console.log('[Socket] Reconectado exitosamente. Re-uniéndose a sala:', roomId);
    socket?.emit('join_room', roomId);
    if (isHost) {
      notifyStatusListeners('connected');
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Desconectado por:', reason);
    // Si el servidor cerró la conexión, Socket.io reconectará automáticamente
    if (reason === 'io server disconnect') {
      // El servidor forzó la desconexión, intentamos reconectar manualmente
      socket?.connect();
    }
    notifyStatusListeners('connecting'); // Mostramos "reconectando" en vez de "desconectado"
  });

  socket.on('peer_count', (count: number) => {
    // Si soy Host, el total de alumnos son todos los de la sala menos yo (el Host)
    let peerTotal = count - 1;
    if (peerTotal < 0) peerTotal = 0;

    notifyPeerStatusListeners(peerTotal);

    // Si soy Alumno y la sala tiene al menos 2 personas (Maestro + Yo), asumimos conexión correcta
    if (!isHost && count >= 2) {
      console.log('[Socket] Alumno ha entrado a sala activa.');
      notifyStatusListeners('connected');
    }
  });

  socket.on('data_received', (data: any) => {
    // Cuando entra broadcast de Data (ej. {type: 'full_text', text: '...'})
    notifyDataListeners(data);
  });
}

/**
 * Inicia una sesión de maestro, generando un ID corto para compartir.
 */
export function hostSession(): string {
  const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 5);
  const roomId = nanoid().toLowerCase();

  initializeSocket(roomId, true);
  return roomId;
}

/**
 * Se une a la sesión de un maestro usando su ID.
 * @param teacherId El ID del peer del maestro (roomId).
 */
export function joinSession(teacherId: string) {
  teacherId = teacherId.trim().toLowerCase();
  initializeSocket(teacherId, false);
}

/**
 * Envía datos a todos los peers conectados en la sala actual.
 * @param data Los datos a enviar (string, objeto, etc.).
 */
export function sendToPeers(data: any) {
  if (socket && socket.connected && currentSessionId) {
    socket.emit('broadcast_data', { roomId: currentSessionId, data });
  }
}
