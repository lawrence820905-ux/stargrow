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
| customAchievements | 自定义成就 / 内置成就覆盖 |
| feedback | 用户反馈 |
| shop | 积分商城商品 |
| exchangeRecords | 兑换记录 |
| observations | 家长观察记录 |
| wishlists | 心愿单 |
| cheers | 加油记录 |

---

## families

```json
{
  "_id": "auto",
  "openid": "wx_openid",
  "members": ["wx_openid_爸爸", "wx_openid_妈妈"],
  "inviteCode": "A3X9K2",
  "name": "张家",
  "createdAt": "2026-05-27T00:00:00Z",
  "updatedAt": "2026-05-27T00:00:00Z"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| openid | string | 创建者的微信 openid（向后兼容） |
| members | string[] | 所有家庭成员的 openid 列表 |
| inviteCode | string | 6位邀请码，其他家长凭此加入 |
| memberProfiles | array | 成员配置 `[{ openid, role, nickname }]`，如 `[{ openid: "xxx", role: "家长", nickname: "爸爸" }]` |

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
  "createdAt": "2026-05-01T00:00:00Z",
  "updatedAt": "2026-05-27T08:30:00Z"
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
  "category": "sport",
  "basePoints": 10,
  "taskType": "daily",
  "status": "completed",
  "score": 3,
  "pointsAwarded": 15,
  "completedAt": "2026-05-27T08:30:00Z",
  "completedBy": "wx_openid_parent",
  "createdAt": "2026-05-27T08:00:00Z"
}
```

字段说明：
- `category`: `sport`（运动）、`life`（生活）、`study`（学习）
- `taskType`: `daily`（日常任务，每天复用）或 `special`（特殊任务，一次性）
- `status`: `pending` / `completed`
- `completedBy`: 完成该任务的家长的 openid

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
      "name": "50积分",
      "type": "points",
      "pointsValue": 50,
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

字段说明：
- `items[].type`: `points`（积分）或 `reward`（奖励）
- `items[].pointsValue`: `number`，积分值（可为负）
- `items[].rarity`: `common` / `rare` / `epic` / `legendary`
- `items[].weight`: 按稀有度自动分配（普通 60 / 稀有 25 / 史诗 10 / 传说 5）

## drawRecords

```json
{
  "_id": "auto",
  "familyId": "family_id",
  "childId": "child_id",
  "poolId": "pool_id",
  "poolType": "small",
  "pointsSpent": 20,
  "prizeName": "50积分",
  "prizeType": "points",
  "pointsAwarded": 50,
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
  "completedBy": "wx_openid_parent",
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

## customAchievements

```json
{
  "_id": "auto",
  "familyId": "family_id",
  "name": "运动健将",
  "description": "完成30个运动任务",
  "icon": "⚽",
  "category": "sport",
  "count": 30,
  "enabled": true,
  "overridesKey": null,
  "createdAt": "2026-05-27T00:00:00Z",
  "updatedAt": "2026-05-27T00:00:00Z"
}
```

字段说明：
- `overridesKey`: 不为 `null` 时表示覆盖内置成就，值为对应内置成就的 `key`（如 `"sport_20"`）
- `category`: `all` / `sport` / `life` / `study`
- 若 `overridesKey` 为 `null`，则为纯自定义成就

## feedback

```json
{
  "_id": "auto",
  "familyId": "family_id",
  "openid": "wx_openid",
  "content": "希望增加更多任务分类",
  "createdAt": "2026-05-27T12:00:00Z"
}
```

## shop

```json
{
  "_id": "auto",
  "familyId": "family_id",
  "name": "看动画片15分钟",
  "description": "可以选择看一集喜欢的动画片",
  "price": 50,
  "icon": "📺",
  "category": "reward",
  "isActive": true,
  "stock": -1,
  "createdAt": "2026-06-01T00:00:00Z",
  "updatedAt": "2026-06-01T00:00:00Z"
}
```

字段说明：
- `price`: 固定积分价格（区别于抽奖的随机性）
- `category`: `reward`（实物/活动奖励）或 `virtual`（虚拟物品）
- `stock`: `-1` 表示不限量，`>=0` 表示限量
- `isActive`: 软删除标记

## exchangeRecords

```json
{
  "_id": "auto",
  "familyId": "family_id",
  "childId": "child_id",
  "shopItemId": "shop_item_id",
  "itemName": "看动画片15分钟",
  "itemIcon": "📺",
  "pointsSpent": 50,
  "isFulfilled": false,
  "fulfilledAt": null,
  "createdAt": "2026-06-01T10:00:00Z"
}
```

字段说明：
- `isFulfilled`: 家长是否已兑现（同 drawRecords 的 fulfill 机制）
- 已兑现记录在每日定时任务中自动清理

## observations

```json
{
  "_id": "auto",
  "familyId": "family_id",
  "childId": "child_id",
  "content": "今天主动帮妹妹系鞋带，很有耐心！",
  "mood": "🥰",
  "tags": ["kindness", "initiative"],
  "createdAt": "2026-06-01T18:00:00Z"
}
```

字段说明：
- `mood`: 可选的心情 emoji
- `tags`: 可选的标签数组

## wishlists

```json
{
  "_id": "auto",
  "familyId": "family_id",
  "childId": "child_id",
  "shopItemId": "shop_item_id",
  "createdAt": "2026-06-15T10:00:00Z"
}
```

## cheers

```json
{
  "_id": "auto",
  "familyId": "family_id",
  "fromChildId": "child_id",
  "toChildId": "child_id",
  "date": "2026-06-15",
  "createdAt": "2026-06-15T10:00:00Z"
}
```

## 2026-06 新增字段

### drawPools
- `dailyLimit` (number): 每日抽奖上限，默认 3

### drawRecords
- `expectedFulfillBy` (date): 承诺兑现期限，默认创建后 3 天

### exchangeRecords
- `expectedFulfillBy` (date): 承诺兑现期限，默认创建后 3 天

### tasks
- `status: 'proposed'`: 新增"提议中"状态
- `isSelfChallenge` (boolean): 是否为自主挑战任务（不计积分）
