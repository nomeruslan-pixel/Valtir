import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScanLine, Package, MapPinOff, Key, BellRing, Database } from 'lucide-react-native';
import { useThemeColors } from '../../theme/useThemeColors';
import { useInventoryStore } from '../../entities/inventory/model/useInventoryStore';

export const HomeScreen = ({ navigation }: any) => {
  const colors = useThemeColors();
  const styles = getStyles(colors);
  
  const items = useInventoryStore((state) => state.items);
  
  const trackedCount = items.filter(i => !!i.linkedTrackerId).length;
  const untrackedCount = items.filter(i => !i.linkedTrackerId).length;
  
  // Sort items by last updated, taking top 2
  const recentItems = [...items].sort((a, b) => 
    new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
  ).slice(0, 2);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Valtir Hub</Text>
          <Text style={styles.headerSubtitle}>Welcome back</Text>
        </View>
        <TouchableOpacity 
          style={styles.avatar}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.avatarText}>V</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>Add Inventory tracker</Text>
            <Text style={styles.heroSubtitle}>Scan a new BLE tag to track</Text>
            
            <TouchableOpacity 
              style={styles.scanButton}
              onPress={() => navigation.navigate('Scan')}
            >
              <ScanLine color={colors.primary} size={16} />
              <Text style={styles.scanButtonText}>Scan Now</Text>
            </TouchableOpacity>
          </View>
          {/* Decorative blur circle simulation */}
          <View style={styles.heroDecoration} />
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: colors.primary + '20' }]}>
              <Package color={colors.primary} size={24} />
            </View>
            <View>
              <Text style={styles.statLabel}>TRACKED</Text>
              <Text style={styles.statValue}>{trackedCount}</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: colors.muted }]}>
              <Database color={colors.mutedForeground} size={24} />
            </View>
            <View>
              <Text style={styles.statLabel}>UNTRACKED</Text>
              <Text style={styles.statValue}>{untrackedCount}</Text>
            </View>
          </View>
        </View>

        {/* Recent Items */}
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={styles.sectionTitle}>Recent Items</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Items')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {recentItems.length === 0 ? (
            <View style={[styles.recentItemCard, { justifyContent: 'center', paddingVertical: 24 }]}>
              <Text style={{ color: colors.mutedForeground }}>No items yet. Add one in Inventory!</Text>
            </View>
          ) : (
            recentItems.map(item => (
              <View key={item.id} style={[styles.recentItemCard, { marginBottom: 12 }]}>
                <View style={styles.recentItemLeft}>
                  <View style={styles.recentItemIcon}>
                    <Package color={colors.mutedForeground} size={24} />
                  </View>
                  <View>
                    <Text style={styles.recentItemTitle}>{item.skuName}</Text>
                    <View style={styles.recentItemStatus}>
                      <View style={[styles.statusDot, { backgroundColor: item.linkedTrackerId ? colors.primary : colors.mutedForeground }]} />
                      <Text style={styles.statusText}>
                        {item.linkedTrackerId ? 'Tracked' : 'Untracked'} • Qty: {item.qty}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Version Indicator */}
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: 'bold' }}>
            v1.0.0 (Build 28) - Bulk Imports & Fixes
          </Text>
        </View>

        {/* Padding for bottom tab bar */}
        <View style={{ height: 100 }} />

      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.foreground,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.mutedForeground,
    marginTop: 2,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: colors.secondaryForeground,
    fontWeight: 'bold',
    fontSize: 16,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: 24,
    padding: 24,
    height: 160,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 32,
  },
  heroContent: {
    zIndex: 2,
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroTitle: {
    color: colors.primaryForeground,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  heroSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
  },
  scanButton: {
    backgroundColor: colors.card,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  scanButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  heroDecoration: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 130,
    height: 130,
    backgroundColor: 'white',
    opacity: 0.1,
    borderRadius: 65,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 6,
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: colors.border,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statLabel: {
    fontSize: 10,
    color: colors.mutedForeground,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.foreground,
    marginTop: 2,
  },
  recentSection: {
    marginBottom: 24,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.foreground,
  },
  viewAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  recentItemCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderColor: colors.border,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  recentItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recentItemIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.muted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  recentItemTitle: {
    fontWeight: '600',
    color: colors.cardForeground,
    fontSize: 16,
  },
  recentItemStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.muted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  b2bCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  b2bCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },
  b2bIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(246, 159, 60, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(246, 159, 60, 0.2)',
  },
  b2bTextContainer: {
    flex: 1,
  },
  b2bTitle: {
    color: colors.foreground,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  b2bSubtitle: {
    color: colors.mutedForeground,
    fontSize: 13,
  },
  b2bChevron: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.muted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  b2bDecoration: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary,
    opacity: 0.05,
    zIndex: 1,
  }
});

