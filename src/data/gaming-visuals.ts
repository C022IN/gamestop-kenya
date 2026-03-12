export interface GamingVisual {
  src: string;
  alt: string;
}

export const gamingVisuals = {
  playstationConsole: {
    src: 'https://images.pexels.com/photos/33513532/pexels-photo-33513532.jpeg?cs=srgb&dl=pexels-userpascal-33513532.jpg&fm=jpg',
    alt: 'PlayStation 5 console with a DualSense controller on a wooden shelf',
  },
  gamesHero: {
    src: 'https://images.pexels.com/photos/13341786/pexels-photo-13341786.jpeg?cs=srgb&dl=pexels-jonathanborba-13341786.jpg&fm=jpg',
    alt: 'Hands using a PlayStation controller during gameplay',
  },
  gamingLounge: {
    src: 'https://images.pexels.com/photos/28850990/pexels-photo-28850990.jpeg?cs=srgb&dl=pexels-jakubzerdzicki-28850990.jpg&fm=jpg',
    alt: 'Controller, phone, and TV in a modern gaming lounge setup',
  },
  nintendoSwitch: {
    src: 'https://images.pexels.com/photos/371924/pexels-photo-371924.jpeg?cs=srgb&dl=pexels-pixabay-371924.jpg&fm=jpg',
    alt: 'Nintendo Switch showing gameplay on a colorful screen',
  },
  headsetDock: {
    src: 'https://images.pexels.com/photos/28993059/pexels-photo-28993059.jpeg?cs=srgb&dl=pexels-bertellifotografia-28993059.jpg&fm=jpg',
    alt: 'White gaming headset resting on a charging dock',
  },
  racingSimulator: {
    src: 'https://images.pexels.com/photos/18966447/pexels-photo-18966447.jpeg?cs=srgb&dl=pexels-bertellifotografia-18966447.jpg&fm=jpg',
    alt: 'Racing simulator cockpit with a steering wheel and large display',
  },
  pcBuild: {
    src: 'https://images.pexels.com/photos/33693626/pexels-photo-33693626.jpeg?cs=srgb&dl=pexels-zeleboba-33693626.jpg&fm=jpg',
    alt: 'Open gaming PC build showing cooling fans and a GeForce RTX graphics card',
  },
  pcDesk: {
    src: 'https://images.pexels.com/photos/30469973/pexels-photo-30469973.jpeg?cs=srgb&dl=pexels-atahandemir-30469973.jpg&fm=jpg',
    alt: 'Gaming PC desk setup with lit desktop tower and monitor',
  },
} as const satisfies Record<string, GamingVisual>;
