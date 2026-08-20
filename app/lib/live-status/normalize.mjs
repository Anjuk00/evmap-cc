const STATUS_LABELS = {
  Available: "Сул",
  Charging: "Цэнэглэж байна",
  Finishing: "Дуусгаж байна",
  Preparing: "Бэлтгэж байна",
  Offline: "Ажиллахгүй",
  Faulted: "Гэмтэлтэй",
  Unavailable: "Боломжгүй",
  SuspendedEV: "Түр зогссон",
  SuspendedEVSE: "Түр зогссон",
};

export function normalizeChargeXStatus(status, busy = false) {
  if (busy) return { code: "charging", label: STATUS_LABELS.Charging };
  const value = typeof status === "string" ? status : "";
  const code = {
    Available: "available",
    Charging: "charging",
    Finishing: "finishing",
    Preparing: "preparing",
    Offline: "offline",
    Faulted: "offline",
    Unavailable: "offline",
    SuspendedEV: "offline",
    SuspendedEVSE: "offline",
  }[value] ?? "unknown";
  return { code, label: STATUS_LABELS[value] ?? "Төлөв тодорхойгүй" };
}

function isActiveBusyRow(row) {
  if (!row?.connector_id || !row?.started_at) return false;
  const startedAt = Date.parse(row.started_at);
  const total = Number(row.total_minutes);
  const elapsed = Number(row.elapsed_minutes);
  const remaining = Number(row.remaining_minutes);
  return Number.isFinite(startedAt)
    && Number.isFinite(total)
    && Number.isFinite(elapsed)
    && Number.isFinite(remaining)
    && total > 0
    && remaining > 0
    && elapsed >= 0
    && elapsed < total;
}

export function normalizeChargeXData(parksPayload, busyPayload) {
  const parks = Array.isArray(parksPayload?.data) ? parksPayload.data : [];
  const busyRows = Array.isArray(busyPayload?.data) ? busyPayload.data : [];
  // ChargeX /busy currently includes queued reservations and expired sessions.
  // Only a started session with remaining time is safe to present as charging.
  const busyIds = new Set(busyRows.filter(isActiveBusyRow).map((row) => row.connector_id));

  return parks
    .map((park) => {
      const stations = Array.isArray(park?.stations) ? park.stations : [];
      const connectors = stations.flatMap((station) => {
        const rows = Array.isArray(station?.connectors) ? station.connectors : [];
        return rows.map((connector) => ({
          id: String(connector?.id ?? ""),
          stationId: String(station?.id ?? ""),
          stationName: String(station?.name ?? ""),
          connector: String(connector?.connector_type ?? "Тодорхойгүй"),
          current: String(connector?.current_type ?? "").toUpperCase() === "AC" ? "AC" : "DC",
          power: Number(connector?.power_kw) || 0,
          price: Number(connector?.kw_price) || 0,
          ...normalizeChargeXStatus(
            connector?.status,
            busyIds.has(connector?.id) && !["Faulted", "Offline", "Unavailable"].includes(connector?.status),
          ),
        }));
      });

      return {
        provider: "chargex",
        parkId: String(park?.id ?? ""),
        name: String(park?.name ?? "ChargeX"),
        address: String(park?.location_text ?? ""),
        phone: String(park?.contact_phonenumber ?? ""),
        lat: Number(park?.geo_lat),
        lng: Number(park?.geo_lng),
        connectors,
      };
    })
    .filter((park) => park.parkId && Number.isFinite(park.lat) && Number.isFinite(park.lng));
}
