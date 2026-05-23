import Editor from "@monaco-editor/react";
import { useEffect, useRef } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { MonacoBinding } from "y-monaco";

const YJS_WS_URL = import.meta.env.VITE_YJS_WS_URL || "ws://localhost:1234";

export default function CodeEditor({
    code,
    setCode,
    language,
    roomId,
    onEditorMount
}) {

    const providerRef = useRef(null);
    const ydocRef = useRef(null);
    const bindingRef = useRef(null);
    const modelChangeRef = useRef(null);

    const handleEditorMount = (editor) => {
        // initialize Yjs doc and websocket provider (connects to a standalone y-websocket server)
        const ydoc = new Y.Doc();
        const provider = new WebsocketProvider(YJS_WS_URL, roomId, ydoc);

        const ytext = ydoc.getText("monaco");

        // bind Monaco model to Yjs text
        const model = editor.getModel();
        bindingRef.current = new MonacoBinding(ytext, model, new Set([editor]), provider.awareness);

        // sync initial text from model to React state
        setCode(model.getValue());

        // keep React state synced to editor
        modelChangeRef.current = model.onDidChangeContent(() => {
            setCode(model.getValue());
        });

        providerRef.current = provider;
        ydocRef.current = ydoc;

        if (onEditorMount) {
            onEditorMount(editor, ytext);
        }

        editor.onDidDispose(() => {
            modelChangeRef.current?.dispose();
            bindingRef.current?.destroy();
            providerRef.current?.destroy();
            ydocRef.current?.destroy();
        });
    };

    useEffect(() => {
        return () => {
            modelChangeRef.current?.dispose();
            bindingRef.current?.destroy();
            providerRef.current?.destroy();
            ydocRef.current?.destroy();
        };
    }, []);

    return (
        <div className="h-full min-h-0">

            <Editor
                height="100%"
                language={language}
                theme="vs-dark"
                defaultValue={code}
                onMount={handleEditorMount}
            />

        </div>
    );
}
