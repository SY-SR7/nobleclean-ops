export type SectionMedia = {
  imageUrl: string;
  videoTitle: string;
  videoPoster: string;
};

export type ToolMedia = {
  imageUrl: string;
  videoTitle: string;
  videoPoster: string;
  steps: string[];
};

export function getSectionMedia(sectionName: string): SectionMedia {
  const name = sectionName.toLowerCase();

  if (name.includes("eingang") || name.includes("empfang") || name.includes("lounge")) {
    return {
      imageUrl: "/images/sections/entrance_v2.jpg",
      videoTitle: "Demonstration: Eingangsbereich & Empfangstheke Pflege",
      videoPoster: "/images/sections/entrance_v2.jpg",
    };
  }

  if (name.includes("cardio") || name.includes("laufband") || name.includes("bike")) {
    return {
      imageUrl: "/images/sections/cardio_v2.jpg",
      videoTitle: "Demonstration: Desinfektion von Cardio-Geräten & Laufbändern",
      videoPoster: "/images/sections/cardio_v2.jpg",
    };
  }

  if (name.includes("kraft") || name.includes("hantel") || name.includes("maschine")) {
    return {
      imageUrl: "/images/sections/strength_v2.jpg",
      videoTitle: "Demonstration: Hygiene & Reinigung im Freihantel- & Kraftbereich",
      videoPoster: "/images/sections/strength_v2.jpg",
    };
  }

  if (name.includes("sanitär") || name.includes("dusche") || name.includes("wc") || name.includes("umkleide")) {
    return {
      imageUrl: "/images/sections/sanitary_v2.jpg",
      videoTitle: "Demonstration: Tiefenreinigung & Sanitär-Hygiene",
      videoPoster: "/images/sections/sanitary_v2.jpg",
    };
  }

  if (name.includes("sauna") || name.includes("dampfbad")) {
    return {
      imageUrl: "/images/sections/sauna_v2.jpg",
      videoTitle: "Demonstration: Pflege & Desinfektion der Saunabänke",
      videoPoster: "/images/sections/sauna_v2.jpg",
    };
  }

  return {
    imageUrl: "/images/sections/entrance_v2.jpg",
    videoTitle: "Demonstration: Allgemeine Bereichsreinigung",
    videoPoster: "/images/sections/entrance_v2.jpg",
  };
}

export function getToolMedia(toolName: string): ToolMedia {
  const name = toolName.toLowerCase();

  if (name.includes("maschine") || name.includes("scheuer") || name.includes("automat")) {
    return {
      imageUrl: "/images/tools/scrubber.jpg",
      videoTitle: "Video-Anleitung: Einsatz der Bodenreinigungsmaschine",
      videoPoster: "/images/tools/scrubber.jpg",
      steps: [
        "Frischwassertank mit Reinigungsmittel befüllen",
        "Saugfuß & Bürstendruck einstellen",
        "Gleichmäßige Bahnen ohne Überlappungslücken fahren",
      ],
    };
  }

  if (name.includes("mopp") || name.includes("mop") || name.includes("wischen")) {
    return {
      imageUrl: "/images/tools/mop.jpg",
      videoTitle: "Video-Anleitung: Mikrofaser-Wischsystem (8-Schleifen-Technik)",
      videoPoster: "/images/tools/mop.jpg",
      steps: [
        "Sauberen Mikrofaser-Moppbezug aufspannen",
        "In 8er-Schleifen von innen nach außen wischen",
        "Schmutzigen Bezug sofort in die Wäsche geben",
      ],
    };
  }

  return {
    imageUrl: "/images/tools/disinfectant.jpg",
    videoTitle: "Video-Anleitung: Flächendesinfektion & Einwirkzeit",
    videoPoster: "/images/tools/disinfectant.jpg",
    steps: [
      "Fläche gleichmäßig aus 20cm Entfernung einsprühen",
      "Vorgeschriebene Einwirkzeit (min. 60 Sek.) abwarten",
      "Mit trockenem Mikrofasertuchstreifen streifenfrei nachwischen",
    ],
  };
}
