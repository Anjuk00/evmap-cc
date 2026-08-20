const GBT = [{ connector: "GB/T", current: "AC" }, { connector: "GB/T", current: "DC" }];
const EU = [{ connector: "Type 2 (Mennekes)", current: "AC" }, { connector: "CCS2", current: "DC" }];
const JAPAN = [{ connector: "Type 1 (J1772)", current: "AC" }, { connector: "CHAdeMO", current: "DC" }];
const NORTH_AMERICA = [{ connector: "Type 1 (J1772)", current: "AC" }, { connector: "CCS1", current: "DC" }];

const SOURCES = {
  bydCaribbean: {
    sourceLabel: "BYD Caribbean албан ёсны техникийн хуудас (2024)",
    sourceUrl: "https://www.byd.com/content/dam/byd-site/caribbean/product-detail/song-plus-dm-i-rhd/flyer/song-plus-dm-i-rhd-flyer-20240401.pdf",
    sourceNote: "Type 2 AC, CCS2 DC — тухайн зах зээлийн хувилбар.",
  },
  bydLatam: {
    sourceLabel: "BYD Latin America албан ёсны техникийн хуудас (2023)",
    sourceUrl: "https://www.byd.com/material/byd-site/america-public/flyer/songplus-dm-i-flyer-es-20230307.pdf",
    sourceNote: "GB/T AC, DC хурдан цэнэглэлтгүй — тухайн зах зээлийн хувилбар.",
  },
  nissan: {
    sourceLabel: "Nissan албан ёсны цэнэглэх заавар",
    sourceUrl: "https://www.nissanusa.com/experience-nissan/news-and-events/how-to-charge-electric-car.html/1000.html",
    sourceNote: "North America хувилбар: LEAF — J1772/CHAdeMO, ARIYA — J1772/CCS1.",
  },
};

function profile(name, powertrain, compatibility, options = {}) {
  return {
    name,
    powertrain,
    market: options.market || "Зах зээлийн хувилбараа шалгана уу",
    years: options.years || "",
    confidence: options.confidence || "estimated",
    compatibility,
    connectors: [...new Set(compatibility.map((item) => item.connector))],
    sourceLabel: options.sourceLabel || "Зах зээлийн нийтлэг техникийн хувилбар",
    sourceUrl: options.sourceUrl || "",
    sourceNote: options.sourceNote || "Он, үйлдвэрлэсэн зах зээлээс шалтгаалан порт өөр байж болно.",
  };
}

function estimated(names, powertrain, compatibility, market) {
  return names.map((name) => profile(name, powertrain, compatibility, { market }));
}

