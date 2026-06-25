import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList,
  ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView, StatusBar,
  Keyboard, Alert, Image, Modal, ScrollView, Dimensions
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { API_ENDPOINTS } from '../data/api'; 

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// WARNA KONSEP (KOMATSU INDUSTRIAL)
const KOMATSU_YELLOW = '#FFB800'; 
const DEEP_BLUE = '#001F3F';

// ==========================================
// HELPER: AUTO-HEIGHT IMAGE COMPONENT
// ==========================================
const AutoHeightImage = ({ uri, style }) => {
  const [aspectRatio, setAspectRatio] = useState(16 / 9); 
  useEffect(() => {
    if (uri) {
      Image.getSize(uri, (width, height) => {
        if (width && height) setAspectRatio(width / height);
      }, (error) => console.log('Failed to get image size:', error));
    }
  }, [uri]);
  return <Image source={{ uri }} style={[style, { aspectRatio }]} resizeMode="contain" />;
};

// ==========================================
// COMPONENT: STEP CARD (TROUBLESHOOTING)
// ==========================================
const StepCard = ({ data, index, isLastStep, onFinish, onNext }) => {
  const [showCircuit, setShowCircuit] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImg, setSelectedImg] = useState(null);

  const handleOpenZoom = (uri) => {
    setSelectedImg(uri);
    setModalVisible(true);
  };

  return (
    <View style={styles.stepCard}>
      <View style={styles.stepHeader}>
        <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>{index + 1}</Text></View>
        <Text style={styles.stepHeaderText}>REPAIR STEP</Text>
      </View>
      <Text style={styles.causeDesc}>{data.cause_description}</Text>
      
      {data.image_url && (
        <TouchableOpacity style={styles.btnCircuit} onPress={() => setShowCircuit(!showCircuit)}>
          <MaterialCommunityIcons name={showCircuit ? "eye-off-outline" : "image-search-outline"} size={18} color="#FFF" />
          <Text style={styles.btnTextWhite}> {showCircuit ? "Hide Diagram" : "View Circuit Diagram"}</Text>
        </TouchableOpacity>
      )}
      {showCircuit && data.image_url && (
        <TouchableOpacity activeOpacity={0.9} style={styles.imageFrame} onPress={() => handleOpenZoom(data.image_url)}>
          <Text style={styles.labelFrame}>CIRCUIT DIAGRAM (Tap to Zoom)</Text>
          <AutoHeightImage uri={data.image_url} style={styles.fullImage} />
        </TouchableOpacity>
      )}

      <View style={styles.methodBox}>
        <Text style={styles.labelSmall}>CHECK METHOD:</Text>
        <Text style={styles.methodText}>{data.check_method || '-'}</Text>
      </View>

      <View style={styles.standardBox}>
        <Text style={styles.labelSmall}>STANDARD CONDITION:</Text>
        <Text style={styles.standardValueText}>{data.standard_condition || '-'}</Text>
        {data.standard_image_url && (
          <TouchableOpacity activeOpacity={0.9} style={styles.imageFrameStandard} onPress={() => handleOpenZoom(data.standard_image_url)}>
            <AutoHeightImage uri={data.standard_image_url} style={styles.standardImage} />
          </TouchableOpacity>
        )}
      </View>

      {data.remedy && (
        <View style={styles.remedyBox}>
            <Text style={[styles.labelSmall, {color: '#B45309'}]}>REMEDY / SOLUTION:</Text>
            <Text style={styles.methodText}>{data.remedy}</Text>
        </View>
      )}

      <View style={styles.stepActionRow}>
        <TouchableOpacity style={styles.btnYa} onPress={onFinish}><Text style={styles.btnTextWhite}>Resolved</Text></TouchableOpacity>
        {!isLastStep && <TouchableOpacity style={styles.btnTidak} onPress={onNext}><Text style={styles.btnTextBlack}>Still Error</Text></TouchableOpacity>}
      </View>

      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <SafeAreaView style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}><MaterialCommunityIcons name="close-circle" size={40} color={KOMATSU_YELLOW} /></TouchableOpacity>
          </SafeAreaView>
          <ScrollView maximumZoomScale={4} minimumZoomScale={1} centerContent={true}>
             <Image source={{ uri: selectedImg }} style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.8 }} resizeMode="contain" />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}; 

