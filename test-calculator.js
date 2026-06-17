// Simulate calculator computation logic
function calculateScope1(data) {
  const stationary = (parseFloat(data.stationaryFuel) || 0) * 2.68 + 
                     (parseFloat(data.stationaryGas) || 0) * 1.96;
  const mobile = (parseFloat(data.mobileGasoline) || 0) * 2.31 +
                 (parseFloat(data.mobileDiesel) || 0) * 2.68;
  const fugitive = (parseFloat(data.refrigerant) || 0) * 1430;
  return {
    stationary: stationary.toFixed(2),
    mobile: mobile.toFixed(2),
    fugitive: fugitive.toFixed(2),
    total: (stationary + mobile + fugitive).toFixed(2)
  };
}

function calculateScope2(data) {
  const electricity = (parseFloat(data.electricity) || 0) * 0.4;
  return {
    locationBased: electricity.toFixed(2),
    total: electricity.toFixed(2)
  };
}

// Test data
const testData = {
  stationaryFuel: 1000,
  stationaryGas: 500,
  mobileGasoline: 200,
  mobileDiesel: 100,
  refrigerant: 5,
  electricity: 10000
};

console.log('Calculator Computation Test:');
console.log('Input:', testData);

const s1 = calculateScope1(testData);
console.log('\nScope 1 Results:');
console.log('  Stationary:', s1.stationary, 'tCO₂e');
console.log('  Mobile:', s1.mobile, 'tCO₂e');
console.log('  Fugitive:', s1.fugitive, 'tCO₂e');
console.log('  Total:', s1.total, 'tCO₂e');

const s2 = calculateScope2(testData);
console.log('\nScope 2 Results:');
console.log('  Location-based:', s2.locationBased, 'tCO₂e');

// Verify expected values
const expected = {
  stationary: (1000 * 2.68 + 500 * 1.96).toFixed(2), // 2680 + 980 = 3660
  mobile: (200 * 2.31 + 100 * 2.68).toFixed(2),      // 462 + 268 = 730
  fugitive: (5 * 1430).toFixed(2),                    // 7150
  total: (3660 + 730 + 7150).toFixed(2)              // 11540
};

console.log('\nVerification:');
console.log('  Stationary:', s1.stationary === expected.stationary ? '✅' : '❌', 
  `Expected: ${expected.stationary}, Got: ${s1.stationary}`);
console.log('  Mobile:', s1.mobile === expected.mobile ? '✅' : '❌',
  `Expected: ${expected.mobile}, Got: ${s1.mobile}`);
console.log('  Fugitive:', s1.fugitive === expected.fugitive ? '✅' : '❌',
  `Expected: ${expected.fugitive}, Got: ${s1.fugitive}`);
console.log('  Total:', s1.total === expected.total ? '✅' : '❌',
  `Expected: ${expected.total}, Got: ${s1.total}`);
