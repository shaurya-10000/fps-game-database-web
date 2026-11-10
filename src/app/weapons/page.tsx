import { getWeapons } from "@/lib/catalog";
import WeaponsGrid from "./WeaponsGrid";

export default async function WeaponsPage() {
  const weapons = await getWeapons();
  
  return (
    <div className="mx-auto max-w-[1600px] px-5 py-16 sm:px-8 lg:px-10 xl:px-16">
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
        Arsenal
      </div>
      <h1 className="mt-1.5 text-4xl font-semibold tracking-[-0.03em] text-foreground sm:text-5xl">
        Weapons
      </h1>
      <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-muted mb-10">
        {weapons.length} weapons with full ballistics — damage, falloff, fire rate, recoil, spread, and penetration.
      </p>
      
      <WeaponsGrid weapons={weapons} />
    </div>
  );
}
