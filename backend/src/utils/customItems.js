// src/utils/customItems.js
//
// Reservations and POS orders can carry free-form "custom items" that are not
// on the menu. They are stored after a marker inside the notes column. A
// malformed payload must never make the whole order unreadable, so parsing
// degrades to "no custom items" and logs the problem instead of throwing.

export const CUSTOM_ITEMS_MARKER = '---CUSTOM_ITEMS_JSON---';

export function parseCustomItemsFromNotes(notes, context = 'customItems') {
  const text = typeof notes === 'string' ? notes : '';
  const index = text.indexOf(CUSTOM_ITEMS_MARKER);
  if (index === -1) return [];

  const raw = text.slice(index + CUSTOM_ITEMS_MARKER.length).trim();
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    console.warn(`[${context}] Ignoring custom items payload that is not an array.`);
  } catch (err) {
    console.warn(`[${context}] Ignoring malformed custom items JSON:`, err.message);
  }
  return [];
}

export function stripCustomItemsFromNotes(notes) {
  const text = typeof notes === 'string' ? notes : '';
  return text.split(CUSTOM_ITEMS_MARKER)[0].trim();
}
