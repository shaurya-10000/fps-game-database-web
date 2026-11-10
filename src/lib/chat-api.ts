import { api } from "./api";

export async function uploadVoiceMessage(roomId: string, blob: Blob) {
  const formData = new FormData();
  formData.append("audio", blob, "voice.webm");
  
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api/chat/rooms/${roomId}/voice`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("fps.dashboard.jwt")}`
    },
    body: formData
  });
  if (!res.ok) throw new Error("Failed to upload voice message");
  return res.json();
}

export async function createGroup(name: string, memberIds: string[]) {
  return api<{ roomId: string, name: string, type: "group" }>("/api/chat/groups", {
    method: "POST",
    body: { name, memberIds }
  });
}