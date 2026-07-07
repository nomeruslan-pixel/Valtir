import Papa from 'papaparse';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';

export const pickAndParseCSV = async (): Promise<any[] | null> => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*', // Allow all files because Android sometimes loses CSV mime type from Telegram
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      console.log('Picker canceled or no assets');
      return null;
    }

    const fileUri = result.assets[0].uri;
    
    // Check if it's a CSV by name if possible
    if (result.assets[0].name && !result.assets[0].name.toLowerCase().endsWith('.csv')) {
      Alert.alert('Warning', 'The selected file does not appear to be a CSV file. Attempting to parse anyway...');
    }

    // Use fetch instead of FileSystem to avoid native linking issues
    const response = await fetch(fileUri);
    const fileContent = await response.text();

    return new Promise((resolve, reject) => {
      Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            console.warn('PapaParse errors:', results.errors);
          }
          resolve(results.data);
        },
        error: (error: any) => {
          console.error('PapaParse error:', error);
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error('Error parsing CSV:', error);
    Alert.alert('Error', `Failed to read file: ${(error as any).message}`);
    return null;
  }
};
