export default function SystemRow({ text }: { text: string }) {
  return (
    <div className="my-3 flex justify-center px-4">
      <span className="max-w-full break-words rounded-full bg-foreground/[0.05] px-3.5 py-1 text-center text-[12px] text-muted">
        {text}
      </span>
    </div>
  );
}