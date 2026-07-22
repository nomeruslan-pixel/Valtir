import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, Shield, Moon, ChevronRight, LogOut, X, UserX, Bluetooth, FileUp, ClipboardList, ArrowLeft, Settings, ShieldAlert } from 'lucide-react-native';
import { useUserStore } from '../../features/user/store/useUserStore';
import { useBleStore } from '../../entities/tracker/model/useBleStore';
import { useThemeColors } from '../../theme/useThemeColors';
import { useAuthStore } from '../../features/auth/store/useAuthStore';
import * as DocumentPicker from 'expo-document-picker';
import Papa from 'papaparse';
import { useInventoryStore } from '../../entities/inventory/model/useInventoryStore';
import { useTicketStore } from '../../features/tickets/store/useTicketStore';
import { pickAndParseCSV } from '../../features/tickets/utils/csvParser';

export const ProfileScreen = ({ navigation }: any) => {
  const { name, email, notificationsEnabled, darkMode, updateProfile, toggleNotifications, toggleDarkMode } = useUserStore();
  const { showAllDevices, setShowAllDevices } = useBleStore();
  const importInventoryCSV = useInventoryStore(state => state.importCSV);
  const addTicketsFromCSV = useTicketStore(state => state.addTicketsFromCSV);
  const colors = useThemeColors();
  const styles = getStyles(colors);
  const { logout } = useAuthStore();
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(name);
  const [editEmail, setEditEmail] = useState(email);
  const insets = useSafeAreaInsets();

  const handleImportInventory = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'application/csv'],
      });

      if (result.canceled) return;

      const fileUri = result.assets[0].uri;
      const response = await fetch(fileUri);
      const csvText = await response.text();

      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const data = results.data as any[];
          const parsedData = data.map(row => {
            // Exact matching for inventory
            const partNumber = row['Part Number'];
            const sku = row['SKU'];
            const description = row['Description'] || '';
            const type = row['Type'] || null;
            const qty = parseInt(row['Quantity']) || parseInt(row['Qty']) || 1;
            
            const finalSkuName = sku || partNumber;
            
            return {
              skuName: finalSkuName,
              description: description,
              qty: qty,
              type: type, // Adding type
            };
          }).filter(item => !!item.skuName);

          importInventoryCSV(parsedData).then(() => {
            Alert.alert('Success', `Imported ${parsedData.length} items from CSV.`);
          }).catch((err) => {
            Alert.alert('Error', `Failed to import: ${err.message}`);
          });
        },
        error: (error: any) => {
          Alert.alert('Error', `Failed to parse CSV: ${error.message}`);
        }
      });
    } catch (e: any) {
      Alert.alert('Error', 'Failed to read file: ' + e.message);
    }
  };

  const handleImportTickets = async () => {
    try {
      const data = await pickAndParseCSV();
      if (data) {
        if (data.length === 0) {
          Alert.alert('Error', 'The CSV file is empty or could not be parsed properly.');
          return;
        }
        addTicketsFromCSV(data).then(() => {
          Alert.alert('Success', `Imported pick tickets from CSV.`);
        }).catch((err) => {
          Alert.alert('Error', `Failed to import tickets: ${err.message}`);
        });
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred during import.');
    }
  };

  const handleSaveProfile = () => {
    if (!editName.trim() || !editEmail.trim()) {
      Alert.alert('Error', 'Name and email cannot be empty.');
      return;
    }
    updateProfile(editName, editEmail);
    setEditModalVisible(false);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you absolutely sure you want to delete your account? This action cannot be undone and will erase all your tracking data.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => {
            logout(); 
            Alert.alert("Account Deleted", "Your account has been permanently deleted.");
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={[styles.backButton, { top: (insets.top || 40) + 16 }]} 
            onPress={() => navigation.navigate('Tabs', { screen: 'Home' })}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <ArrowLeft color={colors.foreground} size={28} />
          </TouchableOpacity>
          
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.email}>{email}</Text>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => {
              setEditName(name);
              setEditEmail(email);
              setEditModalVisible(true);
            }}
          >
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Settings Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SETTINGS</Text>
            <View style={styles.card}>
              
              {/* Notifications */}
              <View style={[styles.row, styles.borderBottom]}>
                <View style={styles.rowLeft}>
                  <Bell color={colors.mutedForeground} size={20} />
                  <Text style={styles.rowText}>Notifications</Text>
                </View>
                <TouchableOpacity 
                  activeOpacity={0.8} 
                  onPress={toggleNotifications}
                  style={[styles.toggle, notificationsEnabled ? styles.toggleActive : styles.toggleInactive]}
                >
                  <View style={[styles.toggleKnob, notificationsEnabled ? styles.toggleKnobRight : styles.toggleKnobLeft]} />
                </TouchableOpacity>
              </View>

              {/* Privacy */}
              <TouchableOpacity style={[styles.row, styles.borderBottom]} onPress={() => navigation.navigate('Legal')}>
                <View style={styles.rowLeft}>
                  <ShieldAlert color={colors.mutedForeground} size={20} />
                  <Text style={styles.rowText}>Privacy & Terms</Text>
                </View>
                <ChevronRight color={colors.border} size={20} />
              </TouchableOpacity>

              {/* Dark Mode */}
              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <Moon color={colors.mutedForeground} size={20} />
                  <Text style={styles.rowText}>Dark Mode</Text>
                </View>
                <TouchableOpacity 
                  activeOpacity={0.8} 
                  onPress={toggleDarkMode}
                  style={[styles.toggle, darkMode ? styles.toggleActive : styles.toggleInactive]}
                >
                  <View style={[styles.toggleKnob, darkMode ? styles.toggleKnobRight : styles.toggleKnobLeft]} />
                </TouchableOpacity>
              </View>

            </View>
          </View>

          {/* Scanner Settings Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SCANNER</Text>
            <View style={styles.card}>
              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <Bluetooth color={colors.mutedForeground} size={20} />
                  <Text style={styles.rowText}>Show all BLE devices</Text>
                </View>
                <TouchableOpacity 
                  activeOpacity={0.8} 
                  onPress={() => setShowAllDevices(!showAllDevices)}
                  style={[styles.toggle, showAllDevices ? styles.toggleActive : styles.toggleInactive]}
                >
                  <View style={[styles.toggleKnob, showAllDevices ? styles.toggleKnobRight : styles.toggleKnobLeft]} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Data Management Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>DATA MANAGEMENT</Text>
            <View style={styles.card}>
              <TouchableOpacity style={[styles.row, styles.borderBottom]} onPress={handleImportInventory}>
                <View style={styles.rowLeft}>
                  <FileUp color={colors.primary} size={20} />
                  <Text style={styles.rowText}>Import Inventory CSV</Text>
                </View>
                <ChevronRight color={colors.border} size={20} />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.row} onPress={handleImportTickets}>
                <View style={styles.rowLeft}>
                  <ClipboardList color={colors.primary} size={20} />
                  <Text style={styles.rowText}>Import Pick Tickets CSV</Text>
                </View>
                <ChevronRight color={colors.border} size={20} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Danger Zone */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>DANGER ZONE</Text>
            <View style={styles.card}>
              <TouchableOpacity style={styles.row} onPress={handleDeleteAccount}>
                <View style={styles.rowLeft}>
                  <UserX color={colors.destructive} size={20} />
                  <Text style={[styles.rowText, { color: colors.destructive }]}>Delete Account</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.logoutButton, { borderColor: colors.destructive }]} 
            onPress={logout}
          >
            <LogOut color={colors.destructive} size={20} style={{ marginRight: 8 }} />
            <Text style={[styles.logoutButtonText, { color: colors.destructive }]}>Log Out</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isEditModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <X color={colors.foreground} size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.textInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter your name"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.textInput}
                value={editEmail}
                onChangeText={setEditEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.card,
    paddingVertical: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(246, 159, 60, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.cardForeground,
  },
  email: {
    fontSize: 14,
    color: colors.mutedForeground,
    fontWeight: '500',
    marginTop: 4,
  },
  editButton: {
    backgroundColor: colors.foreground,
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
  },
  editButtonText: {
    color: colors.card,
    fontSize: 14,
    fontWeight: 'bold',
  },
  content: {
    padding: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.mutedForeground,
    letterSpacing: 1,
    marginBottom: 12,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.cardForeground,
    marginLeft: 12,
  },
  toggle: {
    width: 40,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: colors.primary,
  },
  toggleInactive: {
    backgroundColor: colors.muted,
  },
  toggleKnob: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.card,
    position: 'absolute',
  },
  toggleKnobRight: {
    right: 4,
  },
  toggleKnobLeft: {
    left: 4,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 48,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.foreground,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.mutedForeground,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.foreground,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: colors.primaryForeground,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
