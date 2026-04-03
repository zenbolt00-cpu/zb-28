import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator,
  Dimensions, Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, Easing, withRepeat,
} from 'react-native-reanimated';
import { useColors } from '../constants/colors';
import { useThemeStore } from '../store/themeStore';
import { useCartStore } from '../store/cartStore';
import { config } from '../constants/config';
import { useUIStore } from '../store/uiStore';
import GlassHeader from '../components/GlassHeader';

const { width, height } = Dimensions.get('window');

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  createdAt: Date;
  typing?: boolean;
}

// Zica AI Knowledge Base — contextual responses
// Zica AI Knowledge Base — minimal, premium responses
const ZICA_AI_RESPONSES: { [key: string]: string } = {
  hello: "Welcome to Zica Bella. I'm Zica AI, your personal style concierge. How can I assist you in your curation today?",
  hi: "Hello. I'm here to help with your Zica Bella experience. What are you looking for?",
  sizing: "Zica Bella pieces are designed with a signature oversized fit. We recommend your true size for the intended silhouette, or sizing down for a more standard fit.\n\nS — 38\" Chest\nM — 40\" Chest\nL — 42\" Chest\nXL — 44\" Chest",
  size: "Our collections follow a specific architectural fit. Most items are pre-shrunk and heavyweight. If you prefer a tailored look, consider one size smaller than your usual.",
  order: "You can track your latest curation in Profile > Order History. Most orders are dispatched within 48 hours and delivered via our premium logistics partners within 3-5 business days.",
  shipping: "We offer complimentary express shipping on all orders over ₹999. International deliveries are handled by DHL and typically arrive within 10-14 days.",
  return: "We accept returns within 7 days of delivery. All items must be in original condition with tags intact. You can initiate a return directly from your Order History.",
  refund: "Refunds are processed to your original payment method within 5 business days of receiving and verifying your return.",
  payment: "We accept all major credit cards, UPI, and net banking. Secure checkout is powered by Razorpay.",
  fabric: "Our pieces are crafted from 240 GSM premium ring-spun cotton. Pre-shrunk and enzyme-washed for a superior hand-feel and longevity.",
  care: "To preserve the integrity of your pieces: wash cold, inside out. Avoid tumble drying. Iron on low heat if necessary.",
  price: "Zica Bella represents accessible luxury. Our curations range from ₹1,299 to ₹4,999, reflecting the premium materials and artisanal finish of every piece.",
  recommend: "Currently, I recommend exploring the Acid Tees for our signature graphic language, or the Vexee Shirts for a more structured, elevated silhouette.",
  style: "The Zica Bella aesthetic is a dialogue between brutalist architecture and luxury streetwear. It is designed for those who appreciate silence and shadow.",
  collection: "Our current repertoire includes Acid Tees, Do-Zak, Drip Denim, Jortsy, and Leather Room. You can explore the full catalog in the Discovery tab.",
  contact: "For dedicated support, you can reach our studio at support@zicabella.com. We aim to respond to all inquiries within 24 hours.",
  discount: "We occasionally release exclusive access codes to our Inner Circle. Ensure you're subscribed to our journal and following @zicabella for updates.",
  track: "Live tracking is available in your Profile under Order History. You will also receive real-time updates via SMS as your order moves through our network.",
  exchange: "Size exchanges are complimentary within 7 days of delivery, subject to availability. Initiate the process via your Orders dashboard.",
  wholesale: "For institutional or bulk inquiries (10+ units), please contact our trade desk at wholesale@zicabella.com.",
  custom: "We offer bespoke production for select projects with a minimum order of 50 units. Please share your brief with custom@zicabella.com.",
  default: "I'm Zica AI. I can guide you through our sizing, shipping, returns, and style philosophy. What would you like to explore?",
};

