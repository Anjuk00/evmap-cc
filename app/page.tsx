"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { isPortMatch, vehicleCatalog } from "./data/vehicles.mjs";

type Port = {
  evse: string;
  connector: string;
  current: "AC" | "DC";
  power: number;
  count: number;
  simultaneous: number;
  cable: string;
  price: number;
  statusCode?: "available" | "charging" | "finishing" | "preparing" | "offline" | "unknown";
  statusLabel?: string;
};

type Station = {
  id: string;
  operator: string;
  name: string;
  district: string;
  khoroo?: number;
  lat: number;
  lng: number;
  address: string;
  entrance?: string;
  hours: string;
  phone?: string;
  chargerCount: number;
  simultaneous: number;
  parking: string;
  payment: string;
  app: string;
  ports: Port[];
  updatedAt?: string;
  providerParkId?: string;
  liveUpdatedAt?: string;
  liveAvailable?: boolean;
};

type Vehicle = {
  name: string;
  powertrain: "EV" | "EREV" | "PHEV";
  connectors: string[];
  compatibility: Array<{ connector: string; current: "AC" | "DC" }>;
  market: string;
  years: string;
  confidence: "verified" | "estimated";
  sourceLabel: string;
  sourceUrl: string;
  sourceNote: string;
};

type SelectedVehicle = Vehicle & {
  country: string;
  manufacturer: string;
};

type VehicleCountry = {
  country: string;
  manufacturers: Array<{ name: string; models: Vehicle[] }>;
};

const typedVehicleCatalog = vehicleCatalog as unknown as VehicleCountry[];

type LiveConnector = {
  id: string;
  connector: string;
  current: "AC" | "DC";
  power: number;
  price: number;
  code: Port["statusCode"];
  label: string;
};

type LivePark = {
  provider: string;
  parkId: string;
  name: string;
  address: string;
  phone: string;
  lat: number;
  lng: number;
  connectors: LiveConnector[];
};

type CurrentFilter = "ALL" | "AC" | "DC";
type UserLocation = { lat: number; lng: number };

