"use client";

import { useRef, useEffect } from "react";
import { EditorView, basicSetup } from "codemirror";
import { json } from "@codemirror/lang-json";
import { EditorState } from "@codemirror/state";

interface JsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
}

export function JsonEditor({
  value,
  onChange,
  onBlur,
  placeholder,
  className,
}: JsonEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const onBlurRef = useRef(onBlur);

  onChangeRef.current = onChange;
  onBlurRef.current = onBlur;

  useEffect(() => {
    if (!containerRef.current) return;

    const state = EditorState.create({
      doc: value,
      extensions: [
        basicSetup,
        json(),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString());
          }
        }),
        EditorView.domEventHandlers({
          blur: () => {
            onBlurRef.current?.();
          },
        }),
        EditorView.theme({
          "&": { fontSize: "13px" },
          "&.cm-focused": { outline: "none" },
          ".cm-content": {
            fontFamily: "var(--font-mono, monospace)",
            padding: "8px 0",
          },
          ".cm-scroller": { overflow: "auto", maxHeight: "300px" },
          ".cm-gutters": { border: "none", background: "transparent" },
        }),
        placeholder
          ? EditorView.contentAttributes.of({
              "aria-placeholder": placeholder,
            })
          : [],
      ].flat(),
    });

    const view = new EditorView({ state, parent: containerRef.current });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (value !== current) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      });
    }
  }, [value]);

  return (
    <div
      ref={containerRef}
      className={`rounded-md border border-input bg-background overflow-hidden min-h-[140px] ${
        className ?? ""
      }`}
    />
  );
}
