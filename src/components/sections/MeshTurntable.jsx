import { useCallback, useEffect, useRef, useState } from 'react';
import { useMotionValueEvent, useReducedMotion, useScroll } from 'framer-motion';
import './MeshTurntable.css';

const frameCount = 90;
const frameUrl = (index) =>
  `${import.meta.env.BASE_URL}mesh-360/${String(index).padStart(3, '0')}.webp`;

export function MeshTurntable() {
  const section = useRef(null);
  const canvas = useRef(null);
  const frames = useRef([]);
  const requested = useRef(0);
  const displayed = useRef(-1);
  const [angle, setAngle] = useState(0);
  const [hasFrame, setHasFrame] = useState(false);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: section,
    offset: ['start start', 'end end'],
  });

  const drawFrame = useCallback(() => {
    const target = requested.current;
    let nearest = -1;
    let distance = Infinity;
    frames.current.forEach((frame, index) => {
      const gap = Math.abs(target - index);
      if (gap < distance) {
        nearest = index;
        distance = gap;
      }
    });
    if (nearest < 0 || nearest === displayed.current) return;

    const surface = canvas.current;
    const context = surface?.getContext('2d');
    if (!context) return;
    context.clearRect(0, 0, surface.width, surface.height);
    context.drawImage(frames.current[nearest], 0, 0);
    if (displayed.current < 0) setHasFrame(true);
    displayed.current = nearest;
  }, []);

  function rotate(degrees) {
    setAngle(degrees);
    requested.current = Math.round((degrees / 360) * (frameCount - 1));
    drawFrame();
  }

  useMotionValueEvent(scrollYProgress, 'change', (progress) => {
    if (!reduceMotion) rotate(Math.round(progress * 360));
  });

  useEffect(() => {
    let active = true;
    const indices = Array.from({ length: frameCount }, (_, index) => index);
    const isPreviewFrame = (index) => index % 5 === 0 || index === frameCount - 1;
    const order = [...indices.filter(isPreviewFrame), ...indices.filter((index) => !isPreviewFrame(index))];
    let next = 0;

    function loadNext() {
      if (!active || next >= order.length) return;
      const index = order[next++];
      const image = new Image();
      image.onload = () => {
        if (!active) return;
        frames.current[index] = image;
        drawFrame();
        loadNext();
      };
      image.onerror = loadNext;
      image.src = frameUrl(index);
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      for (let request = 0; request < 4; request++) loadNext();
    }, { rootMargin: '35% 0px' });
    observer.observe(section.current);

    return () => {
      active = false;
      observer.disconnect();
    };
  }, [drawFrame]);

  return (
    <section ref={section} className="mesh-turntable" aria-labelledby="mesh-turntable-title">
      <div className="mesh-turntable__sticky">
        <div className="mesh-turntable__layout">
          <div className="mesh-turntable__copy">
            <p className="mesh-turntable__eyebrow">Welded wire mesh</p>
            <h2 id="mesh-turntable-title">See it from<br />every angle.</h2>
            <p className="mesh-turntable__description">
              Turn the roll to see the welded grid, wire spacing and coil profile up close.
            </p>
          </div>

          <div className="mesh-turntable__viewer">
            <div className="mesh-turntable__stage">
              <div className="mesh-turntable__orbit" aria-hidden="true" />
              <div className="mesh-turntable__product" role="img" aria-label="Welded wire mesh roll">
                <img
                  src={frameUrl(0)}
                  alt=""
                  width="336"
                  height="552"
                  loading="lazy"
                  style={{ visibility: hasFrame ? 'hidden' : 'visible' }}
                />
                <canvas ref={canvas} width="336" height="552" aria-hidden="true" />
              </div>
            </div>
            <div className="mesh-turntable__controls">
              <label htmlFor="mesh-turntable-angle">
                {reduceMotion ? 'Rotate the roll' : 'Scroll or drag to rotate'}
              </label>
              <output htmlFor="mesh-turntable-angle" aria-hidden="true">{angle}°</output>
              <input
                id="mesh-turntable-angle"
                type="range"
                min="0"
                max="360"
                value={angle}
                aria-valuetext={`${angle} degrees`}
                onChange={(event) => rotate(event.target.valueAsNumber)}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
