"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LoaderCircle, Mic, SendHorizontal, Smile } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVoiceRecorder } from "../hooks/useVoiceRecorder";
import EmojiPicker from "../ui/EmojiPicker";
import MentionMenu from "./MentionMenu";
import RecordingBar from "./RecordingBar";
import ReplyBar from "./ReplyBar";

const MAX_LENGTH = 2000;
const MAX_HEIGHT_PX = 160;
const NO_NAMES: string[] = [];

interface ComposerProps {
  placeholder: string;
  disabled: boolean;
  /** Text left in the box the last time this conversation was open. */
  initialText: string;
  reply: { messageId: string; senderName: string; preview: string } | null;
  editing: { id: string; content: string } | null;
  /** Names offered when you type "@". Leave empty to turn mentions off. */
  mentionCandidates?: string[];
  onTyping?: () => void;
  /** Enter sends (default). When false, Ctrl+Enter sends and Enter adds a new line. */
  enterToSend?: boolean;
  onDraftChange: (text: string) => void;
  onSend: (text: string) => void;
  onSaveEdit: (id: string, text: string) => Promise<void>;
  onCancelReply: () => void;
  onCancelEdit: () => void;
  onSendVoice: (blob: Blob) => Promise<void>;
  onError: (message: string) => void;
}

/** The "@fragment" being typed right before the caret, if any. */
function mentionAt(text: string, caret: number): { start: number; fragment: string } | null {
  if (caret <= 0) return null;
  const at = text.lastIndexOf("@", caret - 1);
  if (at < 0) return null;
  if (at > 0 && !/\s/.test(text.charAt(at - 1))) return null;
  const fragment = text.slice(at + 1, caret);
  if (fragment.length > 24 || fragment.includes("\n")) return null;
  return { start: at, fragment };
}

