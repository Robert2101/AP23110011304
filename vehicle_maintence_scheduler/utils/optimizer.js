function calculateOptimalTasks(vehicles, maxHours) {
    const n = vehicles.length;
    const dp = new Array(maxHours + 1).fill(0);
    const keep = Array.from({ length: n }, () => new Array(maxHours + 1).fill(false));

    for (let i = 0; i < n; i++) {
        const { Duration: weight, Impact: value, TaskID } = vehicles[i];

        for (let w = maxHours; w >= weight; w--) {
            if (dp[w - weight] + value > dp[w]) {
                dp[w] = dp[w - weight] + value;
                keep[i][w] = true;
            }
        }
    }

    let currentCapacity = maxHours;
    const selectedTaskIds = [];

    for (let i = n - 1; i >= 0; i--) {
        if (keep[i][currentCapacity]) {
            selectedTaskIds.push(vehicles[i].TaskID);
            currentCapacity -= vehicles[i].Duration;
        }
    }

    return {
        maxImpact: dp[maxHours],
        selectedTaskIds
    };
}

module.exports = { calculateOptimalTasks };