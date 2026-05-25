import axios from 'axios';
import { clearToken, getToken } from '../utils/storage';

// Set your backend URL here — update when deploying to Railway
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://gamifying-production.up.railway.app/api';

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

  async checkIn() {
    return this.unwrap(await this.client.post('/checkins'));
  }

  async qrCheckin(qrPayload) {
    return this.unwrap(await this.client.post('/checkins/qr', { qrPayload }));
  }

  async getCheckins(userId) {
    return this.unwrap(await this.client.get(`/checkins/user/${userId}`));
  }

  async socialCheckin(imageUri) {
    const form = new FormData();
    form.append('screenshot', {
      uri: imageUri,
      name: 'screenshot.jpg',
      type: 'image/jpeg',
    });
    return this.unwrap(
      await this.client.post('/checkins/social', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      })
    );
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

  async challenge(defenderId, moves) {
    return this.unwrap(await this.client.post(`/battles/challenge/${defenderId}`, { moves }));
  }

  async getBattlesRemaining() {
    return this.unwrap(await this.client.get('/battles/remaining'));
  }

  async getBattleVideo(battleId) {
    return this.unwrap(await this.client.get(`/battles/${battleId}/video`));
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

  async sendFeedback(message) {
    return this.unwrap(await this.client.post('/feedback', { message }));
  }

  async getFeedback(gymId) {
    return this.unwrap(await this.client.get(`/feedback/${gymId}`));
  }

  async getTodayWod(gymId) {
    return this.unwrap(await this.client.get(`/wods/today/${gymId}`));
  }

  async submitWodResults(wodId, results) {
    return this.unwrap(await this.client.post(`/wods/${wodId}/results`, { results }));
  }

  async getMonthlyAthletes(gymId) {
    return this.unwrap(await this.client.get(`/wods/monthly/${gymId}`));
  }

  async getPendingChallenges() {
    return this.unwrap(await this.client.get('/battles/pending'));
  }

  async respondToChallenge(battleId, moves) {
    return this.unwrap(await this.client.post(`/battles/${battleId}/respond`, { moves }));
  }

  async declineChallenge(battleId) {
    return this.unwrap(await this.client.post(`/battles/${battleId}/decline`));
  }
}

const apiService = new ApiService();

export default apiService;
