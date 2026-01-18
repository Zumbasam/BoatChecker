# Teknisk Plan: Fikse "Låste sjekkpunkter markeres som OK"

**Opprettet:** 2026-01-18  
**Status:** Planlegging  
**Prioritet:** KRITISK - Påvirker faglig integritet  

---

## 1. Problemet (Executive Summary)

### 1.1 Kjernefeilen
Når en gratisbruker navigerer gjennom sjekklisten, auto-lagres **låste sjekkpunkter** som `state: 'ok'`, selv om de aldri er vurdert. Dette gir **falsk trygghet** i rapporten.

### 1.2 Hvor feilen oppstår
**Fil:** `src/components/ChecklistStepper.tsx`  
**Linjer:** 173-184

```typescript
// PROBLEMATISK KODE:
const handleNextClick = async () => {
  // ...
  const currentItem = checklistItems[activeStep];
  if (currentItem) {
    const existingItem = await db.items.get(currentItem.id);
    if (!existingItem) {
      // ❌ Auto-lagrer ALLE items som 'ok', inkludert låste!
      await db.items.put({
        id: currentItem.id,
        state: 'ok',  // <-- PROBLEMET
      });
    }
  }
  // ...
};
```

### 1.3 Konsekvens
- Rapporten viser at punkter er "OK" selv om de **aldri er sjekket**
- Underminer produktets troverdighet og faglige integritet
- Kan føre til at kjøpere tar beslutninger basert på ufullstendig informasjon

---

## 2. Løsningsoversikt

### 2.1 Ny state: `not_assessed`
Introduser en ny tilstand for sjekkpunkter som ikke er vurdert:

| State | Beskrivelse | Vises i rapport |
|-------|-------------|-----------------|
| `ok` | Vurdert og funnet i orden | Nei (kun funn vises) |
| `obs` | Observasjon/merknad | Ja, i hovedtabell |
| `kritisk` | Kritisk funn | Ja, i hovedtabell |
| `not_assessed` | **Ikke vurdert** | Ja, egen seksjon |

### 2.2 Logikk for auto-lagring
- **Åpne punkter:** Auto-lagres som `ok` når "Neste" trykkes (dagens oppførsel)
- **Låste punkter:** Auto-lagres som `not_assessed` når "Neste" trykkes

---

## 3. Detaljert Implementasjonsplan

### Fase 1: Datamodell (db.ts)

**Fil:** `src/db.ts`

```typescript
// Linje 35 - ENDRE FRA:
state: 'ok' | 'obs' | 'kritisk';

// TIL:
state: 'ok' | 'obs' | 'kritisk' | 'not_assessed';
```

**Ingen databasemigrering nødvendig** - Dexie håndterer nye string-verdier i eksisterende kolonner.

---

### Fase 2: Type-definisjoner (useChecklistData.ts)

**Fil:** `src/hooks/useChecklistData.ts`

```typescript
// Linje 30 - ENDRE FRA:
export type Row = {
  // ...
  state: "ok" | "obs" | "kritisk";
  // ...
};

// TIL:
export type Row = {
  // ...
  state: "ok" | "obs" | "kritisk" | "not_assessed";
  // ...
};
```

**Også oppdater sorteringslogikk (linje 146):**
```typescript
const stateOrder = { 
  'kritisk': 1, 
  'obs': 2, 
  'ok': 3,
  'not_assessed': 4  // Sist i sortering
} as const;
```

---

### Fase 3: Auto-lagring (ChecklistStepper.tsx)

**Fil:** `src/components/ChecklistStepper.tsx`

**Endre `handleNextClick` (linje 163-191):**

```typescript
const handleNextClick = async () => {
  if (activeStep === checklistItems.length - 1 && isFinishLocked) {
    toast({
      title: t('checklist.toast_report_limit_title'),
      description: t('checklist.toast_report_limit_desc'),
      status: 'warning',
      duration: 5000,
      isClosable: true,
    });
  } else {
    const currentItem = checklistItems[activeStep];
    if (currentItem) {
      const existingItem = await db.items.get(currentItem.id);
      if (!existingItem) {
        // NYTT: Sjekk om punktet er låst
        const isLocked = !isPro && (currentItem.criticality ?? 0) > 1;
        
        await db.items.put({
          id: currentItem.id,
          state: isLocked ? 'not_assessed' : 'ok',  // ✅ RIKTIG LOGIKK
        });
      }
    }

    if (activeStep === checklistItems.length - 1 && inspectionId) {
      await db.inspections.update(inspectionId, { status: 'completed' });
    }
    setActiveStep(s => s + 1);
  }
};
```

