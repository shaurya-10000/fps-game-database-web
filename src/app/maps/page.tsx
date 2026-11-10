import { getMaps } from "@/lib/catalog";
import MapsGrid from "./MapsGrid";

export default async function MapsPage() {
  const maps = await getMaps();
  return (
    <div className="mx-auto max-w-[1600px] px-5 py-16 sm:px-8 lg:px-10 xl:px-16">
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Arenas</div>
      <h1 className="mt-1.5 text-4xl font-semibold tracking-[-0.03em] text-foreground sm:text-5xl">Maps</h1>
      <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-muted mb-10">
        {maps.length} maps with size, cover, and supported game modes.
      </p>
      <MapsGrid maps={maps} />
    </div>
  );
}
