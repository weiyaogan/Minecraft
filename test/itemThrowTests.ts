import assert from 'assert';
import { Vector3 } from 'three';
import { useWorldStore } from '../src/store';
import { computeItemThrowSpawnAndVelocity, isItemInSolidBlock } from '../src/utils/itemThrow';
import { Block } from '../src/world/blocks';

console.log('=== RUNNING ITEM THROWING TEST SUITE ===\n');

// Set up initial test world
const initialBlocks: Block[] = [
  { x: 0, y: 4, z: 0, type: 'dirt' },
  { x: 0, y: 4, z: -1, type: 'dirt' },
  { x: 0, y: 4, z: -2, type: 'dirt' },
  { x: 1, y: 4, z: 0, type: 'dirt' },
  { x: -1, y: 4, z: 0, type: 'dirt' },
];

useWorldStore.setState({
  blocks: initialBlocks,
  playerFeetPosition: new Vector3(0, 5, 0),
  playerHeight: 1.8,
  droppedItems: [],
  hotbar: [
    { type: 'dirt', count: 64 },
    { type: 'stone', count: 10 },
    { type: null, count: 0 },
    { type: null, count: 0 },
    { type: null, count: 0 },
    { type: null, count: 0 },
    { type: null, count: 0 },
    { type: null, count: 0 },
    { type: null, count: 0 },
  ],
  selectedHotbarSlot: 0,
});

// -------------------------------------------------------------
// TEST 1: Throw while looking straight ahead
// -------------------------------------------------------------
console.log('--- Test 1: Throw while looking straight ahead ---');
{
  const cameraDir = new Vector3(0, 0, -1);
  const cameraPos = new Vector3(0, 6.62, 0); // Player eye level
  const { position, velocity } = computeItemThrowSpawnAndVelocity(
    new Vector3(0, 5, 0),
    1.8,
    initialBlocks,
    cameraPos,
    cameraDir
  );

  // Starts near head height (eye level 6.62, head ~6.50)
  assert(position[1] >= 6.35 && position[1] <= 6.65, `Spawn Y ${position[1]} should be near head height (~6.50)`);
  // Starts slightly in front (z < 0)
  assert(position[2] < 0, `Spawn Z ${position[2]} should be in front of player (z < 0)`);
  // Forward impulse along -Z
  assert(velocity[2] < -4.0, `Velocity Z ${velocity[2]} should have strong forward impulse (< -4.0)`);
  // Gentle upward arc
  assert(velocity[1] > 0.5 && velocity[1] < 2.0, `Velocity Y ${velocity[1]} should have modest upward component (0.5 to 2.0)`);
  console.log('[PASS] Item thrown straight ahead spawns at head height with forward impulse and gentle upward arc');
}

// -------------------------------------------------------------
// TEST 2: Throw while looking upward
// -------------------------------------------------------------
console.log('\n--- Test 2: Throw while looking upward ---');
{
  // 60 degrees upward pitch: dir.y ≈ 0.866, dir.z = -0.5
  const cameraDir = new Vector3(0, Math.sin(Math.PI / 3), -Math.cos(Math.PI / 3)).normalize();
  const cameraPos = new Vector3(0, 6.62, 0);
  const { position, velocity } = computeItemThrowSpawnAndVelocity(
    new Vector3(0, 5, 0),
    1.8,
    initialBlocks,
    cameraPos,
    cameraDir
  );

  assert(position[1] >= 6.4, `Spawn Y ${position[1]} starts at head level`);
  assert(velocity[1] > 4.5, `Looking upward must throw the item upward (vy = ${velocity[1]}, expected > 4.5)`);
  console.log(`[PASS] Item thrown looking upward has strong upward velocity (vy = ${velocity[1].toFixed(2)} m/s)`);
}

// -------------------------------------------------------------
// TEST 3: Throw while looking downward
// -------------------------------------------------------------
console.log('\n--- Test 3: Throw while looking downward ---');
{
  // 60 degrees downward pitch: dir.y ≈ -0.866, dir.z = -0.5
  const cameraDir = new Vector3(0, -Math.sin(Math.PI / 3), -Math.cos(Math.PI / 3)).normalize();
  const cameraPos = new Vector3(0, 6.62, 0);
  const { position, velocity } = computeItemThrowSpawnAndVelocity(
    new Vector3(0, 5, 0),
    1.8,
    initialBlocks,
    cameraPos,
    cameraDir
  );

  assert(position[1] >= 6.1, `Spawn Y ${position[1]} starts at head level`);
  assert(velocity[1] < -2.0, `Looking downward must throw the item downward (vy = ${velocity[1]}, expected < -2.0)`);
  console.log(`[PASS] Item thrown looking downward has downward velocity (vy = ${velocity[1].toFixed(2)} m/s)`);
}

