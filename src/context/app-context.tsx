'use client';

import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { getFirestore, doc, setDoc, onSnapshot, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

export type Role = 'teacher' | 'student';

interface AppContextType {
  role: Role | null;
  setRole: (role: Role) => void;
  sessionId: string | null;
  setSessionId: (id: string, role: Role) => void;
  isPeerConnected: boolean;
  peerConnection: RTCPeerConnection | null;
  dataChannel: RTCDataChannel | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role | null>(null);
  const [sessionId, setSessionIdState] = useState<string | null>(null);
  const [isPeerConnected, setIsPeerConnected] = useState(false);
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const [dataChannel, setDataChannel] = useState<RTCDataChannel | null>(null);

  const { toast } = useToast();
  const db = getFirestore(firebaseApp);

  const setRole = (role: Role) => {
    setRoleState(role);
  };

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate && sessionId) {
        const candidatesCollection = doc(db, 'sessions', sessionId, role === 'teacher' ? 'teacherCandidates' : 'studentCandidates', event.candidate.sdpMid!);
        updateDoc(candidatesCollection, { candidate: JSON.stringify(event.candidate) });
      }
    };
    
    pc.ondatachannel = (event) => {
      const receiveChannel = event.channel;
      setDataChannel(receiveChannel);
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setIsPeerConnected(true);
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setIsPeerConnected(false);
      }
    };

    setPeerConnection(pc);
    return pc;
  }, [db, role, sessionId]);


  const setSessionId = useCallback(async (id: string, currentRole: Role) => {
    setSessionIdState(id);
    const pc = createPeerConnection();
    const sessionRef = doc(db, 'sessions', id);

    if (currentRole === 'teacher') {
      const channel = pc.createDataChannel('transcript');
      setDataChannel(channel);

      const offerDescription = await pc.createOffer();
      await pc.setLocalDescription(offerDescription);

      const offer = {
        sdp: offerDescription.sdp,
        type: offerDescription.type,
      };

      await setDoc(sessionRef, { offer, createdAt: serverTimestamp() });

      onSnapshot(sessionRef, (snapshot) => {
        const data = snapshot.data();
        if (data?.answer && !pc.currentRemoteDescription) {
          const answerDescription = new RTCSessionDescription(data.answer);
          pc.setRemoteDescription(answerDescription);
        }
      });
    } else { // Student role
      const docSnap = await getDoc(sessionRef);
      if (docSnap.exists()) {
        const { offer } = docSnap.data();
        await pc.setRemoteDescription(new RTCSessionDescription(offer));

        const answerDescription = await pc.createAnswer();
        await pc.setLocalDescription(answerDescription);

        const answer = {
          sdp: answerDescription.sdp,
          type: answerDescription.type,
        };

        await updateDoc(sessionRef, { answer });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error de Sesión',
          description: 'El código de sesión no es válido o ha expirado.'
        });
        setSessionIdState(null);
      }
    }
  }, [createPeerConnection, db, toast]);
  
  // Cleanup session on component unmount
  useEffect(() => {
    return () => {
      if (sessionId && role === 'teacher') {
        const sessionRef = doc(db, 'sessions', sessionId);
        deleteDoc(sessionRef);
      }
      peerConnection?.close();
    };
  }, [sessionId, role, db, peerConnection]);


  const value = {
    role,
    setRole,
    sessionId,
    setSessionId,
    isPeerConnected,
    peerConnection,
    dataChannel
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
