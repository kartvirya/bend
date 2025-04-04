// Asset path helpers to ensure paths work correctly in dev and production
export const getAssetPath = (path) => {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  // Return with relative path
  return `./${cleanPath}`;
};

// Car image paths (centralized for consistency)
export const CAR_IMAGES = {
  RED: './car/redcar.svg',
  GREEN: './car/greencar.svg',
  BLUE: './car/bluecar.svg',
  ORANGE: './car/orangecar.svg',
  PURPLE: './car/purplecar.svg',
  YELLOW: './car/yellowcar.svg'
};

// Helper function to get car image by type
export const getCarImage = (type) => {
  const colorMap = {
    'red': CAR_IMAGES.RED,
    'green': CAR_IMAGES.GREEN,
    'blue': CAR_IMAGES.BLUE,
    'orange': CAR_IMAGES.ORANGE,
    'purple': CAR_IMAGES.PURPLE, 
    'yellow': CAR_IMAGES.YELLOW
  };
  
  return colorMap[type.toLowerCase()] || CAR_IMAGES.RED;
}; 