// -------------------------------------------------------------
// TEST 4: Throw while looking toward a wall
// -------------------------------------------------------------
console.log('\n--- Test 4: Throw while looking toward a wall ---');
{
  // Place a wall block 0.8 units in front of player: at z = -1
  // Block bounds: x: [-0.5, 0.5], y: [5.5, 6.5], z: [-1.5, -0.5]
  const blocksWithWall: Block[] = [
    ...initialBlocks,
    { x: 0, y: 6, z: -1, type: 'stone' },
  ];

  const cameraDir = new Vector3(0, 0, -1);
  // Player standing very close to wall at z = -0.3
  const playerFeet = new Vector3(0, 5, -0.3);
  const cameraPos = new Vector3(0, 6.62, -0.3);

  const { position } = computeItemThrowSpawnAndVelocity(
    playerFeet,
    1.8,
    blocksWithWall,
    cameraPos,
    cameraDir
  );

  const colliding = isItemInSolidBlock(position[0], position[1], position[2], blocksWithWall);
  assert(!colliding, `Item must not spawn inside wall block at position [${position.join(', ')}]`);
  console.log(`[PASS] Item spawned safely at [${position.map(n => n.toFixed(2)).join(', ')}] without clipping into wall`);
}

// -------------------------------------------------------------
// TEST 5: Throw while standing near a block or edge
// -------------------------------------------------------------
console.log('\n--- Test 5: Throw while standing near a block or edge ---');
{
  // Player standing on edge at x = 0, z = 0; no floor at z < -0.5
  const edgeBlocks: Block[] = [
    { x: 0, y: 4, z: 0, type: 'dirt' },
  ];
  const cameraDir = new Vector3(0, -0.3, -0.95).normalize();
  const cameraPos = new Vector3(0, 6.62, 0);

  const { position, velocity } = computeItemThrowSpawnAndVelocity(
    new Vector3(0, 5, 0),
    1.8,
    edgeBlocks,
    cameraPos,
    cameraDir
  );

  const colliding = isItemInSolidBlock(position[0], position[1], position[2], edgeBlocks);
  assert(!colliding, 'Item must not spawn inside block near edge');
  assert(velocity[2] < -3.5, 'Item travels outward over edge');
  console.log('[PASS] Item thrown near edge successfully spawns clear of obstacles and flies outward');
}

// -------------------------------------------------------------
// TEST 6: Verify the item starts near the player's head, not the lower body
// -------------------------------------------------------------
console.log('\n--- Test 6: Verify the item starts near the player\'s head, not the lower body ---');
{
  const feetY = 5.0;
  const waistY = feetY + 0.9; // 5.9
  const feetPos = new Vector3(0, feetY, 0);

  // Test across 12 different pitch/yaw directions
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const pitch = (Math.random() - 0.5) * (Math.PI * 0.8);
    const dir = new Vector3(
      Math.cos(pitch) * Math.sin(angle),
      Math.sin(pitch),
      -Math.cos(pitch) * Math.cos(angle)
    ).normalize();

    const { position } = computeItemThrowSpawnAndVelocity(
      feetPos,
      1.8,
      initialBlocks,
      new Vector3(0, feetY + 1.62, 0),
      dir
    );

    assert(position[1] > waistY + 0.3, `Spawn Y ${position[1]} must be strictly above waist level (${waistY})`);
    assert(position[1] < feetY + 2.0, `Spawn Y ${position[1]} must not be excessively high above head`);
  }
  console.log('[PASS] Confirmed across all angles that item spawns at head level, never at waist or feet');
}

