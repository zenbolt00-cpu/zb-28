import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useColors } from '../constants/colors';
import { useThemeStore } from '../store/themeStore';
import GlassHeader from '../components/GlassHeader';

const FAQ_ITEMS = [
  {
    q: "What is Zica Bella?",
    a: "Zica Bella is a premium Indian luxury streetwear brand offering oversized T-shirts, baggy jeans, acid-wash apparel, and bold urban fashion inspired by global street culture."
  },
  {
    q: "Are the products unisex?",
    a: "Yes, Zica Bella apparel is designed to be unisex and suitable for all genders, focusing on universal streetwear silhouettes."
  },
  {
    q: "How does the sizing work?",
    a: "Most Zica Bella T-shirts are designed with an intended oversized streetwear fit. For a true oversized look, select your regular size. Sizing down will give a more fitted, relaxed look."
  },
  {
    q: "Do you offer Cash on Delivery (COD)?",
    a: "Yes, Cash on Delivery (COD) is available on eligible orders across India."
  },
  {
    q: "How long does delivery take?",
    a: "Delivery usually takes 3–7 business days depending on your location in India."
  },
  {
    q: "What is your return policy?",
    a: "Eligible products can be returned according to our return policy. Items must be unworn, unwashed, and have original tags attached."
  }
];

export default function FAQScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const isDark = useThemeStore((s) => s.theme) === 'dark';
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GlassHeader title="FAQ" showBack />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: insets.top + 60, paddingBottom: 100 }}>
        
        <View style={styles.headerArea}>
          <Text style={[styles.title, { color: colors.text }]}>FREQUENTLY{'\n'}ASKED QUESTIONS</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Everything you need to know about Zica Bella.
          </Text>
        </View>

        <View style={styles.faqList}>
          {FAQ_ITEMS.map((item, index) => {
            const isExpanded = expandedIndex === index;
            return (
              <TouchableOpacity 
                key={index} 
                style={styles.faqItemWrapper}
                onPress={() => toggleExpand(index)}
                activeOpacity={0.8}
              >
                <BlurView 
                  intensity={isDark ? 40 : 80} 
                  tint={isDark ? "dark" : "light"} 
                  style={[StyleSheet.absoluteFill, { borderRadius: 16 }]} 
                />
                <View style={[styles.faqItem, { borderColor: colors.glassBorder }]}>
                  <View style={styles.questionRow}>
                    <Text style={[styles.questionText, { color: colors.text }]}>{item.q}</Text>
                    <Ionicons 
                      name={isExpanded ? "chevron-up" : "chevron-down"} 
                      size={16} 
                      color={colors.textExtraLight} 
                    />
                  </View>
                  {isExpanded && (
                    <Text style={[styles.answerText, { color: colors.textSecondary, borderColor: colors.borderLight }]}>
                      {item.a}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerArea: {
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 1,
    lineHeight: 38,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '300',
  },
  faqList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  faqItemWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  faqItem: {
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  questionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    paddingRight: 16,
    lineHeight: 20,
  },
  answerText: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    fontSize: 13,
    lineHeight: 22,
    fontWeight: '300',
  },
});
