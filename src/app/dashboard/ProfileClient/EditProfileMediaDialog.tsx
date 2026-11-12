"use client";

import { useRef, useState } from "react";
import { Camera, LoaderCircle, Trash2 } from "lucide-react";
import Modal from "@/app/dashboard/dms/DmsClient/ui/Modal";
import { api } from "@/lib/api";

interface EditProfileMediaDialogProps {
  currentAvatarUrl: string | null;
  currentBannerUrl: string | null;
  onSaved: (data: { avatarUrl: string | null; bannerUrl: string | null }) => void;
  onClose: () => void;
}

async function compressImage(file: File, targetWidth: number, targetHeight: number): Promise<string> {
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
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = () => reject(new Error("Could not load image"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

export default function EditProfileMediaDialog({ currentAvatarUrl, currentBannerUrl, onSaved, onClose }: EditProfileMediaDialogProps) {
  const [avatarPreview, setAvatarPreview] = useState<string | null>(currentAvatarUrl);
  const [bannerPreview, setBannerPreview] = useState<string | null>(currentBannerUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarFile = async (file: File | null) => {
    if (!file) return;
    setError(null);
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      setError("Avatar must be a JPG, PNG or WebP.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("Avatar file is too large. Max 8 MB.");
      return;
    }
    try {
      const dataUrl = await compressImage(file, 200, 200);
      setAvatarPreview(dataUrl);
    } catch {
      setError("Could not read that avatar. Try another file.");
    }
  };

  const handleBannerFile = async (file: File | null) => {
    if (!file) return;
    setError(null);
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      setError("Banner must be a JPG, PNG or WebP.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError("Banner file is too large. Max 15 MB.");
      return;
    }
    try {
      const dataUrl = await compressImage(file, 1200, 300);
      setBannerPreview(dataUrl);
    } catch {
      setError("Could not read that banner. Try another file.");
    }
  };

  const save = async () => {
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
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const isDirty = avatarPreview !== currentAvatarUrl || bannerPreview !== currentBannerUrl;

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
            disabled={busy || !isDirty}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-foreground py-2.5 text-[13px] font-semibold text-background hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy && <LoaderCircle size={14} className="animate-spin" />}
            {busy ? "Saving..." : "Save changes"}
          </button>
        </>
      }
    >
      <div className="space-y-6 px-6 py-5">
        
        {/* Banner Section */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-[13px] font-semibold text-foreground">Profile Banner</h3>
            {bannerPreview && (
              <button
                type="button"
                onClick={() => setBannerPreview(null)}
                className="inline-flex items-center gap-1 text-[12px] font-medium text-rose-500 hover:underline"
              >
                <Trash2 size={12} /> Remove
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => bannerInputRef.current?.click()}
            className="group relative flex aspect-[4/1] w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-surface transition-opacity hover:opacity-90"
          >
            {bannerPreview ? (
              <img src={bannerPreview} alt="Banner preview" className="size-full object-cover" />
            ) : (
              <span className="text-[13px] text-muted">Click to upload a banner (1200×300)</span>
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              <Camera size={24} className="text-white" />
            </span>
          </button>
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => void handleBannerFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {/* Avatar Section */}
        <div className="border-t border-border pt-6">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-[13px] font-semibold text-foreground">Profile Picture</h3>
            {avatarPreview && (
              <button
                type="button"
                onClick={() => setAvatarPreview(null)}
                className="inline-flex items-center gap-1 text-[12px] font-medium text-rose-500 hover:underline"
              >
                <Trash2 size={12} /> Remove
              </button>
            )}
          </div>
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="group relative size-24 shrink-0 overflow-hidden rounded-full border border-border bg-surface transition-opacity hover:opacity-90"
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar preview" className="size-full object-cover" />
              ) : (
                <div className="flex size-full items-center justify-center text-muted">
                  <Camera size={32} />
                </div>
              )}
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <Camera size={24} className="text-white" />
              </span>
            </button>
            <div className="text-[12px] leading-relaxed text-muted">
              <p>Square image, resized to 200×200.</p>
              <p>JPG, PNG or WebP. Max 8 MB.</p>
            </div>
          </div>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => void handleAvatarFile(e.target.files?.[0] ?? null)}
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

