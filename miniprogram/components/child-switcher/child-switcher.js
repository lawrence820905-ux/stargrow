Component({
  properties: {
    children: { type: Array, value: [] },
    activeId: { type: String, value: '' }
  },

  methods: {
    onSelect(e) {
      const id = e.currentTarget.dataset.id;
      this.triggerEvent('change', { childId: id });
    }
  }
});
