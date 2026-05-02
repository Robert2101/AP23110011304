const axios = require('axios');

class AffordLogger {

    constructor(clientId, clientSecret) {
        if (!clientId || !clientSecret) {
            console.error("AffordLogger requires clientId and clientSecret");
        }
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.token = null;
        this.baseURL = 'http://20.207.122.201/evaluation-service';
    }


    async authenticate() {
        try {
            const response = await axios.post(`${this.baseURL}/auth`, {
                clientId: this.clientId,
                clientSecret: this.clientSecret
            });
            this.token = response.data.access_token;
            return true;
        } catch (error) {
            console.error("Logger Authentication Failed:", error.response?.data || error.message);
            return false;
        }
    }


    async Log(stack, level, pkg, message) {
        if (!this.token) {
            const authSuccess = await this.authenticate();
            if (!authSuccess) return;
        }

        try {
            const payload = {
                stack: stack.toLowerCase(),
                level: level.toLowerCase(),
                package: pkg.toLowerCase(),
                message: message
            };

            const response = await axios.post(`${this.baseURL}/logs`, payload, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log(`[AffordLogger] Successfully logged: ${message}`);
            return response.data;

        } catch (error) {
            console.error("[AffordLogger] Failed to send log:", error.response?.data || error.message);

            if (error.response?.status === 401) {
                this.token = null;
            }
        }
    }
}

module.exports = AffordLogger;