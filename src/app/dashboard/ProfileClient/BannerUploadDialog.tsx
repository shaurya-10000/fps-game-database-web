"use client";

import { useRef, useState } from "react";
import { LoaderCircle, Trash2 } from "lucide-react";
import Modal from "@/app/dashboard/dms/DmsClient/ui/Modal";
import { api } from "@/lib/api";

interface BannerUploadDialogProps {
  currentBannerUrl: string | null;
  onSaved: (bannerUrl: string | null) => void;
  onClose: () => void;
}

async function compressToBanner(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => {
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const targetWidth = 1200;
        const targetHeight = 300;
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("Canvas not supported")); return; }
        
        // Center-crop to 4:1 aspect ratio
        const targetRatio = targetWidth / targetHeight;
        let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height;
        
        if (img.width / img.height > targetRatio) {
          sWidth = img.height * targetRatio;
          sx = (img.width - sWidth) / 2;
        } else {
          sHeight = img.width / targetRatio;
          sy = (img.height - sHeight) / 2;
        }
        
        ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = () => reject(new Error("Could not load image"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

export default function BannerUploadDialog({ currentBannerUrl, onSaved, onClose }: BannerUploadDialogProps) {
  const [preview, setPreview] = useState<string | null>(currentBannerUrl);
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
    if (file.size > 15 * 1024 * 1024) {
      setError("That file is too large. Max 15 MB.");
      return;
    }
    try {
      const dataUrl = await compressToBanner(file);
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
      await api("/api/me/profile", {
        method: "PATCH",
        body: { bannerUrl: preview },
      });
      onSaved(preview);
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
      await api("/api/me/profile", {
        method: "PATCH",
        body: { bannerUrl: null },
      });
      onSaved(null);
      onClose();
    } catch {
      setError("Could not remove banner.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Profile banner"
      description="Wide image (4:1 aspect ratio). JPG, PNG or WebP."
      busy={busy}
      onClose={onClose}
      footer={
        <>
          {currentBannerUrl && (
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
            disabled={busy || !preview || preview === currentBannerUrl}
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
            className="group relative aspect-[4/1] w-full overflow-hidden rounded-xl border border-border bg-surface transition-opacity hover:opacity-90"
          >
            {preview ? (
              <img src={preview} alt="Banner preview" className="size-full object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center text-muted text-[13px]">
                Click to pick a banner image
              </div>
            )}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
          />
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
