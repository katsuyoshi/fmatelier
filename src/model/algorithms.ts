/**
 * DX7 algorithm definitions.
 *
 * Each algorithm defines a fixed routing of the 6 operators.
 * Operators that output audio are "carriers"; others are "modulators".
 *
 * Layout data includes vertical stacking groups for SVG rendering.
 * Each group is a vertical chain rendered as a column.
 */

export interface AlgorithmConnection {
  from: number; // modulator operator (1-6)
  to: number;   // carrier/destination operator (1-6)
}

export interface AlgorithmDef {
  id: number;
  carriers: number[];
  connections: AlgorithmConnection[];
  feedback: number; // which operator has self-feedback (1-6)
  /** Layout: array of vertical chains, bottom = carrier. Rendered left-to-right. */
  layout: number[][];
}

// prettier-ignore
export const ALGORITHMS: AlgorithmDef[] = [
  // Algorithm 1: 2→1, 4→3, 6→5→4. Carriers: 1, 3
  { id: 1, carriers: [1, 3], feedback: 6,
    connections: [{from:2,to:1},{from:4,to:3},{from:6,to:5},{from:5,to:4}],
    layout: [[2,1],[6,5,4,3]] },
  // Algorithm 2: 2→1, 6→5→4→3. Carriers: 1, 3
  { id: 2, carriers: [1, 3], feedback: 2,
    connections: [{from:2,to:1},{from:6,to:5},{from:5,to:4},{from:4,to:3}],
    layout: [[2,1],[6,5,4,3]] },
  // Algorithm 3: 3→2→1, 6→5→4. Carriers: 1, 4
  { id: 3, carriers: [1, 4], feedback: 6,
    connections: [{from:3,to:2},{from:2,to:1},{from:6,to:5},{from:5,to:4}],
    layout: [[3,2,1],[6,5,4]] },
  // Algorithm 4: 3→2→1, 6→5→4. (FB on 4→4). Carriers: 1, 4
  { id: 4, carriers: [1, 4], feedback: 4,
    connections: [{from:3,to:2},{from:2,to:1},{from:6,to:5},{from:5,to:4}],
    layout: [[3,2,1],[6,5,4]] },
  // Algorithm 5: 2→1, 4→3, 6→5. Carriers: 1, 3, 5
  { id: 5, carriers: [1, 3, 5], feedback: 6,
    connections: [{from:2,to:1},{from:4,to:3},{from:6,to:5}],
    layout: [[2,1],[4,3],[6,5]] },
  // Algorithm 6: 2→1, 4→3, 6→5. (FB on 5). Carriers: 1, 3, 5
  { id: 6, carriers: [1, 3, 5], feedback: 5,
    connections: [{from:2,to:1},{from:4,to:3},{from:6,to:5}],
    layout: [[2,1],[4,3],[6,5]] },
  // Algorithm 7: 2→1, 3→(1), 6→5→4. Carriers: 1, 4 (3 mods 1 too)
  { id: 7, carriers: [1, 4], feedback: 6,
    connections: [{from:2,to:1},{from:3,to:1},{from:6,to:5},{from:5,to:4}],
    layout: [[2,3,1],[6,5,4]] },
  // Algorithm 8: 2→1, 4→3, 6→5→4. (FB on 4). Carriers: 1, 3
  { id: 8, carriers: [1, 3], feedback: 4,
    connections: [{from:2,to:1},{from:4,to:3},{from:6,to:5},{from:5,to:4}],
    layout: [[2,1],[6,5,4,3]] },
  // Algorithm 9: 2→1, 3→(1), 6→5→4. (FB on 2). Carriers: 1, 4
  { id: 9, carriers: [1, 4], feedback: 2,
    connections: [{from:2,to:1},{from:3,to:1},{from:6,to:5},{from:5,to:4}],
    layout: [[2,3,1],[6,5,4]] },
  // Algorithm 10: 3→2→1, 6→(4,5). Carriers: 1, 4, 5
  { id: 10, carriers: [1, 4, 5], feedback: 3,
    connections: [{from:3,to:2},{from:2,to:1},{from:6,to:4},{from:6,to:5}],
    layout: [[3,2,1],[6,5],[6,4]] },
  // Algorithm 11: 3→2→1, 6→5→4. (FB on 6). Carriers: 1, 4
  { id: 11, carriers: [1, 4], feedback: 6,
    connections: [{from:2,to:1},{from:3,to:1},{from:6,to:5},{from:5,to:4}],
    layout: [[3,2,1],[6,5,4]] },
  // Algorithm 12: 2→1, 3→(1), 4→(1), 6→5. Carriers: 1, 5
  { id: 12, carriers: [1, 5], feedback: 2,
    connections: [{from:2,to:1},{from:3,to:1},{from:4,to:1},{from:6,to:5}],
    layout: [[2,3,4,1],[6,5]] },
  // Algorithm 13: 2→1, 3→(1), 4→(1), 6→5. Carriers: 1, 5
  { id: 13, carriers: [1, 5], feedback: 6,
    connections: [{from:2,to:1},{from:3,to:1},{from:4,to:1},{from:6,to:5}],
    layout: [[2,3,4,1],[6,5]] },
  // Algorithm 14: 2→1, 3→(1), 6→5→4. Carriers: 1, 4
  { id: 14, carriers: [1, 4], feedback: 6,
    connections: [{from:2,to:1},{from:3,to:1},{from:6,to:5},{from:5,to:4}],
    layout: [[2,3,1],[6,5,4]] },
  // Algorithm 15: 2→1, 3→(1), 6→5→4. (FB on 2). Carriers: 1, 4
  { id: 15, carriers: [1, 4], feedback: 2,
    connections: [{from:2,to:1},{from:3,to:1},{from:6,to:5},{from:5,to:4}],
    layout: [[2,3,1],[6,5,4]] },
  // Algorithm 16: 2→1, 3→1, 5→4→1, 6→(1). Carriers: 1
  { id: 16, carriers: [1], feedback: 6,
    connections: [{from:2,to:1},{from:3,to:1},{from:5,to:4},{from:4,to:1},{from:6,to:1}],
    layout: [[2,3,5,4,6,1]] },
  // Algorithm 17: 2→1, 3→1, 4→1, 6→5→(1). Carriers: 1
  { id: 17, carriers: [1], feedback: 2,
    connections: [{from:2,to:1},{from:3,to:1},{from:4,to:1},{from:6,to:5},{from:5,to:1}],
    layout: [[2,3,4,6,5,1]] },
  // Algorithm 18: 2→1, 3→(1), 6→5→4→(1). (FB on 3). Carriers: 1
  { id: 18, carriers: [1], feedback: 3,
    connections: [{from:2,to:1},{from:3,to:1},{from:6,to:5},{from:5,to:4},{from:4,to:1}],
    layout: [[2,3,6,5,4,1]] },
  // Algorithm 19: 3→2→1, 6→(4,5). (FB on 6). 4,5 carriers? No: 4→1, 5→1. Carriers: 1,4,5
  { id: 19, carriers: [1, 4, 5], feedback: 6,
    connections: [{from:3,to:2},{from:2,to:1},{from:6,to:4},{from:6,to:5}],
    layout: [[3,2,1],[6,4],[6,5]] },
  // Algorithm 20: 2→1, 3→(1), (4,5)→(1). (FB on 3). Carriers: 1, 4, 5
  { id: 20, carriers: [1, 4, 5], feedback: 3,
    connections: [{from:3,to:2},{from:3,to:1},{from:6,to:4},{from:6,to:5}],
    layout: [[3,2,1],[6,4],[6,5]] },
  // Algorithm 21: 3→2→1, 6→(4,5). All 4,5 carriers. (FB on 3)
  { id: 21, carriers: [1, 4, 5], feedback: 3,
    connections: [{from:3,to:2},{from:3,to:1},{from:6,to:4},{from:6,to:5}],
    layout: [[3,2,1],[6,4],[6,5]] },
  // Algorithm 22: 2→1, 3→1, 4→1, 5→1, 6→1. Carriers: 1. (FB on 6)
  { id: 22, carriers: [1], feedback: 6,
    connections: [{from:2,to:1},{from:3,to:1},{from:4,to:1},{from:5,to:1},{from:6,to:1}],
    layout: [[2,3,4,5,6,1]] },
  // Algorithm 23: 2→1, 3→(1), 4→1, 5→1, 6→(5). Carriers: 1, 5
  { id: 23, carriers: [1, 5], feedback: 6,
    connections: [{from:2,to:1},{from:3,to:1},{from:4,to:1},{from:6,to:5}],
    layout: [[2,3,4,1],[6,5]] },
  // Algorithm 24: 2→1, 3→1, 4→1, 5→(1), 6→5. Carriers: 1
  { id: 24, carriers: [1], feedback: 6,
    connections: [{from:2,to:1},{from:3,to:1},{from:4,to:1},{from:5,to:1},{from:6,to:5}],
    layout: [[2,3,4,6,5,1]] },
  // Algorithm 25: 2→1, 3→1, 4, 5, 6. Carriers: 1, 3, 4, 5, 6? No. Carriers: 1,4,5,6
  { id: 25, carriers: [1, 4, 5, 6], feedback: 6,
    connections: [{from:2,to:1},{from:3,to:1}],
    layout: [[2,3,1],[4],[5],[6]] },
  // Algorithm 26: 2→1, 3→(1), 6→5. Carriers: 1, 4, 5
  { id: 26, carriers: [1, 4, 5], feedback: 6,
    connections: [{from:2,to:1},{from:3,to:1},{from:6,to:5}],
    layout: [[2,3,1],[4],[6,5]] },
  // Algorithm 27: 2→1, 3→(2), 6→5→4. Carriers: 1, 4
  { id: 27, carriers: [1, 2, 4], feedback: 3,
    connections: [{from:3,to:2},{from:2,to:1},{from:6,to:5},{from:5,to:4}],
    layout: [[3,2,1],[6,5,4]] },
  // Algorithm 28: 5→4→3, 2→1, 6. (FB on 5). Carriers: 1, 3, 6
  { id: 28, carriers: [1, 3, 6], feedback: 5,
    connections: [{from:5,to:4},{from:4,to:3},{from:2,to:1}],
    layout: [[2,1],[5,4,3],[6]] },
  // Algorithm 29: 2→1, 4→3, 5, 6. Carriers: 1, 3, 5, 6
  { id: 29, carriers: [1, 3, 5, 6], feedback: 6,
    connections: [{from:2,to:1},{from:4,to:3}],
    layout: [[2,1],[4,3],[5],[6]] },
  // Algorithm 30: 5→4→3, 2→1, 6. Carriers: 1, 3, 6
  { id: 30, carriers: [1, 3, 6], feedback: 5,
    connections: [{from:5,to:4},{from:4,to:3},{from:2,to:1}],
    layout: [[2,1],[5,4,3],[6]] },
  // Algorithm 31: 2→1, 3, 4, 5, 6. Carriers: 1, 3, 4, 5, 6
  { id: 31, carriers: [1, 3, 4, 5, 6], feedback: 6,
    connections: [{from:2,to:1}],
    layout: [[2,1],[3],[4],[5],[6]] },
  // Algorithm 32: 1, 2, 3, 4, 5, 6 all carriers. (FB on 6)
  { id: 32, carriers: [1, 2, 3, 4, 5, 6], feedback: 6,
    connections: [],
    layout: [[1],[2],[3],[4],[5],[6]] },
];
