import axios from 'axios';
import { clearToken, getToken } from '../utils/storage';

const BASE_URL = 'http://192.168.86.119:3000/api';

class ApiService {
  constructor() {
    this.onUnauthorized = null;
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' }
    });

    this.client.interceptors.request.use(async (config) => {
      const token = await getToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error?.response?.status === 401) {
          await clearToken();
          if (this.onUnauthorized) this.onUnauthorized();
        }
        return Promise.reject(this.normalizeError(error));
      }
    );
  }

  setUnauthorizedHandler(handler) {
    this.onUnauthorized = handler;
  }

  normalizeError(error) {
    const apiMessage = error?.response?.data?.error;
    if (apiMessage) return new Error(apiMessage);
    if (error.code === 'ECONNABORTED') return new Error('Request timeout');
    return new Error(error.message || 'Network error');
  }

  unwrap(response) {
    return response.data;
  }

  async login(payload) {
    return this.unwrap(await this.client.post('/auth/login', payload));
  }

  async register(payload) {
    return this.unwrap(await this.client.post('/auth/register', payload));
  }

  async me() {
    return this.unwrap(await this.client.get('/auth/me'));
  }

  async createAvatar(payload) {
    return this.unwrap(await this.client.post('/auth/create-avatar', payload, { timeout: 60000 }));
  }

  async updateProfilePhoto(profilePhoto) {
    return this.unwrap(await this.client.put('/auth/profile-photo', { profilePhoto }));
  }

  async checkIn() {
    return this.unwrap(await this.client.post('/checkins'));
  }

  async qrCheckin(qrPayload) {
    return this.unwrap(await this.client.post('/checkins/qr', { qrPayload }));
  }

  async getCheckins(userId) {
    return this.unwrap(await this.client.get(`/checkins/user/${userId}`));
  }

  async getPurchaseQr() {
    return this.unwrap(await this.client.get('/purchases/my-qr'));
  }

  async scanPurchase(qrToken, amount) {
    return this.unwrap(await this.client.post('/purchases/scan', { qrToken, amount }));
  }

  async getGymQrData(gymId) {
    return this.unwrap(await this.client.get(`/gyms/${gymId}/qr-code`));
  }

  async getLeaderboard(gymId) {
    return this.unwrap(await this.client.get(`/leaderboard/${gymId}`));
  }

  async getBodybuilding(gymId) {
    return this.unwrap(await this.client.get(`/leaderboard/${gymId}/bodybuilding`));
  }

  async getAvatar(userId) {
    return this.unwrap(await this.client.get(`/avatar/${userId}`));
  }

  async getFaceOptions() {
    return this.unwrap(await this.client.get('/avatar/face-options'));
  }

  async getShop() {
    return this.unwrap(await this.client.get('/shop'));
  }

  async buyItem(itemId) {
    return this.unwrap(await this.client.post(`/shop/buy/${itemId}`));
  }

  async getInventory(userId) {
    return this.unwrap(await this.client.get(`/shop/inventory/${userId}`));
  }

  async equipItem(userId, itemId) {
    return this.unwrap(await this.client.post(`/avatar/${userId}/equip/${itemId}`));
  }

  async getBattleHistory(userId) {
    return this.unwrap(await this.client.get(`/battles/history/${userId}`));
  }

  async challenge(defenderId) {
    return this.unwrap(await this.client.post(`/battles/challenge/${defenderId}`));
  }

  async getCompetitions(gymId) {
    return this.unwrap(await this.client.get(`/competitions/${gymId}`));
  }

  async getGym(gymId) {
    return this.unwrap(await this.client.get(`/gyms/${gymId}`));
  }

  async getGymMembers(gymId) {
    return this.unwrap(await this.client.get(`/gyms/${gymId}/members`));
  }

  async getSessions() {
    return this.unwrap(await this.client.get('/sessions'));
  }

  async createSession(payload) {
    return this.unwrap(await this.client.post('/sessions', payload));
  }

  async joinSession(sessionId) {
    return this.unwrap(await this.client.post(`/sessions/${sessionId}/join`));
  }

  async cancelSession(sessionId, reason = null) {
    return this.unwrap(await this.client.delete(`/sessions/${sessionId}`, { data: { reason } }));
  }

  async savePushToken(pushToken) {
    return this.unwrap(await this.client.post('/sessions/push-token', { pushToken }));
  }

  async getSessionMessages(sessionId) {
    return this.unwrap(await this.client.get(`/sessions/${sessionId}/messages`));
  }

  async sendSessionMessage(sessionId, text) {
    return this.unwrap(await this.client.post(`/sessions/${sessionId}/messages`, { text }));
  }
}

const apiService = new ApiService();

export default apiService;
