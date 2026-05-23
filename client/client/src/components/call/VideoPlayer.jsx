import { useEffect, useRef } from "react";

export default function VideoPlayer({
    stream,
    label,
    muted = false,
    isLocal = false,
    placeholder = "Waiting for video"
}) {
    const videoRef = useRef(null);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.srcObject = stream || null;
        }
    }, [stream]);

    return (
        <div className="relative overflow-hidden rounded bg-[#0f0f0f] border border-gray-800 aspect-video">
            {stream ? (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted={muted}
                    className={`h-full w-full object-cover ${isLocal ? "scale-x-[-1]" : ""}`}
                />
            ) : (
                <div className="h-full w-full flex items-center justify-center text-xs text-gray-500">
                    {placeholder}
                </div>
            )}

            <div className="absolute left-2 bottom-2 rounded bg-black/70 px-2 py-1 text-[11px] text-gray-200">
                {label}
            </div>
        </div>
    );
}
