export default function Controls({
    isInCall,
    isMicEnabled,
    isCameraEnabled,
    isScreenSharing,
    isBusy,
    onJoin,
    onToggleMic,
    onToggleCamera,
    onShareScreen,
    onLeave
}) {
    if (!isInCall) {
        return (
            <button
                type="button"
                onClick={onJoin}
                disabled={isBusy}
                className="w-full rounded bg-cyan-400 disabled:bg-cyan-900 disabled:text-gray-400 text-black font-semibold px-3 py-2 text-sm"
            >
                {isBusy ? "Starting call..." : "Join Call"}
            </button>
        );
    }

    return (
        <div className="grid grid-cols-2 gap-2">
            <button
                type="button"
                onClick={onToggleMic}
                className={`rounded px-3 py-2 text-sm font-semibold ${isMicEnabled ? "bg-[#2d2d2d] text-white" : "bg-red-500 text-white"}`}
            >
                {isMicEnabled ? "Mute" : "Unmute"}
            </button>

            <button
                type="button"
                onClick={onToggleCamera}
                className={`rounded px-3 py-2 text-sm font-semibold ${isCameraEnabled ? "bg-[#2d2d2d] text-white" : "bg-red-500 text-white"}`}
            >
                {isCameraEnabled ? "Camera Off" : "Camera On"}
            </button>

            <button
                type="button"
                onClick={onShareScreen}
                disabled={isBusy}
                className={`rounded px-3 py-2 text-sm font-semibold ${isScreenSharing ? "bg-amber-400 text-black" : "bg-[#2d2d2d] text-white"} disabled:text-gray-400`}
            >
                {isScreenSharing ? "Stop Share" : "Share Screen"}
            </button>

            <button
                type="button"
                onClick={onLeave}
                className="rounded bg-red-600 px-3 py-2 text-sm font-semibold text-white"
            >
                Leave
            </button>
        </div>
    );
}
