import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, Alert } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import * as Sharing from 'expo-sharing';
import { Asset } from 'expo-asset';

const KOMATSU_YELLOW = '#FFB800'; 
const DEEP_BLUE = '#001F3F';

const KatalogScreen = ({ navigation }) => {
  
  const manualFiles = [
    { 
      id: '1', 
      title: 'PC200-8 Service Manual', 
      subtitle: 'Shop Manual SEN00084-03',
      size: '65.2 MB', 
      // PASTIKAN NAMA FILE SUDAH DIGANTI DAN SESUAI
      localFile: require('../../assets/pdf/manual_pc200_8.pdf'), 
      fileName: 'manual_pc200_8.pdf'
    },
  ];

  const openPDF = async (fileSource) => {
    try {
      // 1. Download/Load file dari assets ke memory
      const asset = await Asset.fromModule(fileSource).downloadAsync();
      
      if (!asset.localUri) {
        throw new Error("Gagal memproses file lokal.");
      }

      // 2. Cek fitur sharing
      const canShare = await Sharing.isAvailableAsync();
      
      if (canShare) {
        // 3. Share/Buka file
        await Sharing.shareAsync(asset.localUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Buka Service Manual',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert("Error", "HP kamu tidak mendukung fitur untuk membuka file ini.");
      }
    } catch (error) {
      console.log("Detail Error:", error);
      Alert.alert(
        "Gagal Membuka PDF", 
        "1. Pastikan sudah install expo-sharing & expo-asset\n2. Cek apakah file manual_pc200_8.pdf benar ada di folder assets/pdf/\n3. Restart terminal expo"
      );
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.pdfCard} 
      onPress={() => openPDF(item.localFile)}
    >
      <View style={styles.pdfIconBox}>
        <MaterialCommunityIcons name="file-pdf-box" size={32} color="#E74C3C" />
      </View>
      <View style={styles.pdfInfo}>
        <Text style={styles.pdfTitle}>{item.title}</Text>
        <Text style={styles.pdfSubtitle}>{item.subtitle}</Text>
        <Text style={styles.fileDetails}>{item.fileName} • {item.size}</Text>
      </View>
      <View style={styles.openBadge}>
         <MaterialCommunityIcons name="eye-outline" size={20} color={DEEP_BLUE} />
         <Text style={styles.openText}>BUKA</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={DEEP_BLUE} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={26} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Service Manuals</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.sectionLabelContainer}>
            <Text style={styles.sectionLabel}>OFFLINE DOCUMENTS</Text>
            <View style={styles.yellowLine} />
        </View>
        <FlatList
          data={manualFiles}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
        />
      </View>
    </View>
  );
};

// ... (Styles tetap sama seperti sebelumnya)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFDFD' },
  header: {
    backgroundColor: DEEP_BLUE,
    height: 110,
    paddingTop: 50,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomRightRadius: 25,
    borderBottomLeftRadius: 25,
    elevation: 10,
  },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  sectionLabelContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  sectionLabel: { fontSize: 12, fontWeight: '800', color: '#BBB', letterSpacing: 1.2 },
  yellowLine: { flex: 1, height: 2, backgroundColor: KOMATSU_YELLOW, marginLeft: 10 },
  pdfCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    elevation: 4,
  },
  pdfIconBox: { width: 55, height: 55, backgroundColor: '#FDEDEC', borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  pdfInfo: { flex: 1, marginLeft: 15 },
  pdfTitle: { fontSize: 15, fontWeight: '800', color: '#1A1A1A' },
  pdfSubtitle: { fontSize: 12, color: '#666', marginTop: 2 },
  fileDetails: { fontSize: 10, color: '#999', marginTop: 4, fontWeight: '600' },
  openBadge: { alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
  openText: { fontSize: 9, fontWeight: '800', color: DEEP_BLUE, marginTop: 2 }
});

export default KatalogScreen;