// src/components/reports/WorkshopReport.tsx
import React from 'react';
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import type { BoatModel } from '../../db';

type Finding = {
  id: string;
  label: string;
  state: 'obs' | 'kritisk';
  criticality?: number;
  costIndicator?: number;
  note?: string;
  thumb?: string;
  photoFull?: string;
};

type Group = {
  id: string;
  label: string;
  items: Finding[];
};

type UserInfo = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
};

type Props = {
  boatModel: BoatModel;
  groups: Group[];
  userInfo: UserInfo;
  fullImages?: boolean;
};

const styles = StyleSheet.create({
  page: { padding: 28, fontSize: 10, fontFamily: 'Helvetica' },
  h1: { fontSize: 18, fontWeight: 700, marginBottom: 8 },
  h2: { fontSize: 14, fontWeight: 700, marginBottom: 6, marginTop: 10 },
  h3: { fontSize: 12, fontWeight: 700, marginBottom: 4, marginTop: 8 },
  box: { backgroundColor: '#F7FAFC', borderRadius: 4, padding: 10, marginTop: 8 },
  row: { flexDirection: 'row', borderBottom: 1, borderColor: '#E2E8F0' },
  cell: { padding: 6, flexGrow: 1, flexBasis: 0 },
  head: { backgroundColor: '#EDF2F7', fontWeight: 700 },
  badge: { fontSize: 9, padding: 3, borderRadius: 3, color: '#1A202C' },
  kritisk: { backgroundColor: '#FED7D7', color: '#822727' },
  obs: { backgroundColor: '#FEFCBF', color: '#744210' },
  cost: { fontSize: 12, fontWeight: 700 },
  note: { fontStyle: 'italic', color: '#4A5568' },
  thumb: { width: 56, height: 56, objectFit: 'cover', borderRadius: 3, marginRight: 8 },
  footer: { position: 'absolute', left: 28, right: 28, bottom: 16, fontSize: 8, color: '#4A5568' },
  coverTitle: { fontSize: 20, fontWeight: 700, marginBottom: 12 },
  kv: { marginBottom: 2 },
  appendixTitle: { fontSize: 14, fontWeight: 700, marginBottom: 12, marginTop: 12 },
  appendixImg: { maxWidth: 520, maxHeight: 340, objectFit: 'contain', marginBottom: 6, alignSelf: 'center' },
  appendixBlock: { marginBottom: 18, borderBottom: 1, borderColor: '#E2E8F0', paddingBottom: 12 },
  appendixLabel: { fontSize: 11, fontWeight: 700, marginBottom: 2 },
  appendixNote: { fontSize: 9, fontStyle: 'italic', color: '#4A5568' },
});

function safe(str?: string | null) {
  return typeof str === 'string' && str.trim().length > 0 ? str.trim() : '—';
}

function dollars(n?: number) {
  if (!n) return '—';
  return '$'.repeat(n);
}

function Footer() {
  return (
    <Text style={styles.footer}>
      Rapporten er generert av en bruker via BoatChecker-appen og er et utgangspunkt for dialog, ikke en profesjonell takst. BoatChecker er kun en formidler.
    </Text>
  );
}

