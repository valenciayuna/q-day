//! Q-DAY leaderboard for NEAR testnet.
//!
//! One job: remember the best run of every account that plays, and hand back a ranked list.
//! The game reads it with a free view call and writes it with a signed `submit` call.

use borsh::{BorshDeserialize, BorshSerialize};
use near_sdk::serde::{Deserialize, Serialize};
use near_sdk::{env, near, AccountId, NearToken, PanicOnDefault};

const MAX_ROWS: u32 = 50;

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct Run {
    pub account: AccountId,
    pub name: String,
    pub score: u64,
    pub wave: u32,
    pub boss_down: bool,
}

#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct Contract {
    runs: Vec<Run>,
    plays: u64,
    owner: AccountId,
}

#[near]
impl Contract {
    #[init]
    pub fn new() -> Self {
        Self { runs: Vec::new(), plays: 0, owner: env::predecessor_account_id() }
    }

    /// Record a run. Only the caller's best score is kept, so replaying does not spam the board.
    pub fn submit(&mut self, name: String, score: u64, wave: u32, boss_down: bool) -> Run {
        let who = env::predecessor_account_id();
        self.plays += 1;

        let clean: String = name.chars().filter(|c| !c.is_control()).take(16).collect();
        let clean = if clean.trim().is_empty() { who.to_string() } else { clean };

        let entry = Run { account: who.clone(), name: clean, score, wave, boss_down };

        if let Some(pos) = self.runs.iter().position(|r| r.account == who) {
            if self.runs[pos].score >= score {
                return self.runs[pos].clone();   // not a personal best, nothing changes
            }
            self.runs.remove(pos);
        }
        self.runs.push(entry.clone());
        self.sort_and_trim();
        entry
    }

    /// Top runs, highest first.
    pub fn top(&self, n: u32) -> Vec<Run> {
        let take = n.min(MAX_ROWS) as usize;
        self.runs.iter().take(take).cloned().collect()
    }

    pub fn rank_of(&self, account: AccountId) -> Option<u32> {
        self.runs.iter().position(|r| r.account == account).map(|i| i as u32 + 1)
    }

    pub fn total_plays(&self) -> u64 {
        self.plays
    }

    pub fn players(&self) -> u32 {
        self.runs.len() as u32
    }

    pub fn owner(&self) -> AccountId {
        self.owner.clone()
    }

    /// Wipe the board for a new event. Owner only.
    pub fn reset(&mut self) {
        assert_eq!(env::predecessor_account_id(), self.owner, "only the owner can reset");
        self.runs.clear();
        self.plays = 0;
    }

    /// Small deposit guard: nobody needs to attach NEAR to submit, but keep the account funded.
    #[payable]
    pub fn poke(&mut self) {
        let _ = NearToken::from_yoctonear(env::attached_deposit().as_yoctonear());
    }

    fn sort_and_trim(&mut self) {
        self.runs.sort_by(|a, b| b.score.cmp(&a.score).then(a.wave.cmp(&b.wave)));
        self.runs.truncate(MAX_ROWS as usize);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use near_sdk::test_utils::{accounts, VMContextBuilder};
    use near_sdk::testing_env;

    fn ctx(who: AccountId) -> VMContextBuilder {
        let mut b = VMContextBuilder::new();
        b.predecessor_account_id(who);
        b
    }

    #[test]
    fn keeps_only_the_personal_best() {
        let mut c = Contract::new();
        testing_env!(ctx(accounts(0)).build());
        c.submit("ana".into(), 100, 2, false);
        c.submit("ana".into(), 40, 1, false);
        assert_eq!(c.players(), 1);
        assert_eq!(c.top(10)[0].score, 100);
        assert_eq!(c.total_plays(), 2);
    }

    #[test]
    fn ranks_high_scores_first() {
        let mut c = Contract::new();
        testing_env!(ctx(accounts(0)).build());
        c.submit("ana".into(), 100, 2, false);
        testing_env!(ctx(accounts(1)).build());
        c.submit("bo".into(), 300, 4, true);
        testing_env!(ctx(accounts(2)).build());
        c.submit("cy".into(), 200, 3, false);

        let top = c.top(3);
        assert_eq!(top[0].score, 300);
        assert_eq!(top[1].score, 200);
        assert_eq!(top[2].score, 100);
        assert_eq!(c.rank_of(accounts(1)), Some(1));
    }

    #[test]
    fn empty_name_falls_back_to_account() {
        let mut c = Contract::new();
        testing_env!(ctx(accounts(3)).build());
        let run = c.submit("   ".into(), 10, 1, false);
        assert_eq!(run.name, accounts(3).to_string());
    }

    #[test]
    fn name_is_trimmed_and_cleaned() {
        let mut c = Contract::new();
        testing_env!(ctx(accounts(4)).build());
        let run = c.submit("averyveryverylongname\n".into(), 5, 1, false);
        assert!(run.name.len() <= 16);
        assert!(!run.name.contains('\n'));
    }

    #[test]
    #[should_panic(expected = "only the owner can reset")]
    fn reset_is_owner_only() {
        let mut c = Contract::new();
        testing_env!(ctx(accounts(1)).build());
        c.reset();
    }
}
