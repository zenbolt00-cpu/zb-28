import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator,
  Dimensions, Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, Easing, withRepeat, FadeInDown, FadeInUp,
} from 'react-native-reanimated';
import { useColors } from '../constants/colors';
import { useThemeStore } from '../store/themeStore';
import { config } from '../constants/config';
import { useUIStore } from '../store/uiStore';
import GlassHeader from '../components/GlassHeader';
import { Typography } from '../components/Typography';
import { haptics } from '../utils/haptics';

const { width, height } = Dimensions.get('window');

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  createdAt: Date;
  typing?: boolean;
}

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
  if (lower.includes('return') || (lower.includes('refund') && lower.includes('policy'))) return ZICA_AI_RESPONSES.return;
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
  { label: 'Size guide', icon: 'shirt-outline' },
  { label: 'Shipping info', icon: 'car-outline' },
  { label: 'Return policy', icon: 'refresh-outline' },
  { label: 'Trending now', icon: 'flame-outline' },
  { label: 'Payment options', icon: 'card-outline' },
  { label: 'Fabric quality', icon: 'diamond-outline' },
];

const MessageBubble = memo(({ item }: { item: Message }) => {
  const isUser = item.isUser;
  return (
    <Animated.View 
      entering={FadeInDown.duration(400).springify().damping(20)}
      style={[msgStyles.row, isUser && msgStyles.rowRight]}
    >
      <View style={[
        msgStyles.bubble,
        isUser ? msgStyles.userBubble : msgStyles.aiBubble,
        !isUser && msgStyles.aiBubbleDecoration
      ]}>
        <Text style={[msgStyles.text, { color: '#FFF' }]}>
          {item.content}
        </Text>
        <Typography size={8} weight="300" color="rgba(255,255,255,0.3)" style={msgStyles.time}>
          {item.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Typography>
      </View>
    </Animated.View>
  );
});

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const isDark = true; 
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const setTabBarVisible = useUIStore(s => s.setTabBarVisible);
  const isTabBarVisible = useUIStore(s => s.isTabBarVisible);
  const lastScrollY = useRef(0);

  const inputTranslateY = useSharedValue(0);

  useEffect(() => {
    inputTranslateY.value = withTiming(isTabBarVisible ? 0 : 70, {
      duration: 300,
      easing: Easing.bezier(0.33, 1, 0.68, 1),
    });
  }, [isTabBarVisible]);

  const inputAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: inputTranslateY.value }],
  }));

  const handleSend = useCallback((text?: string) => {
    const content = (text ?? input).trim();
    if (!content) return;
    
    Keyboard.dismiss();
    setInput('');
    haptics.buttonTap();

    const userMsg: Message = {
      id: Date.now().toString(),
      content,
      isUser: true,
      createdAt: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    const delay = 800 + Math.random() * 600;
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
      haptics.success();
    }, delay);
  }, [input]);

  const renderOnboarding = () => (
    <View style={styles.onboarding}>
      <Animated.View entering={FadeInUp.delay(200).duration(800)}>
        <Typography heading weight="700" size={32} color="#FFF" style={styles.onboardingTitle}>
          ZICA AI
        </Typography>
        <Typography weight="300" size={12} color="rgba(255,255,255,0.4)" style={styles.onboardingSubtitle}>
          YOUR ARCHIVAL STYLE CONCIERGE
        </Typography>
      </Animated.View>

      <View style={styles.promptGrid}>
        {QUICK_PROMPTS.map((item, idx) => (
          <Animated.View key={idx} entering={FadeInDown.delay(400 + idx * 100).duration(600)}>
            <TouchableOpacity 
              style={styles.promptCard} 
              activeOpacity={0.7}
              onPress={() => handleSend(item.label)}
            >
              <Ionicons name={item.icon as any} size={18} color="rgba(255,255,255,0.6)" />
              <Typography size={10} weight="400" color="#FFF">{item.label}</Typography>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: '#000' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <GlassHeader title="ZICA AI" showBack />

      {messages.length === 0 ? (
        renderOnboarding()
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MessageBubble item={item} />}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 150, paddingTop: insets.top + 70 }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          scrollEventThrottle={16}
        />
      )}

      {isTyping && (
        <View style={styles.typingRow}>
          <Typography size={9} weight="700" color="rgba(255,255,255,0.3)" style={{ letterSpacing: 1 }}>
            ZICA IS THINKING...
          </Typography>
        </View>
      )}

      <Animated.View style={[
        styles.inputBarWrapper,
        { paddingBottom: insets.bottom + 90 },
        inputAnimatedStyle
      ]}>
        <View style={styles.inputPill}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask anything..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            style={styles.input}
            returnKeyType="send"
            onSubmitEditing={() => handleSend()}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            onPress={() => handleSend()}
            disabled={!input.trim() || isTyping}
            style={[styles.sendButton, {
              backgroundColor: input.trim() && !isTyping ? '#FFF' : 'rgba(255,255,255,0.05)',
            }]}
            activeOpacity={0.8}
          >
            {isTyping ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Ionicons name="arrow-up" size={18} color={input.trim() ? '#000' : 'rgba(255,255,255,0.2)'} />
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const msgStyles = StyleSheet.create({
  row: {
    marginBottom: 12,
    flexDirection: 'row',
  },
  rowRight: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: width * 0.8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderBottomLeftRadius: 4,
  },
  aiBubbleDecoration: {
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(52, 199, 89, 0.4)',
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '300',
    letterSpacing: -0.2,
  },
  time: {
    marginTop: 6,
    textAlign: 'right',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  onboarding: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  onboardingTitle: {
    textAlign: 'center',
    letterSpacing: 12,
    marginBottom: 8,
    textShadowColor: 'rgba(255,255,255,0.1)',
    textShadowRadius: 10,
  },
  onboardingSubtitle: {
    textAlign: 'center',
    letterSpacing: 4,
    marginBottom: 48,
  },
  promptGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  promptCard: {
    width: (width - 64 - 12) / 2,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  typingRow: {
    paddingHorizontal: 24,
    paddingBottom: 150,
  },
  inputBarWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  inputPill: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 32,
    padding: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  input: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 120,
    fontWeight: '300',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
    marginRight: 2,
  },
});
