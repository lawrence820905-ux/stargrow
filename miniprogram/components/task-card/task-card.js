Component({
  properties: {
    task: { type: Object, value: {} }
  },

  data: {
    scoreLabel: '',
    showScore: false,
    showTaskType: false,
    taskTypeLabel: ''
  },

  observers: {
    'task': function (task) {
      if (!task) return;
      const score = task.score || 0;
      const showScore = task.status === 'completed' && score > 0;
      const labelMap = { 1: '马马虎虎', 2: '达成目标', 3: '棒极了', 4: '棒极了', 5: '棒极了' };
      const scoreLabel = showScore ? (labelMap[score] || '') : '';
      const taskType = task.taskType || 'daily';
      const showTaskType = taskType === 'daily';
      this.setData({ scoreLabel, showScore, showTaskType, taskTypeLabel: '日常' });
    }
  },

  methods: {
    onTap() {
      this.triggerEvent('tasktap', { task: this.properties.task }, { bubbles: true, composed: true });
    }
  }
});
