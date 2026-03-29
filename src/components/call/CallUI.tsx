'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, RotateCcw, X, AlertTriangle, PhoneMissed } from 'lucide-react';
import { useCall } from './CallProvider';

// ─── Call Duration Timer ───
function CallTimer({ startTime }: { startTime: number }) {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setElapsed(Math.floor((Date.now() - startTime) / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, [startTime]);

    const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const secs = (elapsed % 60).toString().padStart(2, '0');
    return <span>{mins}:{secs}</span>;
}

// ─── Pulse Animation for Ringing ───
function PulseRing() {
    return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="absolute w-24 h-24 rounded-full bg-[#8B5CF6]/20 animate-ping" style={{ animationDuration: '2s' }} />
            <div className="absolute w-32 h-32 rounded-full bg-[#8B5CF6]/10 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
            <div className="absolute w-40 h-40 rounded-full bg-[#8B5CF6]/5 animate-ping" style={{ animationDuration: '2s', animationDelay: '1s' }} />
        </div>
    );
}

// ─── Avatar Fallback ───
function AvatarDisplay({ name, avatar, size = 96 }: { name: string; avatar: string | null; size?: number }) {
    return (
        <div
            className="rounded-full overflow-hidden bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center ring-4 ring-white/10 shadow-2xl"
            style={{ width: size, height: size }}
        >
            {avatar ? (
                <img src={avatar} alt={name} className="w-full h-full object-cover" />
            ) : (
                <span className="font-bold text-white" style={{ fontSize: size / 2.5 }}>
                    {name?.charAt(0)?.toUpperCase()}
                </span>
            )}
        </div>
    );
}

