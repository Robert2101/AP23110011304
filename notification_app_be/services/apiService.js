const axios = require('axios');

const BASE_URL = 'http://20.207.122.201/evaluation-service';

class NotificationService {
    constructor(loggerInstance) {
        this.logger = loggerInstance;
    }

    async fetchNotifications() {
        if (!this.logger.token) {
            throw new Error("Authorization token missing. Authenticate logger first.");
        }

        try {
            const response = await axios.get(`${BASE_URL}/notifications`, {
                headers: { 'Authorization': `Bearer ${this.logger.token}` }
            });
            return response.data.notifications || [];
        } catch (error) {
            console.error("[NotificationService] Failed to fetch data:", error.message);
            throw error;
        }
    }
}

module.exports = NotificationService;