Component({
  properties: {
    value: { type: Number, value: 0 },
    label: { type: String, value: '积分' },
    animate: { type: Boolean, value: false }
  },

  data: {
    displayValue: 0
  },

  observers: {
    'value': function (val) {
      if (this._timer) clearInterval(this._timer);
      const start = this.data.displayValue;
      const diff = val - start;
      const steps = 20;
      const duration = 400;
      let step = 0;
      this._timer = setInterval(() => {
        step++;
        const progress = step / steps;
        const eased = 1 - Math.pow(1 - progress, 3);
        this.setData({ displayValue: Math.round(start + diff * eased) });
        if (step >= steps) {
          clearInterval(this._timer);
          this.setData({ displayValue: val });
        }
      }, duration / steps);
    }
  }
});