const stations: Station[] = [
  {
    id: "EV-001", operator: "Эрчим сүлжээ", name: "Шангри-Ла", district: "Сүхбаатар", khoroo: 1,
    lat: 47.9124221, lng: 106.9223172, address: "Шангри-Ла молл гадна зогсоол",
    entrance: "Үндсэн хаалгаар орж зогсоолын хэсэг рүү явна", hours: "24 цаг", phone: "77047704",
    chargerCount: 3, simultaneous: 3, parking: "1 цаг нь 3,000₮", payment: "QPay", app: "Toki",
    ports: [
      { evse: "EVSE-01", connector: "CCS1", current: "DC", power: 60, count: 1, simultaneous: 1, cable: "Кабельтай", price: 1300 },
      { evse: "EVSE-02", connector: "GB/T", current: "DC", power: 60, count: 1, simultaneous: 1, cable: "Кабельтай", price: 1300 },
      { evse: "EVSE-02", connector: "CHAdeMO", current: "DC", power: 60, count: 1, simultaneous: 1, cable: "Кабельтай", price: 1300 },
    ],
  },
  {
    id: "EV-002", operator: "Эрчим сүлжээ", name: "UbCab оффис", district: "Сүхбаатар", khoroo: 1,
    lat: 47.9085109, lng: 106.9147383, address: "UbCab оффис гадна зогсоол",
    entrance: "Үндсэн хаалгаар ороод зүүн гар талд", hours: "24 цаг", phone: "77047704",
    chargerCount: 1, simultaneous: 1, parking: "1 цаг нь 3,000₮", payment: "QPay", app: "Toki",
    ports: [{ evse: "EVSE-01", connector: "GB/T", current: "AC", power: 7, count: 1, simultaneous: 1, cable: "Кабельтай", price: 1000 }],
  },
  {
    id: "EV-003", operator: "Эрчим сүлжээ", name: "Dongfeng Motor showroom", district: "Хан-Уул", khoroo: 15,
    lat: 47.9036879, lng: 106.9279361, address: "Dongfeng showroom гадна зогсоол",
    entrance: "Home Plaza зогсоолын хаалтаар орно", hours: "24 цаг", phone: "77047704",
    chargerCount: 2, simultaneous: 2, parking: "1 цаг нь 3,000₮", payment: "QPay", app: "Toki",
    ports: [
      { evse: "EVSE-01", connector: "GB/T", current: "DC", power: 60, count: 1, simultaneous: 1, cable: "Кабельтай", price: 1300 },
      { evse: "EVSE-02", connector: "GB/T", current: "DC", power: 60, count: 1, simultaneous: 1, cable: "Кабельтай", price: 1300 },
    ],
  },
  {
    id: "EV-004", operator: "Эрчим сүлжээ", name: "Интермед", district: "Хан-Уул", khoroo: 19,
    lat: 47.8984116, lng: 106.9058675, address: "Интермед эмнэлэг гадна зогсоол",
    entrance: "Гадна зогсоолд", hours: "24 цаг", phone: "77047704", chargerCount: 4, simultaneous: 4,
    parking: "1 цаг нь 3,000₮", payment: "QPay", app: "Toki",
    ports: [
      { evse: "EVSE-01", connector: "GB/T", current: "AC", power: 7, count: 1, simultaneous: 1, cable: "Кабельтай", price: 1000 },
      { evse: "EVSE-02", connector: "GB/T", current: "AC", power: 7, count: 1, simultaneous: 1, cable: "Кабельтай", price: 1000 },
      { evse: "EVSE-03", connector: "CCS1", current: "DC", power: 9, count: 1, simultaneous: 1, cable: "Кабельтай", price: 1000 },
      { evse: "EVSE-04", connector: "CCS1", current: "DC", power: 9, count: 1, simultaneous: 1, cable: "Кабельтай", price: 1000 },
    ],
  },
  {
    id: "EV-005", operator: "Эрчим сүлжээ", name: "Эрчим сүлжээ", district: "Хан-Уул", khoroo: 19,
    lat: 47.8934593, lng: 106.9036634, address: "Эрчим сүлжээ ХХК-н гадна зогсоол",
    entrance: "Гадна зогсоолд", hours: "24 цаг", phone: "77047704", chargerCount: 1, simultaneous: 1,
    parking: "1 цаг нь 3,000₮", payment: "QPay", app: "Toki",
    ports: [{ evse: "EVSE-01", connector: "GB/T", current: "AC", power: 7, count: 1, simultaneous: 1, cable: "Кабельтай", price: 1000 }],
  },
  {
    id: "EV-006", operator: "Эрчим сүлжээ", name: "Анун төв", district: "Хан-Уул", khoroo: 3,
    lat: 47.8971847, lng: 106.8865379, address: "MCS Анун төв гадна зогсоол",
    entrance: "Гадна зогсоолд", hours: "24 цаг", phone: "77047704", chargerCount: 3, simultaneous: 3,
    parking: "1 цаг нь 3,000₮", payment: "QPay", app: "Toki",
    ports: [
      { evse: "EVSE-01", connector: "Type 2 (Mennekes)", current: "AC", power: 7, count: 1, simultaneous: 1, cable: "Кабельтай", price: 1000 },
      { evse: "EVSE-02", connector: "GB/T", current: "AC", power: 7, count: 1, simultaneous: 1, cable: "Кабельтай", price: 1000 },
      { evse: "EVSE-03", connector: "Type 1 (J1772)", current: "AC", power: 7, count: 1, simultaneous: 1, cable: "Кабельтай", price: 1000 },
    ],
  },
  {
    id: "EV-007", operator: "Uudam.mn", name: "Eco Car Center", district: "Баянзүрх", khoroo: 13,
    lat: 47.9076121, lng: 106.9685256, address: "Eco Car Center зогсоол",
    entrance: "Гадна зогсоолд", hours: "24 цаг", phone: "70112797", chargerCount: 2, simultaneous: 2,
    parking: "Зогсоолын төлбөр тодорхойгүй", payment: "QPay", app: "EV цэнэглэгч",
    ports: [
      { evse: "EVSE-01", connector: "GB/T", current: "DC", power: 60, count: 1, simultaneous: 1, cable: "Кабельтай", price: 800 },
      { evse: "EVSE-02", connector: "GB/T", current: "DC", power: 60, count: 1, simultaneous: 1, cable: "Кабельтай", price: 800 },
    ],
  },
  {
    id: "EV-008", operator: "Uudam.mn", name: "Villa Verde хотхон", district: "Хан-Уул", khoroo: 11,
    lat: 47.8712062, lng: 106.9059041, address: "Villa Verde хотхон доторх гадна зогсоол",
    entrance: "Гадна зогсоолд", hours: "24 цаг", phone: "70112797", chargerCount: 2, simultaneous: 2,
    parking: "Зогсоол үнэгүй", payment: "QPay", app: "EV цэнэглэгч",
    ports: [
      { evse: "EVSE-01", connector: "GB/T", current: "AC", power: 7, count: 1, simultaneous: 1, cable: "Кабельтай", price: 800 },
      { evse: "EVSE-02", connector: "GB/T", current: "AC", power: 7, count: 1, simultaneous: 1, cable: "Кабельтай", price: 800 },
    ],
  },
  {
    id: "EV-009", operator: "Uudam.mn", name: "Leaf Center Яармаг", district: "Хан-Уул", khoroo: 5,
    lat: 47.8684609, lng: 106.819836, address: "Leaf Center-ийн гадна зогсоол",
    entrance: "Гадна зогсоолд", hours: "24 цаг", phone: "70112797", chargerCount: 1, simultaneous: 1,
    parking: "Зогсоолын төлбөр тодорхойгүй", payment: "QPay", app: "EV цэнэглэгч",
    ports: [{ evse: "EVSE-01", connector: "GB/T", current: "AC", power: 7, count: 1, simultaneous: 1, cable: "Кабельтай", price: 800 }],
  },
  {
    id: "EV-010", operator: "ChargeX", name: "Спортын төв ордон", district: "Сүхбаатар", khoroo: 1,
    providerParkId: "c975965e-2cf0-433d-a997-a5c3b14620fc",
    lat: 47.9199559, lng: 106.9232016, address: "Спортын төв ордны гадна зогсоол",
    entrance: "Гадна зогсоолд", hours: "24 цаг", phone: "72005858", chargerCount: 2, simultaneous: 2,
    parking: "1 цаг нь 3,000₮", payment: "QPay", app: "ChargeX",
    ports: [
      { evse: "EVSE-01", connector: "CCS2", current: "DC", power: 40, count: 1, simultaneous: 1, cable: "Кабельтай", price: 1000 },
      { evse: "EVSE-02", connector: "GB/T", current: "DC", power: 40, count: 1, simultaneous: 1, cable: "Кабельтай", price: 1000 },
    ],
  },
  {
    id: "EV-011", operator: "ChargeX", name: "Moncable Office", district: "Баянгол", khoroo: 16,
    providerParkId: "c4240225-1b09-437c-9eae-e04753c33b8f",
    lat: 47.923077, lng: 106.8965227, address: "Moncable Office-ийн гадна зогсоол", entrance: "Гадна зогсоолд",
    hours: "09:00–18:00", phone: "72005858", chargerCount: 1, simultaneous: 1,
    parking: "Зогсоол үнэгүй", payment: "QPay", app: "ChargeX",
    ports: [{ evse: "EVSE-01", connector: "GB/T", current: "DC", power: 25, count: 1, simultaneous: 1, cable: "Кабельтай", price: 1000 }],
  },
  {
    id: "EV-012", operator: "ChargeX", name: "Union Building", district: "Сүхбаатар", khoroo: 1,
    providerParkId: "63ef5692-b430-4e45-bd7b-fb1ebc4e94e5",
    lat: 47.9096449, lng: 106.9297311, address: "Union Building-ийн гадна зогсоол",
    entrance: "Гадна зогсоолд", hours: "24 цаг", phone: "72005858", chargerCount: 2, simultaneous: 2,
    parking: "Зогсоолын төлбөр тодорхойгүй", payment: "QPay", app: "ChargeX",
    ports: [
      { evse: "EVSE-01", connector: "CCS2", current: "DC", power: 25, count: 1, simultaneous: 1, cable: "Кабельтай", price: 1000 },
      { evse: "EVSE-02", connector: "CCS2", current: "DC", power: 25, count: 1, simultaneous: 1, cable: "Кабельтай", price: 1000 },
    ],
  },
  {
    id: "EV-013", operator: "ChargeX", name: "Автотээврийн Петровис ШТС", district: "Сүхбаатар", khoroo: 1,
    providerParkId: "7dcc9119-cf41-431f-94f4-939d0d8d7a12",
    lat: 47.9086479, lng: 106.9131796, address: "Автотээврийн төвийн хажуу талын Петровис ШТС",
    entrance: "Гадна зогсоолд", hours: "24 цаг", phone: "72005858", chargerCount: 2, simultaneous: 2,
    parking: "1 цаг нь 3,000₮", payment: "QPay", app: "ChargeX",
    ports: [
      { evse: "EVSE-01", connector: "CHAdeMO", current: "DC", power: 60, count: 1, simultaneous: 1, cable: "Кабельтай", price: 1500 },
      { evse: "EVSE-02", connector: "CCS2", current: "DC", power: 60, count: 1, simultaneous: 1, cable: "Кабельтай", price: 1500 },
    ],
  },
  {
    id: "EV-014", operator: "ChargeX", name: "Ниссан төв", district: "Сүхбаатар", khoroo: 2,
    providerParkId: "455bb3d1-f8a1-408e-a6cb-21ee9c446ee3",
    lat: 47.9083544, lng: 106.9115008, address: "Nissan Showroom-ийн гадна зогсоол",
    entrance: "Гадна зогсоолд", hours: "24 цаг", phone: "72005858", chargerCount: 4, simultaneous: 4,
    parking: "1 цаг нь 3,000₮", payment: "QPay", app: "ChargeX",
    ports: [
      { evse: "EVSE-01", connector: "CCS2", current: "DC", power: 50, count: 1, simultaneous: 1, cable: "Кабельтай", price: 1500 },
      { evse: "EVSE-02", connector: "CHAdeMO", current: "DC", power: 50, count: 1, simultaneous: 1, cable: "Кабельтай", price: 1500 },
      { evse: "EVSE-03", connector: "CCS2", current: "DC", power: 50, count: 1, simultaneous: 1, cable: "Кабельтай", price: 1500 },
      { evse: "EVSE-04", connector: "CHAdeMO", current: "DC", power: 50, count: 1, simultaneous: 1, cable: "Кабельтай", price: 1500 },
    ],
  },
  {
    id: "EV-015", operator: "ChargeX", name: "Үндэсний цэцэрлэгт хүрээлэн", district: "Баянзүрх", khoroo: 26,
    providerParkId: "113b95a2-bf35-48d8-8746-f66a7f82a7f3",
    lat: 47.9020195, lng: 106.9414024, address: "Үндэсний цэцэрлэгт хүрээлэнгийн зогсоол", entrance: "8-р сарын 20-ноос ажиллана гэж мэдээлсэн",
    hours: "24 цаг", phone: "72005858", chargerCount: 10, simultaneous: 10,
    parking: "1 цаг нь 3,000₮", payment: "QPay", app: "ChargeX",
    ports: Array.from({ length: 10 }, (_, index) => ({
      evse: `EVSE-${String(index + 1).padStart(2, "0")}`, connector: "GB/T", current: "DC" as const,
      power: 80, count: 1, simultaneous: 1, cable: "Кабельтай", price: 1000,
    })),
  },
  {
    id: "EV-016", operator: "ChargeX", name: "River Garden хотхон", district: "Хан-Уул", khoroo: 17,
    providerParkId: "796c53ae-c4ec-4162-85aa-212560172ef5",
    lat: 47.889519, lng: 106.9260049, address: "River Garden хотхон дотор", entrance: "Зөвхөн хотхоны оршин суугчид ашиглах боломжтой",
    hours: "24 цаг", phone: "72005858", chargerCount: 1, simultaneous: 1,
    parking: "Зогсоол үнэгүй", payment: "QPay", app: "ChargeX",
    ports: [{ evse: "EVSE-01", connector: "GB/T", current: "DC", power: 25, count: 1, simultaneous: 1, cable: "Кабельтай", price: 1000 }],
  },
  {
    id: "EV-017", operator: "Charge", name: "Хан-Уул Emart", district: "Хан-Уул", khoroo: 15,
    lat: 47.9003485, lng: 106.9290582, address: "Хан-Уул Emart B1 зогсоол", entrance: "B1 зогсоолд",
    hours: "09:00–22:00", phone: "99314726", chargerCount: 4, simultaneous: 4,
    parking: "1 цаг нь 3,000₮", payment: "QPay", app: "Банкны QPay",
    ports: [
      { evse: "EVSE-01", connector: "CCS2", current: "DC", power: 80, count: 1, simultaneous: 1, cable: "Кабельтай", price: 1300 },
      { evse: "EVSE-02", connector: "GB/T", current: "DC", power: 80, count: 1, simultaneous: 1, cable: "Кабельтай", price: 1300 },
      { evse: "EVSE-03", connector: "GB/T", current: "DC", power: 80, count: 1, simultaneous: 1, cable: "Кабельтай", price: 1300 },
      { evse: "EVSE-04", connector: "GB/T", current: "DC", power: 80, count: 1, simultaneous: 1, cable: "Кабельтай", price: 1300 },
    ],
  },
  {
    id: "EV-018", operator: "EVM app", name: "Тусгаар тогтнолын ордон", district: "Сүхбаатар", khoroo: 1,
    lat: 47.9190877, lng: 106.921543, address: "Тусгаар тогтнолын ордон гадна зогсоол", entrance: "Гадна зогсоолд",
    hours: "24 цаг", phone: "77070202", chargerCount: 6, simultaneous: 6,
    parking: "1 цаг нь 3,000₮", payment: "QPay", app: "EVMapp",
    ports: [
      ...Array.from({ length: 3 }, (_, index) => ({ evse: `EVSE-${String(index + 1).padStart(2, "0")}`, connector: "GB/T", current: "AC" as const, power: 25, count: 1, simultaneous: 1, cable: "Кабельтай", price: 800 })),
      ...Array.from({ length: 3 }, (_, index) => ({ evse: `EVSE-${String(index + 4).padStart(2, "0")}`, connector: "Type 1 (J1772)", current: "AC" as const, power: 25, count: 1, simultaneous: 1, cable: "Кабельтай", price: 800 })),
    ],
  },
  {
    id: "EV-019", operator: "EVM app", name: "Мэдээлэл технологийн парк", district: "Сүхбаатар", khoroo: 8,
    lat: 47.92161, lng: 106.9229002, address: "Мэдээлэл технологийн парк", entrance: "Гадна зогсоолд",
    hours: "24 цаг", phone: "77070202", chargerCount: 2, simultaneous: 2,
    parking: "Зогсоолын төлбөр тодорхойгүй", payment: "QPay", app: "EVMapp",
    ports: [
      { evse: "EVSE-01", connector: "GB/T", current: "AC", power: 25, count: 1, simultaneous: 1, cable: "Кабельтай", price: 800 },
      { evse: "EVSE-02", connector: "Type 1 (J1772)", current: "AC", power: 25, count: 1, simultaneous: 1, cable: "Кабельтай", price: 800 },
    ],
  },
  {
    id: "EV-020", operator: "EVM app", name: "Cila Center замын эсрэг талд", district: "Хан-Уул", khoroo: 17,
    lat: 47.8931615, lng: 106.9106291, address: "V28 Lounge-ийн гадна зогсоол",
    hours: "Тодорхойгүй", phone: "77970202", chargerCount: 2, simultaneous: 2,
    parking: "Зогсоолын төлбөр тодорхойгүй", payment: "QPay", app: "EVMapp",
    ports: [
      { evse: "EVSE-01", connector: "GB/T", current: "AC", power: 25, count: 1, simultaneous: 1, cable: "Кабельтай", price: 800 },
      { evse: "EVSE-02", connector: "Type 1 (J1772)", current: "AC", power: 25, count: 1, simultaneous: 1, cable: "Кабельтай", price: 800 },
    ],
  },
  {
    id: "EV-021", operator: "Эрчим сүлжээ", name: "Чингис хаан олон улсын нисэх буудал", district: "Бусад", khoroo: 4,
    lat: 47.6534674, lng: 106.8204375, address: "Чингис хаан олон улсын нисэх буудал гадна зогсоол", entrance: "Гадна зогсоолд",
    hours: "24 цаг", phone: "77047704", chargerCount: 3, simultaneous: 3,
    parking: "1 цаг нь 3,000₮", payment: "QPay", app: "Toki",
    ports: [
      { evse: "EVSE-01", connector: "CCS1", current: "DC", power: 60, count: 1, simultaneous: 1, cable: "Кабельтай", price: 1300 },
      { evse: "EVSE-02", connector: "CHAdeMO", current: "DC", power: 60, count: 1, simultaneous: 1, cable: "Кабельтай", price: 1300 },
      { evse: "EVSE-03", connector: "GB/T", current: "DC", power: 60, count: 1, simultaneous: 1, cable: "Кабельтай", price: 1300 },
    ],
  },
  {
    id: "EV-022", operator: "Эрчим сүлжээ", name: "CU Хутагт-Өндөр", district: "Бусад",
    lat: 47.4044971, lng: 106.6935585, address: "Хутаг-Өндөр сумын CU дэлгүүр", entrance: "Гадна зогсоолд",
    hours: "24 цаг", phone: "77047704", chargerCount: 2, simultaneous: 2,
    parking: "Зогсоол үнэгүй", payment: "QPay", app: "Toki",
    ports: [
      { evse: "EVSE-01", connector: "GB/T", current: "DC", power: 120, count: 1, simultaneous: 1, cable: "Кабельтай", price: 1300 },
      { evse: "EVSE-02", connector: "GB/T", current: "DC", power: 120, count: 1, simultaneous: 1, cable: "Кабельтай", price: 1300 },
    ],
  },
  {
    id: "EV-023", operator: "Charger.mn", name: "Regis Place", district: "Хан-Уул", khoroo: 15,
    lat: 47.9000372, lng: 106.909677, address: "Regis Place гадна зогсоол", entrance: "Одоогоор оффлайн байна",
    hours: "Тодорхойгүй", chargerCount: 1, simultaneous: 1,
    parking: "Зогсоолын төлбөр тодорхойгүй", payment: "QPay", app: "Charger.mn",
    ports: [{ evse: "EVSE-01", connector: "GB/T", current: "AC", power: 25, count: 1, simultaneous: 1, cable: "Тодорхойгүй", price: 1000 }],
  },
];

