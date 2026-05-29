# 数据库 Schema 文档

## 集合概览

| 集合名 | 说明 |
|--------|------|
| families | 家庭信息 |
| children | 孩子档案 |
| tasks | 任务 |
| familyConfig | 家庭配置 |
| drawPools | 抽奖池 |
| drawRecords | 抽奖记录 |
| pointRecords | 积分流水 |
| achievements | 成就记录 |

---

## families

```json
{
  "_id": "auto",
  "openid": "wx_openid",
  "name": "张家",
  "createdAt": "2026-05-27T00:00:00Z",
  "updatedAt": "2026-05-27T00:00:00Z"
}
```

## children

```json
{
  "_id": "auto",
  "familyId": "family_id",
  "name": "小明",
  "avatarUrl": "cloud://xxx.png",
  "totalPointsEarned": 850,
  "currentPoints": 320,
  "level": 4,
  "streakDays": 12,
  "lastActiveDate": "2026-05-27",
  "totalTasksCompleted": 45,
  "totalDraws": 15,
  "createdAt": "2026-05-01T00:00:00Z"
}
```

## tasks

```json
{
  "_id": "auto",
  "familyId": "family_id",
  "childId": "child_id",
  "title": "完成数学作业第10页",
  "description": "认真完成，字迹工整",
  "category": "homework",
  "basePoints": 10,
  "taskType": "daily",
  "status": "completed",
  "score": 3,
  "pointsAwarded": 15,
  "completedAt": "2026-05-27T08:30:00Z",
  "createdAt": "2026-05-27T08:00:00Z"
}
```

## familyConfig

```json
{
  "_id": "auto",
  "familyId": "family_id",
  "scoreMultipliers": {
    "3": 1.5,
    "2": 1.0,
    "1": 0.6
  },
  "updatedAt": "2026-05-27T00:00:00Z"
}
```

## drawPools

```json
{
  "_id": "auto",
  "familyId": "family_id",
  "type": "small",
  "name": "小抽奖",
  "cost": 20,
  "isActive": true,
  "items": [
    {
      "id": "item_1",
      "name": "5-15积分",
      "type": "points",
      "pointsValue": { "min": 5, "max": 15 },
      "rewardTitle": "",
      "rewardDescription": "",
      "weight": 60,
      "rarity": "common",
      "icon": "⭐"
    }
  ],
  "createdAt": "2026-05-27T00:00:00Z",
  "updatedAt": "2026-05-27T00:00:00Z"
}
```

## drawRecords

```json
{
  "_id": "auto",
  "familyId": "family_id",
  "childId": "child_id",
  "poolId": "pool_id",
  "poolType": "small",
  "pointsSpent": 20,
  "prizeName": "20-30积分",
  "prizeType": "points",
  "pointsAwarded": 25,
  "rewardTitle": null,
  "isFulfilled": false,
  "fulfilledAt": null,
  "createdAt": "2026-05-27T10:00:00Z"
}
```

## pointRecords

```json
{
  "_id": "auto",
  "familyId": "family_id",
  "childId": "child_id",
  "amount": 12,
  "type": "task_complete",
  "relatedTaskId": "task_id",
  "relatedDrawId": null,
  "balanceAfter": 320,
  "note": "完成任务: 完成数学作业第10页",
  "createdAt": "2026-05-27T08:30:00Z"
}
```

## achievements

```json
{
  "_id": "auto",
  "familyId": "family_id",
  "childId": "child_id",
  "achievementKey": "first_task",
  "earnedAt": "2026-05-27T08:30:00Z"
}
```
