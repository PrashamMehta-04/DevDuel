const matchEndTime = Date.now() + 30 * 60 * 1000;
const diff = Math.max(0, matchEndTime - Date.now());
const minutes = Math.floor(diff / 60000);
const seconds = Math.floor((diff % 60000) / 1000);
console.log(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