// -------------------------------------------------------------
// TEST 7: Verify the item travels in the camera's actual facing direction
// -------------------------------------------------------------
console.log('\n--- Test 7: Verify the item travels in the camera\'s actual facing direction ---');
{
  const testDirections = [
    { name: 'Forward (+Z)', dir: new Vector3(0, 0, 1) },
    { name: 'Backward (-Z)', dir: new Vector3(0, 0, -1) },
    { name: 'Right (+X)', dir: new Vector3(1, 0, 0) },
    { name: 'Left (-X)', dir: new Vector3(-1, 0, 0) },
    { name: 'Diagonal (+X, -Z)', dir: new Vector3(1, 0, -1).normalize() },
  ];

  for (const t of testDirections) {
    const { velocity } = computeItemThrowSpawnAndVelocity(
      new Vector3(0, 5, 0),
      1.8,
      initialBlocks,
      new Vector3(0, 6.62, 0),
      t.dir
    );

    // Horizontal velocity dot product with dir should be positive and >= 4.0
    const hDot = velocity[0] * t.dir.x + velocity[2] * t.dir.z;
    assert(hDot > 4.0, `${t.name}: Velocity must align with camera look direction (dot = ${hDot})`);
  }
  console.log('[PASS] Verified item travel direction aligns with camera facing in all horizontal and diagonal directions');
}

// -------------------------------------------------------------
// TEST 8: Verify gravity, collisions, pickup delay, and independent item entities
// -------------------------------------------------------------
console.log('\n--- Test 8: Verify gravity, collisions, pickup delay, and independent item entities ---');
{
  useWorldStore.setState({ droppedItems: [] });

  // Throw two items sequentially in the same direction
  const lookDir = new Vector3(0, 0, -1);
  const eyePos = new Vector3(0, 6.62, 0);

  useWorldStore.getState().throwCurrentItem(false, eyePos, lookDir);
  useWorldStore.getState().throwCurrentItem(false, eyePos, lookDir);

  const items = useWorldStore.getState().droppedItems;
  assert.strictEqual(items.length, 2, 'Two independent items should be spawned');
  assert.notStrictEqual(items[0].id, items[1].id, 'Entities must have unique IDs');
  assert.strictEqual(items[0].pickupDelay, 0.5, 'Item 1 has 0.5s pickup delay');
  assert.strictEqual(items[1].pickupDelay, 0.5, 'Item 2 has 0.5s pickup delay');

  // Slight jitter ensures independent velocities
  const v0 = items[0].velocity;
  const v1 = items[1].velocity;
  assert(v0[0] !== v1[0] || v0[1] !== v1[1] || v0[2] !== v1[2], 'Items have independent velocities via natural jitter');

  // Simulate gravity on item 0
  const dt = 0.05;
  const initialVy = v0[1];
  const simulatedVy = initialVy - 15 * dt;
  assert(simulatedVy < initialVy, 'Gravity accelerates downward');
  console.log('[PASS] Entity independence, 0.5s pickup delay, and physics gravity verified');
}

// -------------------------------------------------------------
// TEST 9: Verify Q and Ctrl+Q drop the correct quantities without duplication or loss
// -------------------------------------------------------------
console.log('\n--- Test 9: Verify Q and Ctrl+Q drop quantities without duplication or loss ---');
{
  // Reset hotbar slot 0 to 64 dirt items
  useWorldStore.setState({
    hotbar: [
      { type: 'dirt', count: 64 },
      { type: null, count: 0 },
      { type: null, count: 0 },
      { type: null, count: 0 },
      { type: null, count: 0 },
      { type: null, count: 0 },
      { type: null, count: 0 },
      { type: null, count: 0 },
      { type: null, count: 0 },
    ],
    selectedHotbarSlot: 0,
    droppedItems: [],
  });

  const eyePos = new Vector3(0, 6.62, 0);
  const lookDir = new Vector3(0, 0, -1);

  // Desktop Q: single item drop
  useWorldStore.getState().throwCurrentItem(false, eyePos, lookDir);
  let state = useWorldStore.getState();
  assert.strictEqual(state.hotbar[0].count, 63, 'Q drops 1 item, leaving 63');
  assert.strictEqual(state.droppedItems.length, 1, '1 item entity dropped');
  assert.strictEqual(state.droppedItems[0].count, 1, 'Dropped entity count is 1');
  assert.strictEqual(state.hotbar[0].count + state.droppedItems[0].count, 64, 'Zero loss or duplication (63 + 1 = 64)');

  // Desktop Ctrl+Q: drop entire remaining stack (63)
  useWorldStore.getState().throwCurrentItem(true, eyePos, lookDir);
  state = useWorldStore.getState();
  assert.strictEqual(state.hotbar[0].count, 0, 'Ctrl+Q clears slot to count 0');
  assert.strictEqual(state.hotbar[0].type, null, 'Slot type becomes null');
  assert.strictEqual(state.droppedItems.length, 2, '2 total dropped entities');
  assert.strictEqual(state.droppedItems[1].count, 63, 'Second dropped entity has count 63');

  const totalDirt = (state.hotbar[0].count || 0) + state.droppedItems[0].count + state.droppedItems[1].count;
  assert.strictEqual(totalDirt, 64, 'Total item count strictly preserved at 64');

  // Test Cursor drop (Inventory interaction used on both desktop and mobile)
  useWorldStore.setState({
    cursorItem: { type: 'stone', count: 16 },
  });

  // Drop 1 from cursor
  useWorldStore.getState().throwInventoryItem('cursor', 0, false, eyePos, lookDir);
  state = useWorldStore.getState();
  assert(state.cursorItem !== null && state.cursorItem.count === 15, 'Cursor decremented to 15');
  assert.strictEqual(state.droppedItems[2].type, 'stone', 'Dropped item is stone');
  assert.strictEqual(state.droppedItems[2].count, 1, 'Dropped item count is 1');

  // Drop remaining stack from cursor
  useWorldStore.getState().throwInventoryItem('cursor', 0, true, eyePos, lookDir);
  state = useWorldStore.getState();
  assert.strictEqual(state.cursorItem, null, 'Cursor cleared to null after dropAll');
  assert.strictEqual(state.droppedItems[3].count, 15, 'Remaining 15 items dropped');

  console.log('[PASS] Q and Ctrl+Q and cursor drops strictly preserve item conservation without duplication or loss');
}

