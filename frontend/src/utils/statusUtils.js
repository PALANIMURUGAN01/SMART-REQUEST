const normalize = (val) => (val || "").toLowerCase().replace(/[\s\-_]+/g, "");

export const getBadgeClass = (status, customColors) => {
    const sNorm = normalize(status || "pending");
    const colors = customColors || {};

    // 1. Robust Mapping for Rejected (Force Red)
    if (sNorm === 'rejected' || sNorm === 'danger' || sNorm === 'failed') {
        return "bg-danger";
    }

    // 2. Check Custom Colors for other statuses
    const matchingKey = Object.keys(colors).find(k => normalize(k) === sNorm);
    let color = colors[matchingKey];

    // 3. Fallback logic
    if (!color) {
        if (sNorm.includes('progress')) color = 'info';
        else if (['completed', 'resolved', 'approved', 'success'].includes(sNorm)) color = 'success';
        else if (sNorm === 'pending') color = 'warning';
        else color = 'warning'; // Default fallback
    }

    // Bootstrap badge classes use bg-[color]
    if (color === 'warning') return "bg-warning text-dark";
    return `bg-${color}`;
};

export const getPriorityBadgeClass = (priority) => {
    const p = (priority || "low").toLowerCase();
    if (p === "high") return "bg-danger";
    if (p === "medium") return "bg-warning text-dark";
    return "bg-secondary";
};
