import React, { useEffect, useState, useRef } from "react";

export const InfiniteMovingCards = ({
  items,
  direction = "left",
  speed = "fast",
  className,
}) => {
  const containerRef = useRef(null);
  const scrollerRef = useRef(null);
  const [start, setStart] = useState(false);

  useEffect(() => {
    function getDirection() {
      if (containerRef.current) {
        if (direction === "left") {
          containerRef.current.style.setProperty("--animation-direction", "forwards");
        } else {
          containerRef.current.style.setProperty("--animation-direction", "reverse");
        }
      }
    }

    function getSpeed() {
      if (containerRef.current) {
        if (speed === "fast") {
          containerRef.current.style.setProperty("--animation-duration", "20s");
        } else if (speed === "normal") {
          containerRef.current.style.setProperty("--animation-duration", "40s");
        } else {
          containerRef.current.style.setProperty("--animation-duration", "80s");
        }
      }
    }

    function addAnimation() {
      if (containerRef.current && scrollerRef.current) {
        // Only add duplicates if we haven't already (check using a data attribute or similar logic, but basic check relative to items length is safer)
        if (scrollerRef.current.getAttribute('data-cloned') === 'true') return;
        
        const scrollerContent = Array.from(scrollerRef.current.children);

        scrollerContent.forEach((item) => {
          const duplicatedItem = item.cloneNode(true);
          if (scrollerRef.current) {
            scrollerRef.current.appendChild(duplicatedItem);
          }
        });
        
        if (scrollerRef.current) scrollerRef.current.setAttribute('data-cloned', 'true');

        getDirection();
        getSpeed();
        setStart(true);
      }
    }
    
    // Check if animation already started to prevent duplication on strict mode double render
    if (!start) addAnimation();
  }, [direction, speed, start]);

  return (
    <div
      ref={containerRef}
      className={`scroller relative z-20 max-w-7xl overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_20%,white_80%,transparent)] ${className}`}
      style={{
          overflow: 'hidden',
          display: 'flex',
          maxWidth: '100%',
          maskImage: 'linear-gradient(to right, transparent, white 20%, white 80%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, white 20%, white 80%, transparent)'
      }}
    >
      <ul
        ref={scrollerRef}
        className={`flex min-w-full shrink-0 gap-4 py-4 w-max flex-nowrap ${
          start && "animate-scroll"
        }`}
        style={{
            display: 'flex',
            gap: '16px',
            padding: '16px 0',
            width: 'max-content',
            animation: start ? `scroll var(--animation-duration) linear infinite var(--animation-direction)` : 'none'
        }}
      >
        {items.map((item, idx) => (
          <li
            className="w-[350px] max-w-full relative rounded-2xl border border-b-0 flex-shrink-0 border-slate-700 px-8 py-6 md:w-[450px]"
            style={{
                width: '350px',
                background: 'linear-gradient(180deg, rgba(30,30,30,0.8), rgba(10,10,10,0.9))',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '24px',
                flexShrink: 0
            }}
            key={item.name + idx}
          >
            <blockquote>
              <div
                aria-hidden="true"
                className="user-select-none -z-1 pointer-events-none absolute -left-0.5 -top-0.5 h-[calc(100%_+_4px)] w-[calc(100%_+_4px)]"
              ></div>
              <span className=" relative z-20 text-sm leading-[1.6] text-gray-100 font-normal">
                {item.quote}
              </span>
              <div className="relative z-20 mt-6 flex flex-row items-center">
                <span className="flex flex-col gap-1">
                  <span className=" text-sm leading-[1.6] text-gray-400 font-normal">
                    {item.name}
                  </span>
                  <span className=" text-sm leading-[1.6] text-gray-400 font-normal">
                    {item.title}
                  </span>
                </span>
              </div>
            </blockquote>
          </li>
        ))}
      </ul>
      <style>{`
        @keyframes scroll {
          to {
            transform: translate(calc(-50% - 0.5rem));
          }
        }
      `}</style>
    </div>
  );
};
