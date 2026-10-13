import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../lib/theme';

export function FinanceBackLink() {
  return (
    <View style={styles.row}>
      <Link href="/dashboard" asChild>
        <Text style={styles.link}>← Back to overview</Text>
      </Link>
      <Text style={styles.brand}>Gnosiant<Text style={styles.brandDot}>.</Text></Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  link: { color: colors.green, fontSize: 13, fontWeight: '800', paddingVertical: 8, paddingRight: 12 },
  brand: { color: colors.ink, fontSize: 19, fontWeight: '900', letterSpacing: -0.5 },
  brandDot: { color: colors.coral },
});
