"use client";

import { useRef, useState } from "react";
import { Camera, LoaderCircle, Trash2 } from "lucide-react";
import Modal from "@/app/dashboard/dms/DmsClient/ui/Modal";
import { api } from "@/lib/api";

interface AvatarUploadDialogProps {
  currentAvatarUrl: string | null;
  onSaved: (avatarUrl: string | null) => void;
  onClose: () => void;
}

async function compressTo200(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => {
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 200;
        canvas.height = 200;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("Canvas not supported")); return; }
        // Center-crop the image into a square, then draw scaled
        const min = Math.min(img.width, img.height);
        const sx = (img.width - min) / 2;
        const sy = (img.height - min) / 2;
        ctx.drawImage(img, sx, sy, min, min, 0, 0, 200, 200);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = () => reject(new Error("Could not load image"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

export default function AvatarUploadDialog({ currentAvatarUrl, onSaved, onClose }: AvatarUploadDialogProps) {
  const [preview, setPreview] = useState<string | null>(currentAvatarUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setError(null);
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      setError("Use a JPG, PNG or WebP file.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("That file is too large. Max 8 MB.");
      return;
    }
    try {
      const dataUrl = await compressTo200(file);
      setPreview(dataUrl);
    } catch {
      setError("Could not read that image. Try another file.");
    }
  };

  const save = async () => {
    if (!preview) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ avatarUrl: string }>("/api/me/avatar", {
        method: "POST",
        body: { avatarUrl: preview },
      });
      onSaved(res.avatarUrl);
      onClose();
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    setError(null);
    try {
      await api("/api/me/avatar", { method: "DELETE" });
      onSaved(null);
      onClose();
    } catch {
      setError("Could not remove avatar.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Profile picture"
      description="Square JPG, PNG or WebP. Resized to 200×200."
      busy={busy}
      onClose={onClose}
      footer={
        <>
          {currentAvatarUrl && (
            <button
              type="button"
              onClick={() => void remove()}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-[13px] font-semibold text-rose-500 hover:bg-rose-500/20 disabled:opacity-50"
            >
              <Trash2 size={14} /> Remove
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="flex-1 rounded-xl border border-border bg-surface py-2.5 text-[13px] font-semibold text-foreground hover:bg-foreground/5 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void save()}
            disabled={busy || !preview || preview === currentAvatarUrl}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-foreground py-2.5 text-[13px] font-semibold text-background hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy && <LoaderCircle size={14} className="animate-spin" />}
            {busy ? "Saving..." : "Save"}
          </button>
        </>
      }
    >
      <div className="space-y-4 px-6 py-5">
        <div className="flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="group relative size-32 overflow-hidden rounded-full border border-border bg-surface transition-opacity hover:opacity-90"
          >
            {preview ? (
                            <img src={preview} alt="Preview" className="size-full object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center text-muted">
                <Camera size={32} />
              </div>
            )}
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              <Camera size={24} className="text-white" />
            </span>
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
          />
          <p className="text-center text-[12px] text-muted">
            Click the circle to pick a picture
          </p>
        </div>

        {error && (
          <p role="alert" className="rounded-xl bg-rose-500/10 px-3 py-2 text-center text-[12px] font-medium text-rose-500">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}



