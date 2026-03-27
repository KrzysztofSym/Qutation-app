import { useState, useCallback } from "react";

// ─── MACHINE RATES (from Stawki_maszyn sheet) ────────────────────────────────
const RATES = {
  atma: 170, insignia: 210, aquity: 130, tampo: 80, roland: 65,
  lam: 35, gilotyna: 55, kaszerka: 55, sztanc: 55,
  bhx: 95, homag: 85, brandt: 100, holzma: 100, wielowrzec: 70,
  ploter_a4004: 50, laser_nrg: 50,
  termo_s: 40, termo_l: 90, termo_r: 50, prasa_hyd: 55,
  festool: 35, laser_metal: 50,
};

const fmtH = (h) => {
  if (!h || isNaN(h)) return "00:00:00";
  const hrs = Math.floor(h), mins = Math.floor((h % 1) * 60), secs = Math.floor((((h % 1) * 60) % 1) * 60);
  return `${String(hrs).padStart(2,"0")}:${String(mins).padStart(2,"0")}:${String(secs).padStart(2,"0")}`;
};
const fmtPLN = (n) =>
  new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN", maximumFractionDigits: 2 }).format(n || 0);
const uid = () => Math.random().toString(36).slice(2, 9);

// ─── OPERATION DEFINITIONS ────────────────────────────────────────────────────
const OP_DEFS = [
  {
    id: "druk_sito", label: "Druk Sitowy", cat: "Druk", color: "#3b82f6",
    machines: [{ k: "atma", v: "Atma (170/h)" }, { k: "insignia", v: "Insignia (210/h)" }],
    params: [
      { id: "dl", label: "Dług. formatki [mm]", type: "num", def: 1500 },
      { id: "sz", label: "Szer. formatki [mm]", type: "num", def: 1000 },
      { id: "uz", label: "Użytków/formatce", type: "num", def: 1 },
      { id: "ko", label: "Ilość kolorów", type: "num", def: 5 },
      { id: "pr", label: "Ilość przelotów", type: "num", def: 5 },
      { id: "farba", label: "Farba", type: "sel", def: "srebrna", opts: [["srebrna", "Srebrna"], ["zwykla", "Zwykła"]] },
    ],
    calc(p, nakład, rk) {
      const rate = RATES[rk] || 170;
      const sheets = Math.ceil(nakład / Math.max(1, p.uz || 1));
      const area = ((p.dl || 1500) * (p.sz || 1000)) / 1e6;
      const oppH = sheets * (p.ko || 1) * (p.pr || 1) * ((p.dl || 1500) / 4000 / 60 + 13 / 3600);
      const setH = (p.ko || 1) * (59 + 10 / 60) / 60;
      const paintC = sheets * area * (p.ko || 1) * (p.farba === "srebrna" ? 1.2 : 0.68);
      const screenC = (p.ko || 1) * 250;
      return { opC: oppH * rate + paintC, setC: setH * rate + screenC, opH: oppH, setH };
    },
  },
  {
    id: "druk_uv", label: "Druk UV (Ploter Aquity)", cat: "Druk", color: "#8b5cf6",
    machines: [{ k: "aquity", v: "Ploter Aquity (130/h)" }],
    params: [
      { id: "dl", label: "Dług. formatki [mm]", type: "num", def: 600 },
      { id: "sz", label: "Szer. formatki [mm]", type: "num", def: 600 },
      { id: "uz", label: "Użytków/formatce", type: "num", def: 1 },
      { id: "jakt", label: "Jakość wydruku", type: "sel", def: "premium", opts: [["premium", "Wysoka / Podświetlenia (18 m²/h)"], ["standard", "Standardowa (34 m²/h)"]] },
    ],
    calc(p, nakład, rk) {
      const rate = RATES[rk] || 130;
      const sheets = Math.ceil(nakład / Math.max(1, p.uz || 1));
      const area = ((p.dl || 600) * (p.sz || 600)) / 1e6;
      const speedMph = p.jakt === "premium" ? 18.18 : 34.48;
      const oppH = (sheets * area) / speedMph + sheets * 0.008;
      const setH = 10 / 60;
      return { opC: oppH * rate, setC: setH * rate, opH: oppH, setH };
    },
  },
  {
    id: "druk_tampo", label: "Tampodruk", cat: "Druk", color: "#ec4899",
    machines: [{ k: "tampo", v: "Tampodrukarka (80/h)" }],
    params: [
      { id: "ko", label: "Ilość kolorów", type: "num", def: 1 },
      { id: "matr", label: "Ilość matryc", type: "num", def: 3 },
      { id: "elem", label: "Typ elementu", type: "sel", def: "czolka", opts: [["czolka", "Czółka/małe (3s/szt)"], ["tray", "Treje/większe (4s/szt)"]] },
    ],
    calc(p, nakład, rk) {
      const rate = RATES[rk] || 80;
      const tPerPiece = (p.elem === "czolka" ? 3 : 4) / 3600;
      const oppH = nakład * (p.ko || 1) * tPerPiece;
      const setH = (p.matr || 1) * (15 + 2 + 3 + 5 + 9) / 60;
      const inkC = nakład * (p.ko || 1) * 0.04;
      return { opC: oppH * rate + inkC, setC: setH * rate, opH: oppH, setH };
    },
  },
  {
    id: "laminowanie", label: "Laminowanie", cat: "Intro", color: "#10b981",
    machines: [{ k: "lam", v: "Laminator (35/h)" }],
    params: [
      { id: "format", label: "Wielkość formatki", type: "sel", def: "B2", opts: [["B0+", "B0+"], ["B0", "B0"], ["B1", "B1"], ["B2", "B2"], ["B3", "B3"], ["B4", "B4"]] },
      { id: "uz", label: "Użytków/formatce", type: "num", def: 1 },
      { id: "format_po", label: "Formatowanie po laminowaniu", type: "sel", def: "z", opts: [["z", "Z formatowaniem"], ["bez", "Bez formatowania"]] },
      { id: "doc_dl", label: "Dług. docinania [mm]", type: "num", def: 130 },
    ],
    calc(p, nakład, rk) {
      const rate = RATES[rk] || 35;
      const sheets = Math.ceil(nakład / Math.max(1, p.uz || 1));
      const formatWidths = { "B0+": 1800, B0: 1400, B1: 1000, B2: 700, B3: 500, B4: 350 };
      const width = formatWidths[p.format] || 700;
      const speed = width > 900 ? 1580 : 700;
      const oppH = (sheets * width) / speed / 60 + sheets * 0.002;
      const setH = 10 / 60;
      const docH = p.format_po === "z" ? sheets * 0.00037 : 0;
      const docSetH = p.format_po === "z" ? 5 / 60 : 0;
      return { opC: oppH * rate + docH * 38, setC: setH * rate + docSetH * 38, opH: oppH + docH, setH: setH + docSetH };
    },
  },
  {
    id: "sztancowanie", label: "Sztancowanie", cat: "Intro", color: "#f59e0b",
    machines: [{ k: "sztanc", v: "Sztanctygiel (55/h)" }],
    params: [
      { id: "format", label: "Wielkość formatki", type: "sel", def: "B0", opts: [["B0+", "B0+"], ["B0", "B0"], ["B1", "B1"], ["B2", "B2"], ["B3", "B3"], ["B4", "B4"]] },
      { id: "uz", label: "Użytków/formatce", type: "num", def: 1 },
      { id: "wyrywanie", label: "Wyrywanie", type: "sel", def: "TAK", opts: [["TAK", "Tak"], ["NIE", "Nie"]] },
      { id: "rodzaj", label: "Rodzaj formatki", type: "sel", def: "Błona", opts: [["Błona", "Błona"], ["inne", "Inne"]] },
      { id: "do_wyrwania", label: "Użytków do wyrwania", type: "num", def: 30 },
    ],
    calc(p, nakład, rk) {
      const rate = RATES[rk] || 55;
      const sheets = Math.ceil(nakład / Math.max(1, p.uz || 1));
      const cycleT = { "B0+": 18, B0: 15, B1: 14, B2: 12, B3: 9, B4: 8 };
      const oppH = sheets * (cycleT[p.format] || 15) / 3600;
      const setH = 30 / 60;
      let wyrH = 0, wyrSetH = 0;
      if (p.wyrywanie === "TAK") {
        const wyrRate = p.rodzaj === "Błona" ? 0.000047 : 0.000028;
        wyrH = sheets * (p.do_wyrwania || 1) * wyrRate;
        wyrSetH = 10 / 60;
      }
      return { opC: (oppH + wyrH) * rate, setC: (setH + wyrSetH) * rate, opH: oppH + wyrH, setH: setH + wyrSetH };
    },
  },
  {
    id: "gilotyna", label: "Gilotyna", cat: "Intro", color: "#ef4444",
    machines: [{ k: "gilotyna", v: "Gilotyna G1 (55/h)" }],
    params: [
      { id: "uz", label: "Użytków/formatce", type: "num", def: 10 },
      { id: "material", label: "Materiał", type: "sel", def: "inne", opts: [["kasz", "Kaszerowany (tylko przezbrojenie)"], ["inne", "Inne (tworzywo, papier)"]] },
    ],
    calc(p, nakład, rk) {
      const rate = RATES[rk] || 55;
      const sheets = Math.ceil(nakład / Math.max(1, p.uz || 1));
      const setH = Math.max(0.25, (sheets / 50) * 0.25);
      const oppH = p.material === "kasz" ? 0 : sheets * 0.002;
      return { opC: oppH * rate, setC: setH * rate, opH: oppH, setH };
    },
  },
  {
    id: "drewno_holzma", label: "Drewno – Formatyzowanie (Holzma)", cat: "Drewno", color: "#84cc16",
    machines: [{ k: "holzma", v: "Piła Holzma (100/h)" }],
    params: [
      { id: "uz", label: "Użytków/formatce", type: "num", def: 2 },
      { id: "na_ile", label: "Na ile pociąć (cięcia/formatce)", type: "num", def: 10 },
      { id: "material", label: "Materiał", type: "sel", def: "Kaszerowany", opts: [["Kaszerowany", "Kaszerowany"], ["inne", "Tworzywo / inne"]] },
    ],
    calc(p, nakład, rk) {
      const rate = RATES[rk] || 100;
      const sheets = Math.ceil(nakład / Math.max(1, p.uz || 1));
      // Simplified: setup-dominant for kaszerowany
      const setH = Math.max(0.25, (sheets / 100) * 0.25);
      const oppH = p.material === "Kaszerowany" ? 0 : sheets * (p.na_ile || 1) * 0.0003;
      return { opC: oppH * rate, setC: setH * rate, opH: oppH, setH };
    },
  },
  {
    id: "drewno_bhx", label: "Drewno – Wiercenie (BHX)", cat: "Drewno", color: "#06b6d4",
    machines: [{ k: "bhx", v: "Centrum BHX (95/h)" }, { k: "wielowrzec", v: "Wielowrzecionówka (70/h)" }],
    params: [
      { id: "uz", label: "Detali/formatce", type: "num", def: 1 },
      { id: "holes", label: "Ilość otworów", type: "num", def: 2 },
      { id: "przeloty", label: "Ilość przelotów", type: "num", def: 1 },
    ],
    calc(p, nakład, rk) {
      const rate = RATES[rk] || 95;
      const sheets = nakład / Math.max(1, p.uz || 1);
      const tPerSheet = ((p.holes || 1) * 5 + 30 + 10) / 3600;
      const oppH = sheets * tPerSheet * (p.przeloty || 1);
      const setH = 20 / 60;
      return { opC: oppH * rate, setC: setH * rate, opH: oppH, setH };
    },
  },
  {
    id: "drewno_brandt", label: "Drewno – Oklejanie (Brandt)", cat: "Drewno", color: "#a3e635",
    machines: [{ k: "brandt", v: "Okleiniarka Brandt (100/h)" }, { k: "homag", v: "Centrum Homag (85/h)" }],
    params: [
      { id: "uz", label: "Użytków/formatce", type: "num", def: 1 },
      { id: "dl_ok", label: "Dług. oklejania [mm]", type: "num", def: 8000 },
      { id: "krawedzie", label: "Ilość krawędzi", type: "num", def: 1 },
    ],
    calc(p, nakład, rk) {
      const rate = RATES[rk] || 100;
      const sheets = nakład / Math.max(1, p.uz || 1);
      const speed = rk === "homag" ? 8000 : 10000;
      const tPerSheet = ((p.dl_ok || 1) * (p.krawedzie || 1)) / speed / 60;
      const oppH = sheets * tPerSheet;
      const setH = rk === "homag" ? 12 / 60 : 20 / 60;
      return { opC: oppH * rate, setC: setH * rate, opH: oppH, setH };
    },
  },
  {
    id: "drewno_frezowanie", label: "Drewno – Frezowanie CNC (Homag)", cat: "Drewno", color: "#4ade80",
    machines: [{ k: "homag", v: "Centrum Homag (85/h)" }],
    params: [
      { id: "uz", label: "Użytków/formatce", type: "num", def: 1 },
      { id: "dl_sciezek", label: "Dług. ścieżek [mm]", type: "num", def: 1500 },
      { id: "format", label: "Wielkość formatki", type: "sel", def: "doB2", opts: [["doB2", "do B2 (5000mm/min)"], ["powyzejB2", "powyżej B2 (10000mm/min)"]] },
    ],
    calc(p, nakład, rk) {
      const rate = RATES[rk] || 85;
      const sheets = nakład / Math.max(1, p.uz || 1);
      const speed = p.format === "powyzejB2" ? 10000 : 5000;
      const oppH = sheets * ((p.dl_sciezek || 1000) / speed / 60 + 0.0025);
      const setH = 10 / 60;
      return { opC: oppH * rate, setC: setH * rate, opH: oppH, setH };
    },
  },
  {
    id: "termoformowanie", label: "Termoformowanie", cat: "Termo", color: "#f97316",
    machines: [
      { k: "termo_s", v: "Termoformierka mała – 750×1000 (40/h)" },
      { k: "termo_l", v: "Termoformierka duża – 1500×2500 (90/h)" },
      { k: "termo_r", v: "Termoformierka rolowa (50/h)" },
    ],
    params: [
      { id: "material", label: "Materiał", type: "sel", def: "VIVAK", opts: [["VIVAK", "VIVAK/PET/TUPET"], ["HIPS", "HIPS/ABS"], ["PCV", "PCV"], ["PLEXI", "PLEXI (PMMA)"]] },
      { id: "gr", label: "Grubość [mm]", type: "sel", def: "1", opts: [["0.5", "0.5 mm"], ["0.8", "0.8 mm"], ["1", "1 mm"], ["1.5", "1.5 mm"], ["2", "2 mm"], ["3", "3 mm"], ["4", "4 mm"], ["5", "5 mm"]] },
      { id: "stempel", label: "Stempel", type: "sel", def: "NIE", opts: [["NIE", "Nie"], ["TAK", "Tak"]] },
      { id: "wielkosc", label: "Wielkość wytłoczki", type: "sel", def: "do0.5m", opts: [["do0.5m", "Do 0.5m"], ["0.5-1m", "0.5–1m"], ["pow1m", "Powyżej 1m"]] },
    ],
    calc(p, nakład, rk) {
      const rate = RATES[rk] || 40;
      const cycleTimes = {
        VIVAK: { 0.5: 60, 0.8: 70, 1: 90, 1.5: 135, 2: 165, 3: 305, 4: 408, 5: 465 },
        HIPS: { 0.5: 100, 0.8: 130, 1: 150, 1.5: 135, 2: 150, 3: 195, 4: 265, 5: 405 },
        PCV: { 1.5: 210, 2: 240, 3: 275, 4: 315, 5: 405 },
        PLEXI: { 1.5: 165, 2: 180, 3: 345, 4: 408, 5: 465 },
      };
      const gr = parseFloat(p.gr) || 1;
      const matMap = cycleTimes[p.material] || cycleTimes.VIVAK;
      const avail = Object.keys(matMap).map(Number).filter((k) => !isNaN(matMap[k]));
      const closest = avail.reduce((a, b) => (Math.abs(b - gr) < Math.abs(a - gr) ? b : a), avail[0] || 1);
      const cycleS = (matMap[closest] || 90) * (p.stempel === "TAK" ? 1.15 : 1);
      const sortS = p.wielkosc === "do0.5m" ? 3 : p.wielkosc === "0.5-1m" ? 5 : 10;
      const tPer = (cycleS + 30 + sortS) / 3600;
      const oppH = nakład * tPer;
      const setH = rk === "termo_l" ? 120 / 60 : 45 / 60;
      const sawH = nakład * 29 / 3600;
      const sawSetH = 10 / 60;
      return { opC: oppH * rate + sawH * 35, setC: setH * rate + sawSetH * 35, opH: oppH + sawH, setH: setH + sawSetH };
    },
  },
  {
    id: "frezowanie_formy", label: "Frezowanie / Laser – Formy", cat: "Formy", color: "#e879f9",
    machines: [{ k: "ploter_a4004", v: "Ploter A4004 (50/h)" }, { k: "laser_nrg", v: "Laser NRG 608 (50/h)" }],
    params: [
      { id: "uz", label: "Użytków/formatce", type: "num", def: 1 },
      { id: "dl_frez", label: "Dług. frezowania [mm]", type: "num", def: 2000 },
      { id: "material", label: "Materiał", type: "sel", def: "VIVAK", opts: [["VIVAK", "VIVAK/PET (1000mm/min)"], ["PCV", "PCV (1200mm/min)"], ["HIPS", "HIPS (1600mm/min)"], ["PLEXI", "PLEXI (1000mm/min)"], ["MDF", "OSB/MDF/Wiórowa (1600mm/min)"]] },
      { id: "rodzaj_form", label: "Rodzaj form", type: "sel", def: "2D", opts: [["2D", "2D (przezbrojenie 20min)"], ["3D", "3D (przezbrojenie 30min)"]] },
    ],
    calc(p, nakład, rk) {
      const rate = RATES[rk] || 50;
      const speeds = { VIVAK: 1000, PCV: 1200, HIPS: 1600, PLEXI: 1000, MDF: 1600 };
      const speed = speeds[p.material] || 1000;
      const sheets = nakład / Math.max(1, p.uz || 1);
      const frezH = (p.dl_frez || 1000) / speed / 60;
      const loadH = 30 / 3600;
      const oppH = sheets * (frezH + loadH);
      const setH = p.rodzaj_form === "3D" ? 30 / 60 : 20 / 60;
      return { opC: oppH * rate, setC: setH * rate, opH: oppH, setH };
    },
  },
  {
    id: "metal_laser", label: "Metal – Laser", cat: "Metal", color: "#94a3b8",
    machines: [{ k: "laser_metal", v: "Laser Metal (50/h)" }],
    params: [
      { id: "material", label: "Materiał / grubość", type: "sel", def: "Stal2", opts: [["Stal0.5", "Stal 0.5mm (15 000mm/min)"], ["Stal1", "Stal 1mm (5 000mm/min)"], ["Stal1.5", "Stal 1.5mm (3 000mm/min)"], ["Stal2", "Stal 2mm (3 000mm/min)"], ["Stal3", "Stal 3mm (4 000mm/min)"], ["Nierdzewka1.5", "Nierdzewka 1.5mm (4 600mm/min)"]] },
      { id: "uz", label: "Użytków/formatce", type: "num", def: 1 },
      { id: "dl_sciezek", label: "Dług. ścieżek [mm]", type: "num", def: 2000 },
      { id: "ile_sciezek", label: "Ścieżek/formatce", type: "num", def: 15 },
    ],
    calc(p, nakład, rk) {
      const rate = RATES[rk] || 50;
      const speeds = { "Stal0.5": 15000, Stal1: 5000, "Stal1.5": 3000, Stal2: 3000, Stal3: 4000, "Nierdzewka1.5": 4600 };
      const speed = speeds[p.material] || 3000;
      const sheets = nakład / Math.max(1, p.uz || 1);
      const tCut = (p.dl_sciezek || 1000) / speed / 60;
      const tChange = (p.ile_sciezek || 1) * 0.5 / 3600;
      const tLoad = 30 / 3600;
      const oppH = sheets * (tCut + tChange + tLoad);
      const setH = 20 / 60;
      return { opC: oppH * rate, setC: setH * rate, opH: oppH, setH };
    },
  },
  {
    id: "metal_giecie", label: "Metal – Gięcie", cat: "Metal", color: "#64748b",
    machines: [{ k: "laser_metal", v: "Giętarka prasy krawędziowej" }],
    params: [
      { id: "rodzaj", label: "Rodzaj gięcia", type: "sel", def: "KĄTOWE", opts: [["KĄTOWE", "Kątowe (15s/gięcie)"], ["PROMIENIOWE", "Promieniowe (30s/gięcie)"]] },
      { id: "giecia", label: "Ilość gięć", type: "num", def: 4 },
    ],
    calc(p, nakład) {
      const rate = 60;
      const tPerBend = (p.rodzaj === "KĄTOWE" ? 15 : 30) / 3600;
      const tLoad = 30 / 3600;
      const oppH = nakład * ((p.giecia || 1) * tPerBend + tLoad);
      const setH = 40 / 60;
      return { opC: oppH * rate, setC: setH * rate, opH: oppH, setH };
    },
  },
  {
    id: "metal_spawanie", label: "Metal – Spawanie", cat: "Metal", color: "#b45309",
    machines: [{ k: "laser_metal", v: "Spawalnia" }],
    params: [
      { id: "el_w_module", label: "Elementów w module", type: "num", def: 2 },
      { id: "spawy_punkt", label: "Spawów punktowych", type: "num", def: 8 },
      { id: "dl_spawow", label: "Łączna dług. spawów [mm]", type: "num", def: 0 },
    ],
    calc(p, nakład) {
      const rate = 65;
      const tEl = (p.el_w_module || 1) * 30 / 3600;
      const tSpot = (p.spawy_punkt || 0) * 12 / 3600;
      const tWeld = (p.dl_spawow || 0) / 100 * 20 / 3600;
      const oppH = nakład * (tEl + tSpot + tWeld);
      const setH = 10 / 60;
      const szlifH = nakład * 66 / 3600;
      return { opC: (oppH + szlifH) * rate, setC: setH * rate, opH: oppH + szlifH, setH };
    },
  },
  {
    id: "lakiernia", label: "Lakiernia Proszkowa", cat: "Metal", color: "#0891b2",
    machines: [{ k: "lakiernia", v: "Lakiernia (21 PLN/m²)" }],
    params: [
      { id: "powierzchnia", label: "Pow. elementu [m²]", type: "num", def: 0.5 },
    ],
    calc(p, nakład) {
      const area = (p.powierzchnia || 0) * nakład;
      const oppH = area / 33;
      return { opC: area * 21, setC: 0, opH: oppH, setH: 0 };
    },
  },
  {
    id: "manual", label: "Inna operacja (ręczna)", cat: "Inne", color: "#475569",
    machines: [{ k: "manual", v: "Własna stawka" }],
    params: [
      { id: "opis", label: "Opis operacji", type: "text", def: "" },
      { id: "op_h", label: "Czas operacji [h]", type: "num", def: 1 },
      { id: "set_h", label: "Czas przezbrojenia [h]", type: "num", def: 0.25 },
      { id: "rate", label: "Stawka [PLN/h]", type: "num", def: 60 },
    ],
    calc(p) {
      const rate = p.rate || 60;
      return { opC: (p.op_h || 0) * rate, setC: (p.set_h || 0) * rate, opH: p.op_h || 0, setH: p.set_h || 0 };
    },
  },
];

