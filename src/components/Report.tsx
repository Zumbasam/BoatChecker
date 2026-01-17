// src/components/Report.tsx
import React from 'react';
import { Document, Page, View, Text, Image, StyleSheet, Font, Link } from '@react-pdf/renderer';
import type { BoatModel, CustomBoatDetails, InspectionMetadata } from '../db';
import type { Row } from '../hooks/useChecklistData';

type UserContact = {
  name?: string;
  email?: string;
  phone?: string;
};

type Props = {
  rows: Row[];
  boatModel: BoatModel;
  customBoatDetails?: CustomBoatDetails;
  inspectionMetadata?: InspectionMetadata;
  inspectionDate?: Date;
  fullImages?: boolean;
  hideCosts?: boolean;
  t_summary_of_inspection: string;
  t_summary_for_tender: string;
  t_checkpoint: string;
  t_status: string;
  t_cost: string;
  t_appendix_title: string;
  t_summary_text_no_findings: string;
  t_summary_text_findings_intro: string;
  t_summary_text_high_crit: string;
  t_summary_text_cost_4: string;
  t_summary_text_cost_3: string;
  user?: UserContact;
  getAreaLabel?: (row: Row) => string;
  // Nye oversettelser for utvidede detaljer
  t_boat_details?: {
    year: string;
    loa: string;
    beam: string;
    draft: string;
    displacement: string;
    engine: string;
    hin: string;
    registration: string;
    listing_url: string;
  };
  t_inspection_details?: {
    title: string;
    inspector: string;
    location: string;
    boat_location: string;
    weather: string;
    date: string;
    on_land: string;
    in_water: string;
  };
  t_assessment?: {
    recommended: string;
    with_reservations: string;
    not_recommended: string;
    notes: string;
  };
};

Font.register({
  family: 'Helvetica-Bold',
  src: 'https://cdnjs.cloudflare.com/ajax/libs/helvetica/3.0.2/fonts/Helvetica-Bold.ttf',
});

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 10, fontFamily: 'Helvetica' },
  coverTitle: { fontSize: 20, fontFamily: 'Helvetica-Bold', marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontFamily: 'Helvetica-Bold', marginTop: 16, marginBottom: 8 },
  subTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', marginBottom: 6 },
  infoRow: { marginBottom: 4 },
  infoLabel: { fontFamily: 'Helvetica-Bold', width: 100 },
  box: { backgroundColor: '#F7FAFC', padding: 10, borderRadius: 4 },
  footer: { position: 'absolute', left: 24, right: 24, bottom: 12, fontSize: 8, color: '#4A5568' },
  tableHead: { flexDirection: 'row', backgroundColor: '#F7FAFC', borderBottom: 1, borderColor: '#E2E8F0' },
  tableRow: { flexDirection: 'row', borderBottom: 1, borderColor: '#E2E8F0' },
  cell: { padding: 6, flexGrow: 1, flexBasis: 0 }, 
  cellWide: { padding: 6, flexGrow: 1, flexBasis: '65%' },
  cellMid: { padding: 6, flexGrow: 0, flexBasis: '15%', textAlign: 'center' },
  cellCost: { padding: 6, flexGrow: 0, flexBasis: '20%', textAlign: 'right' },
  headBold: { fontFamily: 'Helvetica-Bold' },
  badge: { fontSize: 8, padding: 2, borderRadius: 3 },
  kritisk: { backgroundColor: '#FED7D7', color: '#822727' },
  obs: { backgroundColor: '#FEFCBF', color: '#744210' },
  highCrit: { color: '#E53E3E', fontFamily: 'Helvetica-Bold', marginRight: 4 },
  noteWrap: { backgroundColor: '#F7FAFC' },
  noteInner: { flexDirection: 'row', padding: 8 },
  thumb: { width: 60, height: 60, objectFit: 'cover', borderRadius: 3, marginRight: 8 },
  noteText: { flex: 1, fontStyle: 'italic', color: '#4A5568' },
  appendixTitle: { fontSize: 14, fontFamily: 'Helvetica-Bold', marginBottom: 12, marginTop: 12 },
  appendixImg: { maxWidth: 500, maxHeight: 320, objectFit: 'contain', marginBottom: 6, alignSelf: 'center' },
  appendixBlock: { marginBottom: 18, borderBottom: 1, borderColor: '#E2E8F0', paddingBottom: 12 },
  appendixLabel: { fontSize: 11, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  appendixNote: { fontSize: 9, fontStyle: 'italic', color: '#4A5568' },
  disclaimerH1: { fontSize: 16, fontFamily: 'Helvetica-Bold', marginBottom: 10 },
  disclaimerH2: { fontSize: 12, fontFamily: 'Helvetica-Bold', marginTop: 10, marginBottom: 4 },
  // Assessment badge styles
  assessmentBox: { padding: 12, borderRadius: 4, marginBottom: 12 },
  assessmentRecommended: { backgroundColor: '#C6F6D5', borderLeft: '4px solid #38A169' },
  assessmentReservations: { backgroundColor: '#FEFCBF', borderLeft: '4px solid #D69E2E' },
  assessmentNotRecommended: { backgroundColor: '#FED7D7', borderLeft: '4px solid #E53E3E' },
  assessmentTitle: { fontFamily: 'Helvetica-Bold', fontSize: 12, marginBottom: 4 },
  assessmentNotes: { fontStyle: 'italic', color: '#4A5568', marginTop: 6 },
  // Details grid
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  detailItem: { width: '50%', marginBottom: 4 },
  detailLabel: { fontFamily: 'Helvetica-Bold', color: '#4A5568' },
  link: { color: '#3182CE', textDecoration: 'underline' },
});

