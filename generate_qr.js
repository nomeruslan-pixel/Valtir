const QRCode = require('qrcode');

QRCode.toFile('C:\\Users\\NoMe\\.gemini\\antigravity\\brain\\e40aff23-ccb6-408c-8afa-3ffb5bf2dd3f\\expo_qr.png', 'exp://192.168.31.162:8081', {
  color: {
    dark: '#000000',
    light: '#FFFFFF'
  }
}, function (err) {
  if (err) throw err;
  console.log('QR Code generated!');
});