// ==========================================
// MAIN SCREEN
// ==========================================
const ChatScreen = ({ navigation, route }) => {
  const [searchText, setSearchText] = useState('');
  const [messages, setMessages] = useState([
    { id: 'start-' + Date.now(), sender: 'bot', text: 'Welcome! Please select a diagnosis mode to search:', type: 'mode_selection' }
  ]);
  const [loading, setLoading] = useState(false);
  const [activeData, setActiveData] = useState(null);
  const [selectedMode, setSelectedMode] = useState(null);
  const flatListRef = useRef();
  const [userNim, setUserNim] = useState(null);

  useEffect(() => {
  const getSession = async () => {
    try {
      const session = await AsyncStorage.getItem('user_session');

      if (session) {
        const userData = JSON.parse(session);
        setUserNim(userData.nim);
      }
    } catch (e) {
      console.log('Gagal ambil session:', e);
    }
  };

  getSession();

  if (route.params?.scannedCode) {
    selectMode('CODE', route.params.scannedCode);
  }
}, [route.params?.scannedCode]);

  const resetChat = () => {
    setSelectedMode(null);
    setMessages([{ id: 'start-' + Date.now(), sender: 'bot', text: 'Welcome! Please select a diagnosis mode to search:', type: 'mode_selection' }]);
  };

  const triggerModeSelection = () => {
    setSelectedMode(null);
    setMessages(prev => [...prev, { 
      id: 'reselect-' + Date.now(), sender: 'bot', text: 'Please select a diagnosis mode again:', type: 'mode_selection' 
    }]);
  };
  

  const selectMode = (mode, autoKeyword = null) => {
    setSelectedMode(mode);
    setMessages(prev => [...prev, 
      { id: 'user-mode-' + Date.now(), sender: 'user', text: `Mode: ${mode}`, type: 'text' },
      { id: 'ask-' + Date.now(), sender: 'bot', text: `Mode ${mode} selected. Please enter your search keyword:`, type: 'text' }
    ]);
    if(autoKeyword) handleSearch(autoKeyword, mode);
  };

  const handleSearch = async (manualKeyword = null, forceMode = null) => {
    const mode = forceMode || selectedMode;
    const keyword = manualKeyword || searchText;
    if (!mode) return triggerModeSelection();
    if (!keyword.trim()) return;

    Keyboard.dismiss();
    if (!manualKeyword) setMessages(prev => [...prev, { id: 'user-msg-' + Date.now(), text: keyword, sender: 'user', type: 'text' }]);
    setSearchText('');
    setLoading(true);

    try {
      const res = await fetch(`${API_ENDPOINTS.failureCode}/search?mode=${mode}&keyword=${keyword}`);
      const data = await res.json();
      if (res.ok && data.length > 0) {
        if (data.length === 1) fetchDetail(data[0].id, mode);
        else setMessages(prev => [...prev, { id: 'list-' + Date.now(), sender: 'bot', text: `Found ${data.length} results, please choose one:`, type: 'result_list', data: data, mode: mode }]);
      } else {
        setMessages(prev => [...prev, { id: 'err-' + Date.now(), sender: 'bot', text: 'Records not found.', type: 'text' }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { id: 'err-' + Date.now(), sender: 'bot', text: 'Server connection failed.', type: 'text' }]);
    } finally { setLoading(false); }
  };

  const fetchDetail = async (id, mode) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_ENDPOINTS.failureCode}/detail?mode=${mode}&id=${id}`);
      const json = await res.json();
      if (res.ok) {
        const finalData = { ...json.header, causes: json.causes };
setActiveData(finalData);

saveToHistory(
  mode,
  mode === 'CODE' ? Number(finalData.id) : null,
  mode !== 'CODE' ? Number(finalData.id) : null,
  finalData.description || finalData.title
);

        setMessages(prev => [...prev, { id: 'info-' + Date.now(), sender: 'bot', type: 'info_card', data: finalData }]);
        setTimeout(() => {
          setMessages(prev => [...prev, { id: 'confirm-' + Date.now(), sender: 'bot', type: 'confirm_ask', text: 'View full troubleshooting steps?' }]);
        }, 600);
      }
    } catch (e) { console.log(e); }
    finally { setLoading(false); }
  };

  const saveToHistory = async (
    diagnosisType,
    failureCodeId,
    troubleshootingCaseId,
    title
  ) => {
    if (!userNim) return;

    try {
    const payload = {
      diagnosisType,
      failureCodeId: failureCodeId ?? null,
      troubleshootingCaseId: troubleshootingCaseId ?? null,
      userNim,
      diagnosisTitle: title
    };

    await fetch(API_ENDPOINTS.saveHistory, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

  } catch (error) {
    console.log('HISTORY ERROR:', error);
  }
  };


  const InfoCard = ({ data }) => {
    const renderItems = (text) => {
      if (!text || text === '-') return <Text style={styles.valueWhiteSmall}>-</Text>;
      const splitItems = text.split('|').map(i => i.trim()).filter(i => i !== "");
      return splitItems.map((item, idx) => (
        <Text key={idx} style={styles.valueWhiteSmall}>• {item}</Text>
      ));
    };

    return (
      <View style={styles.infoCard}>
        <View style={styles.cardHeaderRow}><MaterialCommunityIcons name="shield-check" size={16} color={KOMATSU_YELLOW} /><Text style={styles.cardInfoTag}> DIAGNOSTIC RESULT</Text></View>
        <Text style={styles.infoTitle}>{data.code || data.case_code} {data.user_code ? `(${data.user_code})` : ''}</Text>
        <Text style={styles.infoDesc}>{data.description || data.title}</Text>
        <View style={styles.divider} />
        
        <View style={styles.gridRow}>
          <View style={styles.gridCol}><Text style={styles.labelSmall}>COMPONENT:</Text><Text style={styles.valueWhite}>{data.component_in_charge || '-'}</Text></View>
          <View style={styles.gridCol}><Text style={styles.labelSmall}>CATEGORY:</Text><Text style={styles.valueWhite}>{data.category || data.mode || '-'}</Text></View>
        </View>

        <View style={styles.dataSection}><Text style={styles.labelSmall}>PROBLEM (SYMPTOM):</Text><Text style={styles.valueYellow}>{data.problem_appears || data.trouble_description || '-'}</Text></View>

        {data.contents_of_trouble && (
          <View style={styles.dataSection}><Text style={styles.labelSmall}>CONTENTS OF TROUBLE:</Text><Text style={styles.valueWhiteSmall}>{data.contents_of_trouble}</Text></View>
        )}

        {data.action_of_controller && (
          <View style={styles.dataSection}><Text style={styles.labelSmall}>ACTION OF CONTROLLER:</Text><Text style={styles.valueWhiteSmall}>{data.action_of_controller}</Text></View>
        )}

        {data.related_information && (
          <View style={styles.dataSection}><Text style={styles.labelSmall}>RELATED INFORMATION:</Text>{renderItems(data.related_information)}</View>
        )}
      </View>
    );
  };

  const renderMessage = ({ item }) => {
    const isUser = item.sender === 'user';
    // Menambahkan 'result_list' ke isComplexCard agar dia CENTER
    const isComplexCard = ['info_card', 'mode_selection', 'step_card', 'result_list'].includes(item.type);

    return (
      <View style={[
          styles.msgWrapper, 
          isUser ? styles.userWrapper : styles.botWrapper,
          isComplexCard && { justifyContent: 'center' } 
      ]}>
        {!isUser && !isComplexCard && <View style={styles.botAvatar}><MaterialCommunityIcons name="robot-industrial" size={20} color={KOMATSU_YELLOW} /></View>}
        
        {item.type === 'mode_selection' ? (
          <View style={styles.modeContainer}>
            <Text style={styles.modeTitle}>{item.text}</Text>
            <View style={styles.modeGrid}>
              {[
                { label: 'CODE', icon: 'barcode-scan', sub: 'Failure Code' },
                { label: 'E', icon: 'flash-outline', sub: 'Electrical' },
                { label: 'H', icon: 'water-outline', sub: 'Hydraulic' },
                { label: 'S', icon: 'cog-outline', sub: 'Mechanical' }
              ].map((m) => (
                <TouchableOpacity key={m.label} style={styles.modeCard} onPress={() => selectMode(m.label)}>
                  <View style={styles.modeIconCircle}><MaterialCommunityIcons name={m.icon} size={28} color={DEEP_BLUE} /></View>
                  <Text style={styles.modeCardLabel}>{m.label}</Text>
                  <Text style={styles.modeCardSub}>{m.sub}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : item.type === 'result_list' ? (
          <View style={styles.resultListContainer}>
            <Text style={styles.resultListHeader}>{item.text}</Text>
            {item.data.map((res, i) => (
              <TouchableOpacity key={`${i}-${Date.now()}`} style={styles.resultItem} onPress={() => fetchDetail(res.id, item.mode)}>
                <View style={styles.resultItemRow}>
                    <View style={styles.resultCodeBox}><Text style={styles.resultTitle}>{res.code || res.case_code}</Text></View>
                    <View style={styles.resultInfoBox}>
                        <Text style={styles.resultSub} numberOfLines={2}>{res.description || res.title}</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={DEEP_BLUE} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : item.type === 'info_card' ? <InfoCard data={item.data} /> :
         item.type === 'confirm_ask' ? (
           <View style={styles.botBubble}>
             <Text style={styles.botText}>{item.text}</Text>
             <TouchableOpacity style={styles.btnConfirm} onPress={() => {
                if (activeData?.causes?.length > 0) {
                    setMessages(prev => [...prev, { id: 'step-0-' + Date.now(), sender: 'bot', type: 'step_card', data: activeData.causes[0], currentIndex: 0 }]);
                } else Alert.alert("Info", "Troubleshooting steps not available.");
             }}>
               <Text style={styles.btnTextYellow}>Show Steps</Text>
             </TouchableOpacity>
           </View>
         ) : item.type === 'step_card' ? (
           <StepCard 
              data={item.data} index={item.currentIndex} 
              isLastStep={item.currentIndex === (activeData?.causes?.length || 0) - 1}
              onNext={() => {
                const nextIdx = item.currentIndex + 1;
                setMessages(prev => [...prev, { id: `step-${nextIdx}-${Date.now()}`, sender: 'bot', type: 'step_card', data: activeData.causes[nextIdx], currentIndex: nextIdx }]);
              }}
              onFinish={() => Alert.alert("Success", "Diagnosis complete.")}
           />
         ) : (
           <View style={[styles.bubble, isUser ? styles.userBubble : styles.botBubble]}>
             <Text style={isUser ? styles.userText : styles.botText}>{item.text}</Text>
           </View>
         )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={DEEP_BLUE} />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
            <Text style={styles.headerMainTitle}>TAB DIAGNOSTIC</Text>
            <View style={styles.statusRow}>
                <View style={styles.onlineDot} />
                <Text style={styles.headerSubTitle}>AI System Active</Text>
            </View>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={resetChat}>
            <MaterialCommunityIcons name="refresh" size={22} color={KOMATSU_YELLOW} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <FlatList
          ref={flatListRef} data={messages} keyExtractor={(item) => item.id}
          renderItem={renderMessage} contentContainerStyle={styles.chatContent}
          onContentSizeChange={() => flatListRef.current.scrollToEnd({ animated: true })}
        />
        {loading && <ActivityIndicator size="small" color={DEEP_BLUE} style={{ marginBottom: 10 }} />}
        
        {selectedMode && (
          <View style={styles.selectedModeBar}>
             <View style={styles.modeTag}>
                <MaterialCommunityIcons name="bullseye-arrow" size={14} color={DEEP_BLUE} />
                <Text style={styles.modeTagText}> Active Mode: <Text style={{fontWeight: 'bold'}}>{selectedMode}</Text></Text>
             </View>
             <TouchableOpacity style={styles.changeModeAction} onPress={triggerModeSelection}>
                <Text style={styles.changeModeActionText}>CHANGE MODE</Text>
             </TouchableOpacity>
          </View>
        )}

        <View style={styles.inputArea}>
          <TextInput 
            style={styles.textInput} 
            placeholder={selectedMode ? `Type keyword...` : "Select mode above"} 
            value={searchText} 
            onChangeText={setSearchText} 
            onSubmitEditing={() => handleSearch()} 
            editable={!!selectedMode} 
          />
          <TouchableOpacity 
            style={[styles.sendBtn, {backgroundColor: selectedMode ? DEEP_BLUE : '#CCC'}]} 
            onPress={() => handleSearch()} 
            disabled={!selectedMode}
          >
            <MaterialCommunityIcons name="send" size={22} color={KOMATSU_YELLOW} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F4F7F9' },
    header: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingHorizontal: 15, 
        paddingTop: Platform.OS === 'android' ? 10 : 0,
        height: 75,
        backgroundColor: DEEP_BLUE, 
        borderBottomRightRadius: 25, 
        borderBottomLeftRadius: 25,
        elevation: 8,
    },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    headerTitleContainer: { alignItems: 'center' },
    headerMainTitle: { fontWeight: '900', fontSize: 16, color: '#FFF', letterSpacing: 1.5 },
    statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
    onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ADE80', marginRight: 6 },
    headerSubTitle: { fontSize: 10, color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase' },
    refreshBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12 },

    chatContent: { padding: 15, paddingBottom: 20 },
    msgWrapper: { flexDirection: 'row', marginBottom: 20, width: '100%' },
    userWrapper: { justifyContent: 'flex-end' },
    botWrapper: { justifyContent: 'flex-start' },
    botAvatar: { width: 34, height: 34, borderRadius: 10, backgroundColor: DEEP_BLUE, justifyContent: 'center', alignItems: 'center', marginRight: 10, alignSelf: 'flex-end' },
    
    bubble: { padding: 14, borderRadius: 20, maxWidth: '80%' },
    userBubble: { backgroundColor: KOMATSU_YELLOW, borderBottomRightRadius: 4, alignSelf: 'flex-end' },
    botBubble: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderBottomLeftRadius: 4, padding: 14, maxWidth: '85%' },
    userText: { color: DEEP_BLUE, fontWeight: 'bold', fontSize: 14 },
    botText: { color: '#334155', lineHeight: 20, fontSize: 14 },

    modeContainer: { backgroundColor: '#FFF', padding: 20, borderRadius: 25, width: SCREEN_WIDTH * 0.9, alignSelf: 'center', elevation: 5, borderWidth: 1, borderColor: '#F1F5F9' },
    modeTitle: { fontSize: 12, color: '#64748B', fontWeight: '800', marginBottom: 15, textAlign: 'center' },
    modeGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    modeCard: { width: '48%', backgroundColor: '#F8FAFC', paddingVertical: 15, borderRadius: 20, alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0' },
    modeIconCircle: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    modeCardLabel: { fontWeight: 'bold', fontSize: 14, color: DEEP_BLUE },
    modeCardSub: { fontSize: 9, color: '#94A3B8', marginTop: 2, fontWeight: '700' },

    // PERBAIKAN RESULT LIST (Centered Card)
    resultListContainer: { backgroundColor: '#FFF', padding: 18, borderRadius: 25, width: SCREEN_WIDTH * 0.9, alignSelf: 'center', elevation: 5, borderWidth: 1, borderColor: '#F1F5F9' },
    resultListHeader: { fontSize: 12, color: '#64748B', fontWeight: '800', marginBottom: 15 },
    resultItem: { backgroundColor: '#F8FAFC', padding: 12, borderRadius: 18, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0' },
    resultItemRow: { flexDirection: 'row', alignItems: 'center' },
    resultCodeBox: { backgroundColor: DEEP_BLUE, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, marginRight: 12 },
    resultTitle: { fontWeight: 'bold', color: KOMATSU_YELLOW, fontSize: 13 },
    resultInfoBox: { flex: 1 },
    resultSub: { fontSize: 12, color: '#334155', lineHeight: 18 },

    selectedModeBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 15, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
    modeTag: { flexDirection: 'row', alignItems: 'center' },
    modeTagText: { fontSize: 12, color: DEEP_BLUE },
    changeModeAction: { backgroundColor: DEEP_BLUE, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    changeModeActionText: { color: KOMATSU_YELLOW, fontSize: 10, fontWeight: '900' },
    
    infoCard: { backgroundColor: '#001529', padding: 22, borderRadius: 28, width: SCREEN_WIDTH * 0.92, alignSelf: 'center', elevation: 12, borderWidth: 1, borderColor: 'rgba(255,184,0,0.2)' },
    cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    cardInfoTag: { color: KOMATSU_YELLOW, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    infoTitle: { color: '#FFF', fontSize: 24, fontWeight: '900' },
    infoDesc: { color: '#94A3B8', fontSize: 13, marginTop: 4, fontStyle: 'italic' },
    divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 18 },
    gridRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    gridCol: { flex: 1 },
    dataSection: { marginBottom: 16 },
    labelSmall: { color: '#64748B', fontSize: 10, fontWeight: '900', marginBottom: 5 },
    valueWhite: { color: '#F8FAFC', fontSize: 15, fontWeight: 'bold' },
    valueWhiteSmall: { color: '#CBD5E1', fontSize: 12, lineHeight: 18 },
    valueYellow: { color: KOMATSU_YELLOW, fontSize: 16, fontWeight: 'bold' },

    btnConfirm: { backgroundColor: '#002B5B', padding: 15, borderRadius: 16, marginTop: 15, alignItems: 'center', elevation: 4, borderWidth: 1, borderColor: 'rgba(255,184,0,0.3)' },
    btnTextYellow: { color: KOMATSU_YELLOW, fontWeight: '900', fontSize: 14 },

    stepCard: { backgroundColor: '#FFF', padding: 22, borderRadius: 28, width: SCREEN_WIDTH * 0.92, alignSelf: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#F1F5F9', elevation: 5 },
    stepHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    stepBadge: { width: 28, height: 28, borderRadius: 10, backgroundColor: DEEP_BLUE, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    stepBadgeText: { color: KOMATSU_YELLOW, fontSize: 12, fontWeight: '900' },
    stepHeaderText: { color: DEEP_BLUE, fontWeight: '900', fontSize: 14, letterSpacing: 1.5 },
    causeDesc: { fontSize: 19, fontWeight: '900', color: '#1E293B', marginBottom: 15 },
    btnCircuit: { backgroundColor: '#334155', padding: 12, borderRadius: 14, marginBottom: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    imageFrame: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 18, padding: 10, marginBottom: 15, backgroundColor: '#F8FAFC' },
    imageFrameStandard: { borderRadius: 14, overflow: 'hidden', marginTop: 10 },
    labelFrame: { fontSize: 9, color: '#94A3B8', textAlign: 'center', marginBottom: 10, fontWeight: '800' },
    fullImage: { width: '100%' },
    methodBox: { backgroundColor: '#F1F5F9', padding: 14, borderRadius: 18, marginBottom: 12 },
    methodText: { fontSize: 13, color: '#334155', lineHeight: 22 },
    standardBox: { backgroundColor: '#F0FDF4', padding: 14, borderRadius: 18, marginBottom: 15, borderWidth: 1, borderColor: '#DCFCE7' },
    standardValueText: { fontSize: 16, fontWeight: '900', color: '#166534' },
    standardImage: { width: '100%' },
    remedyBox: { backgroundColor: '#FFFBEB', padding: 14, borderRadius: 18, marginBottom: 15, borderLeftWidth: 5, borderLeftColor: KOMATSU_YELLOW },
    stepActionRow: { flexDirection: 'row', justifyContent: 'space-between' },
    btnYa: { flex: 1.2, backgroundColor: '#166534', padding: 15, borderRadius: 18, marginRight: 10, alignItems: 'center' },
    btnTidak: { flex: 1, backgroundColor: KOMATSU_YELLOW, padding: 15, borderRadius: 18, alignItems: 'center' },
    btnTextBlack: { color: DEEP_BLUE, fontWeight: '900' },
    btnTextWhite: { color: '#FFF', fontWeight: '900' },
    
    inputArea: { flexDirection: 'row', padding: 15, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F1F5F9', alignItems: 'center' },
    textInput: { flex: 1, backgroundColor: '#F1F5F9', borderRadius: 20, paddingHorizontal: 20, height: 52, fontSize: 14, color: '#1E293B' },
    sendBtn: { width: 52, height: 52, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginLeft: 12, elevation: 4 },
    modalContainer: { flex: 1, backgroundColor: '#000' },
    modalHeader: { padding: 20, alignItems: 'flex-end' }
});

export default ChatScreen;