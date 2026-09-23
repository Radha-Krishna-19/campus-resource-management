const Booking = require("../models/booking");
const Room = require("../models/Room");
const { GoogleGenAI } = require('@google/genai');
const { spawn } = require('child_process');
const path = require('path');

// Helper: run Prophet Python script for ML-based demand forecasting
const runProphetScript = (prophetInput) => {
    return new Promise((resolve, reject) => {
        const scriptPath = path.join(__dirname, '../scripts/predict_demand.py');
        // Configurable interpreter: most Linux hosts only ship `python3`, not a `python` shim.
        const py = spawn(process.env.PYTHON_BIN || 'python3', [scriptPath], { timeout: 30000 });

        let stdout = '';
        let stderr = '';

        py.stdout.on('data', (data) => { stdout += data.toString(); });
        py.stderr.on('data', (data) => { stderr += data.toString(); });

        py.on('close', (code) => {
            if (code !== 0) {
                return reject(new Error(`Prophet script exited with code ${code}: ${stderr}`));
            }
            try {
                const result = JSON.parse(stdout.trim());
                if (result.error) return reject(new Error(result.error));
                resolve(result);
            } catch (e) {
                reject(new Error(`Failed to parse Prophet output: ${stdout}`));
            }
        });

        py.on('error', (err) => {
            reject(new Error(`Failed to start Python: ${err.message}`));
        });

        // Feed data via stdin
        py.stdin.write(JSON.stringify(prophetInput));
        py.stdin.end();
    });
};



let aiConfigured = false;
let ai;
const initializeAI = () => {
    if (!aiConfigured && process.env.GEMINI_API_KEY) {
        ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        aiConfigured = true;
    }
};

