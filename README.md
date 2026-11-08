# Q-DAY

Post-quantum beat 'em up built on NEAR testnet.

- Play: https://valenciayuna.github.io/q-day/
- Leaderboard contract: `qday-arena-5959.testnet`

## Submit a run

```
near call qday-arena-5959.testnet submit \
  '{"name":"you","score":4820,"wave":5,"boss_down":true}' \
  --accountId YOUR.testnet
```

Read the board with a free view call:

```
near view qday-arena-5959.testnet top '{"n":10}'
```

Controls: arrows move, J attack, SPACE jump, SPACE+J jump attack, K ultimate (needs a full meter).
