'use client';

import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import type { Socket } from 'socket.io-client';

// ─── Types ───
export type CallType = 'audio' | 'video';
export type CallStatus = 'idle' | 'outgoing' | 'incoming' | 'connecting' | 'active' | 'failed' | 'no-answer';

export interface CallState {
    status: CallStatus;
    callType: CallType;
    remoteUserId: string | null;
    remoteUserName: string;
    remoteUserAvatar: string | null;
    isMuted: boolean;
    isVideoOff: boolean;
    callStartTime: number | null;
    failReason?: string;
}

interface CallContextType extends CallState {
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    startCall: (targetUserId: string, targetName: string, targetAvatar: string | null, type: CallType, roomId: string) => void;
    acceptCall: () => void;
    rejectCall: () => void;
    endCall: () => void;
    toggleMute: () => void;
    toggleVideo: () => void;
    retryCall: () => void;
    dismissCall: () => void;
}

const CallContext = createContext<CallContextType | null>(null);

export function useCall() {
    const ctx = useContext(CallContext);
    if (!ctx) throw new Error('useCall must be used within CallProvider');
    return ctx;
}

// ─── ICE Servers (Free alternatives) ───
const ICE_SERVERS: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject',
    },
    {
        urls: 'turn:openrelay.metered.ca:443',
        username: 'openrelayproject',
        credential: 'openrelayproject',
    },
    {
        urls: 'turn:openrelay.metered.ca:443?transport=tcp',
        username: 'openrelayproject',
        credential: 'openrelayproject',
    },
];

const RING_TIMEOUT_MS = 30000;  // 30 seconds to answer
const ICE_TIMEOUT_MS = 15000;   // 15 seconds for ICE to connect

interface CallProviderProps {
    children: React.ReactNode;
    socketRef: React.RefObject<Socket | null>;
    userId: string;
    userName: string;
    userAvatar: string | null;
}

