import { useEffect, useId, useRef, useState } from 'react';
import './MeshTurntable.css';

const frameCount = 48;
const productNames = ['V-Bend Welded Wire Mesh', 'Welded Wire Mesh', 'Anti-Climb Fence'];
const frameUrl = (product, frame) =>
  `${import.meta.env.BASE_URL}product-360/${product}/${frame}.webp`;

function ProductTurntable({ product }) {
  const id = useId();
  const viewer = useRef(null);
  const [angle, setAngle] = useState(0);
  const name = productNames[product - 1];
  const frame = Math.round(angle * (frameCount - 1) / 360);

  useEffect(() => {
    let active = true;
    let next = 1;

    function preload() {
      if (!active || next >= frameCount) return;
      const image = new Image();
      image.onload = image.onerror = preload;
      image.src = frameUrl(product, next++);
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      for (let i = 0; i < 3; i++) preload();
    }, { rootMargin: '250px' });
    observer.observe(viewer.current);
    return () => {
      active = false;
      observer.disconnect();
    };
  }, [product]);

  return (
    <div ref={viewer} className="product-turntables__viewer">
      <img src={frameUrl(product, frame)} alt={name} width="960" height="960" loading="lazy" />
      <h3 className="product-turntables__name">{name}</h3>
      <div className="mesh-turntable__controls">
        <label htmlFor={id}>Drag to rotate</label>
        <output htmlFor={id} aria-hidden="true">{angle}°</output>
        <input
          id={id}
          type="range"
          min="0"
          max="360"
          value={angle}
          aria-label={`Drag to rotate: ${name}`}
          aria-valuetext={`${angle} degrees`}
          onChange={(event) => setAngle(event.target.valueAsNumber)}
        />
      </div>
    </div>
  );
}

export function ProductTurntables() {
  return (
    <section className="product-turntables" aria-label="360° product views">
      <div className="product-turntables__row">
        {[1, 2, 3].map((product) => <ProductTurntable key={product} product={product} />)}
      </div>
    </section>
  );
}
