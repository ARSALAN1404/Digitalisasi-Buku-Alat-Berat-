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
            <TouchableOpacity onPress={() => setModalVisible(false)}><MaterialCommunityIcons name="close-circle" size={40} color="#FFD700" /></TouchableOpacity>
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

  useEffect(() => {
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
        setMessages(prev => [...prev, { id: 'info-' + Date.now(), sender: 'bot', type: 'info_card', data: finalData }]);
        setTimeout(() => {
          setMessages(prev => [...prev, { id: 'confirm-' + Date.now(), sender: 'bot', type: 'confirm_ask', text: 'View full troubleshooting steps?' }]);
        }, 600);
      }
    } catch (e) { console.log(e); }
    finally { setLoading(false); }
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
        <View style={styles.cardHeaderRow}><MaterialCommunityIcons name="check-decagram" size={16} color="#FFD700" /><Text style={styles.cardInfoTag}> SELECTED DIAGNOSTIC RESULT</Text></View>
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
    return (
      <View style={[styles.msgWrapper, isUser ? styles.userWrapper : styles.botWrapper]}>
        {!isUser && <View style={styles.botAvatar}><MaterialCommunityIcons name="robot-industrial" size={20} color="#FFD700" /></View>}
        
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
                  <View style={styles.modeIconCircle}><MaterialCommunityIcons name={m.icon} size={28} color="#003366" /></View>
                  <Text style={styles.modeCardLabel}>{m.label}</Text>
                  <Text style={styles.modeCardSub}>{m.sub}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : item.type === 'result_list' ? (
          <View style={styles.botBubble}>
            <Text style={styles.botText}>{item.text}</Text>
            {item.data.map((res, i) => (
              <TouchableOpacity key={`${i}-${Date.now()}`} style={styles.resultItem} onPress={() => fetchDetail(res.id, item.mode)}>
                <Text style={styles.resultTitle}>{res.code || res.case_code}</Text>
                <Text style={styles.resultSub} numberOfLines={1}>{res.description || res.title}</Text>
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
               <Text style={styles.btnTextWhite}>Show Steps</Text>
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
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><MaterialCommunityIcons name="chevron-left" size={32} color="#003366" /></TouchableOpacity>
        <Text style={styles.headerTitle}>TAB Diagnostic Bot</Text>
        <TouchableOpacity onPress={resetChat}><MaterialCommunityIcons name="refresh" size={24} color="#003366" /></TouchableOpacity>
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <FlatList
          ref={flatListRef} data={messages} keyExtractor={(item) => item.id}
          renderItem={renderMessage} contentContainerStyle={styles.chatContent}
          onContentSizeChange={() => flatListRef.current.scrollToEnd({ animated: true })}
        />
        {loading && <ActivityIndicator size="small" color="#003366" style={{ marginBottom: 10 }} />}
        {selectedMode && (
          <View style={styles.selectedModeBar}>
             <View style={styles.modeTag}><MaterialCommunityIcons name="bullseye-arrow" size={14} color="#003366" /><Text style={styles.modeTagText}> Active Mode: <Text style={{fontWeight: 'bold'}}>{selectedMode}</Text></Text></View>
             <TouchableOpacity style={styles.changeModeAction} onPress={triggerModeSelection}><Text style={styles.changeModeActionText}>CHANGE MODE</Text></TouchableOpacity>
          </View>
        )}
        <View style={styles.inputArea}>
          <TextInput style={styles.textInput} placeholder={selectedMode ? `Type keyword...` : "Select mode"} value={searchText} onChangeText={setSearchText} onSubmitEditing={() => handleSearch()} editable={!!selectedMode} />
          <TouchableOpacity style={[styles.sendBtn, {backgroundColor: selectedMode ? '#003366' : '#CCC'}]} onPress={() => handleSearch()} disabled={!selectedMode}><MaterialCommunityIcons name="send" size={22} color="#FFD700" /></TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, height: 60, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EEE', elevation: 2 },
    headerTitle: { fontWeight: '900', fontSize: 16, color: '#003366', letterSpacing: 0.5 },
    chatContent: { padding: 15, paddingBottom: 20 },
    msgWrapper: { flexDirection: 'row', marginBottom: 15, width: '100%' },
    userWrapper: { justifyContent: 'flex-end' },
    botWrapper: { justifyContent: 'flex-start' },
    botAvatar: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#003366', justifyContent: 'center', alignItems: 'center', marginRight: 10, alignSelf: 'flex-end' },
    bubble: { padding: 12, borderRadius: 18, maxWidth: '85%' },
    userBubble: { backgroundColor: '#FFD700', borderBottomRightRadius: 2, elevation: 1 },
    botBubble: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#EEE', borderBottomLeftRadius: 2, padding: 12, elevation: 1 },
    userText: { color: '#003366', fontWeight: 'bold' },
    botText: { color: '#333', lineHeight: 20 },
    modeContainer: { backgroundColor: '#FFF', padding: 20, borderRadius: 25, width: SCREEN_WIDTH * 0.82, elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
    modeTitle: { fontSize: 13, color: '#666', fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
    modeGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    modeCard: { width: '48%', backgroundColor: '#F8F9FA', paddingVertical: 15, borderRadius: 20, alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#EEE' },
    modeIconCircle: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    modeCardLabel: { fontWeight: 'bold', fontSize: 14, color: '#003366' },
    modeCardSub: { fontSize: 9, color: '#999', marginTop: 2, fontWeight: '600' },
    selectedModeBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F0F9FF', paddingHorizontal: 15, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#DEEFFF' },
    modeTag: { flexDirection: 'row', alignItems: 'center' },
    modeTagText: { fontSize: 12, color: '#003366' },
    changeModeAction: { backgroundColor: '#003366', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
    changeModeActionText: { color: '#FFD700', fontSize: 10, fontWeight: 'bold' },
    
    infoCard: { backgroundColor: '#001a33', padding: 20, borderRadius: 25, width: SCREEN_WIDTH * 0.85, elevation: 8, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10 },
    cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
    cardInfoTag: { color: '#FFD700', fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },
    infoTitle: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
    infoDesc: { color: '#DDD', fontSize: 13, marginTop: 4, fontStyle: 'italic' },
    divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 15 },
    gridRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    gridCol: { flex: 1 },
    dataSection: { marginBottom: 15 },
    labelSmall: { color: '#888', fontSize: 10, fontWeight: 'bold', marginBottom: 4 },
    valueWhite: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
    valueWhiteSmall: { color: '#EEE', fontSize: 12, lineHeight: 18 },
    valueYellow: { color: '#FFD700', fontSize: 15, fontWeight: 'bold' },

    resultItem: { backgroundColor: '#F8F9FA', padding: 12, borderRadius: 15, marginTop: 10, borderWidth: 1, borderColor: '#EEE' },
    resultTitle: { fontWeight: 'bold', color: '#003366', fontSize: 14 },
    resultSub: { fontSize: 11, color: '#666', marginTop: 3 },
    btnConfirm: { backgroundColor: '#003366', padding: 12, borderRadius: 12, marginTop: 15, alignItems: 'center' },
    btnTextWhite: { color: '#FFF', fontWeight: 'bold' },
    stepCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 25, width: SCREEN_WIDTH * 0.9, elevation: 3, marginTop: 5, borderWidth: 1, borderColor: '#EEE' },
    stepHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    stepBadge: { width: 26, height: 26, borderRadius: 8, backgroundColor: '#003366', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    stepBadgeText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
    stepHeaderText: { color: '#003366', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
    causeDesc: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
    btnCircuit: { backgroundColor: '#334155', padding: 10, borderRadius: 12, marginBottom: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    imageFrame: { borderWidth: 1, borderColor: '#DDD', borderRadius: 15, padding: 8, marginBottom: 15, backgroundColor: '#FAFAFA' },
    imageFrameStandard: { borderRadius: 12, overflow: 'hidden', marginTop: 8 },
    labelFrame: { fontSize: 9, color: '#666', textAlign: 'center', marginBottom: 8, fontWeight: 'bold' },
    fullImage: { width: '100%' },
    methodBox: { backgroundColor: '#F1F3F5', padding: 12, borderRadius: 15, marginBottom: 10 },
    methodText: { fontSize: 13, color: '#444', lineHeight: 20 },
    standardBox: { backgroundColor: '#EBFBEE', padding: 12, borderRadius: 15, marginBottom: 15 },
    standardValueText: { fontSize: 15, fontWeight: 'bold', color: '#2F9E44' },
    standardImage: { width: '100%' },
    remedyBox: { backgroundColor: '#FFF9DB', padding: 12, borderRadius: 15, marginBottom: 15, borderLeftWidth: 4, borderLeftColor: '#F59F00' },
    stepActionRow: { flexDirection: 'row', justifyContent: 'space-between' },
    btnYa: { flex: 1.2, backgroundColor: '#2F9E44', padding: 14, borderRadius: 15, marginRight: 8, alignItems: 'center', elevation: 2 },
    btnTidak: { flex: 1, backgroundColor: '#FFD700', padding: 14, borderRadius: 15, alignItems: 'center', elevation: 2 },
    btnTextBlack: { color: '#000', fontWeight: 'bold' },
    inputArea: { flexDirection: 'row', padding: 12, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#EEE', alignItems: 'center' },
    textInput: { flex: 1, backgroundColor: '#F1F3F5', borderRadius: 25, paddingHorizontal: 20, height: 48, borderWidth: 1, borderColor: '#E9ECEF' },
    sendBtn: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginLeft: 10, elevation: 2 },
    modalContainer: { flex: 1, backgroundColor: '#000' },
    modalHeader: { padding: 20, alignItems: 'flex-end' }
});

export default ChatScreen;