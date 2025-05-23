export const shuffle = (array) => {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
    return array;
  };
  
// Utility to join class names (like classnames or tailwind-merge)
export function cn(...args) {
  return args.filter(Boolean).join(' ');
}
  