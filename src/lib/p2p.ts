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


function initializePeer(peerId?: string): Peer {
  if (peer) {
    // Si ya existe un peer y el ID es el mismo, lo retornamos.
    if (peer.id === peerId || !peerId) {
        return peer;
    }
    // Si el ID es diferente, destruimos el peer actual para crear uno nuevo.
    peer.destroy();
  }
  
  // El servidor de PeerJS es gratuito y público. No requiere configuración.
  const newPeer = peerId ? new Peer(peerId) : new Peer();

  newPeer.on('open', (id) => {
    console.log('My peer ID is: ' + id);
    if (!peerId) notifyStatusListeners('connected'); // Solo para alumnos
  });

  newPeer.on('connection', (conn) => {
    console.log('New peer connected:', conn.peer);
    setupConnection(conn);
  });

  newPeer.on('disconnected', () => {
    console.log('Peer disconnected. Reconnecting...');
    notifyStatusListeners('connecting');
    peer?.reconnect();
  });

  newPeer.on('error', (err) => {
    console.error('PeerJS error:', err);
    if (err.type === 'peer-unavailable' || err.type === 'invalid-id') {
        notifyStatusListeners('error');
    }
  });

  peer = newPeer;
  return peer;
}

function setupConnection(conn: DataConnection) {
    // Evitar conexiones duplicadas
    if (connections.some(c => c.peer === conn.peer)) {
      return;
    }

    connections.push(conn);
    notifyPeerStatusListeners(connections.length);

    conn.on('data', (data) => {
      console.log('Received data:', data);
      notifyDataListeners(data);
    });

    conn.on('close', () => {
      console.log('Peer disconnected:', conn.peer);
      const index = connections.findIndex(c => c.peer === conn.peer);
      if (index > -1) {
        connections.splice(index, 1);
        notifyPeerStatusListeners(connections.length);
      }
    });
    
    conn.on('open', () => {
        console.log('Connection opened with:', conn.peer);
        notifyStatusListeners('connected');
    });
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
  return newId;
}

/**
 * Se une a la sesión de un maestro usando su ID.
 * @param teacherId El ID del peer del maestro.
 */
export function joinSession(teacherId: string) {
  // for consistency, convert incoming id to lowercase (hostSession returns lowercase)
  teacherId = teacherId.trim().toLowerCase();

  // Inicializamos nuestro propio peer sin ID específico
  const p = initializePeer();
  
  notifyStatusListeners('connecting');
  
  if (connections.some(c => c.peer === teacherId)) {
      console.log('Already connected to this peer', teacherId);
      notifyStatusListeners('connected');
      return;
  }
  
  // Esperamos a que nuestro peer esté listo antes de conectar
  if (!p.id) {
    p.on('open', () => {
        console.log('Our peer is open, connecting to', teacherId);
        const conn = p.connect(teacherId);
        setupConnection(conn);
    });
  } else {
    console.log('Connecting to', teacherId);
    const conn = p.connect(teacherId);
    setupConnection(conn);
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
