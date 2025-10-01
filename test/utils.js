export function expect_or(...tests) {
  if (!tests || !Array.isArray(tests)) return;
  try {
    tests.shift()?.();
  } catch (e) {
    if (tests.length) expect_or(...tests);
    else throw e;
  }
}
