const colors = ['#58CC02', '#1CB0F6', '#FF9600', '#FFC800', '#A85CFF', '#FF6BC1', '#FF4B4B', '#46A800'];
const levelUpColors = ['#FFC800', '#58CC02', '#FFD700', '#46A800', '#FFE55C', '#7CCD00'];
const rainbowColors = ['#FF4B4B', '#FF9600', '#FFC800', '#58CC02', '#1CB0F6', '#A85CFF', '#FF6BC1'];

Component({
  data: {
    active: false,
    particles: []
  },

  methods: {
    show(options = {}) {
      const mode = options.mode || 'confetti';
      let particleCount = 60;
      let particleColors = colors;
      let bigParticles = false;

      if (mode === 'levelup') {
        particleCount = 80;
        particleColors = levelUpColors;
        bigParticles = true;
      } else if (mode === 'milestone') {
        particleCount = 120;
        particleColors = rainbowColors;
        bigParticles = true;
      } else if (mode === 'exchange') {
        particleCount = 50;
        particleColors = ['#FFC800', '#FF9600', '#58CC02'];
      }

      const particles = [];
      const screenWidth = 750;
      const sizeMin = bigParticles ? 12 : 8;
      const sizeRange = bigParticles ? 18 : 14;

      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * screenWidth,
          y: -20 - Math.random() * 100,
          color: particleColors[Math.floor(Math.random() * particleColors.length)],
          size: sizeMin + Math.random() * sizeRange,
          round: Math.random() > 0.5,
          duration: 2 + Math.random() * 2,
          delay: Math.random() * 0.5
        });
      }
      this.setData({ active: true, particles });
      setTimeout(() => this.setData({ active: false }), 4000);
    }
  }
});