// Helper: generate algorithmic insights from booking data (no external API required)
const generateAlgorithmicInsights = (forecastData, allRecentBookings, roomMap = {}) => {
    try {
        if (!allRecentBookings || allRecentBookings.length === 0) {
            return {
                recommendations: "No booking data available yet. Insights will appear once bookings are recorded.",
                monopolizationAlerts: "No data to analyse.",
                efficiencyScore: 0,
                predictedIssues: "Data pending.",
                peakTimings: { busiestDay: "N/A", busiestHour: "N/A", avgDuration: "N/A", context: "Waiting for data..." },
                actions: []
            };
        }

        // Busiest days & hours
        const dayCounts = {};
        const hourCounts = {};
        const durations = [];

        allRecentBookings.forEach(b => {
            if (b.startTime) {
                const start = new Date(b.startTime);
                const day = start.toLocaleDateString('en-US', { weekday: 'long' });
                const hour = start.getHours();
                dayCounts[day] = (dayCounts[day] || 0) + 1;
                hourCounts[hour] = (hourCounts[hour] || 0) + 1;

                if (b.endTime) {
                    const duration = (new Date(b.endTime) - start) / 60000;
                    if (duration > 0) durations.push(duration);
                }
            }
        });

        // Per-day peak stats
        const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        const dailyStats = daysOfWeek.map(dName => {
            const dayBookings = allRecentBookings.filter(b => {
                if (!b.startTime) return false;
                const d = new Date(b.startTime).toLocaleDateString('en-US', { weekday: 'long' });
                return d === dName;
            });

            if (dayBookings.length === 0) return { day: dName, peakHour: "N/A", avgDuration: "N/A", count: 0 };

            const hCounts = {};
            const hDurs = [];
            dayBookings.forEach(db => {
                const start = new Date(db.startTime);
                const h = start.getHours();
                hCounts[h] = (hCounts[h] || 0) + 1;
                if (db.endTime) {
                    const dur = (new Date(db.endTime) - start) / 60000;
                    if (dur > 0) hDurs.push(dur);
                }
            });

            const topH = Object.entries(hCounts).sort((a, b) => b[1] - a[1])[0][0];
            const avgD = hDurs.length > 0 ? Math.round(hDurs.reduce((a, b) => a + b, 0) / hDurs.length) : 0;

            return { day: dName, peakHour: `${topH}:00`, avgDuration: `${avgD}m`, count: dayBookings.length };
        });

        const busiestDayStats = [...dailyStats].sort((a, b) => b.count - a.count)[0];
        const avgDurationTotal = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;

        // Peak room
        const roomCounts = {};
        allRecentBookings.forEach(b => { roomCounts[b.hall] = (roomCounts[b.hall] || 0) + 1; });
        const topRoom = Object.entries(roomCounts).sort((a, b) => b[1] - a[1])[0];

        // Monopolization
        const deptCounts = {};
        allRecentBookings.forEach(b => {
            if (b.facultyDepartment) deptCounts[b.facultyDepartment] = (deptCounts[b.facultyDepartment] || 0) + 1;
        });
        const deptEntries = Object.entries(deptCounts).sort((a, b) => b[1] - a[1]);
        const topDept = deptEntries[0];
        const totalBookings = allRecentBookings.length;

        let monopolizationAlerts = "No monopolization detected. Room usage is distributed fairly.";
        if (topDept && (topDept[1] / totalBookings) > 0.4) {
            monopolizationAlerts = `⚠️ ${topDept[0]} accounts for ${Math.round(topDept[1] / totalBookings * 100)}% of bookings.`;
        }

        // Efficiency score
        const bookingsWithBothFields = allRecentBookings.filter(b => b.capacity && b.capacity > 0 && b.hall);
        let efficiencyScore = 0;
        if (bookingsWithBothFields.length > 0) {
            let totalEfficiencySum = 0;
            let validCount = 0;
            bookingsWithBothFields.forEach(b => {
                const actualCap = roomMap[b.hall];
                if (actualCap) {
                    totalEfficiencySum += (Math.min(b.capacity / actualCap, 1) * 100);
                    validCount++;
                }
            });
            if (validCount > 0) efficiencyScore = Math.round(totalEfficiencySum / validCount);
        }

        const recommendations = `Strategic use of ${topRoom ? topRoom[0] : 'halls'} is highly recommended based on demand distribution. ` +
            `Peak demand aligns with ${busiestDayStats.day}s around ${busiestDayStats.peakHour}, showing a ${Math.round((busiestDayStats.count / totalBookings) * 100)}% concentration of weekly volume. ` +
            `Average session length of ${avgDurationTotal}m suggests a preference for standard lab/lecture slots. ` +
            `Usage is currently ${totalBookings > 20 ? 'high' : 'moderate'}, with ${deptEntries.length} departments actively competing for resources.`;

        return {
            recommendations,
            monopolizationAlerts,
            efficiencyScore,
            predictedIssues: `High volume expected on ${busiestDayStats.day} slots. Potential for concurrent overlaps in ${topRoom ? topRoom[0] : 'key halls'}.`,
            peakTimings: {
                busiestDay: busiestDayStats.day,
                dailyStats,
                context: "Calculated from historical real-time booking logs using statistical distribution analysis across all days."
            },
            actions: [
                { title: "Review Peak Capacity", description: `Consider limiting bookings on ${busiestDayStats.day}s during ${busiestDayStats.peakHour} to prevent overcrowding.`, priority: "Medium" },
                { title: "Optimize Room Choice", description: "Encourage users to book halls that match their attendee count to improve utilization efficiency.", priority: "Low" }
            ]
        };
    } catch (e) {
        return {
            recommendations: "Unable to compute detailed insights.",
            monopolizationAlerts: "Analysis failed.",
            efficiencyScore: 0,
            predictedIssues: "Data error.",
            peakTimings: { busiestDay: "N/A", busiestHour: "N/A", avgDuration: "N/A", context: "Error" },
            actions: []
        };
    }
};