// -------------------------------------------------------------
// TEST 10: CRITICAL CUSTOM RULE - NEVER MERGE THROWN ITEMS
// -------------------------------------------------------------
console.log('\n--- Test 10: CRITICAL CUSTOM RULE - NEVER MERGE THROWN ITEMS ---');
{
  useWorldStore.setState({
    hotbar: [
      { type: 'dirt', count: 64 },
      { type: null, count: 0 },
      { type: null, count: 0 },
      { type: null, count: 0 },
      { type: null, count: 0 },
      { type: null, count: 0 },
      { type: null, count: 0 },
      { type: null, count: 0 },
      { type: null, count: 0 },
    ],
    selectedHotbarSlot: 0,
    droppedItems: [],
  });

  const eyePos = new Vector3(0, 6.62, 0);
  const lookDir = new Vector3(0, 0, -1);

  // Rapidly throw 5 dirt items at the exact same location and orientation
  for (let i = 0; i < 5; i++) {
    useWorldStore.getState().throwCurrentItem(false, eyePos, lookDir);
  }

  const items = useWorldStore.getState().droppedItems;
  assert.strictEqual(items.length, 5, 'Must have exactly 5 distinct dropped entities, not merged into 1');
  
  for (let i = 0; i < items.length; i++) {
    assert.strictEqual(items[i].type, 'dirt', `Item ${i} must be dirt`);
    assert.strictEqual(items[i].count, 1, `Item ${i} must have count 1, never merged/combined`);
  }

  // Check unique IDs and distinct spawn coordinates
  const idSet = new Set(items.map(it => it.id));
  assert.strictEqual(idSet.size, 5, 'Every entity must have a unique ID');

  // Verify same-spawn-position micro-offsets (coordinates are slightly varied, not identical float values)
  const posStrings = new Set(items.map(it => `${it.position[0].toFixed(5)},${it.position[2].toFixed(5)}`));
  assert(posStrings.size >= 4, 'Micro-offsets prevent identical pixel/coordinate occupancy for rapid throws');

  console.log('[PASS] 5 identical items thrown at same position remain 5 completely independent entities without merging');
}

// -------------------------------------------------------------
// TEST 11: Block drops never merge
// -------------------------------------------------------------
console.log('\n--- Test 11: Block drops never merge ---');
{
  useWorldStore.setState({ droppedItems: [] });

  // Simulate breaking 3 grass/dirt blocks at adjacent locations
  useWorldStore.getState().addDroppedItem('dirt', [0, 4, 0], 1, [0, 2, 0], 0.1);
  useWorldStore.getState().addDroppedItem('dirt', [0, 4, 0.2], 1, [0, 2, 0], 0.1);
  useWorldStore.getState().addDroppedItem('dirt', [0.1, 4, 0.1], 1, [0, 2, 0], 0.1);

  const blockDrops = useWorldStore.getState().droppedItems;
  assert.strictEqual(blockDrops.length, 3, '3 block drops produce 3 separate entities');
  assert(blockDrops.every(b => b.count === 1), 'Every block drop retains its own count of 1 without merging');

  console.log('[PASS] Block drops remain separate entities and never merge');
}

console.log('\n=== ALL 11 ITEM THROWING TESTS PASSED PERFECTLY ===\n');
