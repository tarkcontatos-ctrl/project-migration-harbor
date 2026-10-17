import { createFileRoute } from "@tanstack/react-router";
import originalHtml from "@/features/detailpro/original.html?raw";
import hero_car from "@/assets/hero-car-4k.webp";
import complete_wash from "@/assets/complete-wash-4k.webp";
import interior_cleaning from "@/assets/interior-cleaning-4k.webp";
import body_polishing from "@/assets/body-polishing-4k.webp";
import ceramic_coating from "@/assets/ceramic-coating-4k.webp";
import water_drops from "@/assets/water-drops-4k.webp";
import car_care from "@/assets/car-care-4k.webp";
import rear_light from "@/assets/rear-light-4k.webp";

const photographs: Record<string, string> = {
  "hero-car": hero_car,
  "complete-wash": complete_wash,
  "interior-cleaning": interior_cleaning,
  "body-polishing": body_polishing,
  "ceramic-coating": ceramic_coating,
  "water-drops": water_drops,
  "car-care": car_care,
  "rear-light": rear_light,
};
const pageHtml = originalHtml.replace(/__ASSET_([a-z-]+)__/g, (_, name: string) => photographs[name] ?? "");

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DetailPro — Estética automotiva" },
      { name: "description", content: "Cuidado profissional que preserva a aparência e prolonga a vida útil do seu veículo. Lavagem, higienização, polimento e proteção cerâmica." },
      { property: "og:title", content: "DetailPro — Estética automotiva" },
      { property: "og:description", content: "Cuidado profissional, brilho e proteção em cada detalhe do seu veículo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  // This is trusted, source-controlled markup from the user's original file, not user input.
  return (
    <div
      className="detailpro"
      style={{ "--p": `url(${car_care})` } as React.CSSProperties}
      dangerouslySetInnerHTML={{ __html: pageHtml }}
    />
  );
}
