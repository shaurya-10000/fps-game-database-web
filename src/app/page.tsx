import Hero from "@/components/Hero";
import CharactersSection from "@/components/sections/CharactersSection";
import ModesSection from "@/components/sections/ModesSection";
import WeaponsSection from "@/components/sections/WeaponsSection";
import MapsSection from "@/components/sections/MapsSection";
import ThrowablesSection from "@/components/sections/ThrowablesSection";
import EquipmentSection from "@/components/sections/EquipmentSection";
import LeaderboardSection from "@/components/sections/LeaderboardSection";
import { 
  getCatalogSummary, getWeapons, getCharacters, getMaps, getModes, getThrowables, getEquipment 
} from "@/lib/catalog";

export default async function HomePage() {
  // Fetch everything in parallel on the server
  const [
    stats, weapons, characters, maps, modes, throwables, equipment
  ] = await Promise.all([
    getCatalogSummary("v1"),
    getWeapons(),
    getCharacters(),
    getMaps(),
    getModes(),
    getThrowables(),
    getEquipment()
  ]);

  return (
    <div className="relative">
      <Hero stats={stats} />
      <CharactersSection characters={characters} />
      <ModesSection modes={modes} />
      <WeaponsSection weapons={weapons} />
      <MapsSection maps={maps} />
      <ThrowablesSection throwables={throwables} />
      <EquipmentSection equipment={equipment} />
      <LeaderboardSection />
    </div>
  );
}
