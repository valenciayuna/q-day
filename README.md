# Q-DAY

Post-quantum beat 'em up where you play Guardian NEAR, defending a wallet that is being cracked by a
quantum computer. One HTML file plus one drop-in JS overlay, no install, runs on desktop and phone.

**Play:** https://valenciayuna.github.io/q-day/

**Track:** Games.

**License:** MIT — see [LICENSE](LICENSE).

## Baseline

The project began **8 November 2026**, inside the hackathon development window (1 November –
14 November 2026). Every commit in this repository falls within that window; the first is dated
2026-11-08 and the last 2026-11-14. Nothing in the build predates the window.

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

## How to judge it (no install, no account)

1. Open https://valenciayuna.github.io/q-day/ — sign in as a guest, no seed phrase, no wallet popup.
2. Play through waves 1–3. Confirm the controls above and that the ultimate needs a full meter.
3. Reach wave 5, walk through the `GO` gate, and watch the camera scroll into the boss.
4. Land a hit on the Stand during its 2-second recovery to confirm the damage rule.
5. After any run, open the **NEAR Testnet Leaderboard** panel on the menu to see the live board.
   It reads straight from the contract with a plain view call.

If you want to check the contract directly instead of playing:

```sh
near view qday-arena-5959.testnet top '{"n":10}'
```

## What is on chain

The leaderboard is a real contract on NEAR testnet:

- Contract: `qday-arena-5959.testnet`
- Source: [`contract-src/src/lib.rs`](contract-src/src/lib.rs), built against `near-sdk 5.30`
- `submit(name, score, wave, boss_down)` writes a run; `top(n)`, `rank_of`, `players`,
  `total_plays` and `owner` read it back
- `submit` keeps only each account's personal best, so replaying cannot spam the board
- The in-game panel calls `top` with a plain view call, so it needs no wallet and no key

Board as read from RPC on **15 November 2026**:

```
[{'account': 'qday-arena-5959.testnet', 'name': 'Krampus', 'score': 4820, 'wave': 5, 'boss_down': True}]
total_plays: 2    players: 1    owner: qday-arena-5959.testnet
```

That single entry is the one submission made so far, posted from the contract account itself. It is
an example of the shape, not a populated leaderboard.

**The game never signs anything.** There is no wallet, signer, key or transaction inside
`index.html` or `chain-layer.js`. The player submits with `near-cli` (or any signed call); when a
run beats the stored high score, the game offers to copy the exact command for that:

```sh
near call qday-arena-5959.testnet submit \
  '{"name":"you","score":4820,"wave":5,"boss_down":true}' \
  --accountId YOUR.testnet
```

## Files

| File | Role |
|---|---|
| `index.html` | the whole game: canvas engine, sprites, audio, menu |
| `chain-layer.js` | the NEAR leaderboard overlay, loaded as an external script. It only creates its own DOM nodes and styles, and never touches the game's code or state |
| `contract-src/` | Rust source for the leaderboard contract (`Cargo.toml` + `src/lib.rs`) |
| `LICENSE` | MIT |

## Scope and dependencies

Built with AI coding assistants at the author's direction.

- **Contract:** `near-sdk 5.30`, `borsh 1.5`. That is the whole chain-side stack.
- **Browser:** no frameworks, no bundler, no npm dependencies. The game is plain JavaScript on a
  `<canvas>` element. `chain-layer.js` is also dependency-free — it only uses `fetch`.
- **Audio:** generated live with the Web Audio API; there are no audio files.
- **Art:** sprites and backgrounds ship inside `index.html` as data URIs. They are original to this
  build, not taken from another game or asset store. Several images were helped along with AI
  generation, mainly for polish and upscaling — the base artwork is drawn for this project, then
  cleaned up and sharpened with an image model rather than replaced by one.

## Independence

This is one of two independent entries by the same builder. The other is
[Cozy Hood Trails](https://github.com/valenciayuna/cozy-hood-trails), a life sim about a restaurant
and a market.

The two projects share no code. Both repositories were checked: the intersection of function names
between `chain-layer.js` and the Cozy Hood build is empty apart from standard browser globals
(`fetch`, `setTimeout`, `getElementById`), and the only shared string literals are
`application/json` and the public NEAR testnet RPC endpoint
(`https://rpc.testnet.fastnear.com`). They use different contracts, different domains, and separate
repositories and builds.
