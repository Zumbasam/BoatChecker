import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import type { CheckItemState } from '../db';          // ← behold KUN denne
import checklist from '../data/checklist.json';

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 11, fontFamily: 'Helvetica' },
  sectionTitle: { fontSize: 14, marginBottom: 6, marginTop: 12 },
  row: { flexDirection: 'row', marginBottom: 2 },
  cell: { flexGrow: 1 }
});

export const Report = ({ states }: { states: CheckItemState[] }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {checklist.areas.map(area => (
        <View key={area.id}>
          <Text style={styles.sectionTitle}>{area.title}</Text>

          {area.items.map(item => {
            const st = states.find(s => s.id === item.id);
            return (
              <View key={item.id} style={styles.row}>
                <Text style={styles.cell}>{item.label}</Text>
                <Text style={styles.cell}>{st ? st.state : '—'}</Text>
                <Text style={styles.cell}>
                  {st ? item.cost[st.state].toLocaleString('nb-NO') : ''}
                </Text>
              </View>
            );
          })}
        </View>
      ))}
    </Page>
  </Document>
);
