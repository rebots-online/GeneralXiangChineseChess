# Xiangqi Board Debug Patch Review (v0.1 to v0.2)

---

## 🧠 What Was Implemented in v0.1

| Feature                                   | Implemented? | Notes                                                                  |
| ----------------------------------------- | ------------ | ---------------------------------------------------------------------- |
| `Math.floor((x + cellSize/2)/cellSize)` | ✅           | Present in `getBoardCoordinates`                                     |
| `mousePos`React state                   | ✅           | Declared and updated in `mousemove`listener                          |
| `dragStateRef`+`useEffect`            | ✅           | Drag state ref properly tracks changes to avoid listener rebinding     |
| Drop/hover indicator logic                | 🟨 Partial   | JSX conditionals using `getBoardCoordinates(...)?`without validation |
| Debug overlay or logging                  | ❌           | No visual/log debug info on mouse position or board coordinates        |
| Coordinate equality checks                | ❌           | Fragile `toString()`comparison used                                  |

---

## ❌ Issues in Current Implementation

### 1. **No Debug Output or Visual Feedback**

While `mousePos` is stored, it is never:

* Logged to console
* Displayed visually
* Used to trace hover feedback behavior in a debuggable way

### 2. **Fragile Comparison for Drop Highlights**

```ts
getBoardCoordinates(mousePos.x, mousePos.y)?.toString() === [row, col].toString()
```

* This works only when both arrays stringify identically (and do exist).
* Silently fails if `getBoardCoordinates()` returns null.

### 3. **No Fallback or Error Messages**

* If `getBoardCoordinates()` fails, there’s no trace or fallback behavior.
* Can cause hover/click logic to silently break with no clue why.

---

## ✅ Suggested Patch: v0.2 Enhancements

### 🔍 Add Console Debugging

```ts
useEffect(() => {
  if (mousePos) {
    const coords = getBoardCoordinates(mousePos.x, mousePos.y);
    console.log(`[DEBUG] mousePos: ${mousePos.x}, ${mousePos.y} → Board: ${coords}`);
  }
}, [mousePos]);
```

### 🩹 Fix Equality Check for Coordinates

```ts
const currentCoords = getBoardCoordinates(mousePos.x, mousePos.y);
const isSameCoord = currentCoords && currentCoords[0] === row && currentCoords[1] === col;
```

### 🧾 Optional Visual Overlay for Debugging

```tsx
<div style={{
  position: 'absolute', top: 0, left: 0, zIndex: 1000,
  backgroundColor: 'rgba(0,0,0,0.7)', color: 'lime', padding: '4px'
}}>
  {mousePos ? `Mouse: ${mousePos.x}, ${mousePos.y}` : 'No mousePos'}
</div>
```

---

## 🏁 Result

Adding these enhancements will:

* Make drop-hover behavior inspectable
* Prevent silent coordinate mismatches
* Improve your ability to verify state during drag interactions

Next step: implement `Patch v0.2` and confirm visual + logical accuracy of hover/drops.

🧩 Need help bundling this into a PR or live hotpatch? Say the word!
