const calculateCourtFees = (claimAmount) => {
  const amount = parseFloat(claimAmount);
  if (isNaN(amount) || amount <= 0) {
    return { error: 'المبلغ يجب أن يكون أكبر من صفر' };
  }

  let fee = 0;
  let breakdown = [];

  if (amount <= 500) {
    fee = amount * 0.025;
    if (fee < 10) fee = 10;
    breakdown.push({
      range: 'حتى 500 د.ك',
      rate: '2.5%',
      calculatedFee: amount * 0.025,
      minFee: 10,
      applied: fee
    });
  } else if (amount <= 5000) {
    const first500 = 500 * 0.025;
    const excess = (amount - 500) * 0.02;
    fee = first500 + excess;
    breakdown.push(
      { range: 'أول 500 د.ك', rate: '2.5%', applied: first500 },
      { range: `الباقي (${(amount - 500).toFixed(3)} د.ك)`, rate: '2%', applied: excess }
    );
  } else if (amount <= 10000) {
    const first500 = 500 * 0.025;
    const next4500 = 4500 * 0.02;
    const excess = (amount - 5000) * 0.015;
    fee = first500 + next4500 + excess;
    breakdown.push(
      { range: 'أول 500 د.ك', rate: '2.5%', applied: first500 },
      { range: 'ال仟ار (4,500 د.ك)', rate: '2%', applied: next4500 },
      { range: `الباقي (${(amount - 5000).toFixed(3)} د.ك)`, rate: '1.5%', applied: excess }
    );
  } else if (amount <= 50000) {
    const first500 = 500 * 0.025;
    const next4500 = 4500 * 0.02;
    const next5000 = 5000 * 0.015;
    const excess = (amount - 10000) * 0.01;
    fee = first500 + next4500 + next5000 + excess;
    breakdown.push(
      { range: 'أول 500 د.ك', rate: '2.5%', applied: first500 },
      { range: 'ال仟ار (4,500 د.ك)', rate: '2%', applied: next4500 },
      { range: 'ال仟ار (5,000 د.ك)', rate: '1.5%', applied: next5000 },
      { range: `الباقي (${(amount - 10000).toFixed(3)} د.ك)`, rate: '1%', applied: excess }
    );
  } else {
    const first500 = 500 * 0.025;
    const next4500 = 4500 * 0.02;
    const next5000 = 5000 * 0.015;
    const next40000 = 40000 * 0.01;
    const excess = (amount - 50000) * 0.005;
    fee = first500 + next4500 + next5000 + next40000 + excess;
    breakdown.push(
      { range: 'أول 500 د.ك', rate: '2.5%', applied: first500 },
      { range: 'ال仟ار (4,500 د.ك)', rate: '2%', applied: next4500 },
      { range: 'ال仟ار (5,000 د.ك)', rate: '1.5%', applied: next5000 },
      { range: 'ال仟ار (40,000 د.ك)', rate: '1%', applied: next40000 },
      { range: `الباقي (${(amount - 50000).toFixed(3)} د.ك)`, rate: '0.5%', applied: excess }
    );
  }

  const totalFee = Math.round(fee * 1000) / 1000;

  return {
    claimAmount: amount,
    totalFee,
    formattedFee: `${totalFee.toFixed(3)} د.ك`,
    breakdown,
    note: 'الرسوم تقريبية وفقاً لقانون رسوم المحاكم Kuwait Court Fees Law'
  };
};

module.exports = { calculateCourtFees };
