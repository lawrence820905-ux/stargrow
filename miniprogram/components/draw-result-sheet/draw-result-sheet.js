const CONVERSATION_PROMPTS = [
  '💬 和孩子聊聊：你最喜欢宝箱里的哪个奖品？为什么？',
  '💬 问问孩子：抽到这个奖品的心情怎么样？',
  '💬 和孩子讨论：下次想抽到什么？怎么攒更多积分？',
  '💬 聊聊看：这个奖品让你想到了什么？',
  '💬 分享感受：如果抽到不一样的奖品，你会怎么想？'
];

Component({
  properties: {
    visible: { type: Boolean, value: false },
    record: {
      type: Object,
      value: {
        pointsSpent: 0,
        pointsAwarded: 0,
        prizeName: '',
        prizeType: 'points',
        rewardTitle: ''
      }
    }
  },

  data: {
    conversationPrompt: ''
  },

  observers: {
    'visible': function (v) {
      if (v) {
        const prompt = CONVERSATION_PROMPTS[Math.floor(Math.random() * CONVERSATION_PROMPTS.length)];
        this.setData({ conversationPrompt: prompt });
      }
    }
  },

  methods: {
    onClose() {
      this.triggerEvent('close');
    }
  }
});