export const WorkshopReport: React.FC<Props> = ({ boatModel, groups, userInfo, fullImages = false }) => {
  const flat = groups.flatMap(g => g.items);
  const total = flat.length;
  const krit = flat.filter(r => r.state === 'kritisk').length;
  const obs = flat.filter(r => r.state === 'obs').length;

  const appendix = flat.filter(r => !!r.photoFull).map(r => ({ id: r.id, label: r.label, note: r.note, photoFull: r.photoFull! }));
  const appendixPages: typeof appendix[] = [];
  for (let i = 0; i < appendix.length; i += 2) appendixPages.push(appendix.slice(i, i + 2));

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.coverTitle}>Anbudsforespørsel via BoatChecker</Text>
        <View style={styles.box}>
          <Text style={styles.h2}>Båt</Text>
          <Text style={styles.kv}>Modell: {safe(boatModel.name)}</Text>
          <Text style={styles.kv}>Produsent: {safe(boatModel.manufacturer)}</Text>
          <Text style={styles.kv}>Type: {safe(boatModel.typePrimary)}/{safe(boatModel.typeSecondary)}</Text>
          <Text style={styles.kv}>Skrog: {safe(boatModel.hullMaterial)}</Text>
        </View>
        <View style={styles.box}>
          <Text style={styles.h2}>Kunde</Text>
          <Text style={styles.kv}>Navn: {safe(userInfo.name)}</Text>
          <Text style={styles.kv}>E-post: {safe(userInfo.email)}</Text>
          <Text style={styles.kv}>Telefon: {safe(userInfo.phone)}</Text>
        </View>
        <View style={styles.box}>
          <Text style={styles.h2}>Oppsummering</Text>
          <Text>Totalt antall funn: {total} ({krit} Kritiske, {obs} Obs)</Text>
        </View>
        <View style={styles.box}>
          <Text style={styles.h2}>Vennligst gi pris</Text>
          <Text>Denne rapporten er sendt på vegne av {safe(userInfo.name)}. Vennligst gjennomgå de dokumenterte funnene og returner et uforpliktende prisoverslag for utbedring til {safe(userInfo.email)}.</Text>
        </View>
        <Footer />
      </Page>

      {groups.map(group => (
        <Page key={group.id} size="A4" style={styles.page}>
          <Text style={styles.h1}>{group.label}</Text>
          <View style={[styles.row, styles.head]}>
            <Text style={[styles.cell, { flexBasis: '60%' }]}>Sjekkpunkt</Text>
            <Text style={[styles.cell, { flexBasis: '15%', textAlign: 'center' }]}>Status</Text>
            <Text style={[styles.cell, { flexBasis: '25%', textAlign: 'right' }]}>Kostnadsindikasjon</Text>
          </View>
          {group.items.map(item => (
            <React.Fragment key={item.id}>
              <View style={styles.row} wrap={false}>
                <View style={[styles.cell, { flexBasis: '60%', flexDirection: 'row', alignItems: 'center' }]}>
                  <Text>{item.criticality === 1 ? '[!] ' : ''}{item.label}</Text>
                </View>
                <View style={[styles.cell, { flexBasis: '15%', alignItems: 'center' }]}>
                  <Text style={[styles.badge, item.state === 'kritisk' ? styles.kritisk : styles.obs]}>{item.state.toUpperCase()}</Text>
                </View>
                <View style={[styles.cell, { flexBasis: '25%', alignItems: 'flex-end' }]}>
                  <Text style={styles.cost}>{dollars(item.costIndicator)}</Text>
                </View>
              </View>
              {(safe(item.note) !== '—' || item.thumb) && (
                <View style={[styles.row, { backgroundColor: '#F7FAFC' }]} wrap={false}>
                  <View style={[styles.cell, { flexDirection: 'row', alignItems: 'center' }]}>
                    {item.thumb ? <Image src={item.thumb} style={styles.thumb} /> : null}
                    {safe(item.note) !== '—' ? <Text style={styles.note}>{safe(item.note)}</Text> : null}
                  </View>
                </View>
              )}
            </React.Fragment>
          ))}
          <Footer />
        </Page>
      ))}

      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Viktig Informasjon om Denne Rapporten</Text>
        <Text style={styles.h2}>BoatChecker er kun en formidler</Text>
        <Text>BoatChecker fungerer utelukkende som en teknisk plattform som muliggjør overføring av brukergenererte rapporter. BoatChecker er ikke en part i, og påtar seg intet ansvar for, den påfølgende kommunikasjonen, avtaler eller tjenester som inngås mellom brukeren og verkstedet.</Text>
        <Text style={styles.h2}>Rapporten er brukerens egen vurdering</Text>
        <Text>Rapporten er utelukkende basert på en visuell inspeksjon og subjektive notater utført av en privat bruker. Innholdet utgjør ikke en profesjonell takst, diagnose eller verdivurdering fra BoatChecker. BoatChecker garanterer ikke for nøyaktigheten eller fullstendigheten av informasjonen.</Text>
        <Text style={styles.h2}>Verkstedets eget ansvar</Text>
        <Text>Verkstedet er selv ansvarlig for å foreta en egen, uavhengig vurdering og diagnose av båten før et bindende tilbud gis. Verkstedet må selv innhente ytterligere informasjon direkte fra brukeren ved behov.</Text>
        <Footer />
      </Page>

      {fullImages && appendixPages.map((page, i) => (
        <Page key={`app-${i}`} size="A4" style={styles.page}>
          <Text style={styles.appendixTitle}>Bilder – side {i + 1} / {appendixPages.length}</Text>
          {page.map(img => (
            <View key={img.id} style={styles.appendixBlock} wrap={false}>
              <Image src={img.photoFull} style={styles.appendixImg} />
              <Text style={styles.appendixLabel}>{safe(img.label)}</Text>
              {safe(img.note) !== '—' ? <Text style={styles.appendixNote}>{safe(img.note)}</Text> : null}
            </View>
          ))}
          <Footer />
        </Page>
      ))}
    </Document>
  );
};
