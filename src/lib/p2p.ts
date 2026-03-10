'use client';

/**
 * ===================================================================================
 * Lógica de Conexión Peer-to-Peer con PeerJS
 * ===================================================================================
 * Este archivo SÓLO debe ser importado en componentes de cliente ('use client').
 * Contiene la lógica para la comunicación en tiempo real entre maestro y alumnos.
 */

import Peer, { DataConnection } from 'peerjs';
import { customAlphabet } from 'nanoid';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

let peer: Peer | null = null;
const connections: DataConnection[] = [];
let heartbeatStarted = false;

// Sistema de keep-alive para detectar desconexiones
interface PeerWithHeartbeat {
  conn: DataConnection;
  lastPong: number;
  heartbeatTimeout?: NodeJS.Timeout;
}
const peersWithHeartbeat: Map<string, PeerWithHeartbeat> = new Map();

const HEARTBEAT_INTERVAL = 5000; // cada 5 segundos
const HEARTBEAT_TIMEOUT = 15000; // timeout si no hay pong en 15 segundos

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
 * Configuración ICE con servidores STUN y TURN públicos.
 * STUN funciona en la mayoría de redes domésticas simples.
 * TURN es necesario cuando ambos dispositivos están detrás de NATs restrictivos
 * (redes corporativas, universidades, ciertos routers).
 */
const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun.relay.metered.ca:80' },
  {
    urls: 'turn:a.relay.metered.ca:80',
    username: 'e8dd65b92f6d15a2e12d9b26',
    credential: '5VWNx+NQOZ7iSJfx',
  },
  {
    urls: 'turn:a.relay.metered.ca:80?transport=tcp',
    username: 'e8dd65b92f6d15a2e12d9b26',
    credential: '5VWNx+NQOZ7iSJfx',
  },
  {
    urls: 'turn:a.relay.metered.ca:443',
    username: 'e8dd65b92f6d15a2e12d9b26',
    credential: '5VWNx+NQOZ7iSJfx',
  },
  {
    urls: 'turn:a.relay.metered.ca:443?transport=tcp',
    username: 'e8dd65b92f6d15a2e12d9b26',
    credential: '5VWNx+NQOZ7iSJfx',
  },
];

function initializePeer(peerId?: string): Peer {
  if (peer) {
    // Si ya existe un peer y el ID es el mismo, lo retornamos.
    if (peer.id === peerId || !peerId) {
      return peer;
    }
    // Si el ID es diferente, destruimos el peer actual para crear uno nuevo.
    peer.destroy();
  }

  const peerOptions = {
    config: {
      iceServers: ICE_SERVERS,
      sdpSemantics: 'unified-plan', // Mejor compatibilidad con navegadores modernos
    },
    pingInterval: 5000, // Envía pings al servidor de señalización cada 5s para evitar que firewalls (ej. RIUV) cierren el websocket
    debug: 3, // Nivel máximo para ver exactamente qué bloquea la red
  };

  const newPeer = peerId 
    ? new Peer(peerId, peerOptions) 
    : new Peer(peerOptions);

  newPeer.on('open', (id) => {
    console.log('[P2P] Mi peer ID:', id);
    if (peerId) {
      // El maestro (host) está listo en el servidor y su sala está abierta
      notifyStatusListeners('connected');
    }
  });

  newPeer.on('connection', (conn) => {
    console.log('[P2P] Nuevo peer conectado:', conn.peer);
    setupConnection(conn);
  });

  newPeer.on('disconnected', () => {
    console.log('[P2P] Peer desconectado del servidor de señalización. Reconectando...');
    notifyStatusListeners('connecting');
    peer?.reconnect();
  });

  newPeer.on('error', (err) => {
    console.warn('[P2P] Error de conexión:', err.type, err.message);
    if (err.type === 'peer-unavailable' || err.type === 'invalid-id' || err.type === 'network') {
      notifyStatusListeners('error');
    }
    // Si el peer fue destruido por el servidor, intentar reconectar
    if (err.type === 'server-error' || err.type === 'socket-error') {
      console.log('[P2P] Error de servidor/socket, intentando reconectar en 3s...');
      setTimeout(() => peer?.reconnect(), 3000);
    }
  });

  peer = newPeer;
  return peer;
}