export default function CallUI() {
    const call = useCall();
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    // ─── Attach streams to video elements ───
    useEffect(() => {
        if (localVideoRef.current && call.localStream) {
            localVideoRef.current.srcObject = call.localStream;
        }
    }, [call.localStream]);

    useEffect(() => {
        if (remoteVideoRef.current && call.remoteStream) {
            remoteVideoRef.current.srcObject = call.remoteStream;
        }
    }, [call.remoteStream]);

    if (call.status === 'idle') return null;

    const isVideo = call.callType === 'video';

    // ─── FAILED / NO ANSWER ───
    if (call.status === 'failed' || call.status === 'no-answer') {
        const isNoAnswer = call.status === 'no-answer';
        return (
            <div className="fixed inset-0 z-[100002] flex items-center justify-center call-overlay" style={{ background: 'rgba(5, 5, 20, 0.95)', backdropFilter: 'blur(30px)' }}>
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-red-500/5 blur-[120px]" />
                </div>

                <div className="relative flex flex-col items-center gap-6 p-8 max-w-[340px] text-center">
                    {/* Icon */}
                    <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                        {isNoAnswer ? (
                            <PhoneMissed size={36} className="text-red-400" />
                        ) : (
                            <AlertTriangle size={36} className="text-red-400" />
                        )}
                    </div>

                    {/* Info */}
                    <div>
                        <h2 className="text-xl font-bold text-white mb-2">
                            {isNoAnswer ? 'No Answer' : 'Call Failed'}
                        </h2>
                        <p className="text-white/40 text-sm leading-relaxed">
                            {isNoAnswer
                                ? `${call.remoteUserName} didn't answer the call.`
                                : (call.failReason || 'The call could not be connected.')}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-5 mt-4">
                        <button onClick={call.dismissCall} className="group flex flex-col items-center gap-2">
                            <div className="w-14 h-14 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all duration-300 group-hover:scale-110 border border-white/10">
                                <X size={22} className="text-white/60" />
                            </div>
                            <span className="text-[10px] text-white/40">Close</span>
                        </button>

                        <button onClick={call.retryCall} className="group flex flex-col items-center gap-2">
                            <div className="w-14 h-14 rounded-full bg-[#22c55e]/15 hover:bg-[#22c55e]/30 flex items-center justify-center transition-all duration-300 group-hover:scale-110 border border-[#22c55e]/30 shadow-[0_0_30px_rgba(34,197,94,0.15)]">
                                <RotateCcw size={20} className="text-[#22c55e]" />
                            </div>
                            <span className="text-[10px] text-white/40">Retry</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ─── INCOMING CALL ───
    if (call.status === 'incoming') {
        return (
            <div className="fixed inset-0 z-[100002] flex items-center justify-center call-overlay" style={{ background: 'rgba(5, 5, 20, 0.95)', backdropFilter: 'blur(30px)' }}>
                {/* Background glow */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-[#8B5CF6]/10 blur-[120px]" />
                </div>

                <div className="relative flex flex-col items-center gap-6 p-8">
                    <PulseRing />

                    {/* Caller Avatar */}
                    <div className="relative z-10">
                        <AvatarDisplay name={call.remoteUserName} avatar={call.remoteUserAvatar} size={112} />
                    </div>

                    {/* Caller Info */}
                    <div className="text-center z-10">
                        <h2 className="text-2xl font-bold text-white mb-1">{call.remoteUserName}</h2>
                        <p className="text-white/50 text-sm flex items-center gap-2 justify-center">
                            {isVideo ? <Video size={16} /> : <Phone size={16} />}
                            Incoming {isVideo ? 'video' : 'audio'} call...
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-8 mt-6 z-10">
                        {/* Reject */}
                        <button
                            onClick={call.rejectCall}
                            className="group flex flex-col items-center gap-2"
                        >
                            <div className="w-16 h-16 rounded-full bg-red-500/20 hover:bg-red-500/40 flex items-center justify-center transition-all duration-300 group-hover:scale-110 border border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                                <PhoneOff size={24} className="text-red-400" />
                            </div>
                            <span className="text-[11px] text-white/40 font-medium">Decline</span>
                        </button>

                        {/* Accept */}
                        <button
                            onClick={call.acceptCall}
                            className="group flex flex-col items-center gap-2"
                        >
                            <div className="w-16 h-16 rounded-full bg-[#22c55e]/20 hover:bg-[#22c55e]/40 flex items-center justify-center transition-all duration-300 group-hover:scale-110 border border-[#22c55e]/30 shadow-[0_0_30px_rgba(34,197,94,0.2)] animate-pulse">
                                <Phone size={24} className="text-[#22c55e]" />
                            </div>
                            <span className="text-[11px] text-white/40 font-medium">Accept</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ─── OUTGOING / CONNECTING ───
    if (call.status === 'outgoing' || call.status === 'connecting') {
        return (
            <div className="fixed inset-0 z-[100002] flex items-center justify-center call-overlay" style={{ background: 'rgba(5, 5, 20, 0.95)', backdropFilter: 'blur(30px)' }}>
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-[#8B5CF6]/8 blur-[150px]" />
                </div>

                <div className="relative flex flex-col items-center gap-6 p-8">
                    {/* Pulsing Avatar */}
                    <div className="relative">
                        <div className="absolute inset-0 w-28 h-28 rounded-full bg-[#8B5CF6]/20 animate-ping" style={{ animationDuration: '1.5s' }} />
                        <AvatarDisplay name={call.remoteUserName} avatar={call.remoteUserAvatar} size={112} />
                    </div>

                    {/* Info */}
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-white mb-1">{call.remoteUserName}</h2>
                        <p className="text-white/50 text-sm">
                            {call.status === 'connecting' ? 'Connecting...' : 'Calling...'}
                        </p>
                        {/* Three dot animation */}
                        <div className="flex items-center justify-center gap-1.5 mt-3">
                            {[0, 1, 2].map(i => (
                                <div
                                    key={i}
                                    className="w-2 h-2 rounded-full bg-[#8B5CF6]"
                                    style={{
                                        animation: 'bounce 1.4s ease-in-out infinite',
                                        animationDelay: `${i * 0.2}s`,
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Cancel */}
                    <button
                        onClick={call.endCall}
                        className="group flex flex-col items-center gap-2 mt-8"
                    >
                        <div className="w-16 h-16 rounded-full bg-red-500/20 hover:bg-red-500/40 flex items-center justify-center transition-all duration-300 group-hover:scale-110 border border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                            <PhoneOff size={24} className="text-red-400" />
                        </div>
                        <span className="text-[11px] text-white/40 font-medium">Cancel</span>
                    </button>
                </div>

                {/* Bounce keyframes */}
                <style jsx>{`
                    @keyframes bounce {
                        0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
                        40% { transform: scale(1); opacity: 1; }
                    }
                `}</style>
            </div>
        );
    }

    // ─── ACTIVE CALL ───
    if (call.status === 'active') {
        return (
            <div className="fixed inset-0 z-[100002] flex flex-col call-overlay" style={{ background: 'rgba(5, 5, 20, 0.98)' }}>
                {/* Main Content Area */}
                <div className="flex-1 relative flex items-center justify-center overflow-hidden">
                    {isVideo && call.remoteStream ? (
                        <>
                            {/* Remote Video (full screen) */}
                            <video
                                ref={remoteVideoRef}
                                autoPlay
                                playsInline
                                className="w-full h-full object-cover"
                            />

                            {/* Local Video (PiP) */}
                            {call.localStream && !call.isVideoOff && (
                                <div className="absolute top-4 right-4 w-[120px] sm:w-[180px] aspect-[3/4] rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl bg-black z-10">
                                    <video
                                        ref={localVideoRef}
                                        autoPlay
                                        playsInline
                                        muted
                                        className="w-full h-full object-cover mirror"
                                        style={{ transform: 'scaleX(-1)' }}
                                    />
                                </div>
                            )}
                        </>
                    ) : (
                        /* Audio-only or video off: show avatar */
                        <div className="flex flex-col items-center gap-6">
                            <div className="relative">
                                <AvatarDisplay name={call.remoteUserName} avatar={call.remoteUserAvatar} size={140} />
                                {/* Audio wave animation */}
                                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-end gap-[3px] h-6">
                                    {[...Array(5)].map((_, i) => (
                                        <div
                                            key={i}
                                            className="w-[3px] rounded-full bg-[#cdf876]"
                                            style={{
                                                animation: 'audioWave 1.2s ease-in-out infinite',
                                                animationDelay: `${i * 0.15}s`,
                                                height: '4px',
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="text-center mt-4">
                                <h2 className="text-2xl font-bold text-white">{call.remoteUserName}</h2>
                                <p className="text-[#cdf876] text-sm mt-1 font-medium">
                                    {call.callStartTime && <CallTimer startTime={call.callStartTime} />}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Video call overlay info */}
                    {isVideo && call.remoteStream && (
                        <div className="absolute top-4 left-4 z-10 flex items-center gap-3 px-4 py-2 rounded-2xl" style={{ background: 'rgba(10,11,30,0.7)', backdropFilter: 'blur(10px)' }}>
                            <h3 className="text-white text-sm font-semibold">{call.remoteUserName}</h3>
                            <span className="text-[#cdf876] text-xs font-medium">
                                {call.callStartTime && <CallTimer startTime={call.callStartTime} />}
                            </span>
                        </div>
                    )}
                </div>

                {/* Controls Bar */}
                <div className="flex-shrink-0 flex items-center justify-center gap-4 sm:gap-6 py-6 sm:py-8 px-4" style={{ background: 'linear-gradient(0deg, rgba(5,5,20,1) 0%, rgba(5,5,20,0.8) 100%)' }}>
                    {/* Mute */}
                    <button
                        onClick={call.toggleMute}
                        className="group flex flex-col items-center gap-1.5"
                    >
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110 border ${call.isMuted
                            ? 'bg-white/15 border-white/20'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                            }`}>
                            {call.isMuted ? <MicOff size={20} className="text-white" /> : <Mic size={20} className="text-white/70" />}
                        </div>
                        <span className="text-[10px] text-white/40">{call.isMuted ? 'Unmute' : 'Mute'}</span>
                    </button>

                    {/* Toggle Video (only for video calls) */}
                    {isVideo && (
                        <button
                            onClick={call.toggleVideo}
                            className="group flex flex-col items-center gap-1.5"
                        >
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110 border ${call.isVideoOff
                                ? 'bg-white/15 border-white/20'
                                : 'bg-white/5 border-white/10 hover:bg-white/10'
                                }`}>
                                {call.isVideoOff ? <VideoOff size={20} className="text-white" /> : <Video size={20} className="text-white/70" />}
                            </div>
                            <span className="text-[10px] text-white/40">{call.isVideoOff ? 'Show' : 'Hide'}</span>
                        </button>
                    )}

                    {/* End Call */}
                    <button
                        onClick={call.endCall}
                        className="group flex flex-col items-center gap-1.5"
                    >
                        <div className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-[0_0_40px_rgba(239,68,68,0.3)]">
                            <PhoneOff size={22} className="text-white" />
                        </div>
                        <span className="text-[10px] text-white/40">End</span>
                    </button>
                </div>

                {/* Audio Wave keyframes */}
                <style jsx>{`
                    @keyframes audioWave {
                        0%, 100% { height: 4px; }
                        50% { height: 20px; }
                    }
                `}</style>
            </div>
        );
    }

    return null;
}
