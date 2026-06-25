import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
} from 'react-native';

import { API_ENDPOINTS } from '../data/api';

// Brand Colors
const NAVY   = '#003366';
const YELLOW = '#F5C518';
const BG     = '#F0F2F5';
const MUTED  = '#8A94A6';
const WHITE  = '#FFFFFF';

const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const formattedDate = date.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
    const formattedTime = date.toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', hour12: false,
    });
    return `${formattedDate}  ${formattedTime}`;
  } catch {
    return dateString;
  }
};

const InfoRow = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const MahasiswaCard = ({ item, index }) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <View style={styles.studentInfoLeft}>
        <View style={styles.indexBadge}>
          <Text style={styles.indexBadgeText}>
            {String(index + 1).padStart(2, '0')}
          </Text>
        </View>
        <View style={styles.nameMeta}>
          <Text style={styles.studentName} numberOfLines={1}>
            {item.namaMahasiswa ?? '-'}
          </Text>
          <Text style={styles.studentNim}>{item.nim ?? '-'}</Text>
        </View>
      </View>
      <View style={styles.searchCountBox}>
        <Text style={styles.searchCountText}>🔍 {item.totalSearch}x</Text>
      </View>
    </View>

    <View style={styles.cardBody}>
      <View style={styles.gridRow}>
        <InfoRow label="First Search" value={formatDateTime(item.firstSearch)} />
        <View style={styles.verticalDivider} />
        <InfoRow label="Last Search" value={formatDateTime(item.lastSearch)} />
      </View>
    </View>
  </View>
);

/* ── Main Screen ── */
const RiwayatDetailScreen = ({ route, navigation }) => {
  const { id, diagnosisType, code, title } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);

  useEffect(() => { fetchDetail(); }, []);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_ENDPOINTS.historyDetail}?diagnosisType=${diagnosisType}&idItem=${id}`
      );
      const json = await response.json();
      const list = Array.isArray(json?.data)
        ? json.data
        : json?.data ? [json.data] : [];
      setData(list);
    } catch (error) {
      console.log('DETAIL ERROR:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={NAVY} />
        <Text style={styles.loadingText}>Loading detail data...</Text>
      </SafeAreaView>
    );
  }

  if (data.length === 0) {
    return (
      <SafeAreaView style={styles.emptyScreen}>
        {/* Navbar on empty state too */}
        <View style={styles.navBar}>
          <TouchableOpacity style={styles.navBackButton} onPress={() => navigation?.goBack()}>
            <Text style={styles.navBackIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.navTitle}>History Details</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.center}>
          <View style={styles.emptyIconCircle}>
            <Text style={styles.emptyIcon}>📋</Text>
          </View>
          <Text style={styles.emptyTitle}>No Data Available</Text>
          <Text style={styles.emptySubtitle}>
            No students have searched this diagnosis yet.
          </Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
            <Text style={styles.backButtonText}>← Back to History</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const typeLabel = diagnosisType === 'CODE'
    ? 'Failure Code'
    : `${diagnosisType}-Mode`;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={WHITE} />

      {/* Navbar */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navBackButton} onPress={() => navigation?.goBack()}>
          <Text style={styles.navBackIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>History Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Card */}
        <View style={styles.headerCard}>
          {/* Type badge row */}
          <View style={styles.headerTopRow}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>{typeLabel}</Text>
            </View>
            <Text style={styles.studentCountText}>
              {data.length} {data.length === 1 ? 'Student' : 'Students'}
            </Text>
          </View>

          {/* Code */}
          <Text style={styles.headerCode}>{code || '-'}</Text>

          {/* Title */}
          <Text style={styles.headerTitle}>{title || 'No Title'}</Text>
        </View>

        {/* Section label */}
        <Text style={styles.sectionLabel}>Student Records</Text>

        {/* Student List */}
        {data.map((item, index) => (
          <MahasiswaCard key={item.nim ?? index} item={item} index={index} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },

  /* Navbar */
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: WHITE,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  navBackButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: BG,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navBackIcon: {
    fontSize: 18,
    color: NAVY,
    fontWeight: '700',
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: NAVY,
    flex: 1,
    textAlign: 'center',
  },

  /* Scroll content */
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },

  /* Header Card */
  headerCard: {
    backgroundColor: NAVY,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  typeBadge: {
    backgroundColor: YELLOW,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeBadgeText: {
    color: NAVY,
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.3,
  },
  studentCountText: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
    fontWeight: '600',
  },
  headerCode: {
    fontSize: 13,
    fontWeight: '700',
    color: YELLOW,
    letterSpacing: 1,
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: WHITE,
    lineHeight: 26,
  },

  /* Section label */
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: MUTED,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginLeft: 2,
  },

  /* Student Card */
  card: {
    backgroundColor: WHITE,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#E8ECF0',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#F0F2F5',
  },
  studentInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 10,
  },
  indexBadge: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: BG,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  indexBadgeText: {
    color: NAVY,
    fontWeight: '700',
    fontSize: 12,
  },
  nameMeta: {
    flex: 1,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '700',
    color: NAVY,
  },
  studentNim: {
    fontSize: 12,
    color: MUTED,
    fontWeight: '500',
    marginTop: 1,
  },
  searchCountBox: {
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
    flexShrink: 0,
  },
  searchCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: NAVY,
  },
  cardBody: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verticalDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 14,
  },
  infoRow: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '700',
    color: NAVY,
  },

  /* Loading & Empty */
  emptyScreen: {
    flex: 1,
    backgroundColor: BG,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 14,
    color: MUTED,
    fontWeight: '600',
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#EAECEF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyIcon: {
    fontSize: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: NAVY,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: MUTED,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: NAVY,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  backButtonText: {
    color: WHITE,
    fontWeight: '600',
    fontSize: 14,
  },
});

export default RiwayatDetailScreen;