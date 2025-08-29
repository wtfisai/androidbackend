const request = require('supertest');
const { exec } = require('child_process');
const app = require('./server'); // Assuming server.js exports the app

jest.mock('child_process');

describe('API Endpoints', () => {
  describe('GET /api/device/properties', () => {
    it('should return parsed device properties on successful command execution', async () => {
      const mockOutput = `
[ro.build.version.release]: [11]
[ro.build.version.sdk]: [30]
[ro.product.device]: [generic_x86]
[ro.product.model]: [sdk_gphone_x86]
[ro.product.manufacturer]: [Google]
[ro.build.id]: [RSR1.200819.001]
[ro.build.date]: [Thu Aug 20 00:00:00 UTC 2020]
      `;
      exec.mockImplementation((command, options, callback) => {
        callback(null, mockOutput, '');
      });

      const res = await request(app)
        .get('/api/device/properties')
        .set('x-api-key', 'diagnostic-api-key-2024');

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual({
        androidVersion: '11',
        sdkVersion: '30',
        device: 'generic_x86',
        model: 'sdk_gphone_x86',
        manufacturer: 'Google',
        buildId: 'RSR1.200819.001',
        buildDate: 'Thu Aug 20 00:00:00 UTC 2020',
        properties: {
          'ro.build.version.release': '11',
          'ro.build.version.sdk': '30',
          'ro.product.device': 'generic_x86',
          'ro.product.model': 'sdk_gphone_x86',
          'ro.product.manufacturer': 'Google',
          'ro.build.id': 'RSR1.200819.001',
          'ro.build.date': 'Thu Aug 20 00:00:00 UTC 2020',
        }
      });
    });

    it('should return an error if the command fails', async () => {
      exec.mockImplementation((command, options, callback) => {
        callback(new Error('Command failed'), '', 'Error');
      });

      const res = await request(app)
        .get('/api/device/properties')
        .set('x-api-key', 'diagnostic-api-key-2024');

      expect(res.statusCode).toEqual(500);
      expect(res.body).toEqual({ error: 'Command failed' });
    });

    it('should return mock data if getprop is not available', async () => {
      const mockOutput = 'getprop command not available';
      exec.mockImplementation((command, options, callback) => {
        callback(null, mockOutput, '');
      });

      const res = await request(app)
        .get('/api/device/properties')
        .set('x-api-key', 'diagnostic-api-key-2024');

      expect(res.statusCode).toEqual(200);
      expect(res.body.androidVersion).toEqual('N/A');
      expect(res.body.model).toEqual('Android Device');
    });
  });
});
