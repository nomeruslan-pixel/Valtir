import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { PickTicket } from '../store/useTicketStore';

export const generateAndSharePDF = async (ticket: PickTicket) => {
  try {
    const itemsHtml = ticket.items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.description || '-'}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.targetQuantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.pickedQuantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: ${item.status === 'picked' ? 'green' : 'red'};">${item.status}</td>
      </tr>
    `).join('');

    const photosHtml = ticket.photos && ticket.photos.length > 0 ? ticket.photos.map(photo => `
      <img src="${photo}" style="width: 45%; margin: 2%; border-radius: 8px; object-fit: cover;" />
    `).join('') : '';

    const htmlContent = `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #333; }
            h1 { color: #F69F3C; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #f8f9fa; padding: 12px; text-align: left; border-bottom: 2px solid #ddd; }
            .photos-container { margin-top: 30px; display: flex; flex-wrap: wrap; }
          </style>
        </head>
        <body>
          <h1>Pick Ticket #${ticket.externalId}</h1>
          <p><strong>Status:</strong> ${ticket.status.toUpperCase()}</p>
          <p><strong>Date:</strong> ${new Date(ticket.createdAt).toLocaleString()}</p>
          
          <h2>Items List</h2>
          <table>
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Description</th>
                <th>On Order</th>
                <th>Picked</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          ${ticket.photos && ticket.photos.length > 0 ? `
            <h2>Truck Photos</h2>
            <div class="photos-container">
              ${photosHtml}
            </div>
          ` : ''}
        </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({ html: htmlContent });
    
    const safeExternalId = ticket.externalId.replace(/[^a-zA-Z0-9-_]/g, '_');
    const baseDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
    
    let finalUri = uri;
    if (baseDir) {
      const newUri = baseDir + `PickTicket_${safeExternalId}.pdf`;
      try {
        const fileInfo = await FileSystem.getInfoAsync(newUri);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(newUri);
        }
        await FileSystem.moveAsync({
          from: uri,
          to: newUri
        });
        finalUri = newUri;
      } catch (e) {
        console.error('Error moving pdf to document directory:', e);
      }
    }

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(finalUri, { UTI: '.pdf', mimeType: 'application/pdf' });
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};