// Helper to generate AI Insights (uses Gemini if configured, otherwise falls back to algorithmic)
const generateAIInsights = async (forecastData, allRecentBookings, roomMap = {}) => {
    initializeAI();
    if (!ai) {
        // No Gemini API key — use smart algorithmic insights instead
        return generateAlgorithmicInsights(forecastData, allRecentBookings, roomMap);
    }

    try {
        // --- Enhanced Data Aggregation for Prompt ---
        const roomUsage = {}; // hall -> count
        const dayUsage = {};  // day -> count
        const hourUsage = {}; // hour -> count
        const durations = []; // array of minutes

        allRecentBookings.forEach(b => {
            roomUsage[b.hall] = (roomUsage[b.hall] || 0) + 1;

            if (b.startTime && b.endTime) {
                const start = new Date(b.startTime);
                const end = new Date(b.endTime);

                // Peak hour
                const hour = start.getHours();
                hourUsage[hour] = (hourUsage[hour] || 0) + 1;

                // Peak day
                const day = start.toLocaleDateString('en-US', { weekday: 'long' });
                dayUsage[day] = (dayUsage[day] || 0) + 1;

                // Duration
                const diffMs = end - start;
                const diffMins = Math.round(diffMs / 60000);
                if (diffMins > 0) durations.push(diffMins);
            }
        });

        const avgDuration = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
        const topRooms = Object.entries(roomUsage).sort((a, b) => b[1] - a[1]).slice(0, 5);
        const topHours = Object.entries(hourUsage).sort((a, b) => b[1] - a[1]).slice(0, 3);
        const topDays = Object.entries(dayUsage).sort((a, b) => b[1] - a[1]).slice(0, 3);

        const prompt = `
        You are an Expert Campus Facility Strategist. 
        Analyze this detailed booking data and provide a comprehensive management strategy.
        
        CURRENT SYSTEM STATE:
        - Total Recent Bookings: ${allRecentBookings.length}
        - Top Halls: ${topRooms.map(r => `${r[0]} (${r[1]} uses)`).join(', ')}
        - Peak Booking Days: ${topDays.map(d => `${d[0]} (${d[1]} bookings)`).join(', ')}
        - Peak Time Slots: ${topHours.map(h => `${h[0]}:00`).join(', ')}
        - Average Booking Duration: ${avgDuration} minutes
        - Capacity Efficiency (Ratio of attendees to room size): ${roomMap ? 'Available in sample' : 'N/A'}
        
        SAMPLE DATASET:
        ${JSON.stringify(allRecentBookings.slice(0, 40))}
        
        FUTURE DEMAND FORECAST:
        ${JSON.stringify(forecastData)}

        Please provide a detailed strategic plan in JSON format:
        {
            "recommendations": "Detailed 3-4 sentence strategic overview with specific mention of halls and timings.",
            "monopolizationAlerts": "Detailed warning if specific departments or individuals are dominating resources.",
            "efficiencyScore": 0-100,
            "predictedIssues": "EXACT foreseeable problems like overlaps on specific days or capacity mismatches.",
            "peakTimings": {
                "busiestDay": "Day of week",
                "dailyStats": [
                    { "day": "Monday", "peakHour": "HH:00", "avgDuration": "90m" },
                    { "day": "Tuesday", "peakHour": "HH:00", "avgDuration": "90m" },
                    { "day": "Wednesday", "peakHour": "HH:00", "avgDuration": "90m" },
                    { "day": "Thursday", "peakHour": "HH:00", "avgDuration": "90m" },
                    { "day": "Friday", "peakHour": "HH:00", "avgDuration": "90m" },
                    { "day": "Saturday", "peakHour": "HH:00", "avgDuration": "90m" },
                    { "day": "Sunday", "peakHour": "HH:00", "avgDuration": "90m" }
                ],
                "context": "Short explanation of why these are peak (e.g. 'Coincides with common lab slots')"
            },
            "actions": [
                {
                    "title": "Clear Action Title",
                    "description": "DETAILED step-by-step instruction for the admin.",
                    "priority": "High" | "Medium" | "Low"
                }
            ]
        }
        
        Important: Reply ONLY with valid JSON. Focus on enabling the Admin to take immediate, informed actions.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            }
        });

        const outputText = response.text;
        return JSON.parse(outputText);
    } catch (error) {
        console.error("Gemini AI API Error:", error);
        // Fall back to algorithmic on Gemini error too
        return generateAlgorithmicInsights(forecastData, allRecentBookings, roomMap);
    }
}

// GET /api/forecasting/demand
// Returns expected bookings for the upcoming week based on Prophet ML + AI insights
const getDemandForecast = async (req, res) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        // Fetch detailed past bookings for AI analysis
        const allRecentBookings = await Booking.find({
            createdAt: { $gte: thirtyDaysAgo },
            status: { $in: ["approved", "pending"] }
        }).select("facultyName facultyDepartment hall capacity startTime endTime status").lean();

        // Build daily booking counts for Prophet (last 90 days)
        const dailyCounts = await Booking.aggregate([
            {
                $match: {
                    startTime: { $gte: ninetyDaysAgo },
                    status: { $in: ["approved", "pending"] }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$startTime" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const prophetInput = dailyCounts.map(d => ({ date: d._id, count: d.count }));

        let forecast = [];
        let prophetUsed = false;

        // Try Prophet ML forecast
        if (prophetInput.length >= 7) {
            try {
                const prophetResult = await runProphetScript(prophetInput);
                if (prophetResult && prophetResult.forecast && prophetResult.forecast.length > 0) {
                    forecast = prophetResult.forecast;
                    prophetUsed = true;
                }
            } catch (e) {
                console.log("Prophet unavailable, using statistical fallback:", e.message);
            }
        }

        // Statistical fallback if Prophet is not available
        if (!prophetUsed) {
            const pastBookingsAggr = await Booking.aggregate([
                {
                    $match: {
                        createdAt: { $gte: thirtyDaysAgo },
                        status: { $in: ["approved", "pending"] }
                    }
                },
                {
                    $project: {
                        dayOfWeek: { $dayOfWeek: "$startTime" }
                    }
                },
                {
                    $group: {
                        _id: "$dayOfWeek",
                        count: { $sum: 1 }
                    }
                }
            ]);

            const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
            const today = new Date();

            for (let i = 1; i <= 7; i++) {
                const nextDay = new Date(today);
                nextDay.setDate(today.getDate() + i);
                const dayIndex = nextDay.getDay() + 1;

                const dayStats = pastBookingsAggr.find(b => b._id === dayIndex);
                const totalPast = dayStats ? dayStats.count : 0;
                const avg = Math.round(totalPast / 4);
                const finalExpected = Math.max(0, avg + (Math.random() > 0.5 ? 1 : 0));

                let conf = "High";
                if (finalExpected === 0) conf = "Low";
                else if (finalExpected < 3) conf = "Medium";

                forecast.push({
                    date: nextDay.toISOString().split('T')[0],
                    day: days[dayIndex - 1],
                    expectedBookings: finalExpected,
                    confidence: conf
                });
            }
        }

        // Build room map for accurate efficiency scoring
        const roomsList = await Room.find().select("name capacity").lean();
        const roomMap = {};
        roomsList.forEach(r => { roomMap[r.name] = r.capacity; });

        // Generate AI Insights
        const aiInsights = await generateAIInsights(forecast, allRecentBookings, roomMap);

        res.status(200).json({
            forecast,
            insights: aiInsights,
            forecastSource: prophetUsed ? "Advanced Prophet ML Forecast" : "Historical Statistical Analysis Engine"
        });
    } catch (error) {
        console.error("Forecasting Error:", error);
        res.status(500).json({ message: "Failed to generate forecast" });
    }
};

module.exports = {
    getDemandForecast
};