function setupConnection(conn: DataConnection) {
  // Evitar conexiones duplicadas
  if (connections.some(c => c.peer === conn.peer)) {
    console.log('[P2P] Conexión duplicada ignorada para:', conn.peer);
    return;
  }

  connections.push(conn);

  // Inicializar keep-alive para este peer
  const peerHeartbeat: PeerWithHeartbeat = {
    conn,
    lastPong: Date.now(),
  };
  peersWithHeartbeat.set(conn.peer, peerHeartbeat);
  notifyPeerStatusListeners(connections.length);

  conn.on('data', (data: unknown) => {
    // Si es un ping, responder automáticamente con pong
    if (typeof data === 'object' && data !== null && 'type' in data && data.type === 'ping') {
      if (conn.open) {
        conn.send({ type: 'pong' });
      }
      return;
    }

    // Si es un pong, actualizar timestamp
    if (typeof data === 'object' && data !== null && 'type' in data && data.type === 'pong') {
      const peer = peersWithHeartbeat.get(conn.peer);
      if (peer) {
        peer.lastPong = Date.now();
      }
      return;
    }

    console.log('[P2P] Datos recibidos de', conn.peer, ':', typeof data === 'object' && data !== null && 'type' in data ? (data as any).type : 'unknown');
    notifyDataListeners(data);
  });

  conn.on('close', () => {
    console.log('[P2P] Peer desconectado:', conn.peer);

    // Limpiar heartbeat
    const peer = peersWithHeartbeat.get(conn.peer);
    if (peer?.heartbeatTimeout) {
      clearTimeout(peer.heartbeatTimeout);
    }
    peersWithHeartbeat.delete(conn.peer);

    const index = connections.findIndex(c => c.peer === conn.peer);
    if (index > -1) {
      connections.splice(index, 1);
      notifyPeerStatusListeners(connections.length);
    }
  });

  conn.on('error', (err) => {
    console.error('[P2P] Error de conexión con', conn.peer, ':', err);
  });

  conn.on('open', () => {
    console.log('[P2P] Canal de datos abierto con:', conn.peer);
    notifyStatusListeners('connected');
  });
}

/**
 * Inicia un heartbeat periódico que envía pings a todos los alumnos.
 * Si un alumno no responde en tiempo, se desconecta automáticamente.
 */
function startHeartbeat() {
  setInterval(() => {
    const now = Date.now();
    const peersToRemove: string[] = [];

    peersWithHeartbeat.forEach((peer, peerId) => {
      // Si no hubo pong en los últimos 15 segundos, desconectar
      if (now - peer.lastPong > HEARTBEAT_TIMEOUT) {
        console.warn('[P2P] Sin heartbeat de', peerId, '- cerrando conexión');
        peersToRemove.push(peerId);
        peer.conn.close();
        return;
      }

      // Enviar ping
      if (peer.conn.open) {
        peer.conn.send({ type: 'ping' });
      }
    });

    // Limpiar peers sin respuesta
    peersToRemove.forEach(peerId => {
      peersWithHeartbeat.delete(peerId);
    });
  }, HEARTBEAT_INTERVAL);
}

/**
 * Inicia una sesión de maestro, generando un ID corto para compartir.
 * @returns El ID corto de 5 caracteres.
 */
export function hostSession(): string {
  // generamos un id y lo normalizamos a minúsculas para evitar confusiones al copiar/pegar
  const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 5);
  const newId = nanoid().toLowerCase();
  initializePeer(newId);

  // Iniciar heartbeat para detectar desconexiones de alumnos
  if (!heartbeatStarted) {
    heartbeatStarted = true;
    startHeartbeat();
  }

  return newId;
}

/**
 * Se une a la sesión de un maestro usando su ID.
 * Incluye lógica de reintento automático si la conexión no se establece.
 * @param teacherId El ID del peer del maestro.
 */
export function joinSession(teacherId: string) {
  // for consistency, convert incoming id to lowercase (hostSession returns lowercase)
  teacherId = teacherId.trim().toLowerCase();

  // Inicializamos nuestro propio peer sin ID específico
  const p = initializePeer();

  notifyStatusListeners('connecting');

  if (connections.some(c => c.peer === teacherId)) {
    console.log('[P2P] Ya conectado a este peer:', teacherId);
    notifyStatusListeners('connected');
    return;
  }

  let connectionAttempts = 0;
  const ATTEMPT_TIMEOUT = 10000; // 10s
  const MAX_RETRIES = 3;

  const attemptConnection = () => {
    connectionAttempts++;
    console.log(`[P2P] Intentando conectar a: ${teacherId} (Intento ${connectionAttempts}/${MAX_RETRIES})`);
    const conn = p.connect(teacherId, {
      reliable: true,
      serialization: 'json',
    });

    setupConnection(conn);

    // Verificar que la conexión realmente se abrió después de 10 segundos
    setTimeout(() => {
      if (!conn.open) {
        console.warn(`[P2P] La conexión no se abrió en 10s (Intento ${connectionAttempts}).`);
        // Remover la conexión fallida
        const index = connections.findIndex(c => c.peer === teacherId);
        if (index > -1) connections.splice(index, 1);
        peersWithHeartbeat.delete(teacherId);
        
        // Reintentar si no excedimos el límite
        if (connectionAttempts < MAX_RETRIES) {
          console.log('[P2P] Reintentando conexión...');
          attemptConnection();
        } else {
          console.error('[P2P] Límite de reintentos alcanzado. Es probable que un Firewall esté bloqueando WebRTC o la sala expiró.');
          notifyStatusListeners('error');
          p.destroy();
        }
      }
    }, ATTEMPT_TIMEOUT);
  };

  // Esperamos a que nuestro peer esté listo antes de conectar
  if (!p.id) {
    p.on('open', () => {
      console.log('[P2P] Nuestro peer está listo, conectando a', teacherId);
      attemptConnection();
    });
  } else {
    attemptConnection();
  }
}

/**
 * Envía datos a todos los peers conectados.
 * @param data Los datos a enviar (string, objeto, etc.).
 */
export function sendToPeers(data: any) {
  if (connections.length > 0) {
    connections.forEach(conn => {
      if (conn.open) {
        conn.send(data);
      }
    });
  }
}
