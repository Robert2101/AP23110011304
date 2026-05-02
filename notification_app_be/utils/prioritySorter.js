const PRIORITY_WEIGHTS = {
    "Placement": 3,
    "Result": 2,
    "Event": 1
};


function sortNotifications(notifications) {
    return notifications.sort((a, b) => {
        const weightA = PRIORITY_WEIGHTS[a.Type] || 0;
        const weightB = PRIORITY_WEIGHTS[b.Type] || 0;

        if (weightA !== weightB) {
            return weightB - weightA;
        }
        const timeA = new Date(a.Timestamp).getTime();
        const timeB = new Date(b.Timestamp).getTime();
        return timeB - timeA;
    });
}

module.exports = { sortNotifications };