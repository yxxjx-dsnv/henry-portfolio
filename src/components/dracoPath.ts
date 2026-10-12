// The Draco decoder that three.js ships for glTF, bundled (hashed, cached) rather than a second
// copy under public/draco/. DRACOLoader.setDecoderPath(DRACO) everywhere a .glb is loaded.
import js from 'three/examples/jsm/libs/draco/gltf/draco_wasm_wrapper.js?url';
import wasm from 'three/examples/jsm/libs/draco/gltf/draco_decoder.wasm?url';

export const DRACO = { js, wasm };
