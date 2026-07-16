import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ClipboardList, ChevronRight, ArrowLeft } from 'lucide-react-native';
import { useThemeColors } from '../../theme/useThemeColors';
import { useTicketStore, TicketStatus } from '../../features/tickets/store/useTicketStore';

export const TicketDashboardScreen = ({ navigation }: any) => {
  const { tickets } = useTicketStore();
  const [activeFilter, setActiveFilter] = useState<TicketStatus | 'all'>('all');
  const colors = useThemeColors();
  const styles = getStyles(colors);

  const filteredTickets = tickets.filter(
    (t) => activeFilter === 'all' || t.status === activeFilter
  );

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case 'not-started': return colors.mutedForeground;
      case 'in-progress': return colors.primary;
      case 'picked': return colors.accent;
      default: return colors.mutedForeground;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft color={colors.foreground} size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pick Tickets</Text>
        </View>
      </View>

      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24 }}>
          {['all', 'not-started', 'in-progress', 'picked'].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.tabButton,
                activeFilter === filter && styles.tabButtonActive
              ]}
              onPress={() => setActiveFilter(filter as any)}
            >
              <Text style={[
                styles.tabText,
                activeFilter === filter && styles.tabTextActive
              ]}>
                {filter === 'all' ? 'All Tickets' : filter.replace('-', ' ').toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {filteredTickets.length === 0 ? (
          <View style={styles.emptyState}>
            <ClipboardList color={colors.mutedForeground} size={48} />
            <Text style={styles.emptyTitle}>No Tickets Found</Text>
            <Text style={styles.emptySubtitle}>
              Go to Profile Settings to import a Pick Tickets CSV file.
            </Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {filteredTickets.map((ticket) => (
              <TouchableOpacity
                key={ticket.id}
                style={styles.ticketCard}
                onPress={() => navigation.navigate('TicketDetails', { ticketId: ticket.id })}
              >
                <View style={styles.ticketLeft}>
                  <View style={styles.ticketIconContainer}>
                    <ClipboardList color={colors.foreground} size={24} />
                  </View>
                  <View>
                    <Text style={styles.ticketIdText}>{ticket.externalId}</Text>
                    <Text style={styles.ticketMetaText}>
                      {ticket.items.length} items • {new Date(ticket.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.ticketRight}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) + '20' }]}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(ticket.status) }]} />
                    <Text style={[styles.statusText, { color: getStatusColor(ticket.status) }]}>
                      {ticket.status.replace('-', ' ')}
                    </Text>
                  </View>
                  <ChevronRight color={colors.border} size={20} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
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
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.foreground,
    letterSpacing: -0.5,
  },
  headerButtons: {
    flexDirection: 'row',
  },
  importButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    paddingVertical: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: colors.muted,
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.mutedForeground,
  },
  tabTextActive: {
    color: colors.primaryForeground,
  },
  scrollContainer: {
    flex: 1,
    paddingTop: 16,
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  ticketCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  ticketLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ticketIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  ticketIdText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.foreground,
  },
  ticketMetaText: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 4,
  },
  ticketRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.foreground,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.mutedForeground,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyButtonText: {
    color: colors.primaryForeground,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