function safeText(text: any): string {
  if (text == null) return '—';
  const s = String(text).trim();
  return s.length ? s : '—';
}

function costIndicatorToDollar(indicator?: number) {
  if (!indicator) return '—';
  return '$'.repeat(indicator);
}

function hasText(str?: string | null): boolean {
  return typeof str === 'string' && str.trim().length > 0;
}

export const Report: React.FC<Props> = ({
  rows,
  boatModel,
  customBoatDetails,
  inspectionMetadata,
  inspectionDate,
  fullImages = false,
  hideCosts = false,
  t_summary_of_inspection,
  t_summary_for_tender,
  t_checkpoint,
  t_status,
  t_cost,
  t_appendix_title,
  t_summary_text_no_findings,
  t_summary_text_findings_intro,
  t_summary_text_high_crit,
  t_summary_text_cost_4,
  t_summary_text_cost_3,
  user,
  getAreaLabel,
  t_boat_details,
  t_inspection_details,
  t_assessment,
}) => {
  const isWorkshop = !!(user && (user.name || user.email || user.phone));

  const criticality1 = rows.filter((r) => r.criticality === 1).length;
  const cost4 = rows.filter((r) => r.costIndicator === 4).length;
  const cost3 = rows.filter((r) => r.costIndicator === 3).length;
  const countCritical = rows.filter((r) => r.state === 'kritisk').length;
  const countObs = rows.filter((r) => r.state === 'obs').length;

  const summaryText = (() => {
    if (rows.length === 0) return t_summary_text_no_findings;
    let text = `${t_summary_text_findings_intro} `;
    if (criticality1 > 0) text += `${t_summary_text_high_crit} `;
    if (cost4 > 0) text += t_summary_text_cost_4;
    else if (cost3 > 0) text += t_summary_text_cost_3;
    return text;
  })();

  const formatDate = (date?: Date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('nb-NO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getAssessmentStyle = () => {
    switch (inspectionMetadata?.overallAssessment) {
      case 'recommended': return styles.assessmentRecommended;
      case 'with_reservations': return styles.assessmentReservations;
      case 'not_recommended': return styles.assessmentNotRecommended;
      default: return {};
    }
  };

  const getAssessmentLabel = () => {
    if (!inspectionMetadata?.overallAssessment || !t_assessment) return '';
    switch (inspectionMetadata.overallAssessment) {
      case 'recommended': return t_assessment.recommended;
      case 'with_reservations': return t_assessment.with_reservations;
      case 'not_recommended': return t_assessment.not_recommended;
      default: return '';
    }
  };

  const groupsMap = new Map<string, Row[]>();
  if (getAreaLabel) {
    rows.forEach((r) => {
      const label = getAreaLabel(r) || 'Andre';
      const arr = groupsMap.get(label) || [];
      arr.push(r);
      groupsMap.set(label, arr);
    });
  } else {
    groupsMap.set('Andre', rows);
  }

  const groups = Array.from(groupsMap.entries()).map(([label, items]) => ({ label, items }));
  const isSingleFlat = groups.length === 1 && groups[0].label === 'Andre';

  const appendixImages = rows
    .filter((r) => !!r.photoFull)
    .map((r) => ({ id: r.id, photoFull: r.photoFull as string, label: r.label, note: r.note }));
  const appendixPages: typeof appendixImages[] = [];
  for (let i = 0; i < appendixImages.length; i += 2) appendixPages.push(appendixImages.slice(i, i + 2));

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.coverTitle}>
          {isWorkshop ? 'Anbudsforespørsel via BoatChecker' : t_summary_of_inspection}
        </Text>

        {/* Totalvurdering badge */}
        {inspectionMetadata?.overallAssessment && (
          <View style={[styles.assessmentBox, getAssessmentStyle()]}>
            <Text style={styles.assessmentTitle}>{getAssessmentLabel()}</Text>
            {inspectionMetadata.assessmentNotes && (
              <Text style={styles.assessmentNotes}>"{inspectionMetadata.assessmentNotes}"</Text>
            )}
          </View>
        )}

        {/* Båtinformasjon */}
        <View style={{ marginBottom: 12 }}>
          <Text style={styles.subTitle}>Båt</Text>
          <View style={styles.box}>
            <Text style={{ fontSize: 14, fontFamily: 'Helvetica-Bold', marginBottom: 6 }}>
              {boatModel.name}
            </Text>
            <Text style={styles.infoRow}>{boatModel.manufacturer}</Text>
            
            <View style={[styles.detailsGrid, { marginTop: 8 }]}>
              <View style={styles.detailItem}>
                <Text><Text style={styles.detailLabel}>Type: </Text>{boatModel.typePrimary}/{boatModel.typeSecondary}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text><Text style={styles.detailLabel}>Skrog: </Text>{boatModel.hullMaterial}</Text>
              </View>
              {customBoatDetails?.year && (
                <View style={styles.detailItem}>
                  <Text><Text style={styles.detailLabel}>{t_boat_details?.year || 'År'}: </Text>{customBoatDetails.year}</Text>
                </View>
              )}
              {customBoatDetails?.loa && (
                <View style={styles.detailItem}>
                  <Text><Text style={styles.detailLabel}>{t_boat_details?.loa || 'Lengde'}: </Text>{customBoatDetails.loa} m</Text>
                </View>
              )}
              {customBoatDetails?.beam && (
                <View style={styles.detailItem}>
                  <Text><Text style={styles.detailLabel}>{t_boat_details?.beam || 'Bredde'}: </Text>{customBoatDetails.beam} m</Text>
                </View>
              )}
              {customBoatDetails?.draft && (
                <View style={styles.detailItem}>
                  <Text><Text style={styles.detailLabel}>{t_boat_details?.draft || 'Dybde'}: </Text>{customBoatDetails.draft} m</Text>
                </View>
              )}
              {customBoatDetails?.displacement && (
                <View style={styles.detailItem}>
                  <Text><Text style={styles.detailLabel}>{t_boat_details?.displacement || 'Deplasement'}: </Text>{customBoatDetails.displacement} kg</Text>
                </View>
              )}
              {customBoatDetails?.engineMake && (
                <View style={styles.detailItem}>
                  <Text>
                    <Text style={styles.detailLabel}>{t_boat_details?.engine || 'Motor'}: </Text>
                    {customBoatDetails.engineMake}
                    {customBoatDetails.enginePower ? ` (${customBoatDetails.enginePower} hk)` : ''}
                  </Text>
                </View>
              )}
              {customBoatDetails?.engineHours && (
                <View style={styles.detailItem}>
                  <Text><Text style={styles.detailLabel}>Timer: </Text>{customBoatDetails.engineHours} t</Text>
                </View>
              )}
              {customBoatDetails?.fuelType && (
                <View style={styles.detailItem}>
                  <Text><Text style={styles.detailLabel}>Drivstoff: </Text>{customBoatDetails.fuelType}</Text>
                </View>
              )}
              {customBoatDetails?.hin && (
                <View style={styles.detailItem}>
                  <Text><Text style={styles.detailLabel}>{t_boat_details?.hin || 'HIN'}: </Text>{customBoatDetails.hin}</Text>
                </View>
              )}
              {customBoatDetails?.registrationNumber && (
                <View style={styles.detailItem}>
                  <Text><Text style={styles.detailLabel}>{t_boat_details?.registration || 'Reg.nr'}: </Text>{customBoatDetails.registrationNumber}</Text>
                </View>
              )}
            </View>

            {customBoatDetails?.listingUrl && (
              <View style={{ marginTop: 8 }}>
                <Text style={styles.detailLabel}>{t_boat_details?.listing_url || 'Annonse'}:</Text>
                <Link src={customBoatDetails.listingUrl} style={styles.link}>
                  <Text>{customBoatDetails.listingUrl}</Text>
                </Link>
              </View>
            )}
          </View>
        </View>

        {/* Inspeksjonsinformasjon */}
        <View style={{ marginBottom: 12 }}>
          <Text style={styles.subTitle}>{t_inspection_details?.title || 'Inspeksjon'}</Text>
          <View style={styles.box}>
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Text><Text style={styles.detailLabel}>{t_inspection_details?.date || 'Dato'}: </Text>{formatDate(inspectionDate)}</Text>
              </View>
              {inspectionMetadata?.inspectorName && (
                <View style={styles.detailItem}>
                  <Text><Text style={styles.detailLabel}>{t_inspection_details?.inspector || 'Inspektør'}: </Text>{inspectionMetadata.inspectorName}</Text>
                </View>
              )}
              {inspectionMetadata?.inspectionLocation && (
                <View style={styles.detailItem}>
                  <Text><Text style={styles.detailLabel}>{t_inspection_details?.location || 'Sted'}: </Text>{inspectionMetadata.inspectionLocation}</Text>
                </View>
              )}
              {inspectionMetadata?.boatLocation && (
                <View style={styles.detailItem}>
                  <Text>
                    <Text style={styles.detailLabel}>{t_inspection_details?.boat_location || 'Båt'}: </Text>
                    {inspectionMetadata.boatLocation === 'land' 
                      ? (t_inspection_details?.on_land || 'På land')
                      : (t_inspection_details?.in_water || 'I vannet')}
                  </Text>
                </View>
              )}
              {inspectionMetadata?.weatherConditions && (
                <View style={styles.detailItem}>
                  <Text><Text style={styles.detailLabel}>{t_inspection_details?.weather || 'Vær'}: </Text>{inspectionMetadata.weatherConditions}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {isWorkshop && (
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.subTitle}>Kontakt</Text>
            <View style={styles.box}>
              <Text style={styles.infoRow}>Navn: {safeText(user?.name)}</Text>
              <Text style={styles.infoRow}>E-post: {safeText(user?.email)}</Text>
              <Text style={styles.infoRow}>Telefon: {safeText(user?.phone)}</Text>
            </View>
          </View>
        )}

        <View style={{ marginBottom: 12 }}>
          <Text style={styles.subTitle}>Oppsummering av funn</Text>
          <View style={styles.box}>
            <Text>Totalt antall funn: {rows.length} ({countCritical} Kritiske, {countObs} Obs)</Text>
            <Text style={{ marginTop: 6 }}>{summaryText}</Text>
          </View>
        </View>

        {isWorkshop && (
          <View style={{ marginTop: 12 }}>
            <Text>
              Denne rapporten er sendt på vegne av {safeText(user?.name)}. Vennligst gjennomgå de dokumenterte funnene og returner et uforpliktende prisoverslag for utbedring til {safeText(user?.email)}.
            </Text>
          </View>
        )}

        <Text style={styles.footer} fixed>
          Rapporten er generert av en bruker via BoatChecker-appen og er et utgangspunkt for dialog, ikke en profesjonell takst. BoatChecker er kun en formidler.
        </Text>
      </Page>

      <Page size="A4" style={styles.page} wrap>
        <Text style={styles.subTitle}>{hideCosts ? t_summary_for_tender : t_summary_of_inspection}</Text>

        {isSingleFlat ? (
          <View>
            <View style={styles.tableHead}>
              <Text style={[styles.cellWide, styles.headBold]}>{t_checkpoint}</Text>
              <Text style={[styles.cellMid, styles.headBold]}>{t_status}</Text>
              {!hideCosts && <Text style={[styles.cellCost, styles.headBold]}>{t_cost}</Text>}
            </View>
            {groups[0].items.map((r) => (
              <React.Fragment key={r.id}>
                <View style={styles.tableRow}>
                  <View style={[styles.cellWide, { flexDirection: 'row', alignItems: 'center' }]}>
                    {r.criticality === 1 && <Text style={styles.highCrit}>[!]&nbsp;</Text>}
                    <Text>{r.label}</Text>
                  </View>
                  <View style={[styles.cellMid, { alignItems: 'center' }]}>
                    <Text style={[styles.badge, r.state === 'kritisk' ? styles.kritisk : styles.obs]}>
                      {r.state.toUpperCase()}
                    </Text>
                  </View>
                  {!hideCosts && (
                    <View style={[styles.cellCost, { alignItems: 'flex-end' }]}>
                      <Text>{costIndicatorToDollar(r.costIndicator)}</Text>
                    </View>
                  )}
                </View>
                {(hasText(r.note) || r.thumb) && (
                  <View style={[styles.noteWrap]} wrap={false}>
                    <View style={styles.noteInner}>
                      {r.thumb && <Image src={r.thumb} style={styles.thumb} />} 
                      {hasText(r.note) && <Text style={styles.noteText}>{safeText(r.note)}</Text>}
                    </View>
                  </View>
                )}
              </React.Fragment>
            ))}
          </View>
        ) : (
          groups.map((g) => (
            <View key={g.label}>
              <Text style={styles.sectionTitle}>{g.label}</Text>
              <View style={styles.tableHead}>
                <Text style={[styles.cellWide, styles.headBold]}>{t_checkpoint}</Text>
                <Text style={[styles.cellMid, styles.headBold]}>{t_status}</Text>
                {!hideCosts && <Text style={[styles.cellCost, styles.headBold]}>{t_cost}</Text>}
              </View>
              {g.items.map((r) => (
                <React.Fragment key={r.id}>
                  <View style={styles.tableRow}>
                    <View style={[styles.cellWide, { flexDirection: 'row', alignItems: 'center' }]}>
                      {r.criticality === 1 && <Text style={styles.highCrit}>[!]&nbsp;</Text>}
                      <Text>{r.label}</Text>
                    </View>
                    <View style={[styles.cellMid, { alignItems: 'center' }]}>
                      <Text style={[styles.badge, r.state === 'kritisk' ? styles.kritisk : styles.obs]}>
                        {r.state.toUpperCase()}
                      </Text>
                    </View>
                    {!hideCosts && (
                      <View style={[styles.cellCost, { alignItems: 'flex-end' }]}>
                        <Text>{costIndicatorToDollar(r.costIndicator)}</Text>
                      </View>
                    )}
                  </View>
                  {(hasText(r.note) || r.thumb) && (
                    <View style={[styles.noteWrap]} wrap={false}>
                      <View style={styles.noteInner}>
                        {r.thumb && <Image src={r.thumb} style={styles.thumb} />} 
                        {hasText(r.note) && <Text style={styles.noteText}>{safeText(r.note)}</Text>}
                      </View>
                    </View>
                  )}
                </React.Fragment>
              ))}
            </View>
          ))
        )}

        <Text style={styles.footer} fixed>
          Rapporten er generert av en bruker via BoatChecker-appen og er et utgangspunkt for dialog, ikke en profesjonell takst. BoatChecker er kun en formidler.
        </Text>
      </Page>

      {fullImages && appendixPages.map((page, idx) => (
        <Page key={`app-${idx}`} size="A4" style={styles.page}>
          <Text style={styles.appendixTitle}>
            {t_appendix_title.replace('{{currentPage}}', String(idx + 1)).replace('{{totalPages}}', String(appendixPages.length))}
          </Text>
          {page.map((img) => (
            <View key={img.id} style={styles.appendixBlock} wrap={false}>
              <Image src={img.photoFull} style={styles.appendixImg} />
              <Text style={styles.appendixLabel}>{safeText(img.label)}</Text>
              {hasText(img.note) && <Text style={styles.appendixNote}>{safeText(img.note)}</Text>}
            </View>
          ))}
          <Text style={styles.footer} fixed>
            Rapporten er generert av en bruker via BoatChecker-appen og er et utgangspunkt for dialog, ikke en profesjonell takst. BoatChecker er kun en formidler.
          </Text>
        </Page>
      ))}

      <Page size="A4" style={styles.page}>
        <Text style={styles.disclaimerH1}>Viktig Informasjon om Denne Rapporten</Text>
        <Text style={styles.disclaimerH2}>BoatChecker er kun en formidler</Text>
        <Text>
          BoatChecker fungerer utelukkende som en teknisk plattform som muliggjør overføring av brukergenererte rapporter.
          BoatChecker er ikke en part i, og påtar seg intet ansvar for, den påfølgende kommunikasjonen, avtaler eller tjenester
          som inngås mellom brukeren og verkstedet.
        </Text>
        <Text style={styles.disclaimerH2}>Rapporten er brukerens egen vurdering</Text>
        <Text>
          Rapporten er utelukkende basert på en visuell inspeksjon og subjektive notater utført av en privat bruker. Innholdet
          utgjør ikke en profesjonell takst, diagnose eller verdivurdering fra BoatChecker. BoatChecker garanterer ikke for
          nøyaktigheten eller fullstendigheten av informasjonen.
        </Text>
        <Text style={styles.disclaimerH2}>Verkstedets eget ansvar</Text>
        <Text>
          Verkstedet er selv ansvarlig for å foreta en egen, uavhengig vurdering og diagnose av båten før et bindende tilbud gis.
          Verkstedet må selv innhente ytterligere informasjon direkte fra brukeren ved behov.
        </Text>
        <Text style={styles.footer} fixed>
          Rapporten er generert av en bruker via BoatChecker-appen og er et utgangspunkt for dialog, ikke en profesjonell takst. BoatChecker er kun en formidler.
        </Text>
      </Page>
    </Document>
  );
};