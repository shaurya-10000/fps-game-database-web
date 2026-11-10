"use client";

import { useId, useState } from "react";
import { AlertCircle, CheckCircle2, LoaderCircle } from "lucide-react";
import Modal from "@/app/dashboard/dms/DmsClient/ui/Modal";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

const NAME_MIN = 2;
const NAME_MAX = 32;
const USERNAME_RE = /^[A-Za-z0-9_]{2,24}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function nameError(value: string): string | null {
  const length = value.trim().length;
  return length < NAME_MIN || length > NAME_MAX ? `Use ${NAME_MIN}-${NAME_MAX} characters.` : null;
}
function usernameError(value: string): string | null {
  return USERNAME_RE.test(value.trim()) ? null : "Use 2-24 letters, numbers or underscores.";
}
function emailError(value: string): string | null {
  const trimmed = value.trim();
  return !trimmed || EMAIL_RE.test(trimmed) ? null : "Enter a valid email address.";
}

function saveError(err: unknown): string {
  const code = err instanceof ApiError ? err.code : undefined;
  switch (code) {
    case "USERNAME_TAKEN":
      return "That username is already taken.";
    case "EMAIL_IN_USE":
      return "That email is already in use.";
    case "INVALID_USERNAME":
      return "Username must be 2-24 letters, numbers or underscores.";
    case "NAME_TOO_SHORT":
      return "Display name must be 2-32 characters.";
    default:
      return "Failed to update profile. Please try again.";
  }
}

interface FieldProps extends Omit<React.ComponentProps<"input">, "id" | "className"> {
  label: string;
  hint?: string;
  error: string | null;
  counter?: string;
}

function Field({ label, hint, error, counter, ...inputProps }: FieldProps) {
  const id = useId();
  const message = error ?? hint;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-[12px] font-semibold text-foreground">
          {label}
        </label>
        {counter && <span className="font-mono text-[11px] tabular-nums text-muted">{counter}</span>}
      </div>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={message ? `${id}-msg` : undefined}
        className={cn(
          "w-full rounded-xl border bg-background px-3.5 py-2.5 text-base text-foreground transition-colors focus:outline-none focus:ring-2 sm:text-[14px]",
          error ? "border-rose-500/60 focus:ring-rose-500/25" : "border-border focus:border-accent focus:ring-accent/30",
        )}
        {...inputProps}
      />
      {message && (
        <p id={`${id}-msg`} className={cn("mt-1.5 text-[12px]", error ? "text-rose-500" : "text-muted")}>
          {message}
        </p>
      )}
    </div>
  );
}

interface EditProfileDialogProps {
  initial: { displayName: string; username: string };
  onSaved: (next: { displayName: string; username: string }) => void;
  onClose: () => void;
}

export default function EditProfileDialog({ initial, onSaved, onClose }: EditProfileDialogProps) {
  const [displayName, setDisplayName] = useState(initial.displayName);
  const [username, setUsername] = useState(initial.username);
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState({ displayName: false, username: false, email: false });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ kind: "idle" } | { kind: "ok" } | { kind: "error"; message: string }>({ kind: "idle" });

  const errors = { displayName: nameError(displayName), username: usernameError(username), email: emailError(email) };
  const dirty = displayName.trim() !== initial.displayName || username.trim() !== initial.username || email.trim() !== "";
  const valid = !errors.displayName && !errors.username && !errors.email;
  const canSave = dirty && valid && !saving && status.kind !== "ok";

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setTouched({ displayName: true, username: true, email: true });
    if (!canSave) return;

    const next = { displayName: displayName.trim(), username: username.trim() };
    const body: Record<string, string> = {};
    if (next.displayName !== initial.displayName) body["displayName"] = next.displayName;
    if (next.username !== initial.username) body["username"] = next.username;
    if (email.trim()) body["email"] = email.trim();

    setSaving(true);
    setStatus({ kind: "idle" });
    try {
      await api("/api/me/profile", { method: "PATCH", body });
      onSaved(next);
      setStatus({ kind: "ok" });
      setTimeout(onClose, 900);
    } catch (err) {
      setStatus({ kind: "error", message: saveError(err) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Edit profile" description="Changes apply across chat and friends." busy={saving} onClose={onClose}>
      <form onSubmit={submit} noValidate className="space-y-4 px-6 py-5">
        <Field
          label="Display name"
          hint="Shown in chat and on your profile."
          counter={`${displayName.trim().length}/${NAME_MAX}`}
          error={touched.displayName ? errors.displayName : null}
          value={displayName}
          maxLength={NAME_MAX}
          autoFocus
          autoComplete="nickname"
          onChange={(e) => setDisplayName(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, displayName: true }))}
        />
        <Field
          label="Username"
          hint="Unique. Friends use it to find you."
          counter={`${username.trim().length}/24`}
          error={touched.username ? errors.username : null}
          value={username}
          maxLength={24}
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          onChange={(e) => setUsername(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, username: true }))}
        />
        <Field
          label="Email"
          hint="Leave blank to keep your current email."
          error={touched.email ? errors.email : null}
          type="email"
          value={email}
          autoComplete="email"
          placeholder="you@example.com"
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, email: true }))}
        />

        {status.kind !== "idle" && (
          <div
            role={status.kind === "error" ? "alert" : "status"}
            className={cn(
              "flex items-start gap-2 rounded-xl p-3 text-[12px] font-medium",
              status.kind === "ok" ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500",
            )}
          >
            {status.kind === "ok" ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <AlertCircle size={16} className="mt-0.5 shrink-0" />}
            <span>{status.kind === "ok" ? "Profile updated." : status.message}</span>
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex-1 rounded-xl border border-border bg-surface py-2.5 text-[13px] font-semibold text-foreground transition-colors hover:bg-foreground/5 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSave}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-foreground py-2.5 text-[13px] font-semibold text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving && <LoaderCircle size={14} className="animate-spin" />}
            {saving ? "Saving..." : status.kind === "ok" ? "Saved" : "Save changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}