export const vehicleCatalog = [
  {
    country: "Хятад",
    manufacturers: [
      { name: "BYD", models: [
        profile("Song Plus DM-i — Caribbean / CCS2 (2024)", "PHEV", [{ connector: "Type 2 (Mennekes)", current: "AC" }, { connector: "CCS2", current: "DC" }], { market: "Caribbean экспорт", years: "2024", confidence: "verified", ...SOURCES.bydCaribbean }),
        profile("Song Plus DM-i — Latin America / GB AC (2023)", "PHEV", [{ connector: "GB/T", current: "AC" }], { market: "Latin America экспорт", years: "2023", confidence: "verified", ...SOURCES.bydLatam }),
        ...estimated(["Song Plus DM-i — Хятад дотоодын хувилбар", "Qin Plus DM-i", "Destroyer 05", "Han DM-i", "Tang DM-i", "Frigate 07"], "PHEV", GBT, "Хятад дотоодын зах зээл"),
        ...estimated(["ATTO 3 / Yuan Plus", "Dolphin", "Seal", "Song Plus EV / Seal U EV", "Han EV", "Tang EV", "Sea Lion 07 EV"], "EV", GBT, "Хятад дотоодын зах зээл"),
      ] },
      { name: "Li Auto", models: [...estimated(["L6", "L7", "L8", "L9"], "EREV", GBT, "Хятад дотоодын зах зээл"), ...estimated(["MEGA"], "EV", GBT, "Хятад дотоодын зах зээл")] },
      { name: "AITO", models: [...estimated(["M5 EREV", "M7", "M9 EREV"], "EREV", GBT, "Хятад дотоодын зах зээл"), ...estimated(["M5 EV", "M9 EV"], "EV", GBT, "Хятад дотоодын зах зээл")] },
      { name: "Zeekr", models: estimated(["001", "007", "7X", "X", "009", "MIX"], "EV", GBT, "Хятад дотоодын зах зээл") },
      { name: "XPeng", models: estimated(["G3i", "G6", "G9", "P5", "P7i", "X9"], "EV", GBT, "Хятад дотоодын зах зээл") },
      { name: "NIO", models: estimated(["ET5", "ET5 Touring", "ET7", "ES6", "ES7", "ES8", "EC6"], "EV", GBT, "Хятад дотоодын зах зээл") },
    ],
  },
  {
    country: "Япон",
    manufacturers: [
      { name: "Nissan", models: [
        profile("Leaf — North America", "EV", JAPAN, { market: "North America", confidence: "verified", ...SOURCES.nissan }),
        profile("Ariya — North America", "EV", NORTH_AMERICA, { market: "North America", confidence: "verified", ...SOURCES.nissan }),
        ...estimated(["Leaf — Япон", "e-NV200", "Sakura"], "EV", JAPAN, "Япон дотоодын зах зээл"),
        ...estimated(["Ariya — Европ"], "EV", EU, "Европын зах зээл"),
      ] },
      { name: "Toyota", models: [...estimated(["bZ4X"], "EV", EU, "Европын зах зээл"), ...estimated(["Prius PHEV", "RAV4 PHEV", "C-HR PHEV"], "PHEV", EU, "Европын зах зээл")] },
      { name: "Mitsubishi", models: [...estimated(["i-MiEV"], "EV", JAPAN, "Япон / North America"), ...estimated(["Outlander PHEV", "Eclipse Cross PHEV"], "PHEV", JAPAN, "Япон / North America")] },
      { name: "Honda", models: [...estimated(["Honda e", "e:Ny1"], "EV", EU, "Европын зах зээл"), ...estimated(["Clarity PHEV"], "PHEV", NORTH_AMERICA, "North America")] },
      { name: "Mazda", models: [...estimated(["MX-30 EV"], "EV", EU, "Европын зах зээл"), ...estimated(["CX-60 PHEV", "CX-80 PHEV"], "PHEV", EU, "Европын зах зээл")] },
    ],
  },
  {
    country: "БНСУ",
    manufacturers: [
      { name: "Hyundai", models: [...estimated(["IONIQ 5", "IONIQ 6", "Kona Electric"], "EV", EU, "Европ / БНСУ экспорт"), ...estimated(["Santa Fe PHEV", "Tucson PHEV"], "PHEV", EU, "Европын зах зээл")] },
      { name: "Kia", models: [...estimated(["EV3", "EV5", "EV6", "EV9", "Niro EV"], "EV", EU, "Европ / БНСУ экспорт"), ...estimated(["Niro PHEV", "Sorento PHEV", "Sportage PHEV"], "PHEV", EU, "Европын зах зээл")] },
      { name: "Genesis", models: estimated(["GV60", "Electrified GV70", "Electrified G80"], "EV", EU, "Европын зах зээл") },
    ],
  },
  {
    country: "АНУ",
    manufacturers: [
      { name: "Tesla", models: estimated(["Model 3 — CCS2", "Model Y — CCS2", "Model S — CCS2", "Model X — CCS2"], "EV", EU, "Европ / CCS2 хувилбар") },
      { name: "Ford", models: [...estimated(["Mustang Mach-E", "F-150 Lightning"], "EV", NORTH_AMERICA, "North America"), ...estimated(["Escape PHEV"], "PHEV", NORTH_AMERICA, "North America")] },
      { name: "Jeep", models: estimated(["Wrangler 4xe", "Grand Cherokee 4xe"], "PHEV", NORTH_AMERICA, "North America") },
      { name: "Rivian", models: estimated(["R1T", "R1S"], "EV", NORTH_AMERICA, "North America") },
    ],
  },
  {
    country: "Европ",
    manufacturers: [
      { name: "Volkswagen", models: estimated(["ID.3", "ID.4", "ID.5", "ID.6", "ID.7", "ID. Buzz"], "EV", EU, "Европын зах зээл") },
      { name: "BMW", models: [...estimated(["iX1", "iX2", "iX3", "i4", "i5", "i7", "iX"], "EV", EU, "Европын зах зээл"), ...estimated(["330e", "530e", "X5 xDrive50e"], "PHEV", EU, "Европын зах зээл")] },
      { name: "Mercedes-Benz", models: [...estimated(["EQA", "EQB", "EQE", "EQS", "EQE SUV", "EQS SUV"], "EV", EU, "Европын зах зээл"), ...estimated(["C 300 e", "GLE 400 e"], "PHEV", EU, "Европын зах зээл")] },
      { name: "Audi", models: [...estimated(["Q4 e-tron", "Q6 e-tron", "Q8 e-tron", "e-tron GT"], "EV", EU, "Европын зах зээл"), ...estimated(["Q5 TFSI e", "Q7 TFSI e"], "PHEV", EU, "Европын зах зээл")] },
      { name: "Volvo / Polestar", models: [...estimated(["Volvo EX30", "Volvo EX40", "Volvo EC40", "Volvo EX90", "Polestar 2", "Polestar 3", "Polestar 4"], "EV", EU, "Европын зах зээл"), ...estimated(["Volvo XC60 Recharge", "Volvo XC90 Recharge"], "PHEV", EU, "Европын зах зээл")] },
      { name: "Renault / Peugeot", models: [...estimated(["Renault Zoe", "Megane E-Tech", "Scenic E-Tech", "Peugeot e-208", "e-2008", "e-3008", "e-5008"], "EV", EU, "Европын зах зээл"), ...estimated(["Peugeot 308 PHEV", "3008 PHEV"], "PHEV", EU, "Европын зах зээл")] },
    ],
  },
];

export function normalizeConnector(connector) {
  const value = String(connector).toLowerCase().replaceAll(" ", "");
  if (value.includes("chademo")) return "CHADEMO";
  if (value.includes("ccs2") || value.includes("combotype2")) return "CCS2";
  if (value.includes("ccs1") || value.includes("combotype1")) return "CCS1";
  if (value.includes("gb/t") || value.includes("gbt")) return "GBT";
  if (value.includes("type2") || value.includes("mennekes")) return "TYPE2";
  if (value.includes("type1") || value.includes("j1772")) return "TYPE1";
  return value.toUpperCase();
}

export function isConnectorMatch(portConnector, vehicleConnectors) {
  const port = normalizeConnector(portConnector);
  return vehicleConnectors.some((connector) => normalizeConnector(connector) === port);
}

export function isPortMatch(portConnector, portCurrent, vehicle) {
  return vehicle.compatibility.some((item) =>
    normalizeConnector(item.connector) === normalizeConnector(portConnector) && item.current === portCurrent
  );
}
