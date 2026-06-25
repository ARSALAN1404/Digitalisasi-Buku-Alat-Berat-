import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ImageBackground, Dimensions, FlatList, StatusBar } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width * 0.88; // Ukuran card sedikit lebih kecil dari lebar layar untuk mengintip card sebelah
const SLIDER_HEIGHT = 300; // Tinggi gambar lebih besar

const HomeScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef(null);

  const carouselData = [
    { id: '1', image: require('../../assets/slide1.jpg'), title: 'Energy Transformation', desc: 'Moving towards a greener, sustainable future' },
    { id: '2', image: require('../../assets/slide2.jpg'), title: 'Expert Workforce', desc: 'Astra standard heavy equipment workshops' },
    { id: '3', image: require('../../assets/slide3.jpg'), title: 'AI Monitoring Tech', desc: 'Real-time unit condition monitoring system' },
    { id: '4', image: require('../../assets/slide4.jpg'), title: 'Preventive Maintenance', desc: 'Optimizing component lifetime and efficiency' },
    { id: '5', image: require('../../assets/slide5.jpg'), title: 'Safety First', desc: 'Prioritizing occupational health and safety' },
    { id: '6', image: require('../../assets/slide6.jpg'), title: 'Manual Digitalization', desc: 'Access TAB catalogs anytime, anywhere' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      let nextIndex = activeIndex === carouselData.length - 1 ? 0 : activeIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setActiveIndex(nextIndex);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeIndex]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const session = await AsyncStorage.getItem('user_session');
        if (session) setUserData(JSON.parse(session));
      } catch (error) {
        console.log("Error loading user data", error);
      }
    };
    fetchUser();
  }, []);

  const getInitial = (name) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FDFDFD" />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* HEADER SECTION */}
        <View style={styles.header}>
          <View style={styles.profileBox}>
            <View style={styles.avatarGradient}>
              <Text style={styles.avatarTxt}>{getInitial(userData?.nama)}</Text>
            </View>
            <View>
              <Text style={styles.greeting}>Hello, {userData?.nama?.split(' ')[0] || 'User'}!</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>
                  {userData?.role === 'lecturer' ? 'Lecturer' : (userData?.kelas || 'Astra Traktor')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* FEATURED SLIDER - BIGGER & IMMERSIVE */}
        <View style={styles.sliderContainer}>
          <FlatList
            ref={flatListRef}
            data={carouselData}
            horizontal
            pagingEnabled
            snapToInterval={ITEM_WIDTH + 20}
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20 }}
            keyExtractor={(item) => item.id}
            onMomentumScrollEnd={(event) => {
              const newIndex = Math.round(event.nativeEvent.contentOffset.x / (ITEM_WIDTH + 20));
              setActiveIndex(newIndex);
            }}
            renderItem={({ item }) => (
              <TouchableOpacity activeOpacity={0.9} style={styles.slideCard}>
                <ImageBackground source={item.image} style={styles.sliderImage} imageStyle={{ borderRadius: 28 }}>
                  <View style={styles.imageOverlay}>
                    <View style={styles.textContainer}>
                      <Text style={styles.titleText}>{item.title}</Text>
                      <Text style={styles.descText}>{item.desc}</Text>
                    </View>
                  </View>
                </ImageBackground>
              </TouchableOpacity>
            )}
          />
          <View style={styles.pagination}>
            {carouselData.map((_, i) => (
              <View key={i} style={[styles.dot, activeIndex === i ? styles.activeDot : null]} />
            ))}
          </View>
        </View>

        {/* SCAN BUTTON - FUTURISTIC DARK THEME */}
        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={styles.mainScanButton} 
            onPress={() => navigation.navigate('Scan')}
          >
            <View style={styles.scanContent}>
               <View style={styles.scanIconCircle}>
                 <MaterialCommunityIcons name="view-grid-plus-outline" size={28} color="#FFD700" />
               </View>
               <View style={{marginLeft: 16}}>
                 <Text style={styles.scanHeadline}>Rapid Diagnosis</Text>
                 <Text style={styles.scanSubline}>Scan monitor error codes instantly</Text>
               </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={28} color="rgba(255,255,255,0.3)" />
          </TouchableOpacity>
        </View>

        {/* QUICK ACCESS MENU */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>CORE FEATURES</Text>
          
          <TouchableOpacity style={styles.featureCard} onPress={() => navigation.navigate('Chat')}>
            <View style={[styles.iconBox, { backgroundColor: '#E8EFFF' }]}>
               <MaterialCommunityIcons name="robot-glow" size={26} color="#2A52BE" />
            </View>
            <View style={styles.featureInfo}>
                <Text style={styles.featureName}>TAB AI Assistant</Text>
                <Text style={styles.featureDesc}>Smart technical support & troubleshooting</Text>
            </View>
            <MaterialCommunityIcons name="arrow-right" size={20} color="#BBB" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.featureCard, { marginTop: 16 }]} onPress={() => navigation.navigate('Katalog')}>
            <View style={[styles.iconBox, { backgroundColor: '#FFF4E5' }]}>
               <MaterialCommunityIcons name="file-document-multiple-outline" size={26} color="#E67E22" />
            </View>
            <View style={styles.featureInfo}>
                <Text style={styles.featureName}>Service Manuals</Text>
                <Text style={styles.featureDesc}>Digital parts catalog & guidebooks</Text>
            </View>
            <MaterialCommunityIcons name="arrow-right" size={20} color="#BBB" />
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFDFD' },
  header: {
    paddingHorizontal: 25,
    paddingTop: 60,
    paddingBottom: 20,
  },
  profileBox: { flexDirection: 'row', alignItems: 'center' },
  avatarGradient: { 
    width: 55, height: 55, borderRadius: 20, 
    backgroundColor: '#003366', justifyContent: 'center', 
    alignItems: 'center', marginRight: 15,
    shadowColor: '#003366', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5
  },
  avatarTxt: { color: '#FFD700', fontWeight: '800', fontSize: 20 },
  greeting: { fontSize: 22, fontWeight: '800', color: '#121212', letterSpacing: -0.5 },
  roleBadge: { 
    backgroundColor: '#F0F0F0', alignSelf: 'flex-start', 
    paddingHorizontal: 10, paddingVertical: 2, borderRadius: 8, marginTop: 4 
  },
  roleText: { color: '#666', fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },

  sliderContainer: { marginTop: 10 },
  slideCard: { width: ITEM_WIDTH, marginRight: 20 },
  sliderImage: { 
    width: '100%', 
    height: SLIDER_HEIGHT, 
    justifyContent: 'flex-end',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  imageOverlay: {
    height: '100%',
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
    padding: 25,
    borderRadius: 28,
  },
  textContainer: { marginBottom: 10 },
  titleText: { color: '#FFFFFF', fontWeight: '800', fontSize: 24, lineHeight: 30 },
  descText: { color: '#E0E0E0', fontSize: 14, marginTop: 6, fontWeight: '400' },
  
  pagination: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  dot: { height: 6, width: 6, borderRadius: 3, backgroundColor: '#DDD', marginHorizontal: 4 },
  activeDot: { width: 20, backgroundColor: '#003366' },

  actionSection: { paddingHorizontal: 25, marginTop: 30 },
  mainScanButton: { 
    backgroundColor: '#001F3F', 
    padding: 22, 
    borderRadius: 28, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    elevation: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12
  },
  scanContent: { flexDirection: 'row', alignItems: 'center' },
  scanIconCircle: { width: 50, height: 50, backgroundColor: 'rgba(255,215,0,0.15)', borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  scanHeadline: { fontWeight: 'bold', fontSize: 18, color: '#FFF' },
  scanSubline: { fontSize: 12, color: '#AAA', marginTop: 2 },

  menuSection: { paddingHorizontal: 25, marginTop: 35 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#BBB', marginBottom: 20, letterSpacing: 1.5 },
  
  featureCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFFFFF', 
    padding: 18, 
    borderRadius: 24, 
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2
  },
  iconBox: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  featureInfo: { flex: 1, marginLeft: 16 },
  featureName: { fontWeight: '700', color: '#1A1A1A', fontSize: 16 },
  featureDesc: { color: '#999', fontSize: 12, marginTop: 3 },
});

export default HomeScreen;