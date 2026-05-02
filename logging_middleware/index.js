require('dotenv').config();
const axios = require('axios');

const VALID_STACKS = ["backend", "frontend"];
const VALID_LEVELS = ["debug", "info", "warn", "error", "fatal"];
const VALID_PACKAGES = [
    "cache", "controller", "cron_job", "db", "domain", "handler", "repository", "route", "service",
    "api", "component", "hook", "page", "state", "style",
    "auth", "config", "middleware", "utils"
];

class AffordLogger {
    constructor() {
        this.token = null;
        this.baseURL = 'http://20.207.122.201/evaluation-service';
    }

    async authenticate() {
        try {
            const response = await axios.post(`${this.baseURL}/auth`, {
                clientID: process.env.CLIENT_ID,
                clientSecret: process.env.CLIENT_SECRET,
                email: process.env.EMAIL,
                name: process.env.NAME,
                rollNo: process.env.ROLL_NO,
                accessCode: process.env.ACCESS_CODE
            });
            this.token = response.data.access_token;
            return true;
        } catch (error) {
            console.error("[AffordLogger] Auth Failed:", error.response?.data || error.message);
            return false;
        }
    }


    async Log(stack, level, pkg, message) {
        const lowerStack = stack.toLowerCase();
        const lowerLevel = level.toLowerCase();
        const lowerPkg = pkg.toLowerCase();

        if (!VALID_STACKS.includes(lowerStack)) console.warn(`[AffordLogger] Warning: '${stack}' is not a standard stack.`);
        if (!VALID_LEVELS.includes(lowerLevel)) console.warn(`[AffordLogger] Warning: '${level}' is not a standard level.`);
        if (!VALID_PACKAGES.includes(lowerPkg)) console.warn(`[AffordLogger] Warning: '${pkg}' is not a standard package.`);

        // 2. Ensure Authentication
        if (!this.token) {
            const authSuccess = await this.authenticate();
            if (!authSuccess) return;
        }

        // 3. Dispatch the Log
        try {
            const payload = {
                stack: lowerStack,
                level: lowerLevel,
                package: lowerPkg,
                message: message
            };

            const response = await axios.post(`${this.baseURL}/logs`, payload, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log(`[AffordLogger] Success | ID: ${response.data.logID}`);
            return response.data;

        } catch (error) {
            console.error("[AffordLogger] Failed to send log:", error.response?.data || error.message);
            // If token expired, clear it to force re-auth on next call
            if (error.response?.status === 401) {
                this.token = null;
            }
        }
    }
}

module.exports = AffordLogger;