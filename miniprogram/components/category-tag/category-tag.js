const categories = {
  sport:  { name: '运动', icon: '⚽' },
  life:   { name: '生活', icon: '🏠' },
  study:  { name: '学习', icon: '📚' }
};

Component({
  properties: {
    category: { type: String, value: 'sport' }
  },

  data: {
    name: '',
    icon: ''
  },

  lifetimes: {
    attached() {
      const cat = categories[this.properties.category] || categories.sport;
      this.setData({ name: cat.name, icon: cat.icon });
    }
  }
});