**NB:** `isPro` er allerede tilgjengelig i komponenten (linje 37).

---

### Fase 4: Rapport (Report.tsx)

**Fil:** `src/components/Report.tsx`

**4.1 Oppdater Props interface (legg til):**
```typescript
type Props = {
  rows: Row[];
  notAssessedRows?: Row[];  // NYT: Ikke-vurderte punkter
  // ... eksisterende props
  t_not_assessed?: {
    section_title: string;
    explanation: string;
  };
};
```

**4.2 Legg til ny seksjon etter hovedtabellen (før disclaimer-siden):**
```typescript
{/* Ikke vurderte punkter - ny seksjon */}
{notAssessedRows && notAssessedRows.length > 0 && (
  <View style={{ marginTop: 16 }}>
    <Text style={styles.subTitle}>
      {t_not_assessed?.section_title || 'Ikke vurderte punkter'}
    </Text>
    <View style={styles.box}>
      <Text style={{ marginBottom: 8, fontStyle: 'italic', color: '#4A5568' }}>
        {t_not_assessed?.explanation || 
          'Følgende punkter er ikke vurdert i denne inspeksjonen og inngår ikke i konklusjonen.'}
      </Text>
      {notAssessedRows.map(r => (
        <Text key={r.id} style={{ marginBottom: 2 }}>• {r.label}</Text>
      ))}
    </View>
  </View>
)}
```

---

### Fase 5: SummaryView oppdatering

**Fil:** `src/components/summary/SummaryView.tsx`

**5.1 Filtrer ut not_assessed fra hovedvisning:**
```typescript
// I handleStreamPdf (linje 60):
// ENDRE FRA:
const reportRows = rows.filter(r => r.state !== 'ok');

// TIL:
const reportRows = rows.filter(r => r.state !== 'ok' && r.state !== 'not_assessed');
const notAssessedRows = rows.filter(r => r.state === 'not_assessed');
```

**5.2 Send notAssessedRows til Report-komponenten:**
```typescript
<Report
  // ... eksisterende props
  notAssessedRows={notAssessedRows}
  t_not_assessed={{
    section_title: t('pdf_report.not_assessed_title'),
    explanation: t('pdf_report.not_assessed_explanation'),
  }}
/>
```

**5.3 Vis "Ikke vurdert" i UI (valgfritt, men anbefalt):**
Legg til en egen `NotAssessedGroup` komponent eller vis antall ikke-vurderte i `SummaryAssessment`.

---

### Fase 6: AnalyticsService oppdatering

**Fil:** `src/services/AnalyticsService.ts`

```typescript
// Linje 103-104 - ENDRE FRA:
.filter(item => item.state && ['ok', 'obs', 'kritisk'].includes(item.state))

// TIL:
.filter(item => 
  item.state && 
  ['ok', 'obs', 'kritisk'].includes(item.state) &&
  item.state !== 'not_assessed'  // Ekskluder ikke-vurderte
)
```

---

### Fase 7: Oversettelser

**Fil:** `src/locales/nb/translation.json`

```json
{
  "pdf_report": {
    "not_assessed_title": "Ikke vurderte punkter",
    "not_assessed_explanation": "Følgende punkter er ikke vurdert i denne inspeksjonen og inngår ikke i konklusjonen. For en fullstendig inspeksjon, vurder å oppgradere til Pro."
  },
  "summary": {
    "not_assessed_count": "{{count}} punkter ikke vurdert",
    "not_assessed_label": "Ikke vurdert"
  }
}
```

**Fil:** `src/locales/en/translation.json`

```json
{
  "pdf_report": {
    "not_assessed_title": "Not Assessed Items",
    "not_assessed_explanation": "The following items were not assessed in this inspection and are not included in the conclusion. For a complete inspection, consider upgrading to Pro."
  },
  "summary": {
    "not_assessed_count": "{{count}} items not assessed",
    "not_assessed_label": "Not Assessed"
  }
}
```

---

## 4. Filer som må endres (Komplett liste)