function getAIResponse(message: string): string {
  const lower = message.toLowerCase();
  
  if (lower.includes('hello') || lower.includes('hey')) return ZICA_AI_RESPONSES.hello;
  if (lower.includes('hi ') || lower === 'hi') return ZICA_AI_RESPONSES.hi;
  if (lower.includes('size') || lower.includes('sizing') || lower.includes('fit')) return ZICA_AI_RESPONSES.sizing;
  if (lower.includes('order') && (lower.includes('track') || lower.includes('status') || lower.includes('where'))) return ZICA_AI_RESPONSES.track;
  if (lower.includes('order') || lower.includes('orders')) return ZICA_AI_RESPONSES.order;
  if (lower.includes('ship') || lower.includes('delivery') || lower.includes('deliver')) return ZICA_AI_RESPONSES.shipping;
  if (lower.includes('return') || lower.includes('refund') && lower.includes('policy')) return ZICA_AI_RESPONSES.return;
  if (lower.includes('refund')) return ZICA_AI_RESPONSES.refund;
  if (lower.includes('exchange')) return ZICA_AI_RESPONSES.exchange;
  if (lower.includes('payment') || lower.includes('pay') || lower.includes('upi') || lower.includes('cod')) return ZICA_AI_RESPONSES.payment;
  if (lower.includes('fabric') || lower.includes('material') || lower.includes('cotton') || lower.includes('quality')) return ZICA_AI_RESPONSES.fabric;
  if (lower.includes('care') || lower.includes('wash') || lower.includes('laundry')) return ZICA_AI_RESPONSES.care;
  if (lower.includes('price') || lower.includes('cost') || lower.includes('how much') || lower.includes('rate')) return ZICA_AI_RESPONSES.price;
  if (lower.includes('recommend') || lower.includes('suggest') || lower.includes('popular') || lower.includes('trending')) return ZICA_AI_RESPONSES.recommend;
  if (lower.includes('style') || lower.includes('aesthetic') || lower.includes('look') || lower.includes('outfit')) return ZICA_AI_RESPONSES.style;
  if (lower.includes('collection') || lower.includes('category') || lower.includes('collections')) return ZICA_AI_RESPONSES.collection;
  if (lower.includes('contact') || lower.includes('support') || lower.includes('help') || lower.includes('email')) return ZICA_AI_RESPONSES.contact;
  if (lower.includes('discount') || lower.includes('offer') || lower.includes('promo') || lower.includes('coupon')) return ZICA_AI_RESPONSES.discount;
  if (lower.includes('wholesale') || lower.includes('bulk') || lower.includes('b2b')) return ZICA_AI_RESPONSES.wholesale;
  if (lower.includes('custom') || lower.includes('print') || lower.includes('personaliz')) return ZICA_AI_RESPONSES.custom;
  if (lower.includes('track') || lower.includes('tracking')) return ZICA_AI_RESPONSES.track;
  
  return ZICA_AI_RESPONSES.default;
}

const QUICK_PROMPTS = [
  'Size guide',
  'Shipping info',
  'Return policy',
  'Trending now',
  'Payment options',
  'Fabric quality',
];

const TypingIndicator = () => {
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    const animate = () => {
      dot1.value = withTiming(1, { duration: 400 }, () => {
        dot1.value = withTiming(0, { duration: 400 });
      });
      setTimeout(() => {
        dot2.value = withTiming(1, { duration: 400 }, () => {
          dot2.value = withTiming(0, { duration: 400 });
        });
      }, 150);
      setTimeout(() => {
        dot3.value = withTiming(1, { duration: 400 }, () => {
          dot3.value = withTiming(0, { duration: 400 });
        });
      }, 300);
    };
    const interval = setInterval(animate, 1000);
    animate();
    return () => clearInterval(interval);
  }, []);

  const s1 = useAnimatedStyle(() => ({ opacity: 0.3 + dot1.value * 0.7, transform: [{ translateY: -dot1.value * 4 }] }));
  const s2 = useAnimatedStyle(() => ({ opacity: 0.3 + dot2.value * 0.7, transform: [{ translateY: -dot2.value * 4 }] }));
  const s3 = useAnimatedStyle(() => ({ opacity: 0.3 + dot3.value * 0.7, transform: [{ translateY: -dot3.value * 4 }] }));

  return (
    <View style={typingStyles.container}>
      <Animated.View style={[typingStyles.dot, s1]} />
      <Animated.View style={[typingStyles.dot, s2]} />
      <Animated.View style={[typingStyles.dot, s3]} />
    </View>
  );
};

