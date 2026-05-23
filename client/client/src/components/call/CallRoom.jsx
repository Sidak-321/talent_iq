import { useCallback, useEffect, useRef, useState } from "react";

import Controls from "./Controls";
import VideoPlayer from "./VideoPlayer";

const ICE_SERVERS = [
    {
        urls: "stun:stun.l.google.com:19302"
    }
];

export default function CallRoom({ socket, roomId, username }) {
    const [localPreviewStream, setLocalPreviewStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [connectionState, setConnectionState] = useState("idle");
    const [isInCall, setIsInCall] = useState(false);
    const [isMicEnabled, setIsMicEnabled] = useState(true);
    const [isCameraEnabled, setIsCameraEnabled] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [isBusy, setIsBusy] = useState(false);
    const [error, setError] = useState("");

    const peerConnectionRef = useRef(null);
    const remoteSocketIdRef = useRef(null);
    const localStreamRef = useRef(null);
    const screenStreamRef = useRef(null);
    const pendingCandidatesRef = useRef([]);

    const stopStream = useCallback((stream) => {
        stream?.getTracks().forEach((track) => track.stop());
    }, []);

    const flushPendingCandidates = useCallback(async () => {
        const peerConnection = peerConnectionRef.current;
        if (!peerConnection?.remoteDescription) return;

        const candidates = pendingCandidatesRef.current;
        pendingCandidatesRef.current = [];

        for (const candidate of candidates) {
            await peerConnection.addIceCandidate(candidate);
        }
    }, []);

    const createPeerConnection = useCallback(() => {
        const peerConnection = new RTCPeerConnection({
            iceServers: ICE_SERVERS
        });

        peerConnection.onicecandidate = (event) => {
            if (event.candidate && remoteSocketIdRef.current) {
                socket.emit("webrtc-ice-candidate", {
                    targetSocketId: remoteSocketIdRef.current,
                    candidate: event.candidate
                });
            }
        };

        peerConnection.ontrack = (event) => {
            const [stream] = event.streams;
            if (stream) {
                setRemoteStream(stream);
            }
        };

        peerConnection.onconnectionstatechange = () => {
            setConnectionState(peerConnection.connectionState);
        };

        peerConnection.oniceconnectionstatechange = () => {
            if (peerConnection.iceConnectionState === "failed") {
                peerConnection.restartIce();
            }
        };

        localStreamRef.current?.getTracks().forEach((track) => {
            peerConnection.addTrack(track, localStreamRef.current);
        });

        peerConnectionRef.current = peerConnection;
        return peerConnection;
    }, [socket]);

    const ensurePeerConnection = useCallback(() => {
        return peerConnectionRef.current || createPeerConnection();
    }, [createPeerConnection]);

    const createOffer = useCallback(async (targetSocketId) => {
        remoteSocketIdRef.current = targetSocketId;
        const peerConnection = ensurePeerConnection();
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);

        socket.emit("webrtc-offer", {
            targetSocketId,
            offer
        });
    }, [ensurePeerConnection, socket]);

    const handleOffer = useCallback(async ({ fromSocketId, offer }) => {
        if (!localStreamRef.current) return;

        remoteSocketIdRef.current = fromSocketId;
        const peerConnection = ensurePeerConnection();

        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        await flushPendingCandidates();

        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        socket.emit("webrtc-answer", {
            targetSocketId: fromSocketId,
            answer
        });
    }, [ensurePeerConnection, flushPendingCandidates, socket]);

    const handleAnswer = useCallback(async ({ fromSocketId, answer }) => {
        if (remoteSocketIdRef.current && remoteSocketIdRef.current !== fromSocketId) return;

        const peerConnection = peerConnectionRef.current;
        if (!peerConnection) return;

        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        await flushPendingCandidates();
    }, [flushPendingCandidates]);

    const handleIceCandidate = useCallback(async ({ fromSocketId, candidate }) => {
        if (remoteSocketIdRef.current && remoteSocketIdRef.current !== fromSocketId) return;

        const iceCandidate = new RTCIceCandidate(candidate);
        const peerConnection = peerConnectionRef.current;

        if (!peerConnection?.remoteDescription) {
            pendingCandidatesRef.current.push(iceCandidate);
            return;
        }

        await peerConnection.addIceCandidate(iceCandidate);
    }, []);

    const leaveCall = useCallback(() => {
        socket.emit("webrtc-leave-room", {
            roomId
        });

        peerConnectionRef.current?.close();
        peerConnectionRef.current = null;
        remoteSocketIdRef.current = null;
        pendingCandidatesRef.current = [];

        stopStream(localStreamRef.current);
        stopStream(screenStreamRef.current);

        localStreamRef.current = null;
        screenStreamRef.current = null;

        setLocalPreviewStream(null);
        setRemoteStream(null);
        setIsInCall(false);
        setIsMicEnabled(true);
        setIsCameraEnabled(true);
        setIsScreenSharing(false);
        setConnectionState("idle");
    }, [roomId, socket, stopStream]);

    const startCall = async () => {
        setIsBusy(true);
        setError("");

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });

            localStreamRef.current = stream;
            setLocalPreviewStream(stream);
            setIsInCall(true);
            setConnectionState("waiting");

            socket.emit("webrtc-join-room", {
                roomId,
                username
            });
        } catch (mediaError) {
            setError(mediaError.message || "Camera or microphone permission was denied.");
        } finally {
            setIsBusy(false);
        }
    };

    const toggleMic = () => {
        const nextValue = !isMicEnabled;
        localStreamRef.current?.getAudioTracks().forEach((track) => {
            track.enabled = nextValue;
        });
        setIsMicEnabled(nextValue);
    };

    const toggleCamera = () => {
        const nextValue = !isCameraEnabled;
        localStreamRef.current?.getVideoTracks().forEach((track) => {
            track.enabled = nextValue;
        });
        setIsCameraEnabled(nextValue);
    };

    const restoreCameraTrack = useCallback(async () => {
        const cameraTrack = localStreamRef.current?.getVideoTracks()[0];
        const sender = peerConnectionRef.current
            ?.getSenders()
            .find((currentSender) => currentSender.track?.kind === "video");

        if (sender && cameraTrack) {
            await sender.replaceTrack(cameraTrack);
        }

        stopStream(screenStreamRef.current);
        screenStreamRef.current = null;
        setLocalPreviewStream(localStreamRef.current);
        setIsScreenSharing(false);
    }, [stopStream]);

    const toggleScreenShare = async () => {
        if (isScreenSharing) {
            await restoreCameraTrack();
            return;
        }

        setIsBusy(true);
        setError("");

        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: false
            });

            const screenTrack = screenStream.getVideoTracks()[0];
            const sender = peerConnectionRef.current
                ?.getSenders()
                .find((currentSender) => currentSender.track?.kind === "video");

            if (!sender || !screenTrack) {
                stopStream(screenStream);
                throw new Error("Screen sharing is available after joining a connected call.");
            }

            await sender.replaceTrack(screenTrack);
            screenStreamRef.current = screenStream;
            setLocalPreviewStream(screenStream);
            setIsScreenSharing(true);

            screenTrack.onended = () => {
                restoreCameraTrack();
            };
        } catch (screenError) {
            setError(screenError.message || "Screen sharing could not start.");
        } finally {
            setIsBusy(false);
        }
    };

    useEffect(() => {
        const handleUsers = ({ peers }) => {
            if (!localStreamRef.current || peers.length === 0) return;
            createOffer(peers[0]);
        };

        const handleUserJoined = ({ socketId }) => {
            if (!localStreamRef.current || remoteSocketIdRef.current) return;
            remoteSocketIdRef.current = socketId;
        };

        const handleUserLeft = ({ socketId }) => {
            if (remoteSocketIdRef.current !== socketId) return;

            peerConnectionRef.current?.close();
            peerConnectionRef.current = null;
            remoteSocketIdRef.current = null;
            pendingCandidatesRef.current = [];
            setRemoteStream(null);
            setConnectionState("waiting");
        };

        socket.on("webrtc-users", handleUsers);
        socket.on("webrtc-user-joined", handleUserJoined);
        socket.on("webrtc-offer", handleOffer);
        socket.on("webrtc-answer", handleAnswer);
        socket.on("webrtc-ice-candidate", handleIceCandidate);
        socket.on("webrtc-user-left", handleUserLeft);

        return () => {
            socket.off("webrtc-users", handleUsers);
            socket.off("webrtc-user-joined", handleUserJoined);
            socket.off("webrtc-offer", handleOffer);
            socket.off("webrtc-answer", handleAnswer);
            socket.off("webrtc-ice-candidate", handleIceCandidate);
            socket.off("webrtc-user-left", handleUserLeft);
        };
    }, [createOffer, handleAnswer, handleIceCandidate, handleOffer, socket]);

    useEffect(() => {
        return () => {
            leaveCall();
        };
    }, [leaveCall]);

    return (
        <section className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-200">
                    Interview Call
                </h2>
                <span className="text-[11px] uppercase tracking-wide text-gray-400">
                    {connectionState}
                </span>
            </div>

            <div className="grid gap-3 mb-3">
                <VideoPlayer
                    stream={remoteStream}
                    label="Remote"
                    placeholder={isInCall ? "Waiting for peer" : "Join to connect"}
                />
                <VideoPlayer
                    stream={localPreviewStream}
                    label={isScreenSharing ? "You - screen" : "You"}
                    muted
                    isLocal={!isScreenSharing}
                    placeholder="Local preview"
                />
            </div>

            <Controls
                isInCall={isInCall}
                isMicEnabled={isMicEnabled}
                isCameraEnabled={isCameraEnabled}
                isScreenSharing={isScreenSharing}
                isBusy={isBusy}
                onJoin={startCall}
                onToggleMic={toggleMic}
                onToggleCamera={toggleCamera}
                onShareScreen={toggleScreenShare}
                onLeave={leaveCall}
            />

            {error && (
                <p className="mt-3 rounded border border-red-900 bg-red-950/40 p-2 text-xs text-red-200">
                    {error}
                </p>
            )}
        </section>
    );
}
