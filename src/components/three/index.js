// Carga diferida del modelo 3D: Three.js (~150 KB gzip) solo se descarga cuando se muestra.
//   import PodVeggie3D from '../three';
//   <Suspense fallback={null}><PodVeggie3D podId="ASH-Gen2-001" plantName="Ashwagandha" /></Suspense>
import { lazy } from 'react';

const PodVeggie3D = lazy(() => import('./PodVeggie3D.jsx'));
export default PodVeggie3D;
