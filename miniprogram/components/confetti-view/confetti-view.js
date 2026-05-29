const colors = ['#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#007AFF', '#AF52DE', '#5AC8FA', '#FF2D55'];

Component({
  data: {
    active: false,
    particles: []
  },

  methods: {
    show() {
      const particles = [];
      const screenWidth = 750;
      for (let i = 0; i < 60; i++) {
        particles.push({
          x: Math.random() * screenWidth,
          y: -20 - Math.random() * 100,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 8 + Math.random() * 14,
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