type LeafletLayer = { addTo: (map: LeafletMap) => LeafletLayer };
type LeafletMarker = LeafletLayer & { on: (event: string, callback: () => void) => LeafletMarker; bindTooltip: (text: string, options: Record<string, unknown>) => LeafletMarker };
type LeafletCluster = { getChildCount: () => number };
type LeafletClusterGroup = LeafletLayer & { addLayer: (layer: LeafletMarker) => LeafletClusterGroup };
type LeafletMap = {
  setView: (point: [number, number], zoom: number, options?: Record<string, unknown>) => LeafletMap;
  fitBounds: (bounds: unknown, options: Record<string, unknown>) => LeafletMap;
  getZoom: () => number;
  removeLayer: (layer: LeafletLayer) => LeafletMap;
  remove: () => void;
};

type LeafletNamespace = {
  map: (element: HTMLElement, options: Record<string, unknown>) => LeafletMap;
  tileLayer: (url: string, options: Record<string, unknown>) => LeafletLayer;
  marker: (point: [number, number], options?: Record<string, unknown>) => LeafletMarker;
  markerClusterGroup: (options: Record<string, unknown>) => LeafletClusterGroup;
  divIcon: (options: Record<string, unknown>) => unknown;
  circleMarker: (point: [number, number], options: Record<string, unknown>) => LeafletMarker;
  latLngBounds: (points: [number, number][]) => unknown;
  control: { zoom: (options: Record<string, unknown>) => LeafletLayer };
};

declare global {
  interface Window { L?: LeafletNamespace; }
}

function money(value: number) {
  return `${value.toLocaleString("en-US")}₮`;
}

