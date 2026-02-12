export const BONUS_RULES = {
  withdrawal: {
    // Minimum turnover percentage required before any withdrawal
    min_turnover_percentage: 100,
    // Maximum bonus amount that can be withdrawn per day
    max_bonus_withdrawal_per_day: 5000,
    // Real money is always withdrawable
    real_money_priority: true
  },
  turnover: {
    // Games that count toward turnover
    eligible_games: ['casino', 'slots', 'sports', 'live_casino'],
    // Games that don't count
    excluded_games: ['bonus_game', 'free_spins'],
    // Minimum bet to count toward turnover
    min_bet_amount: 10
  },
  expiration: {
    // Auto-expire bonuses after period
    auto_expire_days: 30,
    // Send reminder before expiry
    reminder_days_before: [7, 3, 1]
  }
};