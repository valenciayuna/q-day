# Q-DAY

Post-quantum beat 'em up where you play Guardian NEAR, defending a wallet that is being cracked by a
quantum computer. Single HTML file, no install, runs on desktop and phone.

**Play:** https://valenciayuna.github.io/q-day/

Hackathon note: this is one of two independent entries by the same builder. The other is
[Cozy Hood Trails](https://github.com/valenciayuna/cozy-hood-trails), a life sim about a restaurant
and a market. Different repos, different builds, no shared code.

## The run

Five waves, a gate, then a boss fight:

| Wave | Enemies |
|---|---|
| 1 | 3 virus |
| 2 | 4 virus |
| 3 | 1 AI |
| 4 | 2 virus + 2 AI |
| 5 | 3 AI + 1 heavy AI |

After wave 5 a `GO` gate opens at x=980 in a 1320-unit level; walk right and the camera scrolls
until the boss spawns at x=1180.

**Boss:** a hooded hacker plus its Stand, **QUANTUM CRACKER**. Both have their own HP bars (hacker 80,
Stand 90). The hacker only takes damage while the Stand is recovering (2 seconds after a rush) or
broken. At 60% Stand HP a **PQ** pickup drops: while armed, the Stand's rush reflects and stuns it.
Break the Stand, then kill the hacker for `WALLET SECURED`. Lose all health and you get
`WALLET BREACHED`.

HP is the wallet balance, lives are keys, the timer is the signing session. That framing is the game,
not decoration.

## Controls

| Action | Key |
|---|---|
| Move | Arrow keys |
| Basic attack | `J` |
| Jump | `SPACE` |
| Jump attack | `SPACE` + `J` |
| Ultimate | `K` (needs a full meter) |

The ultimate burns a meter that fills as you fight; it cannot be spammed.

## What is on chain

The leaderboard is a real contract on NEAR testnet:

- Contract: `qday-arena-5959.testnet`
- `submit(name, score, wave, boss_down)` writes a run; `top(n)` reads the board back
- The in-game panel calls `top` with a plain view call, so it needs no wallet and no key

Current board, read from RPC:

```
[{'account': 'qday-arena-5959.testnet', 'name': 'Krampus', 'score': 4820, 'wave': 5, 'boss_down': True}]
```

Submit your own run:

```sh
near call qday-arena-5959.testnet submit \
  '{"name":"you","score":4820,"wave":5,"boss_down":true}' \
  --accountId YOUR.testnet
```

Read the board:

```sh
near view qday-arena-5959.testnet top '{"n":10}'
```

When a run beats your stored high score, the game offers to copy the exact submit command.

## Files

| File | Role |
|---|---|
| `index.html` | the whole game: canvas engine, sprites, audio, menu |
| `chain-layer.js` | the NEAR leaderboard overlay. It never touches the game's own code |

## Scope

Built with AI coding assistants at the author's direction. Sound is generated live with the Web
Audio API; there are no audio files. Sprites and backgrounds ship inside `index.html` as data URIs.
