/**
 * Parses time string in "HH:MM", "hh:mm AM", or "hh:mm PM" into minutes from midnight (0 - 1439).
 */
function parseTimeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== "string") return null;

  const trimmed = timeStr.trim().toUpperCase();
  const is12Hour = trimmed.includes("AM") || trimmed.includes("PM");

  if (is12Hour) {
    const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
    if (!match) return null;

    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const modifier = match[3];

    if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) return null;

    if (modifier === "PM" && hours !== 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;

    return hours * 60 + minutes;
  } else {
    const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;

    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);

    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

    return hours * 60 + minutes;
  }
}

/**
 * Validates a single slot string formatted as "StartTime - EndTime".
 * E.g. "09:00 AM - 12:00 PM"
 */
function validateSlot(slotStr) {
  if (!slotStr || typeof slotStr !== "string") {
    return { valid: false, error: "Slot must be a non-empty string" };
  }

  const parts = slotStr.split("-").map((s) => s.trim());
  if (parts.length !== 2) {
    return { valid: false, error: "Slot must be in 'StartTime - EndTime' format" };
  }

  const [startStr, endStr] = parts;
  const startMin = parseTimeToMinutes(startStr);
  const endMin = parseTimeToMinutes(endStr);

  if (startMin === null) {
    return { valid: false, error: `Invalid start time format: '${startStr}'` };
  }

  if (endMin === null) {
    return { valid: false, error: `Invalid end time format: '${endStr}'` };
  }

  if (startMin >= endMin) {
    return {
      valid: false,
      error: `Start time (${startStr}) must be strictly before end time (${endStr})`,
    };
  }

  return { valid: true, startMin, endMin };
}

/**
 * Validates an entire availability array for days and slots.
 * Checks for invalid formats and overlapping slots.
 */
function validateAvailabilityArray(availability) {
  if (!Array.isArray(availability)) {
    return { valid: false, error: "Availability must be an array of schedule items" };
  }

  for (const item of availability) {
    if (!item.day || typeof item.day !== "string") {
      return { valid: false, error: "Each availability item must have a valid 'day' name" };
    }

    if (!Array.isArray(item.slots)) {
      return { valid: false, error: `Slots for ${item.day} must be an array` };
    }

    const intervals = [];

    for (const slotStr of item.slots) {
      const result = validateSlot(slotStr);
      if (!result.valid) {
        return { valid: false, error: `${item.day}: ${result.error}` };
      }

      // Check overlap with existing intervals for this day
      for (const existing of intervals) {
        if (
          (result.startMin >= existing.startMin && result.startMin < existing.endMin) ||
          (result.endMin > existing.startMin && result.endMin <= existing.endMin) ||
          (result.startMin <= existing.startMin && result.endMin >= existing.endMin)
        ) {
          return {
            valid: false,
            error: `Overlapping slot detected on ${item.day}: '${slotStr}' overlaps with an existing slot`,
          };
        }
      }

      intervals.push({ startMin: result.startMin, endMin: result.endMin });
    }
  }

  return { valid: true };
}

module.exports = {
  parseTimeToMinutes,
  validateSlot,
  validateAvailabilityArray,
};
