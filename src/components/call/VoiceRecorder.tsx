'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, X, Send, Square } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface VoiceRecorderProps {
    onSend: (attachment: { url: string; type: string; name: string; size: number }) => void;
    isDark?: boolean;
}

export default function VoiceRecorder({ onSend, isDark = true }: VoiceRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [waveHeights, setWaveHeights] = useState<number[]>(Array(20).fill(4));

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animFrameRef = useRef<number | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    const safeCloseAudioContext = useCallback(() => {
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().catch(() => {});
        }
        audioContextRef.current = null;
        analyserRef.current = null;
    }, []);

    // ─── Waveform Animation ───
    const updateWaveform = useCallback(() => {
        if (!analyserRef.current) return;
        const analyser = analyserRef.current;
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);

        const bars = 20;
        const step = Math.floor(data.length / bars);
        const heights: number[] = [];
        for (let i = 0; i < bars; i++) {
            const val = data[i * step] || 0;
            heights.push(Math.max(4, (val / 255) * 32));
        }
        setWaveHeights(heights);
        animFrameRef.current = requestAnimationFrame(updateWaveform);
    }, []);

    // ─── Start Recording ───
    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            // Set up audio analyser for waveform
            const audioContext = new AudioContext();
            audioContextRef.current = audioContext;
            const source = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 64;
            source.connect(analyser);
            analyserRef.current = analyser;

            // Find a supported mimeType
            const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4', ''];
            let selectedMime = '';
            for (const mt of mimeTypes) {
                if (!mt || MediaRecorder.isTypeSupported(mt)) {
                    selectedMime = mt;
                    break;
                }
            }

            const mediaRecorder = selectedMime
                ? new MediaRecorder(stream, { mimeType: selectedMime })
                : new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.start(250); // Collect data every 250ms for reliable chunks
            setIsRecording(true);
            setRecordingTime(0);

            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

            updateWaveform();
        } catch (err) {
            console.error('Failed to start recording:', err);
        }
    }, [updateWaveform]);

    // ─── Stop Recording & Send ───
    const stopAndSend = useCallback(async () => {
        if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return;

        return new Promise<void>((resolve) => {
            mediaRecorderRef.current!.onstop = async () => {
                // Stop timer and animation
                if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
                if (animFrameRef.current) { cancelAnimationFrame(animFrameRef.current); animFrameRef.current = null; }
                safeCloseAudioContext();
                streamRef.current?.getTracks().forEach(t => t.stop());
                streamRef.current = null;

                setIsRecording(false);
                setWaveHeights(Array(20).fill(4));

                const blobType = chunksRef.current[0]?.type || 'audio/webm';
                const blob = new Blob(chunksRef.current, { type: blobType });
                if (chunksRef.current.length === 0 || blob.size < 100) {
                    // No data captured, discard
                    resolve();
                    return;
                }

                setIsUploading(true);

                try {
                    const fileName = `voice-${Date.now()}-${Math.random().toString(36).substring(7)}.webm`;
                    const filePath = `chat/${fileName}`;

                    const { error: uploadError } = await supabase.storage
                        .from('avatars')
                        .upload(filePath, blob);

                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = supabase.storage
                        .from('avatars')
                        .getPublicUrl(filePath);

                    onSend({
                        url: publicUrl,
                        type: 'AUDIO',
                        name: `Voice message`,
                        size: blob.size,
                    });
                } catch (err) {
                    console.error('Voice upload failed:', err);
                } finally {
                    setIsUploading(false);
                }
                resolve();
            };

            mediaRecorderRef.current!.stop();
        });
    }, [onSend, safeCloseAudioContext]);

    // ─── Cancel Recording ───
    const cancelRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.onstop = null;
            mediaRecorderRef.current.stop();
        }
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        if (animFrameRef.current) { cancelAnimationFrame(animFrameRef.current); animFrameRef.current = null; }
        safeCloseAudioContext();
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        setIsRecording(false);
        setRecordingTime(0);
        setWaveHeights(Array(20).fill(4));
    }, [safeCloseAudioContext]);

    // ─── Cleanup on unmount ───
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
            safeCloseAudioContext();
            streamRef.current?.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        };
    }, []);

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    // ─── Recording UI ───
    if (isRecording) {
        return (
            <div className="flex items-center gap-3 w-full">
                {/* Cancel */}
                <button
                    onClick={cancelRecording}
                    className="p-2.5 rounded-xl hover:bg-red-500/10 text-red-400 transition-all flex-shrink-0"
                    title="Cancel"
                >
                    <X size={20} />
                </button>

                {/* Waveform + Timer */}
                <div className="flex-1 flex items-center gap-3 px-4 py-2.5 rounded-2xl" style={{ background: isDark ? 'rgba(139,92,246,0.08)' : 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}>
                    {/* Recording dot */}
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />

                    {/* Timer */}
                    <span className="text-[13px] font-mono text-red-400 w-12 flex-shrink-0">{formatTime(recordingTime)}</span>

                    {/* Waveform bars */}
                    <div className="flex items-center gap-[2px] flex-1 h-8 justify-center overflow-hidden">
                        {waveHeights.map((h, i) => (
                            <div
                                key={i}
                                className="w-[3px] rounded-full bg-[#8B5CF6] transition-all duration-75"
                                style={{ height: `${h}px` }}
                            />
                        ))}
                    </div>
                </div>

                {/* Send */}
                <button
                    onClick={stopAndSend}
                    className="p-2.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7c3aed] text-white transition-all flex-shrink-0 shadow-lg shadow-[#8B5CF6]/20"
                    title="Send voice message"
                >
                    <Send size={20} />
                </button>
            </div>
        );
    }

    // ─── Default Mic Button ───
    if (isUploading) {
        return (
            <button disabled className="p-2.5 rounded-xl text-white/30 flex-shrink-0">
                <div className="w-5 h-5 border-2 border-white/20 border-t-[#8B5CF6] rounded-full animate-spin" />
            </button>
        );
    }

    return (
        <button
            onClick={startRecording}
            className="p-2.5 rounded-xl hover:bg-[#8B5CF6]/10 text-white/40 hover:text-[#8B5CF6] transition-all flex-shrink-0"
            title="Hold to record voice message"
        >
            <Mic size={20} />
        </button>
    );
}
