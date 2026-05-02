require('dotenv').config();
const AffordLogger = require('../logging_middleware/index');
const AffordApiService = require('./services/apiService');
const { calculateOptimalTasks } = require('./utils/optimizer');

const logger = new AffordLogger();
const apiService = new AffordApiService(logger);

async function main() {
    try {
        await logger.authenticate();
        await logger.Log("backend", "info", "service", "Initializing Vehicle Maintenance Scheduler job.");

        const depots = await apiService.getDepots();
        const vehicles = await apiService.getVehicles();

        const totalBudgetHours = depots.reduce((acc, depot) => acc + depot.MechanicHours, 0);
        await logger.Log("backend", "info", "service", `Aggregate mechanic budget calculated: ${totalBudgetHours} hours across ${depots.length} depots.`);

        if (totalBudgetHours === 0 || vehicles.length === 0) {
            console.warn("Insufficient data to run optimization engine.");
            return;
        }

        await logger.Log("backend", "info", "service", "Starting dynamic programming optimization sequence...");
        const result = calculateOptimalTasks(vehicles, totalBudgetHours);

        await logger.Log("backend", "info", "service", `Optimization complete. Impact Yield: ${result.maxImpact}. Selected ${result.selectedTaskIds.length} tasks.`);

        console.log("\n==================================================");
        console.log("           SCHEDULER EXECUTION SUMMARY            ");
        console.log("==================================================");
        console.log(` Total Budget (Hours) : ${totalBudgetHours}`);
        console.log(` Max Impact Yield     : ${result.maxImpact}`);
        console.log(` Total Tasks Selected : ${result.selectedTaskIds.length}`);
        console.log("==================================================");
        console.log(" Selected Task IDs:");
        console.log(JSON.stringify(result.selectedTaskIds, null, 2));
        console.log("==================================================\n");

    } catch (error) {
        await logger.Log("backend", "error", "service", `Fatal execution error: ${error.message}`);
        console.error("Scheduler process crashed:", error);
        process.exit(1);
    }
}

main();