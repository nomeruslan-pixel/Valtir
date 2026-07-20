import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Dimensions, Alert, Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { Search, Navigation, Bell, Target } from 'lucide-react-native';
import { useThemeColors } from '../../theme/useThemeColors';
import { api } from '../../api/client';

const { width, height } = Dimensions.get('window');

// Mock pins removed

import { useInventoryStore } from '../../entities/inventory/model/useInventoryStore';

const defaultRegion = { latitude: 37.78825, longitude: -122.4324 };

export const MapScreen = ({ route }: any) => {
  const colors = useThemeColors();
  const styles = getStyles(colors);
  const [selectedPin, setSelectedPin] = useState<any>(null);
  const [pins, setPins] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const webViewRef = useRef<WebView>(null);
  const [currentLoc, setCurrentLoc] = useState(defaultRegion);
  const [zones, setZones] = useState<any[]>([]);

  const items = useInventoryStore((state) => state.items);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    let locationReceived = false;

    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Location permission denied, using default');
          updatePins(defaultRegion.latitude, defaultRegion.longitude);
          return;
        }

        subscription = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, distanceInterval: 1, timeInterval: 2000 },
          (location) => {
            const lat = location.coords.latitude;
            const lng = location.coords.longitude;
            setCurrentLoc({ latitude: lat, longitude: lng });
            
            if (!locationReceived) {
              updatePins(lat, lng);
              locationReceived = true;
            } else {
              updateWebViewLocation(lat, lng);
            }
          }
        );
      } catch (error) {
        console.log('Error getting location, using default');
        updatePins(defaultRegion.latitude, defaultRegion.longitude);
      }
    })();

    return () => {
      if (subscription) subscription.remove();
    };
  }, []);

  useEffect(() => {
    fetchZones();
  }, []);

  const fetchZones = async () => {
    try {
      const res = await api.get('/api/zones/');
      setZones(res.data);
      updateWebViewPins(currentLoc.latitude, currentLoc.longitude, pins, res.data);
    } catch(err) {
      console.log('Failed to fetch zones', err);
    }
  };

  // Handle route params for focusing map
  useEffect(() => {
    if (route?.params?.focusLat && route?.params?.focusLng) {
      // Find if this corresponds to a specific pin
      const matchedPin = pins.find(p => p.coordinate.latitude === route.params.focusLat && p.coordinate.longitude === route.params.focusLng);
      if (matchedPin) {
        setSelectedPin(matchedPin);
      }
      
      // Tell webview to center
      if (webViewRef.current) {
        const data = { type: 'CENTER_MAP', lat: route.params.focusLat, lng: route.params.focusLng };
        webViewRef.current.injectJavaScript(`
          window.postMessage(${JSON.stringify(data)}, '*');
          true;
        `);
      }
    }
  }, [route?.params?.focusLat, route?.params?.focusLng, pins]);

  // Sync items when they change
  useEffect(() => {
    updatePins(currentLoc.latitude, currentLoc.longitude);
  }, [items, zones]);

  const updateWebViewLocation = (lat: number, lng: number) => {
    if (webViewRef.current) {
      const data = { type: 'UPDATE_USER_LOCATION', lat, lng };
      webViewRef.current.injectJavaScript(`
        window.postMessage(${JSON.stringify(data)}, '*');
        true;
      `);
    }
  };

  const handleCenterOnUser = () => {
    if (webViewRef.current) {
      const data = { type: 'CENTER_MAP', lat: currentLoc.latitude, lng: currentLoc.longitude };
      webViewRef.current.injectJavaScript(`
        window.postMessage(${JSON.stringify(data)}, '*');
        true;
      `);
    }
  };

  const updatePins = (lat: number, lng: number) => {
    // Convert inventory items to pins
    const generatedPins = items
      .filter(item => item.lastLocation)
      .map(item => ({
        id: item.id,
        title: item.skuName,
        qty: item.qty,
        color: item.linkedTrackerId ? colors.primary : colors.secondary,
        coordinate: { 
          latitude: item.lastLocation!.lat, 
          longitude: item.lastLocation!.lng 
        }
      }));

    setPins(generatedPins);
    updateWebViewPins(lat, lng, generatedPins, zones);
  };

  const updateWebViewPins = (lat: number, lng: number, pinsToRender: any[], zonesToRender: any[] = zones) => {
    if (webViewRef.current) {
      const data = { type: 'SET_LOCATION', lat, lng, pins: pinsToRender, zones: zonesToRender };
      webViewRef.current.injectJavaScript(`
        window.postMessage(${JSON.stringify(data)}, '*');
        true;
      `);
    }
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    const filteredPins = pins.filter(p => p.title.toLowerCase().includes(text.toLowerCase()));
    updateWebViewPins(currentLoc.latitude, currentLoc.longitude, filteredPins, zones);
    if (filteredPins.length > 0) setSelectedPin(filteredPins[0]);
    else setSelectedPin(null);
  };

  const handleDirections = () => {
    if (!selectedPin) return;
    const { latitude, longitude } = selectedPin.coordinate;
    
    // Tell the WebView to draw a route to the selected pin
    if (webViewRef.current) {
      const data = { type: 'DRAW_ROUTE', destLat: latitude, destLng: longitude };
      webViewRef.current.injectJavaScript(`
        window.postMessage(${JSON.stringify(data)}, '*');
        true;
      `);
    }
  };

  const handleRing = () => {
    if (!selectedPin) return;
    Alert.alert('Ringing', `Playing sound on ${selectedPin.title}...`);
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'PIN_CLICK') {
        const pin = pins.find(p => p.id === data.id);
        if (pin) setSelectedPin(pin);
      } else if (data.type === 'MAP_READY') {
        updateWebViewPins(currentLoc.latitude, currentLoc.longitude, pins, zones);
      }
    } catch(e) {}
  };

  const leafletHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet-routing-machine@latest/dist/leaflet-routing-machine.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script src="https://unpkg.com/leaflet-routing-machine@latest/dist/leaflet-routing-machine.js"></script>
        <style>
            body, html { margin: 0; padding: 0; height: 100%; width: 100%; background-color: #1A1A1A; }
            #map { height: 100%; width: 100%; }
            .leaflet-control-attribution { display: none; }
            .leaflet-control-zoom { display: none; }
            .leaflet-routing-container { display: none !important; } /* Hide the turn-by-turn text UI */
            .custom-div-icon {
              background: transparent;
              border: none;
            }
            @keyframes pulse {
                0% { box-shadow: 0 0 0 0 rgba(66, 133, 244, 0.7); }
                70% { box-shadow: 0 0 0 20px rgba(66, 133, 244, 0); }
                100% { box-shadow: 0 0 0 0 rgba(66, 133, 244, 0); }
            }
            .user-dot {
                background-color: #4285F4;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                border: 3px solid white;
                animation: pulse 2s infinite;
            }
            .zone-tooltip {
                background: transparent;
                border: none;
                box-shadow: none;
                color: white;
                font-weight: bold;
                text-shadow: 1px 1px 2px #000;
                font-size: 14px;
            }
            .zone-tooltip::before {
                display: none;
            }
        </style>
    </head>
    <body>
        <div id="map"></div>
        <script>
            var map = L.map('map', { zoomControl: false }).setView([${defaultRegion.latitude}, ${defaultRegion.longitude}], 15);
            
            L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                maxZoom: 19
            }).addTo(map);

            var markers = {};
            var zoneLayers = [];
            var routingControl = null;
            var userLat = ${defaultRegion.latitude};
            var userLng = ${defaultRegion.longitude};

            window.addEventListener('message', function(event) {
                var data = event.data;
                if (!data || !data.type) return;

                if (data.type === 'SET_LOCATION') {
                    userLat = data.lat;
                    userLng = data.lng;
                    map.setView([data.lat, data.lng], 16);
                    
                    // User location dot
                    if(markers['user']) map.removeLayer(markers['user']);
                    var userIcon = L.divIcon({
                        className: 'custom-div-icon',
                        html: '<div class="user-dot"></div>',
                        iconSize: [22, 22],
                        iconAnchor: [11, 11]
                    });
                    markers['user'] = L.marker([data.lat, data.lng], {icon: userIcon, zIndexOffset: 1000}).addTo(map);
                    
                    if(data.pins) {
                        data.pins.forEach(function(pin) {
                            if(markers[pin.id]) map.removeLayer(markers[pin.id]);
                            var html = '<div style="background-color: ' + pin.color + '; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.5);"></div>';
                            var customIcon = L.divIcon({
                                className: 'custom-div-icon',
                                html: html,
                                iconSize: [30, 30],
                                iconAnchor: [15, 15]
                            });
                            
                            var marker = L.marker([pin.coordinate.latitude, pin.coordinate.longitude], {icon: customIcon}).addTo(map);
                            marker.on('click', function() {
                                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'PIN_CLICK', id: pin.id }));
                            });
                            markers[pin.id] = marker;
                        });
                    }
                    
                    if(data.zones) {
                        zoneLayers.forEach(function(layer) { map.removeLayer(layer); });
                        zoneLayers = [];
                        data.zones.forEach(function(zone) {
                            if (zone.coordinates_json) {
                                try {
                                    var geom = JSON.parse(zone.coordinates_json);
                                    if (geom.type === 'Polygon') {
                                        var coords = geom.coordinates[0].map(function(c) { return [c[1], c[0]]; });
                                        var polygon = L.polygon(coords, {
                                            color: zone.color,
                                            fillColor: zone.color,
                                            fillOpacity: 0.3,
                                            weight: 3
                                        }).addTo(map);
                                        
                                        polygon.bindTooltip(zone.name, {
                                            permanent: true,
                                            direction: 'center',
                                            className: 'zone-tooltip'
                                        });
                                        
                                        zoneLayers.push(polygon);
                                    }
                                } catch(e) {}
                            }
                        });
                    }
                } else if (data.type === 'UPDATE_USER_LOCATION') {
                    userLat = data.lat;
                    userLng = data.lng;
                    if(markers['user']) {
                        markers['user'].setLatLng([data.lat, data.lng]);
                    } else {
                        var userIcon = L.divIcon({
                            className: 'custom-div-icon',
                            html: '<div class="user-dot"></div>',
                            iconSize: [22, 22],
                            iconAnchor: [11, 11]
                        });
                        markers['user'] = L.marker([data.lat, data.lng], {icon: userIcon, zIndexOffset: 1000}).addTo(map);
                    }
                } else if (data.type === 'CENTER_MAP') {
                    map.setView([data.lat, data.lng], 16);
                } else if (data.type === 'DRAW_ROUTE') {
                    if (routingControl) {
                        map.removeControl(routingControl);
                    }
                    routingControl = L.Routing.control({
                        waypoints: [
                            L.latLng(userLat, userLng),
                            L.latLng(data.destLat, data.destLng)
                        ],
                        show: false,
                        addWaypoints: false,
                        routeWhileDragging: false,
                        fitSelectedRoutes: true,
                        createMarker: function() { return null; }, // Prevent creating extra markers
                        lineOptions: {
                            styles: [{color: '#F69F3C', opacity: 0.8, weight: 5}]
                        }
                    }).addTo(map);
                }
            });
            
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_READY' }));
        </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      
      {/* Real Interactive Satellite Map without Google APIs */}
      <WebView 
        ref={webViewRef}
        style={styles.map}
        source={{ html: leafletHtml }}
        onMessage={handleMessage}
        scrollEnabled={false}
        bounces={false}
      />
      {/* Dark overlay specifically for aesthetics, intercepting no touches */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(26, 26, 26, 0.2)', zIndex: 1 }]} pointerEvents="none" />

      {/* Top Search Bar */}
      <View style={styles.searchContainer} pointerEvents="box-none">
        <View style={styles.searchBox}>
          <Search color={colors.mutedForeground} size={20} style={styles.searchIcon} />
          <TextInput
            placeholder="Search locations..."
            placeholderTextColor={colors.mutedForeground}
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>
      </View>

      {/* Floating Locate Button */}
      <View style={[styles.locateButtonContainer, { bottom: selectedPin ? 280 : 120 }]} pointerEvents="box-none">
        <TouchableOpacity style={styles.locateButton} onPress={handleCenterOnUser}>
          <Target color={colors.foreground} size={24} />
        </TouchableOpacity>
      </View>

      {/* Bottom Info Card */}
      {selectedPin && (
        <View style={styles.infoCardContainer} pointerEvents="box-none">
          <View style={styles.infoCard}>
            <View style={styles.infoCardHeader}>
              <View>
                <Text style={styles.infoCardTitle}>{selectedPin.title}</Text>
                <Text style={styles.infoCardSubtitle}>Last seen 2 mins ago</Text>
              </View>
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>Nearby</Text>
              </View>
            </View>

            <View style={styles.actionButtonsRow}>
              <TouchableOpacity style={styles.primaryButton} onPress={handleDirections}>
                <Navigation color={colors.primaryForeground} size={16} />
                <Text style={styles.primaryButtonText}>Directions</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={handleRing}>
                <Bell color={colors.foreground} size={20} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

    </View>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  map: {
    width: width,
    height: height,
    zIndex: 0,
  },
  searchContainer: {
    position: 'absolute',
    top: 60,
    left: 24,
    right: 24,
    zIndex: 10,
  },
  searchBox: {
    backgroundColor: colors.card,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: colors.foreground,
  },
  locateButtonContainer: {
    position: 'absolute',
    right: 24,
    zIndex: 10,
  },
  locateButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoCardContainer: {
    position: 'absolute',
    bottom: 120, // Above nav bar
    left: 24,
    right: 24,
    zIndex: 10,
  },
  infoCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.cardForeground,
  },
  infoCardSubtitle: {
    fontSize: 14,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: 'rgba(245, 247, 117, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.foreground,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    marginRight: 12,
  },
  primaryButtonText: {
    color: colors.primaryForeground,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: colors.muted,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
