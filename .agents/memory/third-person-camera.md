---
name: Third-person camera state
description: The camera-orbit rule needed to keep third-person mouse look stable.
---

Third-person orbit yaw and pitch must be authoritative state separate from the camera quaternion. The rendered camera can be positioned and aimed with `lookAt()` each frame, but that derived quaternion must not be read back as the next frame's orbit input.

**Why:** `lookAt()` changes the camera quaternion to point at the player. Feeding that result back into orbit calculations causes camera movement and mouse look to fight each other, unlike Minecraft Java's stable third-person orbit.

**How to apply:** Update the orbit state from pointer/touch look events, use it to calculate the camera position and player facing, and treat `lookAt()` as the final render step only.