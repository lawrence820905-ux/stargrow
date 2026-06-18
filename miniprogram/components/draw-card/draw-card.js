const { calcProbabilities } = require('../../utils/draw');

Component({
  properties: {
    poolType: { type: String, value: 'small' },
    cost: { type: Number, value: 20 },
    items: { type: Array, value: [] },
    disabled: { type: Boolean, value: false },
    loading: { type: Boolean, value: false },
    remainingDraws: { type: Number, value: 3 },
    drawLimitReached: { type: Boolean, value: false }
  },

  data: {
    rateItems: []
  },

  observers: {
    'items': function (items) {
      const probs = calcProbabilities(items);
      const grouped = {};
      probs.forEach(item => {
        if (!grouped[item.rarity]) {
          grouped[item.rarity] = { rarity: item.rarity, name: rarityName(item.rarity), probability: 0 };
        }
        grouped[item.rarity].probability += item.probability;
      });
      this.setData({ rateItems: Object.values(grouped) });
    }
  },

  methods: {
    onDrawOne() {
      this.triggerEvent('draw', { count: 1 });
    }
  }
});

function rarityName(rarity) {
  const map = { common: '普通', rare: '稀有', epic: '史诗', legendary: '传说' };
  return map[rarity] || rarity;
}
