import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ImageBackground, Dimensions, FlatList, StatusBar } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width * 0.9; 
const SLIDER_HEIGHT = 220; // TINGGI GAMBAR DIKECILKAN (Dari 300 ke 220)

const HomeScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef(null);

  const carouselData = [
    { id: '1', image: require('../../assets/slide1.jpg'), title: 'Energy Transformation', desc: 'Towards a greener future' },
    { id: '2', image: require('../../assets/slide2.jpg'), title: 'Expert Workforce', desc: 'Standard Astra workshops' },
    { id: '3', image: require('../../assets/slide3.jpg'), title: 'AI Monitoring Tech', desc: 'Real-time condition monitoring' },
    { id: '4', image: require('../../assets/slide4.jpg'), title: 'Preventive Maintenance', desc: 'Optimizing lifetime and efficiency' },
    { id: '5', image: require('../../assets/slide5.jpg'), title: 'Safety First', desc: 'Prioritizing health and safety' },
    { id: '6', image: require('../../assets/slide6.jpg'), title: 'Manual Digitalization', desc: 'Access catalogs anytime' },
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
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
        
        {/* HEADER SECTION - RAISED UP */}
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

        {/* FEATURED SLIDER - BALANCED SIZE */}
        <View style={styles.sliderContainer}>
          <FlatList
            ref={flatListRef}
            data={carouselData}
            horizontal
            pagingEnabled
            snapToInterval={ITEM_WIDTH + 15}
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20 }}
            keyExtractor={(item) => item.id}
            onMomentumScrollEnd={(event) => {
              const newIndex = Math.round(event.nativeEvent.contentOffset.x / (ITEM_WIDTH + 15));
              setActiveIndex(newIndex);
            }}
            renderItem={({ item }) => (
              <TouchableOpacity activeOpacity={0.9} style={styles.slideCard}>
                <ImageBackground source={item.image} style={styles.sliderImage} imageStyle={{ borderRadius: 24 }}>
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

        {/* SCAN BUTTON */}
        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={styles.mainScanButton} 
            onPress={() => navigation.navigate('Scan')}
          >
            <View style={styles.scanContent}>
               <View style={styles.scanIconCircle}>
                 <MaterialCommunityIcons name="view-grid-plus-outline" size={26} color="#FFD700" />
               </View>
               <View style={{marginLeft: 15}}>
                 <Text style={styles.scanHeadline}>Rapid Diagnosis</Text>
                 <Text style={styles.scanSubline}>Scan monitor error codes</Text>
               </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="rgba(255,255,255,0.3)" />
          </TouchableOpacity>
        </View>

        {/* QUICK ACCESS MENU */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>CORE FEATURES</Text>
          
          <TouchableOpacity style={styles.featureCard} onPress={() => navigation.navigate('Chat')}>
            <View style={[styles.iconBox, { backgroundColor: '#E8EFFF' }]}>
               <MaterialCommunityIcons name="robot" size={26} color="#2A52BE" />
            </View>
            <View style={styles.featureInfo}>
                <Text style={styles.featureName}>TAB AI Assistant</Text>
                <Text style={styles.featureDesc}>Smart technical troubleshooting</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#BBB" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.featureCard, { marginTop: 12 }]} onPress={() => navigation.navigate('Katalog')}>
            <View style={[styles.iconBox, { backgroundColor: '#FFF4E5' }]}>
               <MaterialCommunityIcons name="file-document-multiple-outline" size={24} color="#E67E22" />
            </View>
            <View style={styles.featureInfo}>
                <Text style={styles.featureName}>Service Manuals</Text>
                <Text style={styles.featureDesc}>Digital parts & guidebooks</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#BBB" />
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
    paddingTop: 50, // DINAIKKAN (Dari 60 ke 50)
    paddingBottom: 10, // DIRAPATKAN (Dari 20 ke 10)
  },
  profileBox: { flexDirection: 'row', alignItems: 'center' },
  avatarGradient: { 
    width: 52, height: 52, borderRadius: 18, 
    backgroundColor: '#003366', justifyContent: 'center', 
    alignItems: 'center', marginRight: 15,
    elevation: 5
  },
  avatarTxt: { color: '#FFD700', fontWeight: '800', fontSize: 18 },
  greeting: { fontSize: 21, fontWeight: '800', color: '#121212', letterSpacing: -0.5 },
  roleBadge: { 
    backgroundColor: '#F0F0F0', alignSelf: 'flex-start', 
    paddingHorizontal: 10, paddingVertical: 2, borderRadius: 6, marginTop: 2 
  },
  roleText: { color: '#666', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },

  sliderContainer: { marginTop: 15 },
  slideCard: { width: ITEM_WIDTH, marginRight: 15 },
  sliderImage: { 
    width: '100%', 
    height: SLIDER_HEIGHT, 
    justifyContent: 'flex-end',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  imageOverlay: {
    height: '100%',
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
    padding: 20,
    borderRadius: 24,
  },
  textContainer: { marginBottom: 5 },
  titleText: { color: '#FFFFFF', fontWeight: '800', fontSize: 20, lineHeight: 26 },
  descText: { color: '#E0E0E0', fontSize: 13, marginTop: 4, fontWeight: '400' },
  
  pagination: { flexDirection: 'row', justifyContent: 'center', marginTop: 12 },
  dot: { height: 5, width: 5, borderRadius: 3, backgroundColor: '#DDD', marginHorizontal: 3 },
  activeDot: { width: 15, backgroundColor: '#003366' },

  actionSection: { paddingHorizontal: 25, marginTop: 20 },
  mainScanButton: { 
    backgroundColor: '#001F3F', 
    padding: 18, 
    borderRadius: 22, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    elevation: 5
  },
  scanContent: { flexDirection: 'row', alignItems: 'center' },
  scanIconCircle: { width: 44, height: 44, backgroundColor: 'rgba(255,215,0,0.15)', borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  scanHeadline: { fontWeight: 'bold', fontSize: 16, color: '#FFF' },
  scanSubline: { fontSize: 11, color: '#AAA', marginTop: 1 },

  menuSection: { paddingHorizontal: 25, marginTop: 25 },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: '#BBB', marginBottom: 15, letterSpacing: 1.2 },
  
  featureCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFFFFF', 
    padding: 15, 
    borderRadius: 20, 
    borderWidth: 1,
    borderColor: '#F0F0F0',
    elevation: 2
  },
  iconBox: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  featureInfo: { flex: 1, marginLeft: 15 },
  featureName: { fontWeight: '700', color: '#1A1A1A', fontSize: 15 },
  featureDesc: { color: '#999', fontSize: 11, marginTop: 2 },
});

export default HomeScreen;