export default function Composer({
  placeholder,
  disabled,
  initialText,
  reply,
  editing,
  mentionCandidates = NO_NAMES,
  onTyping,
  enterToSend = true,
  onDraftChange,
  onSend,
  onSaveEdit,
  onCancelReply,
  onCancelEdit,
  onSendVoice,
  onError,
}: ComposerProps) {
  const [text, setText] = useState(initialText);
  const [caret, setCaret] = useState(initialText.length);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [mentionDismissed, setMentionDismissed] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [savedDraft, setSavedDraft] = useState("");
  const [activeEditId, setActiveEditId] = useState<string | null>(null);

  const recorder = useVoiceRecorder({
    onError,
    onComplete: async (blob) => {
      setUploading(true);
      try {
        await onSendVoice(blob);
      } finally {
        setUploading(false);
      }
    },
  });

  // Entering edit mode swaps in the message text; leaving it restores whatever was being typed.
  const editId = editing?.id ?? null;
  const editContent = editing?.content ?? "";
  if (activeEditId !== editId) {
    setActiveEditId(editId);
    if (editId) {
      if (!activeEditId) setSavedDraft(text);
      setText(editContent);
    } else {
      setText(savedDraft);
    }
  }

  useEffect(() => {
    if (editId) inputRef.current?.focus();
  }, [editId]);

  const replyId = reply?.messageId ?? null;
  useEffect(() => {
    if (replyId) inputRef.current?.focus();
  }, [replyId]);

  // Grow with the content up to a cap.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT_PX)}px`;
  }, [text, recorder.recording]);

  // Focus on desktop only: on phones it would pop the keyboard open.
  useEffect(() => {
    if (window.matchMedia("(pointer: fine)").matches) inputRef.current?.focus();
  }, []);

  const trimmed = text.trim();

  const mention = editing ? null : mentionAt(text, caret);
  const suggestions =
    mention && !mentionDismissed
      ? mentionCandidates.filter((name) => name.toLowerCase().startsWith(mention.fragment.toLowerCase())).slice(0, 6)
      : NO_NAMES;
  const activeSuggestion = suggestions.length > 0 ? mentionIndex % suggestions.length : 0;

  const update = (next: string) => {
    setText(next);
    setMentionDismissed(false);
    if (!editing) {
      onDraftChange(next);
      if (next.trim()) onTyping?.();
    }
  };

  const submit = async () => {
    if (!trimmed || disabled || saving) return;
    setEmojiOpen(false);
    if (editing) {
      setSaving(true);
      try {
        await onSaveEdit(editing.id, trimmed);
      } finally {
        setSaving(false);
      }
      return;
    }
    onSend(trimmed);
    update("");
    inputRef.current?.focus();
  };

  const applyMention = (name: string) => {
    if (!mention) return;
    const before = text.slice(0, mention.start);
    const after = text.slice(caret);
    const inserted = `@${name} `;
    const next = (before + inserted + after).slice(0, MAX_LENGTH);
    update(next);
    const position = Math.min(before.length + inserted.length, next.length);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(position, position);
      setCaret(position);
    });
  };

  const wrapSelection = (marker: string) => {
    const el = inputRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = text.slice(start, end);
    update((text.slice(0, start) + marker + selected + marker + text.slice(end)).slice(0, MAX_LENGTH));
    requestAnimationFrame(() => {
      el.focus();
      const from = start + marker.length;
      el.setSelectionRange(from, selected ? end + marker.length : from);
    });
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey) {
      const key = event.key.toLowerCase();
      if (key === "b" || key === "i") {
        event.preventDefault();
        event.stopPropagation();
        wrapSelection(key === "b" ? "**" : "*");
        return;
      }
    }

    if (suggestions.length > 0) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setMentionIndex((i) => i + 1);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setMentionIndex((i) => i + suggestions.length - 1);
        return;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        const choice = suggestions[activeSuggestion];
        if (choice) applyMention(choice);
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setMentionDismissed(true);
        return;
      }
    }

    const sends = enterToSend ? !event.shiftKey : event.ctrlKey || event.metaKey;
    if (event.key === "Enter" && sends && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void submit();
    } else if (event.key === "Escape") {
      if (editing) onCancelEdit();
      else if (reply) onCancelReply();
    }
  };

  const insertEmoji = (emoji: string) => {
    const el = inputRef.current;
    const start = el?.selectionStart ?? text.length;
    const end = el?.selectionEnd ?? text.length;
    update((text.slice(0, start) + emoji + text.slice(end)).slice(0, MAX_LENGTH));
    requestAnimationFrame(() => {
      const position = start + emoji.length;
      el?.focus();
      el?.setSelectionRange(position, position);
    });
  };

  const closeEmoji = useCallback(() => setEmojiOpen(false), []);
  const nearLimit = text.length > MAX_LENGTH * 0.9;
  const busy = disabled || saving;

  return (
    <div className="relative">
      {emojiOpen && !recorder.recording && <EmojiPicker onPick={insertEmoji} onClose={closeEmoji} />}
      {suggestions.length > 0 && !recorder.recording && (
        <MentionMenu names={suggestions} activeIndex={activeSuggestion} onPick={applyMention} />
      )}

      {editing ? (
        <ReplyBar kind="edit" preview={editing.content} onCancel={onCancelEdit} />
      ) : reply ? (
        <ReplyBar kind="reply" name={reply.senderName} preview={reply.preview} onCancel={onCancelReply} />
      ) : null}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className={cn(
          "flex items-end gap-2 rounded-2xl border border-border bg-surface px-3 py-2 transition-all focus-within:border-accent/60 focus-within:ring-2 focus-within:ring-accent/20",
          disabled && "opacity-60",
        )}
      >
        {recorder.recording ? (
          <RecordingBar elapsed={recorder.elapsed} onCancel={recorder.cancel} onSend={recorder.send} />
        ) : (
          <>
            <textarea
              ref={inputRef}
              value={text}
              onChange={(e) => {
                update(e.target.value);
                setCaret(e.target.selectionStart);
              }}
              onSelect={(e) => setCaret(e.currentTarget.selectionStart)}
              onKeyDown={onKeyDown}
              rows={1}
              maxLength={MAX_LENGTH}
              disabled={disabled}
              placeholder={placeholder}
              aria-label="Message"
              className="max-h-40 min-h-[36px] flex-1 resize-none bg-transparent py-1.5 text-base leading-[1.45] text-foreground placeholder:text-muted/60 sm:text-[14px] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setEmojiOpen((open) => !open)}
              disabled={disabled}
              aria-label="Add emoji"
              aria-expanded={emojiOpen}
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-foreground/[0.07] disabled:opacity-50",
                emojiOpen ? "bg-accent/15 text-accent" : "text-muted hover:text-foreground",
              )}
            >
              <Smile size={18} />
            </button>
            {trimmed ? (
              <button
                type="submit"
                disabled={busy}
                aria-label={editing ? "Save edit" : "Send message"}
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-background transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {saving ? <LoaderCircle size={16} className="animate-spin" /> : <SendHorizontal size={16} />}
              </button>
            ) : (
              !editing && (
                <button
                  type="button"
                  onClick={() => void recorder.start()}
                  disabled={disabled || uploading}
                  aria-label="Record a voice message"
                  title="Record a voice message"
                  className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-foreground/[0.07] hover:text-foreground disabled:opacity-50"
                >
                  {uploading ? <LoaderCircle size={17} className="animate-spin" /> : <Mic size={18} />}
                </button>
              )
            )}
          </>
        )}
      </form>
      <div className="mt-1.5 flex items-center justify-between px-2 text-[11px] text-muted">
        <span className="hidden sm:inline">
          {editing
            ? `${enterToSend ? "Enter" : "Ctrl+Enter"} to save, Esc to cancel`
            : mentionCandidates.length > 0
              ? `${enterToSend ? "Enter to send, Shift+Enter for a new line" : "Ctrl+Enter to send, Enter for a new line"}, @ to mention, Ctrl+B for bold`
              : `${enterToSend ? "Enter to send, Shift+Enter for a new line" : "Ctrl+Enter to send, Enter for a new line"}, Ctrl+B for bold`}
        </span>
        {nearLimit && (
          <span className="font-mono tabular-nums">
            {text.length}/{MAX_LENGTH}
          </span>
        )}
      </div>
    </div>
  );
}