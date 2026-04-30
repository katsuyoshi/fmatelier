/**
 * DX7 algorithm definitions.
 *
 * Each algorithm defines a fixed routing of the 6 operators.
 * Operators that output audio are "carriers"; others are "modulators".
 *
 * Layout data includes vertical stacking groups for SVG rendering.
 * Each group is a vertical chain rendered as a column (bottom-aligned).
 * Use 0 as a placeholder for empty slots (to keep carriers at the bottom row).
 * Columns are ordered left-to-right by first appearance in the connections definition.
 */

export interface AlgorithmConnection {
  from: number; // modulator operator (1-6)
  to: number;   // carrier/destination operator (1-6)
}

export interface AlgorithmDef {
  id: number;
  carriers: number[];
  connections: AlgorithmConnection[];
  feedbackFrom: number; // operator that sends feedback (1-6)
  feedbackTo: number;   // operator that receives feedback (1-6), same as feedbackFrom for self-feedback
  /** Layout: array of vertical chains, bottom = carrier. Rendered left-to-right. 0 = empty slot. */
  layout: number[][];
}

// prettier-ignore
export const ALGORITHMS: AlgorithmDef[] = [
  // Algorithm 1: 2→1, 6→5→4→3
  { id: 1, carriers: [1, 3], feedbackFrom: 6, feedbackTo: 6,
    connections: [{from:2,to:1},{from:6,to:5},{from:5,to:4},{from:4,to:3}],
    layout: [[2,1],[6,5,4,3]] },
  // Algorithm 2: 2→1, 6→5→4→3
  { id: 2, carriers: [1, 3], feedbackFrom: 2, feedbackTo: 2,
    connections: [{from:2,to:1},{from:6,to:5},{from:5,to:4},{from:4,to:3}],
    layout: [[2,1],[6,5,4,3]] },
  // Algorithm 3: 3→2→1, 6→5→4
  { id: 3, carriers: [1, 4], feedbackFrom: 6, feedbackTo: 6,
    connections: [{from:3,to:2},{from:2,to:1},{from:6,to:5},{from:5,to:4}],
    layout: [[3,2,1],[6,5,4]] },
  // Algorithm 4: 3→2→1, 6→5→4. Cross-feedback: OP4→OP6
  { id: 4, carriers: [1, 4], feedbackFrom: 4, feedbackTo: 6,
    connections: [{from:3,to:2},{from:2,to:1},{from:6,to:5},{from:5,to:4}],
    layout: [[3,2,1],[6,5,4]] },
  // Algorithm 5: 2→1, 4→3, 6→5
  { id: 5, carriers: [1, 3, 5], feedbackFrom: 6, feedbackTo: 6,
    connections: [{from:2,to:1},{from:4,to:3},{from:6,to:5}],
    layout: [[2,1],[4,3],[6,5]] },
  // Algorithm 6: 2→1, 4→3, 6→5. Cross-feedback: OP5→OP6
  { id: 6, carriers: [1, 3, 5], feedbackFrom: 5, feedbackTo: 6,
    connections: [{from:2,to:1},{from:4,to:3},{from:6,to:5}],
    layout: [[2,1],[4,3],[6,5]] },
  // Algorithm 7: 2→1, (4+6→5)→3 Y-merge
  { id: 7, carriers: [1, 3], feedbackFrom: 6, feedbackTo: 6,
    connections: [{from:2,to:1},{from:4,to:3},{from:6,to:5},{from:5,to:3}],
    layout: [[2,1],[4,0],[6,5,3]] },
  // Algorithm 8: 2→1, (4+6→5)→3 Y-merge
  { id: 8, carriers: [1, 3], feedbackFrom: 4, feedbackTo: 4,
    connections: [{from:2,to:1},{from:4,to:3},{from:6,to:5},{from:5,to:3}],
    layout: [[2,1],[4,0],[6,5,3]] },
  // Algorithm 9: 2→1, (4+6→5)→3 Y-merge
  { id: 9, carriers: [1, 3], feedbackFrom: 2, feedbackTo: 2,
    connections: [{from:2,to:1},{from:4,to:3},{from:6,to:5},{from:5,to:3}],
    layout: [[2,1],[4,0],[6,5,3]] },
  // Algorithm 10: (5+6)→4, 3→2→1
  { id: 10, carriers: [4, 1], feedbackFrom: 3, feedbackTo: 3,
    connections: [{from:5,to:4},{from:6,to:4},{from:3,to:2},{from:2,to:1}],
    layout: [[5,4],[6,0],[3,2,1]] },
  // Algorithm 11: (5+6)→4, 3→2→1
  { id: 11, carriers: [4, 1], feedbackFrom: 6, feedbackTo: 6,
    connections: [{from:5,to:4},{from:6,to:4},{from:3,to:2},{from:2,to:1}],
    layout: [[5,4],[6,0],[3,2,1]] },
  // Algorithm 12: (4+5+6)→3, 2→1
  { id: 12, carriers: [3, 1], feedbackFrom: 2, feedbackTo: 2,
    connections: [{from:4,to:3},{from:5,to:3},{from:6,to:3},{from:2,to:1}],
    layout: [[4,0],[5,3],[6,0],[2,1]] },
  // Algorithm 13: (4+5+6)→3, 2→1
  { id: 13, carriers: [3, 1], feedbackFrom: 6, feedbackTo: 6,
    connections: [{from:4,to:3},{from:5,to:3},{from:6,to:3},{from:2,to:1}],
    layout: [[4,0],[5,3],[6,0],[2,1]] },
  // Algorithm 14: 2→1, (5+6)→4→3
  { id: 14, carriers: [1, 3], feedbackFrom: 6, feedbackTo: 6,
    connections: [{from:2,to:1},{from:5,to:4},{from:6,to:4},{from:4,to:3}],
    layout: [[2,1],[5,4,3],[6,0,0]] },
  // Algorithm 15: 2→1, (5+6)→4→3
  { id: 15, carriers: [1, 3], feedbackFrom: 2, feedbackTo: 2,
    connections: [{from:2,to:1},{from:5,to:4},{from:6,to:4},{from:4,to:3}],
    layout: [[2,1],[5,4,3],[6,0,0]] },
  // Algorithm 16: (2+4→3+6→5) all→1
  { id: 16, carriers: [1], feedbackFrom: 6, feedbackTo: 6,
    connections: [{from:2,to:1},{from:4,to:3},{from:3,to:1},{from:6,to:5},{from:5,to:1}],
    layout: [[2,0],[4,3,1],[6,5,0]] },
  // Algorithm 17: (2+4→3+6→5) all→1
  { id: 17, carriers: [1], feedbackFrom: 2, feedbackTo: 2,
    connections: [{from:2,to:1},{from:4,to:3},{from:3,to:1},{from:6,to:5},{from:5,to:1}],
    layout: [[2,0],[4,3,1],[6,5,0]] },
  // Algorithm 18: (2+3+6→5→4) all→1
  { id: 18, carriers: [1], feedbackFrom: 3, feedbackTo: 3,
    connections: [{from:2,to:1},{from:3,to:1},{from:6,to:5},{from:5,to:4},{from:4,to:1}],
    layout: [[2,0],[3,1],[6,5,4,0]] },
  // Algorithm 19: 3→2→1, 6→(4,5)
  { id: 19, carriers: [1, 4, 5], feedbackFrom: 6, feedbackTo: 6,
    connections: [{from:3,to:2},{from:2,to:1},{from:6,to:4},{from:6,to:5}],
    layout: [[3,2,1],[6,4],[0,5]] },
  // Algorithm 20: 3→(1,2), (5+6)→4
  { id: 20, carriers: [1, 2, 4], feedbackFrom: 3, feedbackTo: 3,
    connections: [{from:3,to:1},{from:3,to:2},{from:5,to:4},{from:6,to:4}],
    layout: [[3,1],[0,2],[5,4],[6,0]] },
  // Algorithm 21: 3→(1,2), 6→(4,5)
  { id: 21, carriers: [1, 2, 4, 5], feedbackFrom: 3, feedbackTo: 3,
    connections: [{from:3,to:1},{from:3,to:2},{from:6,to:4},{from:6,to:5}],
    layout: [[3,1],[0,2],[6,4],[0,5]] },
  // Algorithm 22: 2→1, 6→(3,4,5)
  { id: 22, carriers: [1, 3, 4, 5], feedbackFrom: 6, feedbackTo: 6,
    connections: [{from:2,to:1},{from:6,to:3},{from:6,to:4},{from:6,to:5}],
    layout: [[2,1],[0,3],[6,4],[0,5]] },
  // Algorithm 23: 3→2, 6→(4,5). Standalone: 1
  { id: 23, carriers: [1, 2, 4, 5], feedbackFrom: 6, feedbackTo: 6,
    connections: [{from:3,to:2},{from:6,to:4},{from:6,to:5}],
    layout: [[1],[3,2],[6,4],[0,5]] },
  // Algorithm 24: 6→(3,4,5). Standalone: 1, 2
  { id: 24, carriers: [1, 2, 3, 4, 5], feedbackFrom: 6, feedbackTo: 6,
    connections: [{from:6,to:3},{from:6,to:4},{from:6,to:5}],
    layout: [[1],[2],[0,3],[6,4],[0,5]] },
  // Algorithm 25: 6→(4,5). Standalone: 1, 2, 3
  { id: 25, carriers: [1, 2, 3, 4, 5], feedbackFrom: 6, feedbackTo: 6,
    connections: [{from:6,to:4},{from:6,to:5}],
    layout: [[1],[2],[3],[6,4],[0,5]] },
  // Algorithm 26: 3→2, (5+6)→4. Standalone: 1
  { id: 26, carriers: [1, 2, 4], feedbackFrom: 6, feedbackTo: 6,
    connections: [{from:3,to:2},{from:5,to:4},{from:6,to:4}],
    layout: [[1],[3,2],[5,4],[6,0]] },
  // Algorithm 27: 3→2, (5+6)→4. Standalone: 1
  { id: 27, carriers: [1, 2, 4], feedbackFrom: 3, feedbackTo: 3,
    connections: [{from:3,to:2},{from:5,to:4},{from:6,to:4}],
    layout: [[1],[3,2],[5,4],[6,0]] },
  // Algorithm 28: 2→1, 5→4→3. Standalone: 6
  { id: 28, carriers: [1, 3, 6], feedbackFrom: 5, feedbackTo: 5,
    connections: [{from:2,to:1},{from:5,to:4},{from:4,to:3}],
    layout: [[2,1],[5,4,3],[6]] },
  // Algorithm 29: 4→3, 6→5. Standalone: 1, 2
  { id: 29, carriers: [1, 2, 3, 5], feedbackFrom: 6, feedbackTo: 6,
    connections: [{from:4,to:3},{from:6,to:5}],
    layout: [[1],[2],[4,3],[6,5]] },
  // Algorithm 30: 5→4→3. Standalone: 1, 2, 6
  { id: 30, carriers: [1, 2, 3, 6], feedbackFrom: 5, feedbackTo: 5,
    connections: [{from:5,to:4},{from:4,to:3}],
    layout: [[1],[2],[5,4,3],[6]] },
  // Algorithm 31: 6→5. Standalone: 1, 2, 3, 4
  { id: 31, carriers: [1, 2, 3, 4, 5], feedbackFrom: 6, feedbackTo: 6,
    connections: [{from:6,to:5}],
    layout: [[1],[2],[3],[4],[6,5]] },
  // Algorithm 32: All carriers. No connections.
  { id: 32, carriers: [1, 2, 3, 4, 5, 6], feedbackFrom: 6, feedbackTo: 6,
    connections: [],
    layout: [[1],[2],[3],[4],[5],[6]] },
];
