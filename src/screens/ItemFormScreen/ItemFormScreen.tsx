import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Save, MapPin, Bluetooth } from 'lucide-react-native';
import { useThemeColors } from '../../theme/useThemeColors';
import { useInventoryStore } from '../../entities/inventory/model/useInventoryStore';
import * as Location from 'expo-location';

export const ItemFormScreen = ({ navigation, route }: any) => {
  const { itemId, trackerId } = route.params || {};
  const colors = useThemeColors();
  const styles = getStyles(colors);
  
  const items = useInventoryStore((state) => state.items);
  const addItem = useInventoryStore((state) => state.addItem);
  const updateItem = useInventoryStore((state) => state.updateItem);

  const existingItem = itemId ? items.find(i => i.id === itemId) : null;

  const [skuName, setSkuName] = useState(existingItem?.skuName || '');
  const [qty, setQty] = useState(existingItem?.qty?.toString() || '1');
  const [linkedTrackerId, setLinkedTrackerId] = useState<string | null>(existingItem?.linkedTrackerId || trackerId || null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (trackerId && !linkedTrackerId) {
      setLinkedTrackerId(trackerId);
    }
  }, [trackerId]);

  const handleSave = async () => {
    if (!skuName.trim()) {
      Alert.alert('Error', 'SKU Name is required');
      return;
    }

    setIsSaving(true);
    let coords = existingItem?.lastLocation || null;

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        coords = {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        };
      }
    } catch (e) {
      console.warn('Could not get location', e);
    }

    const payload = {
      skuName: skuName.trim(),
      qty: parseInt(qty, 10) || 0,
      linkedTrackerId,
      lastLocation: coords,
    };

    if (existingItem) {
      updateItem(existingItem.id, payload);
    } else {
      addItem(payload);
    }

    setIsSaving(false);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
          <X color={colors.cardForeground} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{existingItem ? 'Edit Item' : 'Add Item'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>SKU Name</Text>
          <TextInput
            style={styles.input}
            value={skuName}
            onChangeText={setSkuName}
            placeholder="e.g. Generator 5000W"
            placeholderTextColor={colors.mutedForeground}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Quantity on Hand</Text>
          <TextInput
            style={styles.input}
            value={qty}
            onChangeText={setQty}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={colors.mutedForeground}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Tracker / Locator</Text>
          <View style={styles.trackerBox}>
            <View style={styles.trackerIcon}>
              <Bluetooth color={linkedTrackerId ? colors.primary : colors.mutedForeground} size={24} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.trackerStatus}>
                {linkedTrackerId ? 'Tracker Linked' : 'No Tracker Linked'}
              </Text>
              {linkedTrackerId && (
                <Text style={styles.trackerIdText} numberOfLines={1}>
                  {linkedTrackerId}
                </Text>
              )}
            </View>
            {!linkedTrackerId && (
              <TouchableOpacity 
                style={styles.linkButton}
                onPress={() => navigation.navigate('Scan', { fromItem: true })}
              >
                <Text style={styles.linkButtonText}>Link</Text>
              </TouchableOpacity>
            )}
            {linkedTrackerId && (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity 
                  style={[styles.linkButton, { backgroundColor: '#3b82f6' }]}
                  onPress={() => navigation.navigate('Radar', { trackerId: linkedTrackerId })}
                >
                  <Text style={styles.linkButtonText}>Find</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.unlinkButton}
                  onPress={() => setLinkedTrackerId(null)}
                >
                  <Text style={styles.unlinkButtonText}>Unlink</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.saveButton, isSaving && { opacity: 0.7 }]} 
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <>
              <Save color={colors.primaryForeground} size={20} style={{ marginRight: 8 }} />
              <Text style={styles.saveButtonText}>Save Item</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.cardForeground,
  },
  container: {
    flex: 1,
    padding: 24,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.mutedForeground,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.cardForeground,
  },
  trackerBox: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  trackerIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  trackerStatus: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.cardForeground,
  },
  trackerIdText: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 4,
    fontFamily: 'monospace',
  },
  linkButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  linkButtonText: {
    color: colors.primaryForeground,
    fontWeight: 'bold',
    fontSize: 14,
  },
  unlinkButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  unlinkButtonText: {
    color: colors.destructive,
    fontWeight: 'bold',
    fontSize: 14,
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
  },
  saveButtonText: {
    color: colors.primaryForeground,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
