import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const allDevices = await base44.asServiceRole.entities.BluetoothDevice.list();

    // Filter devices with battery_level set and below 20%
    const lowBatteryDevices = allDevices.filter(
      (d) => typeof d.battery_level === 'number' && d.battery_level < 20
    );

    if (lowBatteryDevices.length === 0) {
      console.log('No low-battery devices found. No report sent.');
      return Response.json({ message: 'No low-battery devices. Report skipped.' });
    }

    // Group by owner (created_by)
    const byOwner = {};
    for (const device of lowBatteryDevices) {
      const owner = device.created_by || 'unknown';
      if (!byOwner[owner]) byOwner[owner] = [];
      byOwner[owner].push(device);
    }

    // Send an email per owner
    for (const [ownerEmail, devices] of Object.entries(byOwner)) {
      if (!ownerEmail || ownerEmail === 'unknown') continue;

      const rows = devices.map((d) => {
        const battery = d.battery_level != null ? `${d.battery_level}%` : 'N/A';
        const batteryColor = d.battery_level < 10 ? '#dc2626' : '#f97316';
        const lastSeen = d.last_seen ? new Date(d.last_seen).toLocaleString() : 'Never';
        return `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0">${d.device_name || 'Unnamed'}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0">${d.device_type || 'unknown'}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:${batteryColor};font-weight:700">${battery}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0">${d.address || 'No location'}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0">${lastSeen}</td>
        </tr>`;
      }).join('');

      const body = `
        <div style="font-family:Inter,sans-serif;max-width:640px;margin:0 auto;color:#1e293b">
          <h2 style="font-size:20px;font-weight:700;margin-bottom:4px">🔋 Daily Low Battery Report</h2>
          <p style="color:#64748b;margin-top:0">${new Date().toDateString()} — ${devices.length} device(s) with battery below 20%</p>
          <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:16px">
            <thead>
              <tr style="background:#f1f5f9;text-align:left">
                <th style="padding:8px 12px">Device</th>
                <th style="padding:8px 12px">Type</th>
                <th style="padding:8px 12px">Battery</th>
                <th style="padding:8px 12px">Last Location</th>
                <th style="padding:8px 12px">Last Seen</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <p style="margin-top:24px;font-size:12px;color:#94a3b8">Sent by Item Finder · Daily Report</p>
        </div>
      `;

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: ownerEmail,
        subject: `🔋 Item Finder: ${devices.length} device(s) with low battery`,
        body,
      });

      console.log(`Report sent to ${ownerEmail} for ${devices.length} device(s)`);
    }

    return Response.json({ message: 'Reports sent.', count: lowBatteryDevices.length });
  } catch (error) {
    console.error('dailyLowBatteryReport error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});