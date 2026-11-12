"use client";

import { useRef, useState } from "react";
import { Camera, LoaderCircle, Trash2, UploadCloud } from "lucide-react";
import Modal from "@/app/dashboard/dms/DmsClient/ui/Modal";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

interface EditProfileMediaDialogProps {
  currentAvatarUrl: string | null;
  currentBannerUrl: string | null;
  onSaved: (data: { avatarUrl: string | null; bannerUrl: string | null }) => void;
  onClose: () => void;
}

const AVATAR_LIMIT = 140_000; // 140 KB (matches backend)
const BANNER_LIMIT = 300_000; // 300 KB (matches backend)

async function compressImage(file: File, targetWidth: number, targetHeight: number, maxBytes: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => {
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("Canvas not supported")); return; }
        
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
        
        let quality = 0.85;
        let dataUrl = canvas.toDataURL("image/jpeg", quality);
        
        // Iteratively reduce quality if it exceeds the byte limit
        while (dataUrl.length > maxBytes && quality > 0.3) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL("image/jpeg", quality);
        }
        
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error("Could not load image"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

function formatBytes(bytes: number): string {
  return (bytes / 1024).toFixed(1) + " KB";
}

interface DropZoneProps {
  label: string;
  hint: string;
  preview: string | null;
  onFile: (file: File) => void;
  onRemove: () => void;
  onPaste: (file: File) => void;
  aspect: "square" | "banner";
  limit: number;
}

function DropZone({ label, hint, preview, onFile, onRemove, onPaste, aspect, limit }: DropZoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.[0]) onFile(e.dataTransfer.files[0]);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const file = e.clipboardData.files?.[0];
    if (file && file.type.startsWith("image/")) onPaste(file);
  };

  const isOverLimit = preview ? preview.length > limit : false;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[13px] font-semibold text-foreground">{label}</label>
        {preview && (
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex items-center gap-1 text-[12px] font-medium text-rose-500 hover:underline"
          >
            <Trash2 size={12} /> Remove
          </button>
        )}
      </div>

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onPaste={handlePaste}
        className={cn(
          "group relative flex w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-all",
          aspect === "square" ? "aspect-square max-w-[200px]" : "aspect-[3/1] w-full",
          dragging ? "border-accent bg-accent/5" : "border-border bg-surface hover:border-foreground/30 hover:bg-foreground/[0.02]",
          preview ? "border-solid" : ""
        )}
      >
        {preview ? (
          <img src={preview} alt={`${label} preview`} className="size-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted">
            <UploadCloud size={24} />
            <span className="text-[12px] font-medium">Click, drag, or paste</span>
          </div>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          <Camera size={24} className="text-white" />
        </span>
      </div>

      <div className="flex items-center justify-between text-[11px]">
        <span className="text-muted">{hint}</span>
        {preview && (
          <span className={cn("font-mono font-semibold", isOverLimit ? "text-rose-500" : "text-emerald-500")}>
            {formatBytes(preview.length)} / {formatBytes(limit)}
          </span>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) onFile(e.target.files[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}

export default function EditProfileMediaDialog({ currentAvatarUrl, currentBannerUrl, onSaved, onClose }: EditProfileMediaDialogProps) {
  const [avatarPreview, setAvatarPreview] = useState<string | null>(currentAvatarUrl);
  const [bannerPreview, setBannerPreview] = useState<string | null>(currentBannerUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Track whether the user has changed anything
  const [dirty, setDirty] = useState(false);
  const isDirty = dirty || avatarPreview !== currentAvatarUrl || bannerPreview !== currentBannerUrl;
  const isOverLimit = (avatarPreview?.length ?? 0) > AVATAR_LIMIT || (bannerPreview?.length ?? 0) > BANNER_LIMIT;

  const handleAvatarFile = async (file: File) => {
    setError(null);
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      setError("Avatar must be a JPG, PNG or WebP."); return;
    }
    try {
      const dataUrl = await compressImage(file, 200, 200, AVATAR_LIMIT);
      setAvatarPreview(dataUrl);
      setDirty(true);
    } catch {
      setError("Could not read that avatar. Try another file.");
    }
  };

  const handleBannerFile = async (file: File) => {
    setError(null);
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      setError("Banner must be a JPG, PNG or WebP."); return;
    }
    try {
      const dataUrl = await compressImage(file, 1200, 400, BANNER_LIMIT);
      setBannerPreview(dataUrl);
      setDirty(true);
    } catch {
      setError("Could not read that banner. Try another file.");
    }
  };

  const save = async () => {
    if (isOverLimit) return;
    setBusy(true);
    setError(null);
    try {
      const body: Record<string, string | null> = {};
      if (avatarPreview !== currentAvatarUrl) body["avatarUrl"] = avatarPreview;
      if (bannerPreview !== currentBannerUrl) body["bannerUrl"] = bannerPreview;
      
      if (Object.keys(body).length > 0) {
        await api("/api/me/profile", { method: "PATCH", body });
      }
      onSaved({ avatarUrl: avatarPreview, bannerUrl: bannerPreview });
      onClose();
    } catch (err: unknown) {
      console.error("Save failed:", err);
      if (err instanceof ApiError) {
        if (err.code === "AVATAR_TOO_LARGE" || err.code === "BANNER_TOO_LARGE") {
          setError("Image is too large. Try a smaller file or crop it.");
        } else if (err.code === "INVALID_AVATAR_FORMAT" || err.code === "INVALID_BANNER_FORMAT") {
          setError("Invalid image format.");
        } else {
          setError(`Save failed: ${err.code}`);
        }
      } else {
        setError("Failed to save. Please check the console.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Edit images"
      description="Update your profile picture and banner."
      busy={busy}
      onClose={onClose}
      footer={
        <>
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
            disabled={busy || !isDirty || isOverLimit}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-foreground py-2.5 text-[13px] font-semibold text-background hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy && <LoaderCircle size={14} className="animate-spin" />}
            {busy ? "Saving..." : "Save changes"}
          </button>
        </>
      }
    >
      <div className="space-y-6 px-6 py-5">
        
        <DropZone 
          label="Profile Banner"
          hint="Recommended: 1200x400px. Max 300KB."
          preview={bannerPreview}
          onFile={handleBannerFile}
          onPaste={handleBannerFile}
          onRemove={() => { setBannerPreview(null); setDirty(true); }}
          aspect="banner"
          limit={BANNER_LIMIT}
        />

        <div className="border-t border-border pt-6">
          <DropZone 
            label="Profile Picture"
            hint="Square image. Max 140KB."
            preview={avatarPreview}
            onFile={handleAvatarFile}
            onPaste={handleAvatarFile}
            onRemove={() => { setAvatarPreview(null); setDirty(true); }}
            aspect="square"
            limit={AVATAR_LIMIT}
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

