import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { ArrowLeft, Check, Minus, Plus, Camera, FileText, Trash2, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useThemeColors } from '../../theme/useThemeColors';
import { useTicketStore, PickTicketItem } from '../../features/tickets/store/useTicketStore';
import { useInventoryStore } from '../../entities/inventory/model/useInventoryStore';
import { generateAndSharePDF } from '../../features/tickets/utils/pdfGenerator';

export const TicketDetailsScreen = ({ route, navigation }: any) => {
  const { ticketId } = route.params;
  const { tickets, updateItemQuantity, addPhoto, removePhoto, deleteTicket } = useTicketStore();
  const { items: inventoryItems, updateItem: updateInventoryItem } = useInventoryStore();
  const colors = useThemeColors();
  const styles = getStyles(colors);
  const [isExporting, setIsExporting] = React.useState(false);

  const ticket = tickets.find(t => t.id === ticketId);

  if (!ticket) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft color={colors.foreground} size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ticket Not Found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleToggleItem = (item: PickTicketItem) => {
    const isPicked = item.status === 'picked' || item.pickedQuantity >= item.targetQuantity;
    
    if (isPicked) {
      // Un-picking all
      // DEPENDENCY TURNED OFF FOR PHASE 1: Do not update inventory
      /*
      const invItem = inventoryItems.find(i => i.skuName === item.sku);
      if (invItem) {
        updateInventoryItem(invItem.id, { qty: invItem.qty + item.pickedQuantity });
      }
      */
      updateItemQuantity(ticket.id, item.id, 0);
    } else {
      // Picking all remaining target quantity
      // DEPENDENCY TURNED OFF FOR PHASE 1: Ignore inventory quantities
      /*
      const qtyToAdd = item.targetQuantity - item.pickedQuantity;
      const invItem = inventoryItems.find(i => i.skuName === item.sku);
      
      if (!invItem || invItem.qty < qtyToAdd) {
        Alert.alert('Error', 'This item is not available or has insufficient quantity in inventory.');
        return;
      }
      
      updateInventoryItem(invItem.id, { qty: invItem.qty - qtyToAdd });
      */
      updateItemQuantity(ticket.id, item.id, item.targetQuantity);
    }
  };

  const handleAdjustQuantity = (item: PickTicketItem, delta: number) => {
    const newQuantity = Math.max(0, Math.min(item.targetQuantity, item.pickedQuantity + delta));
    const actualDelta = newQuantity - item.pickedQuantity;
    
    if (actualDelta === 0) return;

    // DEPENDENCY TURNED OFF FOR PHASE 1: Do not update inventory or block based on it
    /*
    const invItem = inventoryItems.find(i => i.skuName === item.sku);

    if (actualDelta > 0) {
      // Trying to pick more
      if (!invItem || invItem.qty < actualDelta) {
        Alert.alert('Error', 'This item is not available or has insufficient quantity in inventory.');
        return;
      }
      // Decrement from inventory
      updateInventoryItem(invItem.id, { qty: invItem.qty - actualDelta });
    } else {
      // Un-picking (delta is negative), so add back to inventory
      if (invItem) {
        updateInventoryItem(invItem.id, { qty: invItem.qty + Math.abs(actualDelta) });
      }
    }
    */

    updateItemQuantity(ticket.id, item.id, newQuantity);
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      addPhoto(ticket.id, result.assets[0].uri);
    }
  };

  const handleExportPDF = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      await generateAndSharePDF(ticket);
      Alert.alert('Success', 'The PDF was successfully generated and shared!');
    } catch (e: any) {
      const errMsg = e?.message || String(e);
      Alert.alert('Error', `Failed to generate PDF. Details: ${errMsg}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearTicket = () => {
    Alert.alert(
      'Delete Ticket',
      'Are you sure you want to delete this ticket and its photos? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            deleteTicket(ticket.id);
            navigation.goBack();
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft color={colors.foreground} size={24} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>{ticket.externalId}</Text>
          <Text style={styles.headerSubtitle}>{ticket.items.length} items</Text>
        </View>
        <TouchableOpacity onPress={handleClearTicket} style={styles.deleteButton}>
          <Trash2 color={colors.destructive} size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.listContainer}>
        {ticket.items.map((item) => {
          const isPicked = item.status === 'picked' || item.pickedQuantity >= item.targetQuantity;
          let dynamicStyle: any = {};
          
          // Lookup inventory item to get the type if it's missing on the ticket item
          const invItem = inventoryItems.find(i => i.skuName === item.sku || i.skuName === item.name);
          const itemType = item.type || invItem?.type;

          if (!isPicked && itemType) {
            const t = itemType.toLowerCase();
            if (t.includes('fabricated')) {
              dynamicStyle = { backgroundColor: '#FEF9C3', borderColor: '#FDE047' }; // Yellow
            } else if (t.includes('raw')) {
              dynamicStyle = { backgroundColor: '#F3F4F6', borderColor: '#D1D5DB' }; // Grey
            } else if (t.includes('purchased')) {
              dynamicStyle = { backgroundColor: '#FFF7ED', borderColor: '#FB923C' }; // Orange
            }
          }
          
          return (
            <View key={item.id} style={[styles.itemCard, dynamicStyle, isPicked && styles.itemCardPicked]}>
              <View style={styles.itemMainRow}>
                <TouchableOpacity 
                  style={[styles.checkbox, isPicked && styles.checkboxPicked]}
                  onPress={() => handleToggleItem(item)}
                >
                  {isPicked && <Check color={colors.primaryForeground} size={16} />}
                </TouchableOpacity>
                
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemName, isPicked && styles.itemNamePicked]}>{item.name}</Text>
                  <Text style={styles.itemSku}>{item.description || item.sku}</Text>
                </View>
              </View>

              <View style={styles.quantityControls}>
                <TouchableOpacity 
                  style={styles.qtyBtn} 
                  onPress={() => handleAdjustQuantity(item, -1)}
                  disabled={item.pickedQuantity === 0}
                >
                  <Minus color={item.pickedQuantity === 0 ? colors.border : colors.foreground} size={16} />
                </TouchableOpacity>
                
                <View style={styles.qtyTextContainer}>
                  <Text style={styles.qtyText}>
                    <Text style={{ fontWeight: 'bold', color: isPicked ? colors.primary : colors.foreground }}>
                      {item.pickedQuantity}
                    </Text>
                    <Text style={{ color: colors.mutedForeground }}> / {item.targetQuantity}</Text>
                  </Text>
                </View>

                <TouchableOpacity 
                  style={styles.qtyBtn} 
                  onPress={() => handleAdjustQuantity(item, 1)}
                  disabled={item.pickedQuantity >= item.targetQuantity}
                >
                  <Plus color={item.pickedQuantity >= item.targetQuantity ? colors.border : colors.foreground} size={16} />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {/* Photos Section */}
        <View style={styles.photosSection}>
          <Text style={styles.sectionTitle}>Truck Photos</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
            {ticket.photos.map((photoUri, index) => (
              <View key={index} style={styles.photoWrapper}>
                <Image source={{ uri: photoUri }} style={styles.photoImage} />
                <TouchableOpacity 
                  style={styles.photoRemoveBtn}
                  onPress={() => removePhoto(ticket.id, photoUri)}
                >
                  <X color="#FFF" size={12} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.addPhotoBtn} onPress={handleTakePhoto}>
              <Camera color={colors.mutedForeground} size={24} />
              <Text style={styles.addPhotoText}>Add Photo</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={[styles.primaryButton, isExporting && { opacity: 0.7 }]} 
          onPress={handleExportPDF}
          disabled={isExporting}
        >
          <FileText color={colors.primaryForeground} size={20} style={{ marginRight: 8 }} />
          <Text style={styles.primaryButtonText}>
            {isExporting ? 'Generating...' : 'Print / Export PDF'}
          </Text>
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
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  deleteButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.foreground,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.mutedForeground,
    textAlign: 'center',
    marginTop: 2,
  },
  scrollContainer: {
    flex: 1,
  },
  listContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  itemCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemCardPicked: {
    backgroundColor: colors.muted,
    borderColor: colors.primary + '40',
  },
  itemMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.mutedForeground,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxPicked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
  },
  itemNamePicked: {
    textDecorationLine: 'line-through',
    color: colors.mutedForeground,
  },
  itemSku: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 4,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 4,
    alignSelf: 'flex-start',
    marginLeft: 40,
  },
  qtyBtn: {
    width: 36,
    height: 36,
    backgroundColor: colors.card,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  qtyTextContainer: {
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  qtyText: {
    fontSize: 16,
  },
  photosSection: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: colors.foreground,
  },
  photoScroll: {
    flexDirection: 'row',
  },
  photoWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  photoImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  photoRemoveBtn: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.destructive,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoBtn: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.card,
  },
  addPhotoText: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 8,
  },
  bottomBar: {
    padding: 24,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.primaryForeground,
    fontSize: 16,
    fontWeight: 'bold',
  }
});