| Fil | Endring | Risiko |
|-----|---------|--------|
| `src/db.ts` | Utvid `InspectionItem.state` type | Lav |
| `src/hooks/useChecklistData.ts` | Utvid `Row.state` type, oppdater sortering | Lav |
| `src/components/ChecklistStepper.tsx` | Endre auto-lagring logikk | Medium |
| `src/components/Report.tsx` | Legg til "Ikke vurdert" seksjon | Lav |
| `src/components/summary/SummaryView.tsx` | Filtrer og send notAssessedRows | Lav |
| `src/services/AnalyticsService.ts` | Ekskluder not_assessed fra sending | Lav |
| `src/locales/nb/translation.json` | Nye oversettelser | Lav |
| `src/locales/en/translation.json` | Nye oversettelser | Lav |

**Valgfritt (forbedring):**
| Fil | Endring | Risiko |
|-----|---------|--------|
| `src/components/summary/SummaryAssessment.tsx` | Vis antall ikke-vurderte | Lav |
| `src/components/summary/NotAssessedGroup.tsx` | Ny komponent for liste | Lav |

---

## 5. Testing

### 5.1 Enhetstester (manuell)
1. ✅ Start ny inspeksjon som gratisbruker
2. ✅ Naviger gjennom alle sjekkpunkter uten å velge status
3. ✅ Verifiser at låste punkter har `state: 'not_assessed'` i IndexedDB
4. ✅ Verifiser at åpne punkter har `state: 'ok'`
5. ✅ Last ned PDF og verifiser at "Ikke vurderte punkter" vises

### 5.2 Regresjonstester
1. ✅ Pro-bruker: Alle punkter skal fortsatt auto-lagres som 'ok'
2. ✅ Eksisterende inspeksjoner skal fungere (ingen migrering nødvendig)
3. ✅ AnalyticsService skal ikke sende 'not_assessed' til backend

---

## 6. Forbedringer oppdaget under kodegjennomgang

Under gjennomgangen ble følgende mulige forbedringer identifisert:

### 6.1 Kode-kvalitet
- **`useChecklistItem.ts` linje 68:** `validState` fallback til `'obs'` er merkelig - bør kanskje være `'ok'`
- **`ChecklistStepper.tsx`:** Mye duplisert logikk for `isPro` sjekk - kan refaktoreres

### 6.2 UX-forbedringer
- **QuestionView:** Vis tydelig "Låst" badge på låste punkter (utover disabled state)
- **SummaryView:** Vis antall "Ikke vurderte" punkter som upsell-motivasjon

### 6.3 Sikkerhet
- **AnalyticsService:** API_KEY eksponeres i frontend - bør kun brukes for rate-limiting, ikke autentisering
- **Report.tsx:** Ingen validering av input-data før PDF-generering

### 6.4 Performance
- **useChecklistData.ts:** `useMemo` dependencies kan optimaliseres
- **Report.tsx:** Stort antall conditional renders - kan memoizes

---

## 7. Risiko-vurdering

| Risiko | Sannsynlighet | Konsekvens | Mitigering |
|--------|---------------|------------|------------|
| TypeScript kompileringsfeil | Medium | Lav | Kjør `npm run build` etter hver fase |
| UI viser feil etter endring | Lav | Medium | Test alle flows manuelt |
| Eksisterende data korrupt | Svært lav | Høy | Ingen migrering nødvendig - nye verdier legges til |
| PDF-generering feiler | Lav | Medium | Test PDF nedlasting grundig |

---

## 8. Implementasjonsrekkefølge

1. **db.ts** - Definer ny type (grunnlag for alt annet)
2. **useChecklistData.ts** - Oppdater Row type og sortering
3. **ChecklistStepper.tsx** - Fikse auto-lagring (kjernefiksen)
4. **Oversettelser** - Legg til nye strings
5. **Report.tsx** - Legg til "Ikke vurdert" seksjon
6. **SummaryView.tsx** - Filtrer og send data til Report
7. **AnalyticsService.ts** - Ekskluder not_assessed
8. **Testing** - Full gjennomgang

---

## 9. Neste steg

**Godkjenn planen, så starter implementasjonen.**

Ved spørsmål eller endringer, oppdater dette dokumentet før vi begynner.

---

*Dokumentet er opprettet av AI-assistenten og skal oppdateres underveis i implementasjonen.*