function priceLabel(station: Station) {
  const prices = station.ports.map((port) => port.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? money(min) : `${money(min)}–${money(max)}`;
}

function liveConnectorLabel(value: string) {
  const normalized = value.toLowerCase().replaceAll(" ", "");
  if (normalized.includes("chademo")) return "CHAdeMO";
  if (normalized.includes("ccs2") || normalized.includes("combotype2")) return "CCS2";
  if (normalized.includes("ccs1") || normalized.includes("combotype1")) return "CCS1";
  if (normalized.includes("gb/t") || normalized.includes("gbt")) return "GB/T";
  if (normalized.includes("type2") || normalized.includes("mennekes")) return "Type 2 (Mennekes)";
  if (normalized.includes("type1") || normalized.includes("j1772")) return "Type 1 (J1772)";
  return value || "Тодорхойгүй";
}

function distanceKm(a: UserLocation, b: UserLocation) {
  const radius = 6371;
  const toRadians = (value: number) => value * Math.PI / 180;
  const lat = toRadians(b.lat - a.lat);
  const lng = toRadians(b.lng - a.lng);
  const h = Math.sin(lat / 2) ** 2 + Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * Math.sin(lng / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function addStylesheet(id: string, href: string) {
  if (document.getElementById(id)) return;
  const stylesheet = document.createElement("link");
  stylesheet.id = id;
  stylesheet.rel = "stylesheet";
  stylesheet.href = href;
  document.head.appendChild(stylesheet);
}

function loadScript(id: string, src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(id) as HTMLScriptElement | null;
    if (existing?.dataset.loaded === "true") return resolve();
    const script = existing ?? document.createElement("script");
    const onLoad = () => { script.dataset.loaded = "true"; resolve(); };
    const onError = () => reject(new Error("Газрын зураг ачаалсангүй"));
    script.addEventListener("load", onLoad, { once: true });
    script.addEventListener("error", onError, { once: true });
    if (!existing) {
      script.id = id;
      script.src = src;
      document.body.appendChild(script);
    }
  });
}

async function loadLeaflet() {
  addStylesheet("leaflet-css", "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css");
  addStylesheet("leaflet-cluster-css", "https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css");
  addStylesheet("leaflet-cluster-default-css", "https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css");
  if (!window.L) await loadScript("leaflet-js", "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js");
  if (!window.L?.markerClusterGroup) {
    await loadScript("leaflet-cluster-js", "https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js");
  }
  if (!window.L?.markerClusterGroup) throw new Error("Газрын зураг ачаалсангүй");
  return window.L;
}

const connectorArt = {
  type1: {
    src: "https://upload.wikimedia.org/wikipedia/commons/2/2a/J1772_connector.svg",
    source: "https://commons.wikimedia.org/wiki/File:J1772_connector.svg",
  },
  ccs1: {
    src: "https://upload.wikimedia.org/wikipedia/commons/b/b2/J1772_%28CCS1%29.svg",
    source: "https://commons.wikimedia.org/wiki/File:J1772_(CCS1).svg",
  },
  type2: {
    src: "https://upload.wikimedia.org/wikipedia/commons/7/7d/IEC_62196-2_Type_2_%28plug%29.svg",
    source: "https://commons.wikimedia.org/wiki/File:IEC_62196-2_Type_2_(plug).svg",
  },
  ccs2: {
    src: "https://upload.wikimedia.org/wikipedia/commons/2/2c/IEC_62196_Type_2_%28M%2C_DC%2C_CCS_Combo_2%29.svg",
    source: "https://commons.wikimedia.org/wiki/File:IEC_62196_Type_2_(M,_DC,_CCS_Combo_2).svg",
  },
  gbtAc: {
    src: "https://upload.wikimedia.org/wikipedia/commons/5/58/GBT_20234_%28AC%29.svg",
    source: "https://commons.wikimedia.org/wiki/File:GBT_20234_(AC).svg",
  },
  gbtDc: {
    src: "https://upload.wikimedia.org/wikipedia/commons/2/28/GBT_20234_%28DC%29.svg",
    source: "https://commons.wikimedia.org/wiki/File:GBT_20234_(DC).svg",
  },
  chademo: {
    src: "https://upload.wikimedia.org/wikipedia/commons/d/d4/CHAdeMO_connector.svg",
    source: "https://commons.wikimedia.org/wiki/File:CHAdeMO_connector.svg",
  },
} as const;

type ConnectorArtKey = keyof typeof connectorArt;

function connectorArtKey(connector: string, current: "AC" | "DC"): ConnectorArtKey {
  const name = connector.toLowerCase();
  if (name.includes("chademo")) return "chademo";
  if (name.includes("ccs2")) return "ccs2";
  if (name.includes("ccs1")) return "ccs1";
  if (name.includes("gb/t")) return current === "DC" ? "gbtDc" : "gbtAc";
  if (name.includes("type 2")) return "type2";
  return "type1";
}

function ConnectorIcon({ connector, current }: { connector: string; current: "AC" | "DC" }) {
  const family = connectorArtKey(connector, current);
  const art = connectorArt[family];
  const label = `${connector} ${current} оролтын хэлбэр`;

  return (
    <div className={`connector-visual ${family}`} role="img" aria-label={label} title={label}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={art.src} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
      <small>{current}</small>
    </div>
  );
}

type ReportIssueModalProps = {
  station: Station;
  dialogRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
};

function ReportIssueModal({ station, dialogRef, onClose }: ReportIssueModalProps) {
  const [field, setField] = useState("");
  const [correctValue, setCorrectValue] = useState("");
  const [note, setNote] = useState("");
  const [contact, setContact] = useState("");
  const [copyStatus, setCopyStatus] = useState("");

  const reportText = [
    "EVmap мэдээллийн алдаа",
    "Станц: " + station.name,
    "Алдаатай мэдээлэл: " + (field || "—"),
    "Зөв мэдээлэл: " + (correctValue || "—"),
    "Нэмэлт тайлбар: " + (note || "—"),
    "Холбоо барих: " + (contact || "—"),
  ].join("\n");

  async function copyReport() {
    if (!field || !correctValue.trim()) return;
    try {
      await navigator.clipboard.writeText(reportText);
      setCopyStatus("Мэдээллийг хууллаа. Та өөрийн ашигладаг холбоо барих сувгаар илгээнэ үү.");
    } catch {
      setCopyStatus("Автоматаар хуулж чадсангүй. Доорх бэлтгэсэн мэдээллийг гараар хуулна уу.");
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="report-modal" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="report-title">
        <div className="dialog-heading">
          <div>
            <p className="eyebrow">Мэдээллийн чанар</p>
            <h2 id="report-title">Алдаатай мэдээлэл мэдэгдэх</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Цонх хаах">×</button>
        </div>

        <div className="report-form">
          <label>
            <span>Станцын нэр</span>
            <input value={station.name} readOnly />
          </label>
          <label>
            <span>Ямар мэдээлэл алдаатай вэ?</span>
            <select value={field} onChange={(event) => setField(event.target.value)} required>
              <option value="">Сонгоно уу</option>
              <option>Байршил эсвэл хаяг</option>
              <option>Үнэ</option>
              <option>Порт эсвэл чадал</option>
              <option>Ажиллах цаг</option>
              <option>Зогсоол эсвэл орох тайлбар</option>
              <option>Утас, төлбөр эсвэл апп</option>
              <option>Бусад</option>
            </select>
          </label>
          <label>
            <span>Зөв мэдээлэл</span>
            <textarea value={correctValue} onChange={(event) => setCorrectValue(event.target.value)} rows={3} required placeholder="Зөв мэдээллийг бичнэ үү" />
          </label>
          <label>
            <span>Нэмэлт тайлбар</span>
            <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={2} placeholder="Шаардлагатай бол дэлгэрүүлнэ үү" />
          </label>
          <label>
            <span>Холбоо барих мэдээлэл <em>заавал биш</em></span>
            <input value={contact} onChange={(event) => setContact(event.target.value)} placeholder="Утас эсвэл имэйл" />
          </label>
        </div>

        <div className="report-preview" aria-label="Хуулах мэдээллийн урьдчилсан харагдац">{reportText}</div>
        <p className="report-help">Одоогоор серверт шууд илгээхгүй. Бэлтгэсэн мэдээллийг хуулж аваад холбоо барих сувгаар илгээх боломжтой.</p>
        {copyStatus && <p className="copy-status" role="status">{copyStatus}</p>}
        <div className="dialog-actions">
          <button className="secondary-button" type="button" onClick={onClose}>Болих</button>
          <button className="primary-button" type="button" disabled={!field || !correctValue.trim()} onClick={copyReport}>Мэдээллийг хуулж авах</button>
        </div>
      </div>
    </div>
  );
}

type VehicleSelectionModalProps = {
  dialogRef: React.RefObject<HTMLDivElement | null>;
  country: string;
  manufacturer: string;
  modelName: string;
  onCountryChange: (value: string) => void;
  onManufacturerChange: (value: string) => void;
  onModelChange: (value: string) => void;
  onApply: () => void;
  onClose: () => void;
};

function VehicleSelectionModal({
  dialogRef,
  country,
  manufacturer,
  modelName,
  onCountryChange,
  onManufacturerChange,
  onModelChange,
  onApply,
  onClose,
}: VehicleSelectionModalProps) {
  const countryEntry = typedVehicleCatalog.find((item) => item.country === country);
  const manufacturerEntry = countryEntry?.manufacturers.find((item) => item.name === manufacturer);

  return (
    <div className="modal-backdrop vehicle-backdrop">
      <div className="vehicle-modal" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="vehicle-title">
        <div className="dialog-heading">
          <div>
            <p className="eyebrow">Тохирох цэнэглэгч олох</p>
            <h2 id="vehicle-title">Машинаа сонгох</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Цонх хаах">×</button>
        </div>

        <p className="vehicle-intro">Улс, үйлдвэрлэгч, загвараа сонгоход түгээмэл үйлдвэрийн үзүүлэлтэд тулгуурлан боломжит станцуудыг санал болгоно.</p>

        <div className="vehicle-form">
          <label>
            <span><b>1</b> Улс</span>
            <select value={country} onChange={(event) => onCountryChange(event.target.value)}>
              <option value="">Улсаа сонгоно уу</option>
              {typedVehicleCatalog.map((item) => <option key={item.country} value={item.country}>{item.country}</option>)}
            </select>
          </label>
          <label>
            <span><b>2</b> Үйлдвэрлэгч</span>
            <select value={manufacturer} disabled={!countryEntry} onChange={(event) => onManufacturerChange(event.target.value)}>
              <option value="">Үйлдвэрлэгчээ сонгоно уу</option>
              {countryEntry?.manufacturers.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}
            </select>
          </label>
          <label>
            <span><b>3</b> Загвар</span>
            <select value={modelName} disabled={!manufacturerEntry} onChange={(event) => onModelChange(event.target.value)}>
              <option value="">Загвараа сонгоно уу</option>
              {manufacturerEntry?.models.map((item) => <option key={item.name + item.powertrain} value={item.name}>{item.name} · {item.powertrain}</option>)}
            </select>
          </label>
        </div>

        <div className="vehicle-caution compact">
          <strong>Анхаарах нь</strong>
          <p>Нэг загварын Хятад, Европ, Америк хувилбар өөр оролттой байж болно. Санал нь зөвхөн загварын түгээмэл үзүүлэлтэд үндэслэнэ.</p>
        </div>

        <div className="dialog-actions">
          <button className="secondary-button" type="button" onClick={onClose}>Болих</button>
          <button className="primary-button" type="button" disabled={!modelName} onClick={onApply}>Тохирох станц харах</button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [currentFilter, setCurrentFilter] = useState<CurrentFilter>("ALL");
  const [connector, setConnector] = useState("ALL");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [vehicleOpen, setVehicleOpen] = useState(false);
  const [vehicleCountry, setVehicleCountry] = useState("");
  const [vehicleManufacturer, setVehicleManufacturer] = useState("");
  const [vehicleModelName, setVehicleModelName] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState<SelectedVehicle | null>(null);
  const [liveParks, setLiveParks] = useState<LivePark[]>([]);
  const [liveFetchedAt, setLiveFetchedAt] = useState<string | null>(null);
  const [liveDegraded, setLiveDegraded] = useState(false);
  const [marketingVisible, setMarketingVisible] = useState(true);
  const [sheetClosing, setSheetClosing] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationMessage, setLocationMessage] = useState("");
  const [mapReady, setMapReady] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const mapElementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const leafletRef = useRef<LeafletNamespace | null>(null);
  const clusterRef = useRef<LeafletClusterGroup | null>(null);
  const locationLayerRef = useRef<LeafletMarker | null>(null);
  const fittedSignatureRef = useRef("");
  const closeTimerRef = useRef<number | null>(null);
  const listDialogRef = useRef<HTMLDivElement>(null);
  const reportDialogRef = useRef<HTMLDivElement>(null);
  const vehicleDialogRef = useRef<HTMLDivElement>(null);

  const displayStations = useMemo(() => stations.map((station) => {
    if (!station.providerParkId) return station;
    const livePark = liveParks.find((park) => park.parkId === station.providerParkId);
    if (!livePark) {
      return {
        ...station,
        liveAvailable: false,
        ports: station.ports.map((port) => ({ ...port, statusCode: "unknown" as const, statusLabel: "Төлөв тодорхойгүй" })),
      };
    }

    const livePorts: Port[] = livePark.connectors.map((port) => ({
      evse: port.id,
      connector: liveConnectorLabel(port.connector),
      current: port.current,
      power: port.power,
      count: 1,
      simultaneous: 1,
      cable: "Кабельтай",
      price: port.price,
      statusCode: port.code,
      statusLabel: port.label,
    }));

    return {
      ...station,
      lat: livePark.lat,
      lng: livePark.lng,
      address: livePark.address || station.address,
      phone: livePark.phone || station.phone,
      chargerCount: livePorts.length || station.chargerCount,
      simultaneous: livePorts.length || station.simultaneous,
      ports: livePorts.length ? livePorts : station.ports.map((port) => ({ ...port, statusCode: "unknown" as const, statusLabel: "Төлөв тодорхойгүй" })),
      liveUpdatedAt: liveFetchedAt ?? undefined,
      liveAvailable: livePorts.length > 0,
    };
  }), [liveFetchedAt, liveParks]);

  const connectors = useMemo(() => Array.from(new Set(displayStations.flatMap((station) => station.ports.map((port) => port.connector)))), [displayStations]);
  const filteredStations = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("mn-MN");
    return displayStations.filter((station) => {
      const matchesSearch = !normalized || [station.name, station.operator, station.address, station.district].some((value) => value.toLocaleLowerCase("mn-MN").includes(normalized));
      const matchesCurrent = currentFilter === "ALL" || station.ports.some((port) => port.current === currentFilter);
      const matchesConnector = connector === "ALL" || station.ports.some((port) => port.connector === connector);
      return matchesSearch && matchesCurrent && matchesConnector;
    });
  }, [connector, currentFilter, displayStations, query]);

  const recommendedStationIds = useMemo(() => new Set(
    selectedVehicle
      ? displayStations.filter((station) => station.ports.some((port) => isPortMatch(port.connector, port.current, selectedVehicle))).map((station) => station.id)
      : []
  ), [displayStations, selectedVehicle]);

  const listStations = useMemo(() => selectedVehicle
    ? [...filteredStations].sort((a, b) => Number(recommendedStationIds.has(b.id)) - Number(recommendedStationIds.has(a.id)))
    : filteredStations,
  [filteredStations, recommendedStationIds, selectedVehicle]);

  const filtersActive = Boolean(query.trim()) || currentFilter !== "ALL" || connector !== "ALL";
  const selected = selectedId ? displayStations.find((station) => station.id === selectedId) ?? null : null;
  const selectedDistance = userLocation && selected ? distanceKm(userLocation, selected) : null;
  const selectedVehicleMatch = Boolean(selected && selectedVehicle && recommendedStationIds.has(selected.id));

  function clearFilters() {
    setQuery("");
    setCurrentFilter("ALL");
    setConnector("ALL");
    setSelectedId(null);
    setDetailsOpen(false);
    setSheetClosing(false);
  }

  function selectStation(station: Station, zoom = true) {
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    setSheetClosing(false);
    setSelectedId(station.id);
    setDetailsOpen(false);
    setListOpen(false);
    if (zoom && mapRef.current) {
      mapRef.current.setView([station.lat, station.lng], Math.max(mapRef.current.getZoom(), 16), { animate: true });
    }
  }

  function closeStation() {
    if (!selectedId || sheetClosing) return;
    setSheetClosing(true);
    closeTimerRef.current = window.setTimeout(() => {
      setSelectedId(null);
      setDetailsOpen(false);
      setSheetClosing(false);
    }, 160);
  }

  useEffect(() => () => {
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
  }, []);

  useEffect(() => {
    let disposed = false;
    let currentController: AbortController | null = null;

    async function refreshLiveStatus() {
      currentController?.abort();
      currentController = new AbortController();
      const controller = currentController;
      try {
        const response = await fetch("/api/live-status", { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("live status unavailable");
        const payload = await response.json() as { providers?: Array<{ id: string; parks?: LivePark[] }>; fetchedAt?: string; degraded?: boolean };
        if (disposed) return;
        const chargeX = payload.providers?.find((provider) => provider.id === "chargex");
        setLiveParks(Array.isArray(chargeX?.parks) ? chargeX.parks : []);
        setLiveFetchedAt(payload.fetchedAt ?? null);
        setLiveDegraded(Boolean(payload.degraded));
      } catch (error) {
        if (disposed || (error instanceof DOMException && error.name === "AbortError")) return;
        setLiveDegraded(true);
      }
    }

    void refreshLiveStatus();
    const interval = window.setInterval(refreshLiveStatus, 60000);
    return () => {
      disposed = true;
      currentController?.abort();
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setMarketingVisible(false), 11000);
    return () => window.clearTimeout(timer);
  }, []);

  function applyVehicleSelection() {
    const countryEntry = typedVehicleCatalog.find((item) => item.country === vehicleCountry);
    const manufacturerEntry = countryEntry?.manufacturers.find((item) => item.name === vehicleManufacturer);
    const model = manufacturerEntry?.models.find((item) => item.name === vehicleModelName);
    if (!countryEntry || !manufacturerEntry || !model) return;
    setSelectedVehicle({ ...model, country: countryEntry.country, manufacturer: manufacturerEntry.name });
    setSelectedId(null);
    setDetailsOpen(false);
    setVehicleOpen(false);
    setListOpen(true);
  }

  function clearVehicleSelection() {
    setSelectedVehicle(null);
    setVehicleCountry("");
    setVehicleManufacturer("");
    setVehicleModelName("");
  }

  useEffect(() => {
    if (!listOpen && !reportOpen && !vehicleOpen) return;
    const activeElement = document.activeElement as HTMLElement | null;
    const dialog = reportOpen ? reportDialogRef.current : vehicleOpen ? vehicleDialogRef.current : listDialogRef.current;
    const selector = "button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]";
    const controls = dialog ? Array.from(dialog.querySelectorAll<HTMLElement>(selector)) : [];
    controls[0]?.focus();

    function handleDialogKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        if (reportOpen) setReportOpen(false);
        else if (vehicleOpen) setVehicleOpen(false);
        else setListOpen(false);
        return;
      }
      if (event.key !== "Tab" || !controls.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleDialogKey);
    return () => {
      document.removeEventListener("keydown", handleDialogKey);
      activeElement?.focus();
    };
  }, [listOpen, reportOpen, vehicleOpen]);

  useEffect(() => {
    if (!selected || listOpen || reportOpen || vehicleOpen) return;
    function handleSheetKey(event: KeyboardEvent) {
      if (event.key === "Escape" && selectedId && !sheetClosing) {
        setSheetClosing(true);
        closeTimerRef.current = window.setTimeout(() => {
          setSelectedId(null);
          setDetailsOpen(false);
          setSheetClosing(false);
        }, 160);
      }
    }
    document.addEventListener("keydown", handleSheetKey);
    return () => document.removeEventListener("keydown", handleSheetKey);
  }, [selected, selectedId, listOpen, reportOpen, sheetClosing, vehicleOpen]);

  useEffect(() => {
    let cancelled = false;
    loadLeaflet().then((L) => {
      if (cancelled || !mapElementRef.current) return;
      const map = L.map(mapElementRef.current, { zoomControl: false, attributionControl: true }).setView([47.918, 106.917], 14);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap" }).addTo(map);
      L.control.zoom({ position: "bottomright" }).addTo(map);
      leafletRef.current = L;
      mapRef.current = map;
      setMapReady(true);
    }).catch(() => setLocationMessage("Газрын зургийн холболтыг шалгана уу"));

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      leafletRef.current = null;
    };
  }, []);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!mapReady || !L || !map) return;

    if (clusterRef.current) map.removeLayer(clusterRef.current);
    if (locationLayerRef.current) map.removeLayer(locationLayerRef.current);

    const cluster = L.markerClusterGroup({
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      spiderfyOnMaxZoom: true,
      spiderfyDistanceMultiplier: 1.4,
      maxClusterRadius: 54,
      iconCreateFunction: (item: LeafletCluster) => {
        const count = item.getChildCount();
        return L.divIcon({
          className: "station-cluster-wrap",
          html: '<span class="station-cluster" role="button" aria-label="' + count + ' станцын бүлэг"><strong>' + count + '</strong><small>станц</small></span>',
          iconSize: [52, 52],
        });
      },
    });

    filteredStations.forEach((station) => {
      const active = station.id === selectedId;
      const recommended = Boolean(selectedVehicle && recommendedStationIds.has(station.id));
      const icon = L.divIcon({
        className: "charger-marker-wrap",
        html: '<span class="charger-marker' + (active ? " is-active" : "") + (recommended ? " is-recommended" : "") + '"><b>⚡</b><i aria-label="' + station.chargerCount + ' нийт цэнэглэгч">' + station.chargerCount + "</i></span>",
        iconSize: [48, 56],
        iconAnchor: [24, 53],
      });
      const marker = L.marker([station.lat, station.lng], { icon, keyboard: true, title: station.name })
        .bindTooltip(station.name, { direction: "top", offset: [0, -48] })
        .on("click", () => selectStation(station, true));
      cluster.addLayer(marker);
    });
    cluster.addTo(map);
    clusterRef.current = cluster;

    if (userLocation) {
      const userMarker = L.circleMarker([userLocation.lat, userLocation.lng], {
        radius: 8, color: "#fff", weight: 3, fillColor: "#397cff", fillOpacity: 1,
      });
      userMarker.addTo(map);
      locationLayerRef.current = userMarker;
    } else {
      locationLayerRef.current = null;
    }

    const shouldFitResults = filtersActive || Boolean(selectedVehicle);
    const signature = shouldFitResults ? filteredStations.map((station) => station.id).join(",") : "initial-central-view";
    if (shouldFitResults && signature !== fittedSignatureRef.current) {
      const visiblePoints: [number, number][] = filteredStations.map((station) => [station.lat, station.lng]);
      if (visiblePoints.length > 1) map.fitBounds(L.latLngBounds(visiblePoints), { padding: [70, 70], maxZoom: 15 });
      if (visiblePoints.length === 1) map.setView(visiblePoints[0], 15);
      fittedSignatureRef.current = signature;
    }
  }, [filteredStations, filtersActive, mapReady, recommendedStationIds, selectedId, selectedVehicle, userLocation]);

  function locateMe() {
    setLocationMessage("Байршил тогтоож байна…");
    if (!navigator.geolocation) {
      setLocationMessage("Таны төхөөрөмж байршил дэмжихгүй байна");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const point = { lat: coords.latitude, lng: coords.longitude };
        setUserLocation(point);
        const nearest = [...displayStations].sort((a, b) => distanceKm(point, a) - distanceKm(point, b))[0];
        selectStation(nearest, true);
        setLocationMessage("Хамгийн ойр станцыг сонголоо");
      },
      () => setLocationMessage("Байршлын зөвшөөрөл өгвөл ойр станцыг харуулна"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <main className={"app-shell " + (selected ? "has-selection" : "")}>
      <section className="map-stage" aria-label="Цэнэглэгчийн газрын зураг">
        <div className="map-fallback" />
        <div ref={mapElementRef} className="real-map" />

        <header className={"top-panel " + (mobileFiltersOpen ? "is-mobile-expanded" : "")}>
          <div className="brand-row" aria-label="EVmap Mongolia">
            <span className="brand-mark" aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/evmap-logo-symbol-transparent-512.png" alt="" />
            </span>
            <div className="brand-copy">
              <h1><span>EVmap</span> Mongolia</h1>
              <p className="brand-tagline">Таны машинд тохирох цэнэглэгчийг олъё</p>
            </div>
            <span className="station-count">{filteredStations.length} станц</span>
          </div>

          <label className="search-box">
            <span aria-hidden="true">⌕</span>
            <input value={query} onChange={(event) => { setQuery(event.target.value); setSelectedId(null); setDetailsOpen(false); }} aria-label="Станц хайх" placeholder="Станц, хаяг, дүүрэг хайх" />
            {query && <button type="button" onClick={() => { setQuery(""); setSelectedId(null); setDetailsOpen(false); }} aria-label="Хайлтыг арилгах">×</button>}
          </label>

          <div className="mobile-quick-actions" aria-label="Түргэн удирдлага">
            <button type="button" className={mobileFiltersOpen ? "active" : ""} onClick={() => setMobileFiltersOpen((value) => !value)}>Шүүлтүүр</button>
            <button type="button" className={selectedVehicle ? "active" : ""} onClick={() => setVehicleOpen(true)}>Машин{selectedVehicle ? " ✓" : ""}</button>
            <button type="button" onClick={() => setListOpen(true)}>Жагсаалт</button>
          </div>

          <div className="filter-row" aria-label="Цэнэглэгч шүүх">
            {(["ALL", "DC", "AC"] as CurrentFilter[]).map((filter) => (
              <button type="button" key={filter} className={currentFilter === filter ? "active" : ""} onClick={() => { setCurrentFilter(filter); setSelectedId(null); setDetailsOpen(false); }} aria-pressed={currentFilter === filter}>
                {filter === "ALL" ? "Бүгд" : filter === "DC" ? "DC хурдан" : "AC"}
              </button>
            ))}
            <label className="connector-select">
              <span className="sr-only">Портын төрөл</span>
              <select value={connector} onChange={(event) => { setConnector(event.target.value); setSelectedId(null); setDetailsOpen(false); }} aria-label="Портын төрлөөр шүүх">
                <option value="ALL">Бүх порт</option>
                {connectors.map((item) => <option value={item} key={item}>{item}</option>)}
              </select>
            </label>
          </div>

          <div className="filter-actions">
            <button className="list-button" type="button" onClick={() => setListOpen(true)}>
              <span aria-hidden="true">☷</span> Жагсаалт · {filteredStations.length}
            </button>
            {filtersActive && <button className="clear-button" type="button" onClick={clearFilters}>Шүүлтүүр цэвэрлэх</button>}
          </div>

          <div className="vehicle-tools">
            <button className="vehicle-button" type="button" onClick={() => setVehicleOpen(true)}>
              <span aria-hidden="true">◇</span>
              {selectedVehicle ? "Машинаа солих" : "Машинаа сонгох"}
            </button>
            {selectedVehicle && (
              <div className="vehicle-summary" role="status">
                <span><strong>{selectedVehicle.manufacturer} {selectedVehicle.name}</strong><small>{selectedVehicle.powertrain} · {recommendedStationIds.size} боломжит станц</small></span>
                <button type="button" onClick={clearVehicleSelection} aria-label="Машины сонголтыг арилгах">×</button>
              </div>
            )}
          </div>
        </header>

        <details className="map-legend">
          <summary>Тэмдгийн тайлбар</summary>
          <div>
            <p><span className="legend-pin">⚡</span> Цэнэглэх станц</p>
            <p><span className="legend-count">3</span> Тухайн станцын нийт цэнэглэгч</p>
            <p><span className="legend-cluster">8</span> Тухайн хэсэгт байгаа станц</p>
          </div>
        </details>

        <button className="locate-button" type="button" onClick={locateMe} aria-label="Миний байршлаас хамгийн ойр станцыг олох" title="Миний байршлаас ойр станц олох">
          <span aria-hidden="true">◎</span> Миний байршил
        </button>
        {!selected && !locationMessage && (
          <div className="selection-hint" role="status">
            <span aria-hidden="true">⚡</span>
            Газрын зураг дээрх станцыг сонгож мэдээлэл харна уу
          </div>
        )}
        {locationMessage && <div className="map-message" role="status">{locationMessage}</div>}
      </section>

      {marketingVisible && (
        <aside className="marketing-banner" role="status" aria-label="EV цэнэглэгчээ бусдад ашиглуулах шинэ боломж">
          <span className="marketing-icon" aria-hidden="true">⚡</span>
          <div>
            <small>ТУН УДАХГҮЙ</small>
            <strong>Та EV цэнэглэгчээ бусдад төлбөртэй ашиглуулах боломжтой болно</strong>
            <p>Зогсоол, гараашийн цэнэглэгчээ EVmap-д бүртгүүлж орлого олох шинэ боломж.</p>
          </div>
          <button type="button" onClick={() => setMarketingVisible(false)} aria-label="Мэдээллийг хаах">×</button>
        </aside>
      )}

      {selected && (
        <aside className={"station-sheet " + (detailsOpen ? "is-open " : "") + (sheetClosing ? "is-closing" : "")} aria-live="polite" aria-label={selected.name + " станцын мэдээлэл"}>
          <button className="sheet-handle" type="button" onClick={() => setDetailsOpen((value) => !value)} aria-label="Дэлгэрэнгүй хэсгийг нээх эсвэл хураах" aria-expanded={detailsOpen} />
          <button className="sheet-close" type="button" onClick={closeStation} aria-label="Станцын мэдээллийг хаах">×</button>

          <div className="station-heading">
            <div>
              <h2>{selected.name}</h2>
              <p className="address"><span aria-hidden="true">⌖</span> {selected.address}</p>
            </div>
            {selectedDistance !== null && <span className="distance-badge">{selectedDistance.toFixed(1)} км</span>}
          </div>

          <div className="quick-stats">
            <div><strong>{selected.chargerCount}</strong><span>нийт цэнэглэгч</span></div>
            <div><strong>{priceLabel(selected)}</strong><span>1 кВт.ц үнэ</span></div>
            <div><strong>{selected.hours}</strong><span>ажиллах цаг</span></div>
          </div>

          <div className="primary-actions">
            <a
              className="directions-button"
              href={"https://www.google.com/maps/dir/?api=1&destination=" + selected.lat + "," + selected.lng}
              target="_blank"
              rel="noreferrer"
              aria-label={selected.name + " станц руу Google Maps-аар чиглэл авах"}
            >
              <span aria-hidden="true">↗</span> Чиглэл авах
            </a>
            <button className="details-button" type="button" onClick={() => setDetailsOpen((value) => !value)} aria-expanded={detailsOpen} aria-controls="station-details">
              {detailsOpen ? "Хураах" : "Дэлгэрэнгүй"} <span aria-hidden="true">{detailsOpen ? "⌃" : "⌄"}</span>
            </button>
          </div>

          <div className="distance-summary">
            {selectedDistance !== null ? (
              <span>Танаас ойролцоогоор <strong>{selectedDistance.toFixed(2)} км</strong></span>
            ) : (
              <button type="button" onClick={locateMe}>◎ Байршлаа зөвшөөрч зай харах</button>
            )}
          </div>

          <div className="details-content" id="station-details">
            {selectedVehicle && (
              <section className={"vehicle-caution " + (selectedVehicleMatch ? "is-match" : "is-warning")} aria-label="Машины тохирлын анхааруулга">
                <strong>{selectedVehicleMatch ? "Боломжит тохироо байна" : "Тохирох оролт олдсонгүй"}</strong>
                <p>
                  {selectedVehicleMatch
                    ? `${selectedVehicle.manufacturer} ${selectedVehicle.name} (${selectedVehicle.market}) хувилбарын порт ба AC/DC төрөлтэй энэ станцын дор хаяж нэг порт таарч байна.`
                    : "Энэ станцад сонгосон хувилбарын порт болон AC/DC төрөлтэй тохирох оролт олдсонгүй. Машиныхаа оролтын төрлийг шалгаад портын төрлөөр дахин хайна уу."}
                </p>
                <small>{selectedVehicle.confidence === "verified" ? "Эх сурвалжаар баталгаажсан хувилбар" : "Урьдчилсан санал"} · {selectedVehicle.sourceNote}</small>
                {selectedVehicle.sourceUrl && <a className="vehicle-source-link" href={selectedVehicle.sourceUrl} target="_blank" rel="noreferrer">Эх сурвалж: {selectedVehicle.sourceLabel} ↗</a>}
              </section>
            )}

            <section className="reliability-card" aria-label="Мэдээллийн найдвартай байдал">
              {selected.providerParkId && selected.liveAvailable ? (
                <>
                  <strong>ChargeX-ийн портын төлөв бодит хугацаанд шинэчлэгдэнэ</strong>
                  <p>Порт бүрийн ард “Сул”, “Цэнэглэж байна” зэрэг төлөвийг харууллаа.</p>
                  <span>Сүүлд татсан: {selected.liveUpdatedAt ? new Date(selected.liveUpdatedAt).toLocaleString("mn-MN") : "Дөнгөж сая"}</span>
                </>
              ) : (
                <>
                  <strong>{selected.providerParkId ? "ChargeX-ийн бодит хугацааны мэдээлэл түр ирсэнгүй" : "Сул/завгүй төлөв бодит хугацаанд харагдахгүй"}</strong>
                  <p>{selected.providerParkId ? "Статик мэдээллийг хэвийн харуулж байна. Портын төлөвийг тодорхойгүй гэж тэмдэглэв." : "Дээрх тоо нь сул портын бус, станц дээрх нийт цэнэглэгчийн тоо."}</p>
                  <span>Мэдээлэл шинэчилсэн: {selected.updatedAt ?? (liveDegraded ? "Live холболт түр тасалдсан" : "Шинэчилсэн огноо оруулаагүй")}</span>
                </>
              )}
            </section>

            <section>
              <div className="section-title">
                <h3>Цэнэглэх портууд</h3>
                <span>{selected.ports.length} порт</span>
              </div>
              <div className="port-list">
                {selected.ports.map((port, index) => (
                  <article className="port-card" key={port.evse + "-" + port.connector + "-" + index}>
                    <ConnectorIcon connector={port.connector} current={port.current} />
                    <div className="port-copy">
                      <strong>{port.connector}</strong>
                      <span>{port.evse} · {port.current} · {port.power} кВт · {port.cable}</span>
                    </div>
                    <div className="port-price">
                      {port.statusLabel && <em className={"port-status status-" + (port.statusCode ?? "unknown")}>{port.statusLabel}</em>}
                      <strong>{money(port.price)}</strong>
                      <span>/кВт.ц</span>
                    </div>
                  </article>
                ))}
              </div>
              <details className="connector-attribution">
                <summary>Портын дүрсний эх сурвалж</summary>
                <p>
                  Дүрсүүдийг Mliu92, Wikimedia Commons-оос CC BY-SA 4.0 лицензээр ашиглав.{" "}
                  <a href={connectorArt.type1.source} target="_blank" rel="noreferrer">Type 1</a>,{" "}
                  <a href={connectorArt.ccs1.source} target="_blank" rel="noreferrer">CCS1</a>,{" "}
                  <a href={connectorArt.type2.source} target="_blank" rel="noreferrer">Type 2</a>,{" "}
                  <a href={connectorArt.ccs2.source} target="_blank" rel="noreferrer">CCS2</a>,{" "}
                  <a href={connectorArt.gbtAc.source} target="_blank" rel="noreferrer">GB/T AC</a>,{" "}
                  <a href={connectorArt.gbtDc.source} target="_blank" rel="noreferrer">GB/T DC</a>,{" "}
                  <a href={connectorArt.chademo.source} target="_blank" rel="noreferrer">CHAdeMO</a>.{" "}
                  <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">Лиценз</a>
                </p>
              </details>
            </section>

            <section className="info-grid">
              <article><span className="info-icon" aria-hidden="true">⌁</span><div><small>Оператор, байршил</small><strong>{selected.operator} · {selected.district}{selected.khoroo ? `, ${selected.khoroo}-р хороо` : ""}</strong></div></article>
              <article><span className="info-icon" aria-hidden="true">P</span><div><small>Зогсоол</small><strong>{selected.parking}</strong></div></article>
              <article><span className="info-icon" aria-hidden="true">₮</span><div><small>Төлбөр</small><strong>{selected.payment} · {selected.app}</strong></div></article>
              <article><span className="info-icon" aria-hidden="true">☏</span><div><small>Утас</small>{selected.phone ? <a href={"tel:" + selected.phone}>{selected.phone}</a> : <strong>Тодорхойгүй</strong>}</div></article>
              <article><span className="info-icon" aria-hidden="true">⌂</span><div><small>Орох тайлбар</small><strong>{selected.entrance ?? "Тусгай тайлбар оруулаагүй"}</strong></div></article>
            </section>

            <button className="report-button" type="button" onClick={() => setReportOpen(true)}>⚑ Алдаатай мэдээлэл мэдэгдэх</button>
          </div>
        </aside>
      )}

      {listOpen && (
        <div className="modal-backdrop list-backdrop">
          <div className="station-list-drawer" ref={listDialogRef} role="dialog" aria-modal="true" aria-labelledby="list-title">
            <div className="dialog-heading list-heading">
              <div>
                <p className="eyebrow">Шүүлтүүрт тохирсон</p>
                <h2 id="list-title">Станцын жагсаалт · {filteredStations.length}</h2>
              </div>
              <button className="icon-button" type="button" onClick={() => setListOpen(false)} aria-label="Жагсаалт хаах">×</button>
            </div>

            {selectedVehicle && (
              <div className="vehicle-recommendation-strip">
                <strong>{selectedVehicle.manufacturer} {selectedVehicle.name}</strong>
                <span>{recommendedStationIds.size} боломжит станцыг жагсаалтын эхэнд харуулав. Газрын зураг дээр бүх станц хэвээрээ харагдана. Тохирлыг порт + AC/DC төрлөөр шалгасан. {selectedVehicle.confidence === "verified" ? "Сонгосон хувилбар албан эх сурвалжтай." : "Энэ нь урьдчилсан санал тул машины бодит оролтыг давхар нягтална уу."}</span>
              </div>
            )}

            {filtersActive && <button className="drawer-clear-button" type="button" onClick={clearFilters}>Шүүлтүүр цэвэрлэх</button>}

            {filteredStations.length ? (
              <div className="station-list">
                {listStations.map((station) => {
                  const stationConnectors = Array.from(new Set(station.ports.map((port) => port.connector))).join(", ");
                  const distance = userLocation ? distanceKm(userLocation, station) : null;
                  return (
                    <button className="station-list-item" type="button" key={station.id} onClick={() => selectStation(station, true)}>
                      <span className="list-item-main">
                        <strong>{station.name} {selectedVehicle && recommendedStationIds.has(station.id) && <em className="match-badge">Боломжит</em>}</strong>
                        <span>{station.district} · {station.operator}</span>
                        <small>{stationConnectors}</small>
                      </span>
                      <span className="list-item-facts">
                        <strong>{priceLabel(station)}-с</strong>
                        <span>{station.chargerCount} цэнэглэгч</span>
                        {distance !== null && <small>{distance.toFixed(1)} км</small>}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">
                <span aria-hidden="true">⌕</span>
                <h3>Олдсон 0 станц</h3>
                <p>Хайлт эсвэл шүүлтүүрийн нөхцөлийг өөрчилж дахин оролдоно уу.</p>
                <button className="primary-button" type="button" onClick={clearFilters}>Шүүлтүүр цэвэрлэх</button>
              </div>
            )}
          </div>
        </div>
      )}

      {reportOpen && selected && <ReportIssueModal station={selected} dialogRef={reportDialogRef} onClose={() => setReportOpen(false)} />}
      {vehicleOpen && (
        <VehicleSelectionModal
          dialogRef={vehicleDialogRef}
          country={vehicleCountry}
          manufacturer={vehicleManufacturer}
          modelName={vehicleModelName}
          onCountryChange={(value) => { setVehicleCountry(value); setVehicleManufacturer(""); setVehicleModelName(""); }}
          onManufacturerChange={(value) => { setVehicleManufacturer(value); setVehicleModelName(""); }}
          onModelChange={setVehicleModelName}
          onApply={applyVehicleSelection}
          onClose={() => setVehicleOpen(false)}
        />
      )}
    </main>
  );
}