const CATEGORIES = [...new Set(OP_DEFS.map((o) => o.cat))];
const BY_CAT = CATEGORIES.reduce((acc, cat) => { acc[cat] = OP_DEFS.filter((o) => o.cat === cat); return acc; }, {});

// ─── STYLES ─────────────────────────────────────────────────────────
const S = {
  root: { fontFamily: "'Segoe UI', system-ui, sans-serif", background: "#0d0f17", minHeight: "100vh", color: "#e2e8f0", fontSize: "13px" },
  header: { background: "#141620", borderBottom: "1px solid #1e2235", padding: "10px 20px", display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" },
  logo: { fontFamily: "'Courier New', monospace", fontSize: "17px", fontWeight: "bold", color: "#f59e0b", letterSpacing: "2px", whiteSpace: "nowrap", marginRight: "4px" },
  fieldGroup: { display: "flex", flexDirection: "column", gap: "2px" },
  fieldLabel: { fontSize: "9px", color: "#4b5563", textTransform: "uppercase", letterSpacing: "1.2px" },
  input: { background: "#0d0f17", border: "1px solid #1e2235", color: "#e2e8f0", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", outline: "none", fontFamily: "inherit" },
  nakładInput: { background: "#0d0f17", border: "1px solid #f59e0b66", color: "#f59e0b", padding: "4px 8px", borderRadius: "4px", fontSize: "13px", outline: "none", fontFamily: "'Courier New', monospace", fontWeight: "bold", width: "80px" },
  main: { display: "grid", gridTemplateColumns: "1fr 300px", height: "calc(100vh - 57px)" },
  leftPane: { overflowY: "auto", padding: "14px", display: "flex", flexDirection: "column", gap: "10px" },
  rightPane: { background: "#141620", borderLeft: "1px solid #1e2235", padding: "16px", display: "flex", flexDirection: "column", gap: "14px", overflowY: "auto" },
  addBtn: { background: "transparent", border: "2px dashed #f59e0b44", color: "#f59e0b88", padding: "10px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "all 0.2s" },
  addPanel: { background: "#141620", border: "1px solid #1e2235", borderRadius: "8px", padding: "14px" },
  catLabel: { fontSize: "9px", color: "#4b5563", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "5px", paddingLeft: "2px" },
  opTypeGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))", gap: "5px" },
  opTypeBtn: { background: "#0d0f17", border: "1px solid #1e223500", color: "#cbd5e1", padding: "7px 10px", borderRadius: "5px", cursor: "pointer", fontSize: "11px", textAlign: "left", transition: "all 0.15s", borderWidth: "1px", borderStyle: "solid" },
  card: { background: "#141620", borderRadius: "8px", overflow: "hidden" },
  cardHead: { padding: "10px 14px", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" },
  cardParams: { padding: "12px 14px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(185px, 1fr))", gap: "8px", borderTop: "1px solid #1e223566" },
  paramField: { display: "flex", flexDirection: "column", gap: "3px" },
  paramLabel: { fontSize: "9px", color: "#4b5563", textTransform: "uppercase", letterSpacing: "0.8px" },
  paramInput: { background: "#0d0f17", border: "1px solid #1e2235", color: "#e2e8f0", padding: "4px 7px", borderRadius: "4px", fontSize: "11px", outline: "none", boxSizing: "border-box", width: "100%", fontFamily: "'Courier New', monospace" },
  paramSelect: { background: "#0d0f17", border: "1px solid #1e2235", color: "#e2e8f0", padding: "4px 7px", borderRadius: "4px", fontSize: "11px", outline: "none", width: "100%", fontFamily: "inherit" },
  breakdown: { gridColumn: "1/-1", background: "#0d0f17", borderRadius: "6px", padding: "8px 10px", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "8px" },
  bdLabel: { fontSize: "8px", color: "#4b5563", marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.5px" },
  bdVal: { fontFamily: "'Courier New', monospace", fontSize: "12px", fontWeight: "bold", color: "#e2e8f0" },
  sectionLabel: { fontSize: "9px", color: "#4b5563", textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: "6px" },
  summaryRow: { display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "6px" },
  summaryKey: { fontSize: "11px", color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  summaryVal: { fontFamily: "'Courier New', monospace", fontSize: "12px", fontWeight: "bold", whiteSpace: "nowrap" },
  totalBox: { background: "#0d0f17", borderRadius: "8px", padding: "12px", display: "flex", flexDirection: "column", gap: "9px" },
  pieceBox: { background: "#f59e0b0d", border: "1px solid #f59e0b22", borderRadius: "8px", padding: "12px" },
};

// ─── COMPONENT ───────────────────────────────────────────────────────
export default function QuotationApp() {
  const today = new Date().toISOString().slice(0, 10);
  const [jobInfo, setJobInfo] = useState({ client: "", name: "", nr: "", date: today, nakład: 100 });
  const [ops, setOps] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [margin, setMargin] = useState(20);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [expandedOp, setExpandedOp] = useState(null);

  const recalcOp = useCallback((opDef, params, nakład, machine) => {
    try { return opDef.calc(params, nakład, machine); }
    catch { return { opC: 0, setC: 0, opH: 0, setH: 0 }; }
  }, []);

  const addOp = useCallback((def) => {
    const params = def.params.reduce((acc, p) => { acc[p.id] = p.def; return acc; }, {});
    const machine = def.machines[0].k;
    const res = recalcOp(def, params, jobInfo.nakład, machine);
    setOps((prev) => [...prev, { id: uid(), defId: def.id, machine, params, ...res }]);
    setShowAddPanel(false);
  }, [jobInfo.nakład, recalcOp]);

  const updateOp = useCallback((id, key, value) => {
    setOps((prev) => prev.map((op) => {
      if (op.id !== id) return op;
      const def = OP_DEFS.find((d) => d.id === op.defId);
      let newParams = op.params, newMachine = op.machine;
      if (key === "machine") { newMachine = value; }
      else if (key.startsWith("p_")) { newParams = { ...op.params, [key.slice(2)]: value }; }
      const res = recalcOp(def, newParams, jobInfo.nakład, newMachine);
      return { ...op, machine: newMachine, params: newParams, ...res };
    }));
  }, [jobInfo.nakład, recalcOp]);

  const removeOp = (id) => setOps((prev) => prev.filter((o) => o.id !== id));

  const setNakład = (val) => {
    const n = parseInt(val) || 1;
    setJobInfo((prev) => ({ ...prev, nakład: n }));
    setOps((prev) => prev.map((op) => {
      const def = OP_DEFS.find((d) => d.id === op.defId);
      return { ...op, ...recalcOp(def, op.params, n, op.machine) };
    }));
  };

  const updateMat = (i, field, value) => {
    setMaterials((prev) => prev.map((m, mi) => {
      if (mi !== i) return m;
      const updated = { ...m, [field]: value };
      updated.cost = (parseFloat(field === "qty" ? value : updated.qty) || 0) * (parseFloat(field === "unitCost" ? value : updated.unitCost) || 0);
      return updated;
    }));
  };

  const opTotal = ops.reduce((s, o) => s + (o.opC || 0) + (o.setC || 0), 0);
  const matTotal = materials.reduce((s, m) => s + (m.cost || 0), 0);
  const subtotal = opTotal + matTotal;
  const marginAmt = subtotal * margin / 100;
  const totalNet = subtotal + marginAmt;
  const vat = totalNet * 0.23;
  const totalBrutto = totalNet + vat;
  const totalH = ops.reduce((s, o) => s + (o.opH || 0) + (o.setH || 0), 0);

  return (
    <div style={S.root}>
      {/* HEADER */}
      <div style={S.header}>
        <div style={S.logo}>⬡ WYCENA</div>
        {[
          { k: "nr", l: "Nr wyceny", w: "100px" },
          { k: "client", l: "Klient", w: "140px" },
          { k: "name", l: "Nazwa wyrobu / zlecenia", w: "200px" },
          { k: "date", l: "Data", w: "130px", t: "date" },
        ].map((f) => (
          <div key={f.k} style={S.fieldGroup}>
            <label style={S.fieldLabel}>{f.l}</label>
            <input type={f.t || "text"} value={jobInfo[f.k]} onChange={(e) => setJobInfo((p) => ({ ...p, [f.k]: e.target.value }))}
              style={{ ...S.input, width: f.w }} />
          </div>
        ))}
        <div style={S.fieldGroup}>
          <label style={S.fieldLabel}>Nakład (szt)</label>
          <input type="number" min={1} value={jobInfo.nakład} onChange={(e) => setNakład(e.target.value)} style={S.nakładInput} />
        </div>
      </div>

      {/* MAIN GRID */}
      <div style={S.main}>
        {/* LEFT PANE */}
        <div style={S.leftPane}>
          {/* Add Operation */}
          {!showAddPanel ? (
            <button style={S.addBtn}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = "#f59e0b88"; e.currentTarget.style.color = "#f59e0b"; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = "#f59e0b44"; e.currentTarget.style.color = "#f59e0b88"; }}
              onClick={() => setShowAddPanel(true)}>
              <span style={{ fontSize: "18px", lineHeight: 1 }}>+</span> Dodaj operację
            </button>
          ) : (
            <div style={S.addPanel}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ fontWeight: "600", color: "#f59e0b" }}>Wybierz operację</span>
                <button onClick={() => setShowAddPanel(false)} style={{ background: "none", border: "none", color: "#4b5563", cursor: "pointer", fontSize: "20px", lineHeight: 1 }}>×</button>
              </div>
              {CATEGORIES.map((cat) => (
                <div key={cat} style={{ marginBottom: "10px" }}>
                  <div style={S.catLabel}>{cat}</div>
                  <div style={S.opTypeGrid}>
                    {BY_CAT[cat].map((def) => (
                      <button key={def.id} style={{ ...S.opTypeBtn, borderColor: def.color + "30" }}
                        onMouseOver={(e) => { e.currentTarget.style.background = def.color + "18"; e.currentTarget.style.borderColor = def.color; e.currentTarget.style.color = "#fff"; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = "#0d0f17"; e.currentTarget.style.borderColor = def.color + "30"; e.currentTarget.style.color = "#cbd5e1"; }}
                        onClick={() => addOp(def)}>
                        <span style={{ display: "block", width: "8px", height: "8px", borderRadius: "50%", background: def.color, display: "inline-block", marginRight: "6px", verticalAlign: "middle" }} />
                        {def.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* OPERATION CARDS */}
          {ops.map((op) => {
            const def = OP_DEFS.find((d) => d.id === op.defId);
            const isOpen = expandedOp === op.id;
            const total = (op.opC || 0) + (op.setC || 0);
            return (
              <div key={op.id} style={{ ...S.card, border: `1px solid ${def.color}30` }}>
                <div style={{ ...S.cardHead, borderBottom: isOpen ? `1px solid ${def.color}20` : "none" }}
                  onClick={() => setExpandedOp(isOpen ? null : op.id)}>
                  <div style={{ width: "3px", height: "32px", background: def.color, borderRadius: "2px", flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: "600", fontSize: "12px", marginBottom: "2px" }}>{def.label}</div>
                    <div style={{ fontSize: "10px", color: "#4b5563" }}>
                      {def.machines.find((m) => m.k === op.machine)?.v} &middot; {fmtH((op.opH || 0) + (op.setH || 0))}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", marginRight: "6px" }}>
                    <div style={{ fontFamily: "'Courier New', monospace", fontSize: "14px", fontWeight: "bold", color: def.color }}>{fmtPLN(total)}</div>
                    <div style={{ fontSize: "9px", color: "#4b5563" }}>op:{fmtPLN(op.opC)} prz:{fmtPLN(op.setC)}</div>
                  </div>
                  <span style={{ color: "#4b5563", fontSize: "12px" }}>{isOpen ? "▲" : "▼"}</span>
                  <button onClick={(e) => { e.stopPropagation(); removeOp(op.id); }}
                    style={{ background: "none", border: "none", color: "#ef444866", cursor: "pointer", fontSize: "18px", lineHeight: 1, padding: "0 2px" }}>×</button>
                </div>

                {isOpen && (
                  <div style={S.cardParams}>
                    {/* Machine selector */}
                    {def.machines.length > 1 && (
                      <div style={S.paramField}>
                        <label style={S.paramLabel}>Maszyna</label>
                        <select value={op.machine} onChange={(e) => updateOp(op.id, "machine", e.target.value)} style={S.paramSelect}>
                          {def.machines.map((m) => <option key={m.k} value={m.k}>{m.v}</option>)}
                        </select>
                      </div>
                    )}
                    {def.params.map((param) => (
                      <div key={param.id} style={S.paramField}>
                        <label style={S.paramLabel}>{param.label}</label>
                        {param.type === "sel" ? (
                          <select value={op.params[param.id] ?? param.def} onChange={(e) => updateOp(op.id, `p_${param.id}`, e.target.value)} style={S.paramSelect}>
                            {param.opts.map((o) => <option key={o[0]} value={o[0]}>{o[1]}</option>)}
                          </select>
                        ) : param.type === "text" ? (
                          <input type="text" value={op.params[param.id] ?? param.def} onChange={(e) => updateOp(op.id, `p_${param.id}`, e.target.value)}
                            style={{ ...S.paramInput, fontFamily: "inherit" }} />
                        ) : (
                          <input type="number" value={op.params[param.id] ?? param.def} onChange={(e) => updateOp(op.id, `p_${param.id}`, parseFloat(e.target.value) || 0)}
                            style={S.paramInput} />
                        )}
                      </div>
                    ))}
                    <div style={S.breakdown}>
                      {[["Czas operacji", fmtH(op.opH || 0)], ["Czas przezbrojenia", fmtH(op.setH || 0)], ["Koszt operacji", fmtPLN(op.opC)], ["Koszt przezbrojenia", fmtPLN(op.setC)]].map(([l, v]) => (
                        <div key={l}><div style={S.bdLabel}>{l}</div><div style={S.bdVal}>{v}</div></div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* MATERIALS */}
          <div style={{ marginTop: "4px" }}>
            <div style={{ ...S.catLabel, marginBottom: "8px" }}>Materiały zakupowe</div>
            {materials.map((m, i) => (
              <div key={m.id} style={{ display: "flex", gap: "6px", marginBottom: "5px", alignItems: "center" }}>
                <input type="text" placeholder="Indeks / Nazwa materiału" value={m.name} onChange={(e) => updateMat(i, "name", e.target.value)}
                  style={{ ...S.input, flex: 2 }} />
                <input type="number" placeholder="Ilość" value={m.qty} onChange={(e) => updateMat(i, "qty", e.target.value)}
                  style={{ ...S.input, width: "60px", fontFamily: "'Courier New', monospace" }} />
                <input type="number" placeholder="Cena jdn." value={m.unitCost} onChange={(e) => updateMat(i, "unitCost", e.target.value)}
                  style={{ ...S.input, width: "80px", fontFamily: "'Courier New', monospace" }} />
                <div style={{ fontFamily: "'Courier New', monospace", fontSize: "11px", color: "#f59e0b", width: "80px", textAlign: "right" }}>{fmtPLN(m.cost)}</div>
                <button onClick={() => setMaterials((p) => p.filter((_, xi) => xi !== i))}
                  style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "16px" }}>×</button>
              </div>
            ))}
            <button onClick={() => setMaterials((p) => [...p, { id: uid(), name: "", qty: 1, unitCost: "", cost: 0 }])}
              style={{ background: "transparent", border: "1px dashed #1e2235", color: "#4b5563", padding: "5px 12px", borderRadius: "4px", cursor: "pointer", fontSize: "11px" }}>
              + Dodaj materiał
            </button>
          </div>
        </div>

        {/* RIGHT PANE */}
        <div style={S.rightPane}>
          <div style={{ fontFamily: "'Courier New', monospace", fontSize: "10px", color: "#4b5563", letterSpacing: "2px", textTransform: "uppercase", borderBottom: "1px solid #1e2235", paddingBottom: "10px" }}>
            PODSUMOWANIE WYCENY
          </div>

          {/* Job header */}
          {(jobInfo.client || jobInfo.name) && (
            <div style={{ fontSize: "11px", color: "#94a3b8" }}>
              {jobInfo.client && <div style={{ fontWeight: "600", color: "#e2e8f0" }}>{jobInfo.client}</div>}
              {jobInfo.name && <div>{jobInfo.name}</div>}
              <div style={{ color: "#4b5563" }}>{jobInfo.date} · Nakład: <span style={{ color: "#f59e0b", fontFamily: "'Courier New', monospace", fontWeight: "bold" }}>{jobInfo.nakład} szt</span></div>
            </div>
          )}

          {/* Operations breakdown */}
          {ops.length > 0 && (
            <div>
              <div style={S.sectionLabel}>Operacje</div>
              {ops.map((op) => {
                const def = OP_DEFS.find((d) => d.id === op.defId);
                return (
                  <div key={op.id} style={{ ...S.summaryRow, marginBottom: "4px" }}>
                    <div style={{ ...S.summaryKey, display: "flex", alignItems: "center", gap: "5px" }}>
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: def.color, flexShrink: 0, display: "inline-block" }} />
                      {def.label}
                    </div>
                    <div style={S.summaryVal}>{fmtPLN((op.opC || 0) + (op.setC || 0))}</div>
                  </div>
                );
              })}
              <div style={{ ...S.summaryRow, borderTop: "1px solid #1e2235", paddingTop: "6px", marginTop: "5px" }}>
                <span style={{ ...S.summaryKey, color: "#94a3b8" }}>Razem operacje</span>
                <span style={{ ...S.summaryVal, color: "#e2e8f0" }}>{fmtPLN(opTotal)}</span>
              </div>
            </div>
          )}

          {/* Materials breakdown */}
          {materials.length > 0 && (
            <div>
              <div style={S.sectionLabel}>Materiały</div>
              {materials.map((m, i) => (
                <div key={m.id} style={{ ...S.summaryRow, marginBottom: "4px" }}>
                  <span style={S.summaryKey}>{m.name || "(bez nazwy)"}</span>
                  <span style={S.summaryVal}>{fmtPLN(m.cost)}</span>
                </div>
              ))}
              <div style={{ ...S.summaryRow, borderTop: "1px solid #1e2235", paddingTop: "6px", marginTop: "5px" }}>
                <span style={{ ...S.summaryKey, color: "#94a3b8" }}>Razem materiały</span>
                <span style={{ ...S.summaryVal, color: "#e2e8f0" }}>{fmtPLN(matTotal)}</span>
              </div>
            </div>
          )}

          {/* Total Box */}
          <div style={S.totalBox}>
            <div style={S.summaryRow}>
              <span style={{ fontSize: "11px", color: "#64748b" }}>Koszt produkcji</span>
              <span style={{ ...S.summaryVal, fontSize: "12px" }}>{fmtPLN(subtotal)}</span>
            </div>
            <div style={S.summaryRow}>
              <span style={{ fontSize: "11px", color: "#64748b" }}>Marża</span>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <input type="number" value={margin} min={0} max={500} onChange={(e) => setMargin(parseFloat(e.target.value) || 0)}
                  style={{ width: "46px", background: "#141620", border: "1px solid #f59e0b55", color: "#f59e0b", padding: "2px 5px", borderRadius: "3px", fontSize: "11px", outline: "none", textAlign: "right", fontFamily: "'Courier New', monospace" }} />
                <span style={{ color: "#f59e0b", fontSize: "11px" }}>%</span>
                <span style={{ ...S.summaryVal, fontSize: "11px" }}>{fmtPLN(marginAmt)}</span>
              </div>
            </div>
            <div style={{ borderTop: "1px solid #1e2235", paddingTop: "8px" }}>
              <div style={S.summaryRow}>
                <span style={{ fontSize: "12px", fontWeight: "600" }}>Cena netto</span>
                <span style={{ fontFamily: "'Courier New', monospace", fontSize: "16px", fontWeight: "bold", color: "#f59e0b" }}>{fmtPLN(totalNet)}</span>
              </div>
            </div>
            <div style={S.summaryRow}>
              <span style={{ fontSize: "10px", color: "#4b5563" }}>VAT 23%</span>
              <span style={{ fontFamily: "'Courier New', monospace", fontSize: "11px", color: "#4b5563" }}>{fmtPLN(vat)}</span>
            </div>
            <div style={S.summaryRow}>
              <span style={{ fontSize: "12px", fontWeight: "600" }}>Cena brutto</span>
              <span style={{ fontFamily: "'Courier New', monospace", fontSize: "15px", fontWeight: "bold", color: "#10b981" }}>{fmtPLN(totalBrutto)}</span>
            </div>
          </div>

          {/* Per piece */}
          {jobInfo.nakład > 0 && subtotal > 0 && (
            <div style={S.pieceBox}>
              <div style={{ fontSize: "9px", color: "#f59e0b", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "7px" }}>Cena za sztukę</div>
              {[["Koszt prod./szt.", subtotal / jobInfo.nakład], ["Cena netto/szt.", totalNet / jobInfo.nakład], ["Cena brutto/szt.", totalBrutto / jobInfo.nakład]].map(([l, v]) => (
                <div key={l} style={{ ...S.summaryRow, marginBottom: "4px" }}>
                  <span style={{ fontSize: "10px", color: "#94a3b8" }}>{l}</span>
                  <span style={{ fontFamily: "'Courier New', monospace", fontSize: "11px", fontWeight: "bold" }}>{fmtPLN(v)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Time summary */}
          {ops.length > 0 && (
            <div style={{ borderTop: "1px solid #1e2235", paddingTop: "12px" }}>
              <div style={S.sectionLabel}>Czas łączny</div>
              {[
                ["Operacje", fmtH(ops.reduce((s, o) => s + (o.opH || 0), 0))],
                ["Przezbrojenia", fmtH(ops.reduce((s, o) => s + (o.setH || 0), 0))],
                ["Razem", fmtH(totalH)],
              ].map(([l, v]) => (
                <div key={l} style={{ ...S.summaryRow, marginBottom: "4px" }}>
                  <span style={{ fontSize: "10px", color: "#64748b" }}>{l}</span>
                  <span style={{ fontFamily: "'Courier New', monospace", fontSize: "11px" }}>{v}</span>
                </div>
              ))}
            </div>
          )}

          {/* Print */}
          <button onClick={() => window.print()}
            style={{ marginTop: "auto", background: "#f59e0b", color: "#0d0f17", padding: "9px 16px", borderRadius: "5px", border: "none", cursor: "pointer", fontWeight: "700", fontSize: "11px", letterSpacing: "1px", textTransform: "uppercase" }}>
            Drukuj / Eksportuj
          </button>
        </div>
      </div>
    </div>
  );
}
