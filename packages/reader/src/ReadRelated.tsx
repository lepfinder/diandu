'use client';

import type { ElementType, ReactNode } from 'react';
import type { ReadRelatedProps } from './types';

function DefaultLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}

/** 阅读页「读到这里」关联区：展示层通用，数据由各书适配器传入。 */
export function ReadRelated({
  mode = 'all',
  linkComponent,
  header,
  blocks = [],
  title = '读到这里',
}: ReadRelatedProps) {
  const Link = (linkComponent || DefaultLink) as ElementType<{
    href: string;
    className?: string;
    children?: ReactNode;
  }>;

  const headerNode = header ? (
    <div className="read-context">
      <Link href={header.href}>{header.label}</Link>
      {header.badge ? <span>{header.badge}</span> : null}
    </div>
  ) : null;

  const visibleBlocks = blocks.filter((block) => block.items.length > 0);
  const footerNode =
    visibleBlocks.length > 0 ? (
      <section className="read-related">
        <div className="related-head">{title}</div>
        {visibleBlocks.map((block) => {
          if (block.type === 'cards') {
            return (
              <div key={`cards-${block.label}`} className="related-block">
                <div className="related-label">{block.label}</div>
                {block.items.map((item) => (
                  <Link key={item.id} className="related-card" href={item.href}>
                    <strong>{item.title}</strong>
                    <span>{item.text}</span>
                  </Link>
                ))}
              </div>
            );
          }
          if (block.type === 'scenes') {
            return (
              <div key={`scenes-${block.label}`} className="related-block">
                <div className="related-label">{block.label}</div>
                <div className="related-scenes">
                  {block.items.map((scene) => (
                    <article key={scene.id} className="related-scene">
                      {scene.imageSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={scene.imageSrc} alt="" />
                      ) : (
                        <div className="related-scene-plate" aria-hidden="true">
                          {scene.plate || '戏'}
                        </div>
                      )}
                      <div>
                        <strong>{scene.title}</strong>
                        <p>{scene.summary}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            );
          }
          return (
            <div key={`people-${block.label}`} className="related-block">
              <div className="related-label">{block.label}</div>
              <div className="related-chips">
                {block.items.map((person) => (
                  <Link key={person.id} href={person.href}>
                    {person.name}
                    {person.note ? ` · ${person.note}` : ''}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </section>
    ) : null;

  if (mode === 'header') return headerNode;
  if (mode === 'footer') return footerNode;
  return (
    <>
      {headerNode}
      {footerNode}
    </>
  );
}
