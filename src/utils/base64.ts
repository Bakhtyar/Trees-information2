export function safeBtoa(str: string): string {
  try {
    return btoa(encodeURIComponent(str)).replace(/=/g, '');
  } catch (e) {
    // Fallback for extreme cases
    let result = '';
    for (let i = 0; i < str.length; i++) {
      result += str.charCodeAt(i).toString(16);
    }
    return result;
  }
}
