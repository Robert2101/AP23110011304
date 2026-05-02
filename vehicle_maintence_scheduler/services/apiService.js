const axios = require('axios');

const BASE_URL = 'http://20.207.122.201/evaluation-service';

class AffordApiService {
    constructor(loggerInstance) {
        this.logger = loggerInstance;
    }

    async fetchResource(endpoint) {
        if (!this.logger.token) {
            throw new Error("Authorization token missing. Authenticate logger first.");
        }

        try {
            const response = await axios.get(`${BASE_URL}${endpoint}`, {
                headers: { 'Authorization': `Bearer ${this.logger.token}` }
            });
            return response.data;
        } catch (error) {
            console.error(`[ApiService] Failed to fetch ${endpoint}:`, error.message);
            throw error;
        }
    }

    async getDepots() {
        const data = await this.fetchResource('/depots');
        return data.depots || [];
    }

    async getVehicles() {
        const data = await this.fetchResource('/vehicles');
        return data.vehicles || [];
    }
}

module.exports = AffordApiService;