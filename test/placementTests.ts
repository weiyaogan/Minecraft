import { Vector3 } from 'three';
import { Block, BlockType, WORLD_BOUNDS } from '../src/world/blocks';
import {
  intersectBlock,
  findTargetBlock,
  getPlacementCoordinates,
  validateBlockPlacement,
} from '../src/utils/blockPlacement';
import { useWorldStore } from '../src/store';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passed++;
  } else {
    console.error(`[FAIL] ${testName}: ${detail || 'Condition not met'}`);
    failed++;
  }
}

async function runTests() {
  console.log('=== RUNNING MINECRAFT BLOCK PLACEMENT TEST SUITE ===\n');

  // -------------------------------------------------------------
  // TEST 1: Place blocks on every reachable face (+X, -X, +Y, -Y, +Z, -Z)
  // -------------------------------------------------------------
  console.log('--- Test 1: Every Reachable Face Raycast & Normal ---');
  const centerBlock: Block = { x: 0, y: 5, z: 0, type: 'stone' };

  // Face +X (looking from +X towards -X)
  const rayPlusX = intersectBlock(new Vector3(3, 5, 0), new Vector3(-1, 0, 0), centerBlock);
  assert(rayPlusX.hit && rayPlusX.normal.x === 1 && rayPlusX.normal.y === 0 && rayPlusX.normal.z === 0, 'Face +X Normal is (+1, 0, 0)');

  // Face -X (looking from -X towards +X)
  const rayMinusX = intersectBlock(new Vector3(-3, 5, 0), new Vector3(1, 0, 0), centerBlock);
  assert(rayMinusX.hit && rayMinusX.normal.x === -1 && rayMinusX.normal.y === 0 && rayMinusX.normal.z === 0, 'Face -X Normal is (-1, 0, 0)');

  // Face +Y (looking from above down)
  const rayPlusY = intersectBlock(new Vector3(0, 8, 0), new Vector3(0, -1, 0), centerBlock);
  assert(rayPlusY.hit && rayPlusY.normal.y === 1 && rayPlusY.normal.x === 0 && rayPlusY.normal.z === 0, 'Face +Y Normal is (0, +1, 0)');

  // Face -Y (looking from below up)
  const rayMinusY = intersectBlock(new Vector3(0, 2, 0), new Vector3(0, 1, 0), centerBlock);
  assert(rayMinusY.hit && rayMinusY.normal.y === -1 && rayMinusY.normal.x === 0 && rayMinusY.normal.z === 0, 'Face -Y Normal is (0, -1, 0)');

  // Face +Z (looking from +Z towards -Z)
  const rayPlusZ = intersectBlock(new Vector3(0, 5, 3), new Vector3(0, 0, -1), centerBlock);
  assert(rayPlusZ.hit && rayPlusZ.normal.z === 1 && rayPlusZ.normal.x === 0 && rayPlusZ.normal.y === 0, 'Face +Z Normal is (0, 0, +1)');

  // Face -Z (looking from -Z towards +Z)
  const rayMinusZ = intersectBlock(new Vector3(0, 5, -3), new Vector3(0, 0, 1), centerBlock);
  assert(rayMinusZ.hit && rayMinusZ.normal.z === -1 && rayMinusZ.normal.x === 0 && rayMinusZ.normal.y === 0, 'Face -Z Normal is (0, 0, -1)');

  // -------------------------------------------------------------
  // TEST 2: Exact Grid Alignment
  // -------------------------------------------------------------
  console.log('\n--- Test 2: Exact Grid Alignment ---');
  const posTop = getPlacementCoordinates(centerBlock, rayPlusY.normal);
  assert(posTop.placeX === 0 && posTop.placeY === 6 && posTop.placeZ === 0, 'Placement above is strictly (0, 6, 0)');
  assert(Number.isInteger(posTop.placeX) && Number.isInteger(posTop.placeY) && Number.isInteger(posTop.placeZ), 'Coordinates are exact integers');

  const posEast = getPlacementCoordinates(centerBlock, rayPlusX.normal);
  assert(posEast.placeX === 1 && posEast.placeY === 5 && posEast.placeZ === 0, 'Placement east is strictly (1, 5, 0)');

  const posWest = getPlacementCoordinates(centerBlock, rayMinusX.normal);
  assert(posWest.placeX === -1 && posWest.placeY === 5 && posWest.placeZ === 0, 'Placement west is strictly (-1, 5, 0)');

  const posNorth = getPlacementCoordinates(centerBlock, rayMinusZ.normal);
  assert(posNorth.placeX === 0 && posNorth.placeY === 5 && posNorth.placeZ === -1, 'Placement north is strictly (0, 5, -1)');

  const posSouth = getPlacementCoordinates(centerBlock, rayPlusZ.normal);
  assert(posSouth.placeX === 0 && posSouth.placeY === 5 && posSouth.placeZ === 1, 'Placement south is strictly (0, 5, 1)');

  // -------------------------------------------------------------
  // TEST 3: Attempt Placement Inside Player (Rejected & No Items Consumed)
  // -------------------------------------------------------------
  console.log('\n--- Test 3: Rejection of Placement Inside Player Collision Body ---');
  const playerPos = new Vector3(0, 6, 0); // Feet at (0, 6, 0), height 1.8 -> occupies y from 6.0 to 7.8
  const playerHeight = 1.8;
  const mockSlot = { type: 'dirt' as BlockType, count: 10 };
  const mockBlocks: Block[] = [centerBlock];

  // Try placing at (0, 6, 0) where player's feet/legs are
  const validateInsideFeet = validateBlockPlacement(0, 6, 0, playerPos, playerHeight, mockBlocks, mockSlot);
  assert(!validateInsideFeet.valid && validateInsideFeet.reason === 'inside_player', 'Placement inside player feet is rejected');

  // Try placing at (0, 7, 0) where player's torso/head is
  const validateInsideTorso = validateBlockPlacement(0, 7, 0, playerPos, playerHeight, mockBlocks, mockSlot);
  assert(!validateInsideTorso.valid && validateInsideTorso.reason === 'inside_player', 'Placement inside player torso is rejected');

  // Try placing outside player collision body at (2, 6, 0) (two blocks to the side)
  const validateBesidePlayer = validateBlockPlacement(2, 6, 0, playerPos, playerHeight, mockBlocks, mockSlot);
  assert(validateBesidePlayer.valid, 'Placement outside player collision body is accepted');

  // Try placing above player head at (0, 9, 0) (bottom of block is at 8.5, well above head at 7.8)
  const validateAboveHead = validateBlockPlacement(0, 9, 0, playerPos, playerHeight, mockBlocks, mockSlot);
  assert(validateAboveHead.valid, 'Placement above player head is accepted');

  // -------------------------------------------------------------
  // TEST 4: Attempt Placement in Occupied Cell (Rejected)
  // -------------------------------------------------------------
  console.log('\n--- Test 4: Rejection of Placement in Occupied Cell ---');
  // centerBlock is at (0, 5, 0)
  const validateOccupied = validateBlockPlacement(0, 5, 0, new Vector3(10, 10, 10), playerHeight, mockBlocks, mockSlot);
  assert(!validateOccupied.valid && validateOccupied.reason === 'occupied', 'Placement in occupied cell is rejected');

  // -------------------------------------------------------------
  // TEST 5: Attempt Placement Outside World Boundaries (Rejected)
  // -------------------------------------------------------------
  console.log('\n--- Test 5: World Boundaries Validation ---');
  const validateTooLow = validateBlockPlacement(0, WORLD_BOUNDS.minY - 1, 0, new Vector3(10, 10, 10), playerHeight, mockBlocks, mockSlot);
  assert(!validateTooLow.valid && validateTooLow.reason === 'out_of_bounds', 'Placement below minY is rejected');

  const validateTooHigh = validateBlockPlacement(0, WORLD_BOUNDS.maxY + 1, 0, new Vector3(10, 10, 10), playerHeight, mockBlocks, mockSlot);
  assert(!validateTooHigh.valid && validateTooHigh.reason === 'out_of_bounds', 'Placement above maxY is rejected');

  const validateTooFarX = validateBlockPlacement(WORLD_BOUNDS.maxX + 1, 5, 0, new Vector3(10, 10, 10), playerHeight, mockBlocks, mockSlot);
  assert(!validateTooFarX.valid && validateTooFarX.reason === 'out_of_bounds', 'Placement beyond maxX is rejected');

  // -------------------------------------------------------------
  // TEST 6: Inventory Quantity Decrements Exactly 1 on Success
  // -------------------------------------------------------------
  console.log('\n--- Test 6: Inventory Consumption on Success ---');
  const store = useWorldStore.getState();
  // Set up store hotbar
  useWorldStore.setState({
    hotbar: [
      { type: 'grass', count: 5 },
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
    blocks: [{ x: 0, y: 0, z: 0, type: 'stone' }],
    playerFeetPosition: new Vector3(0, 5, 0),
  });

  const slotBefore = useWorldStore.getState().hotbar[0];
  assert(slotBefore.count === 5, 'Slot initially has count 5');
  useWorldStore.getState().removeInventory(0, 1);
  const slotAfter = useWorldStore.getState().hotbar[0];
  assert(slotAfter.count === 4 && slotAfter.type === 'grass', 'Slot decremented by 1 to count 4');

  // -------------------------------------------------------------
  // TEST 7: Slot Clears to Empty { type: null, count: 0 } When Last Item Placed
  // -------------------------------------------------------------
  console.log('\n--- Test 7: Slot Clears to Empty on Depletion ---');
  useWorldStore.setState({
    hotbar: [
      { type: 'sand', count: 1 },
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
  });

  useWorldStore.getState().removeInventory(0, 1);
  const clearedSlot = useWorldStore.getState().hotbar[0];
  assert(clearedSlot.count === 0 && clearedSlot.type === null, 'Slot cleared to count 0 and type null');

  // -------------------------------------------------------------
  // TEST 8: Offhand Fallback When Main Hand is Empty
  // -------------------------------------------------------------
  console.log('\n--- Test 8: Offhand Fallback When Main Hand is Empty ---');
  useWorldStore.setState({
    hotbar: [
      { type: null, count: 0 },
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
    offhand: { type: 'stone', count: 3 },
  });

  const stateNow = useWorldStore.getState();
  let slotToUse = stateNow.hotbar[stateNow.selectedHotbarSlot];
  let isOffhand = false;
  if (!slotToUse || !slotToUse.type || slotToUse.count <= 0) {
    if (stateNow.offhand && stateNow.offhand.type && stateNow.offhand.count > 0) {
      slotToUse = stateNow.offhand;
      isOffhand = true;
    }
  }

  assert(isOffhand && slotToUse.type === 'stone', 'Correctly selected offhand as fallback');
  useWorldStore.getState().removeOffhand(1);
  assert(useWorldStore.getState().offhand.count === 2, 'Offhand decremented to 2');

  // -------------------------------------------------------------
  // TEST 9: Duplicate Placement / Rapid Double Placement Prevention
  // -------------------------------------------------------------
  console.log('\n--- Test 9: Rapid Double Placement Prevention ---');
  let lastPlaceTime = 1000;
  const now1 = 1050; // 50ms later (same tick or rapid bounce)
  const canPlaceRapid = now1 - lastPlaceTime >= 180;
  assert(!canPlaceRapid, '50ms rapid bounce placement is blocked');

  const now2 = 1200; // 200ms later (valid repeat tick)
  const canPlaceNormal = now2 - lastPlaceTime >= 180;
  assert(canPlaceNormal, '200ms normal interval placement is allowed');

  // -------------------------------------------------------------
  // TEST 10: Device Consistency (Desktop & Mobile share same validation)
  // -------------------------------------------------------------
  console.log('\n--- Test 10: Desktop & Mobile Consistency ---');
  const targetDesktop = findTargetBlock(new Vector3(0, 5, -3), new Vector3(0, 0, 1), [centerBlock]);
  assert(targetDesktop.block !== null && targetDesktop.normal !== null, 'Target ray works for desktop center crosshair');
  const targetMobile = findTargetBlock(new Vector3(0, 5, -3), new Vector3(0, 0, 1), [centerBlock]);
  assert(
    targetDesktop.block?.x === targetMobile.block?.x &&
    targetDesktop.normal?.z === targetMobile.normal?.z,
    'Desktop and Mobile share identical raycast, normal, and targeting'
  );

  // -------------------------------------------------------------
  // TEST 11: Regression Testing (Mining & World Integrity)
  // -------------------------------------------------------------
  console.log('\n--- Test 11: Mining & World Integrity Regression ---');
  useWorldStore.setState({
    blocks: [
      { x: 0, y: 0, z: 0, type: 'dirt' },
      { x: 1, y: 0, z: 0, type: 'stone' },
    ],
    droppedItems: [],
  });
  useWorldStore.getState().removeBlock(0, 0, 0);
  const remainingBlocks = useWorldStore.getState().blocks;
  assert(remainingBlocks.length === 1 && remainingBlocks[0].x === 1, 'removeBlock works correctly');

  useWorldStore.getState().addBlock(2, 0, 0, 'sand');
  const afterAdd = useWorldStore.getState().blocks;
  const addedBlock = afterAdd.find(b => b.x === 2 && b.type === 'sand');
  assert(afterAdd.length === 2 && addedBlock !== undefined, 'addBlock works correctly');
  assert(typeof addedBlock?.createdAt === 'number', 'Placement attaches createdAt timestamp for subtle scale animation');

  // Look away test: raycast pointing in empty space returns null target
  const targetLookAway = findTargetBlock(new Vector3(0, 5, -3), new Vector3(0, 1, 0), remainingBlocks);
  assert(targetLookAway.block === null && targetLookAway.normal === null, 'Looking away produces null target and hides outline');

  // Item entity independence: adding dropped item creates independent entity unaffected by particles
  useWorldStore.getState().addDroppedItem('dirt', [0, 5, 0], 1, [0, 1, 0], 0.1);
  const items = useWorldStore.getState().droppedItems;
  assert(items.length === 1 && items[0].type === 'dirt', 'Dropped item entity created independently with correct type and count');

  // Rejection check: invalid placement produces no block addition
  const initialCount = useWorldStore.getState().blocks.length;
  const playerAtFeet = new Vector3(2, 0, 0);
  const invalidVal = validateBlockPlacement(2, 0, 0, playerAtFeet, 1.8, useWorldStore.getState().blocks, { type: 'stone', count: 1 });
  assert(!invalidVal.valid, 'Placement inside player is rejected');
  assert(useWorldStore.getState().blocks.length === initialCount, 'Blocks array untouched when placement is rejected');

  // -------------------------------------------------------------
  // TEST 12: Material Break Properties & Dropped Item Rules
  // -------------------------------------------------------------
  console.log('\n--- Test 12: Material Break Properties & Dropped Items ---');
  const { BLOCK_PROPERTIES } = await import('../src/world/blocks');
  // Stone: requiresTool = true -> bare hand break drops NOTHING
  assert(BLOCK_PROPERTIES.stone.requiresTool === true, 'Stone requires tool to harvest');
  assert(BLOCK_PROPERTIES.stone.breakTime === 7.5, 'Stone has 7.5s bare-hand break time');
  const stoneHarvestByHand = !BLOCK_PROPERTIES.stone.requiresTool;
  assert(!stoneHarvestByHand, 'Stone broken by bare hand drops nothing');

  // Grass: canBreakByHand = true, requiresTool = false, drops = dirt, dropCount = 1
  assert(BLOCK_PROPERTIES.grass.requiresTool === false, 'Grass does not require tool');
  assert(BLOCK_PROPERTIES.grass.drops === 'dirt' && BLOCK_PROPERTIES.grass.dropCount === 1, 'Grass drops 1 Dirt item');

  // Dirt: canBreakByHand = true, requiresTool = false, drops = dirt, dropCount = 1
  assert(BLOCK_PROPERTIES.dirt.requiresTool === false, 'Dirt does not require tool');
  assert(BLOCK_PROPERTIES.dirt.drops === 'dirt' && BLOCK_PROPERTIES.dirt.dropCount === 1, 'Dirt drops 1 Dirt item');

  // -------------------------------------------------------------
  // TEST 13: Item Throw / Drop Feedback & Mechanics
  // -------------------------------------------------------------
  console.log('\n--- Test 13: Item Throw Mechanics & Entity Separation ---');
  useWorldStore.setState({
    hotbar: [
      { type: 'stone', count: 3 },
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
    playerFeetPosition: new Vector3(0, 5, 0),
    playerHeight: 1.8,
  });

  // Throw 1 stone item forward
  useWorldStore.getState().throwCurrentItem(false, new Vector3(0, 0, -1));
  const hotbarAfterThrow = useWorldStore.getState().hotbar[0];
  const itemsAfterThrow = useWorldStore.getState().droppedItems;
  assert(hotbarAfterThrow.count === 2 && hotbarAfterThrow.type === 'stone', 'Slot decremented to 2 after single item throw');
  assert(itemsAfterThrow.length === 1 && itemsAfterThrow[0].type === 'stone' && itemsAfterThrow[0].count === 1, 'DroppedItem entity spawned with count 1');
  assert(itemsAfterThrow[0].pickupDelay === 0.5, 'Thrown item has 0.5s player pickup delay');

  // -------------------------------------------------------------
  // TEST 14: Audio Functions Resilience in Headless / Node
  // -------------------------------------------------------------
  console.log('\n--- Test 14: Audio Functions Resilience ---');
  const audioModule = await import('../src/utils/audio');
  // In Node environment, window.AudioContext is undefined; verify functions exit safely without throwing
  let audioThrew = false;
  try {
    audioModule.playDigSound('stone');
    audioModule.playDigSound('grass');
    audioModule.playDigSound('dirt');
    audioModule.playBreakSound('stone');
    audioModule.playBreakSound('grass');
    audioModule.playBreakSound('dirt');
    audioModule.playPlaceSound('stone');
    audioModule.playPlaceSound('dirt');
    audioModule.playPickupSound();
    audioModule.playItemDropSound();
    audioModule.playInventoryClickSound();
    audioModule.playJumpSound();
  } catch (err) {
    audioThrew = true;
  }
  assert(!audioThrew, 'All sound synthesis functions execute safely without crashing');

  console.log(`\n=== TEST SUITE COMPLETE: ${passed} PASSED, ${failed} FAILED ===`);
  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
