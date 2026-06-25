import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';

import { API_ENDPOINTS } from '../data/api';

// Brand Colors
const NAVY   = '#003366';
const YELLOW = '#F5C518';
const BG     = '#F0F2F5';
const MUTED  = '#8A94A6';

// Helper function to format ISO date string to readable English format
const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; 

    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    const formattedDate = date.toLocaleDateString('en-US', options);
    
    const formattedTime = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    return `${formattedDate} - ${formattedTime}`;
  } catch (error) {
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
    {/* Card Header */}
    <View style={styles.cardHeader}>
      <View style={styles.studentInfoLeft}>
        <View style={styles.indexBadge}>
          <Text style={styles.indexBadgeText}>
            {String(index + 1).padStart(2, '0')}
          </Text>
        </View>
        <View style={styles.nameMeta}>
          <Text style={styles.studentName}>{item.namaMahasiswa ?? '-'}</Text>
          <Text style={styles.studentNim}>{item.nim ?? '-'}</Text>
        </View>
      </View>
      
      <View style={styles.searchCountBox}>
        <Text style={styles.searchCountText}>🔍 {item.totalSearch}x</Text>
      </View>
    </View>

    {/* Card Body - Date & Time Grid */}
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
  // 1. DI SINI: Destructure code dan title dari route.params
  const { id, diagnosisType, code, title } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchDetail();
  }, []);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_ENDPOINTS.historyDetail}?diagnosisType=${diagnosisType}&idItem=${id}`
      );
      const json = await response.json();
      const list = Array.isArray(json?.data)
        ? json.data
        : json?.data
        ? [json.data]
        : [];
      setData(list);
    } catch (error) {
      console.log('DETAIL ERROR:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={YELLOW} />
        <Text style={styles.loadingText}>Loading detail data...</Text>
      </View>
    );
  }

  if (data.length === 0) {
    return (
      <View style={styles.center}>
        <View style={styles.emptyIconCircle}>
          <Text style={styles.emptyIcon}>📋</Text>
        </View>
        <Text style={styles.emptyTitle}>No Data Available</Text>
        <Text style={styles.emptySubtitle}>
          No students have diagnosed this code yet.
        </Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
          <Text style={styles.backButtonText}>← Back to History</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      
      {/* Top Navbar */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navBackButton} onPress={() => navigation?.goBack()}>
          <Text style={styles.navBackIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>Diagnosis History Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Summary */}
        <View style={styles.headerCard}>
          {/* 2. DI SINI: Tampilkan Code sebagai Badge Utama */}
          <Text style={styles.headerLabel}>DIAGNOSIS CODE: {code || '-'}</Text>
          
          {/* 3. DI SINI: Tampilkan Title/Nama Deskripsi Kerusakannya */}
          <Text style={styles.headerTitle}>{title || 'No Title'}</Text>
          
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {diagnosisType === 'CODE' ? 'Failure-code' : `${diagnosisType}-Mode`}
              </Text>
            </View>
            <Text style={styles.sectionLabelText}>
              • {data.length} {data.length === 1 ? 'Student' : 'Students'} Analyzed
            </Text>
          </View>
        </View>

        {/* Student List */}
        {data.map((item, index) => (
          <MahasiswaCard key={item.nim ?? index} item={item} index={index} />
        ))}
      </ScrollView>
    </View>
  );
};

/* ── UI Styles ── */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  navBackButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: BG,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navBackIcon: {
    fontSize: 20,
    color: NAVY,
    fontWeight: '700',
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: NAVY,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 30,
  },

  /* Center Screens */
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BG,
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
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
    marginBottom: 20,
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
    lineHeight: 18,
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
    color: '#FFF', 
    fontWeight: '600', 
    fontSize: 14,
  },

  /* Header Card */
  headerCard: {
    backgroundColor: NAVY,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: YELLOW,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 15, // Diperkecil sedikit agar tulisan title yang panjang tidak kepotong berantakan
    fontWeight: '800',
    color: '#FFF',
    lineHeight: 26,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  badge: {
    backgroundColor: YELLOW,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: { 
    color: NAVY, 
    fontWeight: '700', 
    fontSize: 11,
  },
  sectionLabelText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },

  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#FAFBCB' + '10', 
    borderBottomWidth: 1,
    borderColor: '#F0F2F5',
  },
  studentInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  indexBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: BG,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 15,
    fontWeight: '700',
    color: NAVY,
  },
  studentNim: {
    fontSize: 12,
    color: MUTED,
    fontWeight: '600',
    marginTop: 1,
  },
  searchCountBox: {
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  searchCountText: { 
    fontSize: 11, 
    fontWeight: '700', 
    color: NAVY,
  },
  cardBody: {
    padding: 14,
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  verticalDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 12,
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
    marginBottom: 2,
  },
  infoValue: { 
    fontSize: 13, 
    fontWeight: '700', 
    color: NAVY,
  },
});

export default RiwayatDetailScreen;