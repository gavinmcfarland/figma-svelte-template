/**
 * Formats the current time in 12-hour format with AM/PM.
 * This function retrieves the current time, formats it to a 12-hour clock,
 * and appends the appropriate AM/PM suffix.
 *
 * @returns {string} The formatted current time as a string in the format "hh:mm:ss AM/PM".
 */
export function formatTime(): string {
  const currentDate = new Date();
  let hours = currentDate.getHours();
  const minutes = String(currentDate.getMinutes()).padStart(2, '0');
  const seconds = String(currentDate.getSeconds()).padStart(2, '0');
  const meridiem = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes}:${seconds} ${meridiem}`;
}