const typingStyles = StyleSheet.create({
  container: { flexDirection: 'row', gap: 5, paddingHorizontal: 6, paddingVertical: 4, alignItems: 'flex-end' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#999' },
});

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const isDark = true; // Forced premium Dark Theme for Zica AI
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      content: "Welcome to Zica Bella. I'm Zica AI. I can assist you with sizing, shipping, curations, and more. How may I be of service?",
      isUser: false,
      createdAt: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const setTabBarVisible = useUIStore(s => s.setTabBarVisible);
  const isTabBarVisible = useUIStore(s => s.isTabBarVisible);
  const lastScrollY = useRef(0);

  // Animate input bar to slide down and fill the gap when the tab bar hides
  const inputTranslateY = useSharedValue(0);

  // Animated Orbs for AI background effect
  const orb1TranslateX = useSharedValue(0);
  const orb1TranslateY = useSharedValue(0);
  const orb2TranslateX = useSharedValue(0);
  const orb2TranslateY = useSharedValue(0);

  useEffect(() => {
    orb1TranslateX.value = withRepeat(
      withTiming(width * 0.2, { duration: 8000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    orb1TranslateY.value = withRepeat(
      withTiming(height * 0.1, { duration: 11000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    orb2TranslateX.value = withRepeat(
      withTiming(-width * 0.15, { duration: 9000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    orb2TranslateY.value = withRepeat(
      withTiming(-height * 0.12, { duration: 10000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, []);

  const orb1Style = useAnimatedStyle(() => ({
    transform: [{ translateX: orb1TranslateX.value }, { translateY: orb1TranslateY.value }],
  }));

  const orb2Style = useAnimatedStyle(() => ({
    transform: [{ translateX: orb2TranslateX.value }, { translateY: orb2TranslateY.value }],
  }));

  useEffect(() => {
    inputTranslateY.value = withTiming(isTabBarVisible ? 0 : 70, {
      duration: 300,
      easing: Easing.bezier(0.33, 1, 0.68, 1),
    });
  }, [isTabBarVisible]);

  const inputAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: inputTranslateY.value }],
  }));

  const onScroll = (event: any) => {
    const currentY = event.nativeEvent.contentOffset.y;
    const diff = currentY - lastScrollY.current;
    if (Math.abs(diff) > 5) {
      const isVisible = useUIStore.getState().isTabBarVisible;
      const shouldShow = diff <= 0;
      if (isVisible !== shouldShow) {
        setTabBarVisible(shouldShow);
      }
    }
    lastScrollY.current = currentY;
  };

  const handleSend = useCallback((text?: string) => {
    const content = (text ?? input).trim();
    if (!content) return;
    
    Keyboard.dismiss();
    setInput('');

    const userMsg: Message = {
      id: Date.now().toString(),
      content,
      isUser: true,
      createdAt: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    // Simulate AI thinking delay (0.8–1.5s)
    const delay = 800 + Math.random() * 700;
    setTimeout(() => {
      const response = getAIResponse(content);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        isUser: false,
        createdAt: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, delay);
  }, [input]);

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.isUser;
    return (
      <View style={[msgStyles.row, isUser && msgStyles.rowRight]}>
        {!isUser && (
          <View style={[msgStyles.avatar, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
            <Text style={[msgStyles.avatarText, { color: '#FFF' }]}>Z</Text>
          </View>
        )}
        <View style={msgStyles.bubbleWrapper}>
          <BlurView 
            intensity={isUser ? 90 : 60} 
            tint={isUser ? "light" : "dark"} 
            style={[StyleSheet.absoluteFill, { borderRadius: 20 }]} 
          />
          <View style={[
            msgStyles.bubble,
            isUser ? msgStyles.userBubble : msgStyles.aiBubble
          ]}>
            <View style={msgStyles.textContainer}>
               {item.content.split('\n').map((line, lidx) => (
                  <Text key={lidx} style={[
                    msgStyles.text,
                    { color: isUser ? '#FFF' : '#FFF' },
                    line.startsWith('•') && { marginLeft: 8 }
                  ]}>
                    {line}
                  </Text>
               ))}
            </View>
            <Text style={[msgStyles.time, { color: 'rgba(255,255,255,0.4)' }]}>
              {item.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: '#000' }]} // Strict deep black background
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Cinematic Animated Glass Background */}
      <View style={StyleSheet.absoluteFill}>
        <Animated.View style={[styles.orb1, orb1Style]} />
        <Animated.View style={[styles.orb2, orb2Style]} />
        <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
      </View>

      {/* Header */}
      <GlassHeader title="ZICA AI" showBack />



      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={{ paddingHorizontal: 4, paddingBottom: 100, paddingTop: insets.top + 70 }}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onScroll={onScroll}
        scrollEventThrottle={16}
      />

      {/* AI Typing Indicator */}
      {isTyping && (
        <View style={[styles.typingRow, { paddingBottom: 4 }]}>
          <View style={[msgStyles.avatar, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
            <Text style={[msgStyles.avatarText, { color: '#FFF' }]}>Z</Text>
          </View>
          <View style={styles.typingBubbleWrapper}>
            <BlurView intensity={60} tint="dark" style={[StyleSheet.absoluteFill, { borderRadius: 20 }]} />
            <View style={styles.typingBubble}>
              <TypingIndicator />
            </View>
          </View>
        </View>
      )}

      {/* Quick Prompts */}
      {messages.length <= 1 && (
        <View style={styles.quickPromptsContainer}>
          <FlatList
            data={QUICK_PROMPTS}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.quickPrompt, { borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.05)' }]}
                onPress={() => handleSend(item)}
                activeOpacity={0.7}
              >
                <BlurView intensity={40} tint="dark" style={[StyleSheet.absoluteFill, { borderRadius: 99 }]} />
                <Text style={[styles.quickPromptText, { color: 'rgba(255,255,255,0.8)' }]}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Input Bar (Floating Glass Pill) */}
      <Animated.View style={[
        styles.inputBarWrapper,
        { paddingBottom: insets.bottom + 90 },
        inputAnimatedStyle
      ]}>
        <View style={styles.inputPill}>
          <BlurView
            intensity={80}
            tint="dark"
            style={[StyleSheet.absoluteFill, { borderRadius: 30 }]}
          />
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask anything about Zica Bella…"
            placeholderTextColor="rgba(255,255,255,0.4)"
            style={styles.input}
            returnKeyType="send"
            onSubmitEditing={() => handleSend()}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            onPress={() => handleSend()}
            disabled={!input.trim() || isTyping}
            style={[styles.sendButton, {
              backgroundColor: input.trim() && !isTyping ? '#FFF' : 'rgba(255,255,255,0.1)',
            }]}
            activeOpacity={0.8}
          >
            {isTyping ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Ionicons name="arrow-up" size={16} color={input.trim() ? '#000' : 'rgba(255,255,255,0.3)'} />
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const msgStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 10,
    paddingHorizontal: 16,
  },
  rowRight: {
    flexDirection: 'row-reverse',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 0.5,
  },
  bubbleWrapper: {
    maxWidth: width * 0.75,
    borderRadius: 20,
    overflow: 'hidden',
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userBubble: {
    backgroundColor: 'rgba(255,255,255,0.08)', // Refined subtle dark styling 
  },
  aiBubble: {
    backgroundColor: 'rgba(255,255,255,0.02)', // Deeper contrast for AI
  },
  text: {
    fontSize: 14.5,
    lineHeight: 22,
    fontWeight: '400',
    letterSpacing: -0.3,
  },
  textContainer: {
    gap: 4,
  },
  time: {
    fontSize: 9,
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
    opacity: 0.8,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  orb1: {
    position: 'absolute',
    top: -height * 0.1,
    left: -width * 0.2,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: 'rgba(52, 199, 89, 0.4)', // subtle green glow
  },
  orb2: {
    position: 'absolute',
    bottom: height * 0.1,
    right: -width * 0.3,
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width * 0.6,
    backgroundColor: 'rgba(0, 122, 255, 0.3)', // subtle blue glow
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  aiDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  headerSub: {
    fontSize: 9,
    fontWeight: '300',
    letterSpacing: 1,
    marginTop: 1,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
  },
  aiBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  messagesList: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  typingRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  typingBubbleWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  typingBubble: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  quickPromptsContainer: {
    paddingVertical: 10,
  },
  quickPrompt: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 99,
    borderWidth: 1,
    overflow: 'hidden',
  },
  quickPromptText: {
    fontSize: 12,
    fontWeight: '300',
    letterSpacing: 0.5,
  },
  inputBarWrapper: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  inputPill: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 30,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: '300',
    maxHeight: 120,
    lineHeight: 20,
    color: '#FFF',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    marginBottom: 2,
  },
});
