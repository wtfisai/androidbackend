const request = require('supertest');
const { exec } = require('child_process');
const { promisify } = require('util');
const app = require('./src/app'); // Import the Express app directly, not server

// Mock the child_process module
jest.mock('child_process', () => ({
  exec: jest.fn()
}));

// Create a mock for the promisified exec
const execAsync = promisify(exec);

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

      // Mock exec to return a promise
      exec.mockImplementation((command, callback) => {
        callback(null, mockOutput, '');
      });

      const res = await request(app)
        .get('/api/device/properties')
        .set('x-api-key', 'diagnostic-api-key-2024');

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('androidVersion', '11');
      expect(res.body).toHaveProperty('sdkVersion', '30');
      expect(res.body).toHaveProperty('device', 'generic_x86');
      expect(res.body).toHaveProperty('model', 'sdk_gphone_x86');
      expect(res.body).toHaveProperty('manufacturer', 'Google');
    });

    it('should return an error if the command fails', async () => {
      exec.mockImplementation((command, callback) => {
        callback(new Error('Command failed'), '', 'Error');
      });

      const res = await request(app)
        .get('/api/device/properties')
        .set('x-api-key', 'diagnostic-api-key-2024');

      expect(res.statusCode).toEqual(500);
      expect(res.body).toHaveProperty('error');
    });

    it('should return mock data if getprop is not available', async () => {
      const mockOutput = '';
      exec.mockImplementation((command, callback) => {
        callback(null, mockOutput, '');
      });

      const res = await request(app)
        .get('/api/device/properties')
        .set('x-api-key', 'diagnostic-api-key-2024');

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('androidVersion');
      expect(res.body).toHaveProperty('model');
    });
  });
});