export function CallProvider({ children, socketRef, userId, userName, userAvatar }: CallProviderProps) {
    const [callState, setCallState] = useState<CallState>({
        status: 'idle',
        callType: 'audio',
        remoteUserId: null,
        remoteUserName: '',
        remoteUserAvatar: null,
        isMuted: false,
        isVideoOff: false,
        callStartTime: null,
    });

    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
    const callStateRef = useRef(callState);
    const localStreamRef = useRef<MediaStream | null>(null);
    const ringTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const iceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastCallParamsRef = useRef<{ targetUserId: string; targetName: string; targetAvatar: string | null; type: CallType; roomId: string } | null>(null);

    useEffect(() => { callStateRef.current = callState; }, [callState]);
    useEffect(() => { localStreamRef.current = localStream; }, [localStream]);

    // ─── Clear all timers ───
    const clearTimers = useCallback(() => {
        if (ringTimeoutRef.current) { clearTimeout(ringTimeoutRef.current); ringTimeoutRef.current = null; }
        if (iceTimeoutRef.current) { clearTimeout(iceTimeoutRef.current); iceTimeoutRef.current = null; }
    }, []);

    // ─── Cleanup helpers ───
    const cleanupCall = useCallback((newStatus: CallStatus = 'idle', failReason?: string) => {
        clearTimers();

        // Close peer connection
        if (peerConnectionRef.current) {
            peerConnectionRef.current.ontrack = null;
            peerConnectionRef.current.onicecandidate = null;
            peerConnectionRef.current.oniceconnectionstatechange = null;
            peerConnectionRef.current.onconnectionstatechange = null;
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        pendingCandidatesRef.current = [];

        // Stop local stream via ref (avoids stale closure)
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(t => t.stop());
            localStreamRef.current = null;
        }

        setLocalStream(null);
        setRemoteStream(null);

        if (newStatus === 'idle') {
            setCallState({
                status: 'idle',
                callType: 'audio',
                remoteUserId: null,
                remoteUserName: '',
                remoteUserAvatar: null,
                isMuted: false,
                isVideoOff: false,
                callStartTime: null,
            });
        } else {
            // Keep remote user info for error/no-answer screens
            setCallState(prev => ({
                ...prev,
                status: newStatus,
                callStartTime: null,
                failReason,
            }));
        }
    }, [clearTimers]);

    // ─── Create Peer Connection ───
    const createPeerConnection = useCallback((targetUserId: string) => {
        // Close any existing connection first
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }

        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socketRef.current?.emit('call:ice-candidate', {
                    targetUserId,
                    candidate: event.candidate.toJSON(),
                });
            }
        };

        pc.ontrack = (event) => {
            console.log('[WebRTC] ontrack fired, streams:', event.streams.length);
            const [stream] = event.streams;
            if (stream) {
                setRemoteStream(stream);
            }
        };

        pc.oniceconnectionstatechange = () => {
            console.log('[WebRTC] ICE state:', pc.iceConnectionState);
            if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
                // Clear ICE timeout on successful connection
                if (iceTimeoutRef.current) { clearTimeout(iceTimeoutRef.current); iceTimeoutRef.current = null; }
                console.log('[WebRTC] Connected!');
            }
            if (pc.iceConnectionState === 'disconnected') {
                console.log('[WebRTC] Disconnected - waiting for reconnect...');
            }
            if (pc.iceConnectionState === 'failed') {
                console.log('[WebRTC] ICE connection failed');
                if (callStateRef.current.status === 'active' || callStateRef.current.status === 'connecting') {
                    cleanupCall('failed', 'Connection lost. Check your internet connection.');
                }
            }
        };

        pc.onconnectionstatechange = () => {
            console.log('[WebRTC] Connection state:', pc.connectionState);
            if (pc.connectionState === 'failed') {
                cleanupCall('failed', 'Peer connection failed.');
            }
            if (pc.connectionState === 'disconnected') {
                // Give 5s grace period before declaring failure
                setTimeout(() => {
                    if (peerConnectionRef.current?.connectionState === 'disconnected') {
                        cleanupCall('failed', 'Connection lost.');
                    }
                }, 5000);
            }
        };

        pc.onnegotiationneeded = () => {
            console.log('[WebRTC] Negotiation needed');
        };

        peerConnectionRef.current = pc;
        return pc;
    }, [socketRef, cleanupCall]);

    // ─── Get Media ───
    const getMedia = useCallback(async (type: CallType): Promise<MediaStream> => {
        const constraints: MediaStreamConstraints = {
            audio: true,
            video: type === 'video' ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } : false,
        };
        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log('[WebRTC] Got media stream, tracks:', stream.getTracks().map(t => `${t.kind}:${t.readyState}`));
            return stream;
        } catch (err: any) {
            console.error('[WebRTC] Media access failed:', err);
            throw new Error(err.name === 'NotAllowedError'
                ? 'Camera/microphone permission denied. Please allow access and try again.'
                : 'Could not access camera/microphone.');
        }
    }, []);

    // ─── Start Call (Caller) ───
    const startCall = useCallback(async (targetUserId: string, targetName: string, targetAvatar: string | null, type: CallType, roomId: string) => {
        if (callStateRef.current.status !== 'idle') return;

        // Save params for retry
        lastCallParamsRef.current = { targetUserId, targetName, targetAvatar, type, roomId };

        try {
            setCallState({
                status: 'outgoing',
                callType: type,
                remoteUserId: targetUserId,
                remoteUserName: targetName,
                remoteUserAvatar: targetAvatar,
                isMuted: false,
                isVideoOff: false,
                callStartTime: null,
            });

            // Get media first
            const stream = await getMedia(type);
            setLocalStream(stream);
            localStreamRef.current = stream;

            // Create peer connection and add tracks
            const pc = createPeerConnection(targetUserId);
            stream.getTracks().forEach(track => {
                console.log('[WebRTC] Caller adding track:', track.kind);
                pc.addTrack(track, stream);
            });

            // Now signal the other user
            socketRef.current?.emit('call:initiate', {
                targetUserId,
                callerName: userName,
                callerAvatar: userAvatar,
                callType: type,
                roomId,
            });

            // Set ring timeout — if no answer in 30s, show no-answer
            ringTimeoutRef.current = setTimeout(() => {
                if (callStateRef.current.status === 'outgoing') {
                    console.log('[WebRTC] Ring timeout — no answer');
                    socketRef.current?.emit('call:end', { targetUserId });
                    cleanupCall('no-answer');
                }
            }, RING_TIMEOUT_MS);

            console.log('[WebRTC] Call initiated to', targetUserId);
        } catch (err: any) {
            console.error('Failed to start call:', err);
            cleanupCall('failed', err.message || 'Failed to start call');
        }
    }, [socketRef, userName, userAvatar, getMedia, createPeerConnection, cleanupCall]);

    // ─── Accept Call (Callee) ───
    const acceptCall = useCallback(async () => {
        const state = callStateRef.current;
        if (state.status !== 'incoming' || !state.remoteUserId) return;

        try {
            setCallState(prev => ({ ...prev, status: 'connecting' }));

            // Get media
            const stream = await getMedia(state.callType);
            setLocalStream(stream);
            localStreamRef.current = stream;

            // Create peer connection and add tracks
            const pc = createPeerConnection(state.remoteUserId);
            stream.getTracks().forEach(track => {
                console.log('[WebRTC] Callee adding track:', track.kind);
                pc.addTrack(track, stream);
            });

            // Tell caller we accepted
            socketRef.current?.emit('call:accept', { callerId: state.remoteUserId });

            // Start ICE connection timeout
            iceTimeoutRef.current = setTimeout(() => {
                if (callStateRef.current.status === 'connecting') {
                    console.log('[WebRTC] ICE connection timeout');
                    cleanupCall('failed', 'Connection timed out. Try again.');
                }
            }, ICE_TIMEOUT_MS);

            console.log('[WebRTC] Call accepted, waiting for offer from', state.remoteUserId);
        } catch (err: any) {
            console.error('Failed to accept call:', err);
            cleanupCall('failed', err.message || 'Failed to accept call');
        }
    }, [socketRef, getMedia, createPeerConnection, cleanupCall]);

    // ─── Reject Call ───
    const rejectCall = useCallback(() => {
        const state = callStateRef.current;
        if (state.remoteUserId) {
            socketRef.current?.emit('call:reject', { callerId: state.remoteUserId });
        }
        cleanupCall();
    }, [socketRef, cleanupCall]);

    // ─── End Call ───
    const endCall = useCallback(() => {
        const state = callStateRef.current;
        if (state.remoteUserId) {
            socketRef.current?.emit('call:end', { targetUserId: state.remoteUserId });
        }
        cleanupCall();
    }, [socketRef, cleanupCall]);

    // ─── Retry Call ───
    const retryCall = useCallback(() => {
        cleanupCall();
        const params = lastCallParamsRef.current;
        if (params) {
            // Small delay to let cleanup finish
            setTimeout(() => {
                startCall(params.targetUserId, params.targetName, params.targetAvatar, params.type, params.roomId);
            }, 500);
        }
    }, [cleanupCall, startCall]);

    // ─── Dismiss (back to idle from error screens) ───
    const dismissCall = useCallback(() => {
        cleanupCall();
    }, [cleanupCall]);

    // ─── Toggle Mute ───
    const toggleMute = useCallback(() => {
        const stream = localStreamRef.current;
        if (stream) {
            const audioTrack = stream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setCallState(prev => ({ ...prev, isMuted: !audioTrack.enabled }));
            }
        }
    }, []);

    // ─── Toggle Video ───
    const toggleVideo = useCallback(() => {
        const stream = localStreamRef.current;
        if (stream) {
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setCallState(prev => ({ ...prev, isVideoOff: !videoTrack.enabled }));
            }
        }
    }, []);

    // ─── Socket Event Listeners ───
    useEffect(() => {
        const socket = socketRef.current;
        if (!socket) return;

        const onIncomingCall = (data: { callerId: string; callerName: string; callerAvatar: string | null; callType: CallType; roomId: string }) => {
            if (callStateRef.current.status !== 'idle') {
                socket.emit('call:reject', { callerId: data.callerId });
                return;
            }
            console.log('[WebRTC] Incoming call from', data.callerName);
            setCallState({
                status: 'incoming',
                callType: data.callType,
                remoteUserId: data.callerId,
                remoteUserName: data.callerName,
                remoteUserAvatar: data.callerAvatar,
                isMuted: false,
                isVideoOff: false,
                callStartTime: null,
            });
            // Save for potential retry
            lastCallParamsRef.current = {
                targetUserId: data.callerId,
                targetName: data.callerName,
                targetAvatar: data.callerAvatar,
                type: data.callType,
                roomId: data.roomId,
            };
        };

        const onCallAccepted = async () => {
            const state = callStateRef.current;
            const pc = peerConnectionRef.current;
            if (state.status !== 'outgoing' || !pc) {
                console.log('[WebRTC] onCallAccepted but wrong state:', state.status, !!pc);
                return;
            }

            try {
                // Clear ring timeout
                if (ringTimeoutRef.current) { clearTimeout(ringTimeoutRef.current); ringTimeoutRef.current = null; }

                console.log('[WebRTC] Call accepted by remote, creating offer...');
                setCallState(prev => ({ ...prev, status: 'connecting' }));
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                console.log('[WebRTC] Offer created and set, sending to remote');
                socket.emit('call:offer', {
                    targetUserId: state.remoteUserId,
                    offer,
                });

                // Start ICE connection timeout
                iceTimeoutRef.current = setTimeout(() => {
                    if (callStateRef.current.status === 'connecting') {
                        console.log('[WebRTC] ICE connection timeout after offer');
                        cleanupCall('failed', 'Connection timed out. Try again.');
                    }
                }, ICE_TIMEOUT_MS);
            } catch (err) {
                console.error('Error creating offer:', err);
                cleanupCall('failed', 'Failed to establish connection.');
            }
        };

        const onCallRejected = () => {
            console.log('[WebRTC] Call rejected');
            cleanupCall('failed', 'Call was declined.');
        };

        const onCallEnded = () => {
            console.log('[WebRTC] Call ended by remote');
            cleanupCall();
        };

        const onCallUnavailable = () => {
            console.log('[WebRTC] User unavailable (not online)');
            cleanupCall('failed', 'User is not available right now.');
        };

        const onOffer = async (data: { senderId: string; offer: RTCSessionDescriptionInit }) => {
            const pc = peerConnectionRef.current;
            if (!pc) {
                console.log('[WebRTC] Received offer but no peer connection');
                return;
            }

            try {
                console.log('[WebRTC] Received offer, setting remote description...');
                await pc.setRemoteDescription(new RTCSessionDescription(data.offer));

                // Add any pending ICE candidates
                for (const candidate of pendingCandidatesRef.current) {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                }
                pendingCandidatesRef.current = [];

                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                console.log('[WebRTC] Answer created and set, sending to remote');
                socket.emit('call:answer', {
                    targetUserId: data.senderId,
                    answer,
                });

                setCallState(prev => ({ ...prev, status: 'active', callStartTime: Date.now() }));
            } catch (err) {
                console.error('Error handling offer:', err);
                cleanupCall('failed', 'Failed to establish connection.');
            }
        };

        const onAnswer = async (data: { senderId: string; answer: RTCSessionDescriptionInit }) => {
            const pc = peerConnectionRef.current;
            if (!pc) {
                console.log('[WebRTC] Received answer but no peer connection');
                return;
            }

            try {
                console.log('[WebRTC] Received answer, setting remote description...');
                await pc.setRemoteDescription(new RTCSessionDescription(data.answer));

                for (const candidate of pendingCandidatesRef.current) {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                }
                pendingCandidatesRef.current = [];

                setCallState(prev => ({ ...prev, status: 'active', callStartTime: Date.now() }));
                console.log('[WebRTC] Call is now active!');
            } catch (err) {
                console.error('Error handling answer:', err);
                cleanupCall('failed', 'Failed to establish connection.');
            }
        };

        const onIceCandidate = async (data: { senderId: string; candidate: RTCIceCandidateInit }) => {
            const pc = peerConnectionRef.current;
            if (!pc) return;

            if (pc.remoteDescription) {
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
                } catch (err) {
                    console.error('Error adding ICE candidate:', err);
                }
            } else {
                pendingCandidatesRef.current.push(data.candidate);
            }
        };

        socket.on('call:incoming', onIncomingCall);
        socket.on('call:accepted', onCallAccepted);
        socket.on('call:rejected', onCallRejected);
        socket.on('call:ended', onCallEnded);
        socket.on('call:unavailable', onCallUnavailable);
        socket.on('call:offer', onOffer);
        socket.on('call:answer', onAnswer);
        socket.on('call:ice-candidate', onIceCandidate);

        return () => {
            socket.off('call:incoming', onIncomingCall);
            socket.off('call:accepted', onCallAccepted);
            socket.off('call:rejected', onCallRejected);
            socket.off('call:ended', onCallEnded);
            socket.off('call:unavailable', onCallUnavailable);
            socket.off('call:offer', onOffer);
            socket.off('call:answer', onAnswer);
            socket.off('call:ice-candidate', onIceCandidate);
        };
    }, [socketRef, cleanupCall]);

    // ─── Cleanup on unmount ───
    useEffect(() => {
        return () => {
            clearTimers();
            cleanupCall();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const contextValue: CallContextType = {
        ...callState,
        localStream,
        remoteStream,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleVideo,
        retryCall,
        dismissCall,
    };

    return (
        <CallContext.Provider value={contextValue}>
            {children}
        </CallContext.Provider>
    );
}
