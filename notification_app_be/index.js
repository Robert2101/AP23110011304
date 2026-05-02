require('dotenv').config();
const AffordLogger = require('../logging_middleware/index');
const NotificationService = require('./services/apiService');
const { sortNotifications } = require('./utils/prioritySorter');

const logger = new AffordLogger();
const notificationService = new NotificationService(logger);

async function generatePriorityInbox(topN = 10) {
    try {
        await logger.authenticate();
        await logger.Log("backend", "info", "service", "Starting priority inbox gen."); 

        const rawNotifications = await notificationService.fetchNotifications();

        await logger.Log("backend", "info", "service", "Sorting by weight & recency."); 
        const sortedNotifications = sortNotifications(rawNotifications);

        const priorityInbox = sortedNotifications.slice(0, topN);

        await logger.Log("backend", "info", "service", `Generated top ${topN} inbox.`); 

        console.log(`\n=== TOP ${topN} PRIORITY INBOX ===`);
        console.log(JSON.stringify(priorityInbox, null, 2));
        console.log("==============================\n");

    } catch (error) {
        await logger.Log("backend", "error", "service", "Inbox generation failed."); 
        console.error("Process crashed:", error);
        process.exit(1);
    }
}

generatePriorityInbox(10);