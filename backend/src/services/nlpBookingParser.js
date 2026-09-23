// Natural-language booking assistant: turns free text like
// "Book Hall A for 60 people this Friday 2 to 4pm for a seminar" into a
// structured booking draft the NewBooking form can pre-fill.
//
// Hybrid pipeline, in priority order:
//   1. Gemini (LLM-based NLU) — reuses the same @google/genai client the
//      forecasting insights already use, when GEMINI_API_KEY is configured.
//   2. Deterministic fallback — chrono-node for date/time-expression
//      parsing plus regex/keyword matching for capacity, hall and event
//      type. Runs with no external dependency, so the feature still works
//      without an API key and gives a second, non-LLM extraction path.
const { GoogleGenAI } = require("@google/genai");
const chrono = require("chrono-node");
const Room = require("../models/Room");
const logger = require("../config/logger");

let ai;
function getAI() {
  if (!ai && process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return ai;
}

// Checked in this order (most specific first) — "Academic" keywords like
// "lecture"/"seminar" are generic enough to appear in almost any event
// description, so they're checked last and used as the default.
const EVENT_TYPE_KEYWORDS = [
  ["External", ["guest", "external", "industry", "visitor", "alumni"]],
  ["Official", ["official", "ceremony", "convocation", "inauguration"]],
  ["Internal", ["meeting", "internal", "review", "staff", "department"]],
  ["Academic", ["class", "lecture", "lab", "exam", "academic", "tutorial", "seminar", "workshop"]]
];

function detectEventType(text) {
  const lower = text.toLowerCase();
  for (const [type, keywords] of EVENT_TYPE_KEYWORDS) {
    if (keywords.some((k) => lower.includes(k))) return type;
  }
  return "Academic";
}

function detectCapacity(text) {
  const forMatch = text.match(/for\s+(\d{1,4})\s*(?:people|persons|students|attendees|pax)?/i);
  if (forMatch) return parseInt(forMatch[1], 10);
  const genericMatch = text.match(/(\d{1,4})\s*(?:people|persons|students|attendees|pax)\b/i);
  if (genericMatch) return parseInt(genericMatch[1], 10);
  return null;
}

async function detectHall(text) {
  const codeMatch = text.match(/\b([A-D]-\d{3})\b/i);
  if (codeMatch) return codeMatch[1].toUpperCase();

  const nameMatch = text.match(/\b(?:hall|room|lab|auditorium)\s+([A-Za-z0-9]{1,20})/i);
  if (!nameMatch) return null;

  const guess = nameMatch[0].trim();
  try {
    const rooms = await Room.find({ isActive: true }).select("name").lean();
    const lowerGuess = guess.toLowerCase();
    const found = rooms.find(
      (r) => lowerGuess.includes(r.name.toLowerCase()) || r.name.toLowerCase().includes(lowerGuess)
    );
    if (found) return found.name;
  } catch (err) {
    logger.warn({ err }, "NLP hall lookup failed, falling back to raw text match");
  }
  return guess; // best-effort — frontend treats this as a suggestion to confirm, not a guarantee
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function detectDateTime(text) {
  const results = chrono.parse(text, new Date(), { forwardDate: true });
  if (results.length === 0) return {};

  const r = results[0];
  const start = r.start ? r.start.date() : null;
  const end = r.end ? r.end.date() : null;
  const out = {};

  if (start) {
    out.date = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`;
    out.startTime = `${pad(start.getHours())}:${pad(start.getMinutes())}`;
  }
  if (end) {
    out.endTime = `${pad(end.getHours())}:${pad(end.getMinutes())}`;
  } else if (start) {
    // No explicit end mentioned — default to a 1-hour slot, user reviews before submitting.
    const defaultEnd = new Date(start.getTime() + 60 * 60 * 1000);
    out.endTime = `${pad(defaultEnd.getHours())}:${pad(defaultEnd.getMinutes())}`;
  }
  return out;
}

async function ruleBasedParse(text) {
  const { date, startTime, endTime } = detectDateTime(text);
  const capacity = detectCapacity(text);
  const hall = await detectHall(text);
  const eventType = detectEventType(text);
  const fieldsFound = [date, capacity, hall].filter(Boolean).length;

  return {
    hall: hall || null,
    capacity: capacity || null,
    date: date || null,
    startTime: startTime || null,
    endTime: endTime || null,
    eventType,
    confidence: fieldsFound >= 2 ? "medium" : "low",
    source: "rule-based"
  };
}

async function geminiParse(text) {
  const client = getAI();
  if (!client) return null;

  const today = new Date().toISOString().split("T")[0];
  const prompt = `Extract a campus hall-booking request from this text into JSON.
Today's date is ${today} (use it to resolve relative dates like "Friday" or "tomorrow").
Text: "${text.replace(/"/g, "'")}"

Respond ONLY with JSON of this exact shape, no prose:
{"hall": string|null, "capacity": number|null, "date": "YYYY-MM-DD"|null, "startTime": "HH:MM"|null, "endTime": "HH:MM"|null, "eventType": "Academic"|"Internal"|"Official"|"External"|"Other"|null}
Use 24-hour time. If a field isn't mentioned, use null.`;

  try {
    const response = await client.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    const parsed = JSON.parse(response.text);
    return { ...parsed, confidence: "high", source: "gemini" };
  } catch (err) {
    logger.warn({ err }, "Gemini NLP parse failed, falling back to rule-based parser");
    return null;
  }
}

async function parseBookingText(text) {
  const gemini = await geminiParse(text);
  if (gemini) return gemini;
  return ruleBasedParse(text);
}

module.exports = { parseBookingText, ruleBasedParse, detectCapacity, detectEventType, detectDateTime };
