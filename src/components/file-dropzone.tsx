"use client";

import { useCallback, useRef, useState } from "react";

export interface FileDropzoneProps {
  onFileAccepted: (file: File) => void;
  accept?: string;
}

export function FileDropzone({ onFileAccepted, accept }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) {
        return;
      }
      const [file] = Array.from(files);
      if (accept && !file.type.match(accept)) {
        setError("Unsupported file type");
        return;
      }
      setError(null);
      onFileAccepted(file);
    },
    [accept, onFileAccepted]
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragging(false);
      handleFiles(event.dataTransfer.files);
    },
    [handleFiles]
  );

  return (
    <div className="space-y-3">
      <div
        className={`flex h-48 cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed px-4 text-center transition ${
          isDragging ? "border-sky-500 bg-slate-900" : "border-slate-700 bg-slate-950"
        }`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <div className="space-y-1">
          <p className="text-lg font-medium">Drag & drop underwriting files here</p>
          <p className="text-sm text-slate-400">PDF, XLSX, CSV, DOCX, and PPTX are supported</p>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        hidden
        onChange={(event) => handleFiles(event.target.files)}
      />
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
