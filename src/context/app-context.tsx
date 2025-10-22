'use client';

import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect, useRef } from 'react';
import { getFirestore, doc, setDoc, onSnapshot, getDoc, updateDoc, deleteDoc, serverTimestamp, collection, addDoc, onSnapshot as onCollectionSnapshot, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

export type Role = 'teacher' | 'student';

interface AppContextType {
  role: Role | null;
  setRole: (role: Role) => void;
  sessionId: string | null;
  setSessionId: (id: string, role: Role) => void;
  isPeerConnected: boolean;
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
  const pc = useRef<RTCPeerConnection | null>(null);
  const [dataChannel, setDataChannel] = useState<RTCDataChannel | null>(null);
  const db = getFirestore(firebaseApp);
  const { toast } = useToast();

  const setRole = (role: Role) => {
    setRoleState(role);
  };

  const setSessionId = (id: string, currentRole: Role) => {
    setSessionIdState(id);
    if (currentRole === 'teacher') {
        setupAsTeacher(id);
    } else {
        setupAsStudent(id);
    }
  };
  
  const setupPeerConnection = useCallback((currentSessionId: string, currentRole: Role) => {
    if (pc.current) {
        pc.current.close();
    }
    const peerConnection = new RTCPeerConnection(ICE_SERVERS);

    peerConnection.onicecandidate = async (event) => {
      if (event.candidate) {
        const candidatesCollectionRef = collection(db, 'sessions', currentSessionId, currentRole === 'teacher' ? 'teacherCandidates' : 'studentCandidates');
        await addDoc(candidatesCollectionRef, event.candidate.toJSON());
      }
    };

    peerConnection.onconnectionstatechange = () => {
      if (peerConnection.connectionState === 'connected') {
        setIsPeerConnected(true);
        toast({ title: 'Conexión establecida' });
      } else if (['disconnected', 'failed', 'closed'].includes(peerConnection.connectionState)) {
        setIsPeerConnected(false);
        if (peerConnection.connectionState !== 'closed') {
          toast({ title: 'Conexión perdida', variant: 'destructive' });
        }
      }
    };
    
    if (currentRole === 'teacher') {
      const channel = peerConnection.createDataChannel('transcript');
      channel.onopen = () => setIsPeerConnected(true);
      channel.onclose = () => setIsPeerConnected(false);
      setDataChannel(channel);
    } else {
      peerConnection.ondatachannel = (event) => {
        const receiveChannel = event.channel;
        receiveChannel.onopen = () => setIsPeerConnected(true);
        receiveChannel.onclose = () => setIsPeerConnected(false);
        setDataChannel(receiveChannel);
      };
    }

    pc.current = peerConnection;
  }, [db, toast]);


  const setupAsTeacher = useCallback(async (id: string) => {
    setupPeerConnection(id, 'teacher');
    const sessionRef = doc(db, 'sessions', id);

    const offerDescription = await pc.current!.createOffer();
    await pc.current!.setLocalDescription(offerDescription);

    const offer = {
      sdp: offerDescription.sdp,
      type: offerDescription.type,
    };

    await setDoc(sessionRef, { offer, createdAt: serverTimestamp() });

    onSnapshot(sessionRef, (snapshot) => {
      const data = snapshot.data();
      if (data?.answer && !pc.current?.currentRemoteDescription) {
        const answerDescription = new RTCSessionDescription(data.answer);
        pc.current!.setRemoteDescription(answerDescription);
      }
    });

    const studentCandidatesCollection = collection(db, 'sessions', id, 'studentCandidates');
    onCollectionSnapshot(studentCandidatesCollection, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
                const candidate = new RTCIceCandidate(change.doc.data());
                pc.current!.addIceCandidate(candidate);
            }
        });
    });

  }, [db, setupPeerConnection]);

  const setupAsStudent = useCallback(async (id: string) => {
    setupPeerConnection(id, 'student');
    const sessionRef = doc(db, 'sessions', id);
    const docSnap = await getDoc(sessionRef);

    if (docSnap.exists()) {
      const { offer } = docSnap.data();
      if (pc.current?.signalingState !== 'closed') {
        await pc.current!.setRemoteDescription(new RTCSessionDescription(offer));

        const answerDescription = await pc.current!.createAnswer();
        await pc.current!.setLocalDescription(answerDescription);

        const answer = {
          sdp: answerDescription.sdp,
          type: answerDescription.type,
        };

        await updateDoc(sessionRef, { answer });
        
        const teacherCandidatesCollection = collection(db, 'sessions', id, 'teacherCandidates');
        onCollectionSnapshot(teacherCandidatesCollection, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === "added" && pc.current?.signalingState !== 'closed') {
                    const candidate = new RTCIceCandidate(change.doc.data());
                    pc.current!.addIceCandidate(candidate);
                }
            });
        });
      }
    } else {
      toast({
        variant: 'destructive',
        title: 'Error de Sesión',
        description: 'El código de sesión no es válido o ha expirado.'
      });
      setSessionIdState(null);
    }
  }, [db, setupPeerConnection, toast]);

  // This effect handles cleanup when the component unmounts.
  useEffect(() => {
    const cleanup = async () => {
      if (sessionId && role === 'teacher') {
        try {
          const sessionRef = doc(db, 'sessions', sessionId);
          // Delete subcollections first
          const teacherCandidatesRef = collection(db, 'sessions', sessionId, 'teacherCandidates');
          const studentCandidatesRef = collection(db, 'sessions', sessionId, 'studentCandidates');
          
          const batch = writeBatch(db);

          const teacherCands = await getDocs(teacherCandidatesRef);
          teacherCands.forEach(doc => batch.delete(doc.ref));

          const studentCands = await getDocs(studentCandidatesRef);
          studentCands.forEach(doc => batch.delete(doc.ref));

          await batch.commit();

          // Then delete the main session document
          await deleteDoc(sessionRef);

        } catch (error) {
            console.error("Error cleaning up session:", error)
        }
      }
      if (pc.current) {
        pc.current.close();
        pc.current = null;
      }
    };

    // This is the key change: we return the cleanup function from a useEffect
    // that runs only once, so it's only called on unmount.
    return () => {
      cleanup();
    };
  }, [sessionId, role, db]); // Rerun cleanup logic if session/role changes


  const value = {
    role,
    setRole,
    sessionId,
    setSessionId,
    isPeerConnected,
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
