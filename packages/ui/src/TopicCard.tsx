import Image from 'next/image';
import { Link } from './Link';

export type TopicCardProps = {
  href: string;
  icon: string;
  title: string;
  desc: string;
  image: string;
  objectPosition?: string;
  sizes?: string;
  priority?: boolean;
};

/** 首页专题卡：上图下文，避免字叠在配图上。 */
export function TopicCard({
  href,
  icon,
  title,
  desc,
  image,
  objectPosition,
  sizes = '(max-width: 720px) 100vw, 33vw',
  priority,
}: TopicCardProps) {
  return (
    <Link className="topic-card has-img" href={href}>
      <div className="topic-media">
        <Image
          src={image}
          alt=""
          fill
          sizes={sizes}
          priority={priority}
          style={objectPosition ? { objectPosition } : undefined}
        />
      </div>
      <div className="topic-body">
        <div className="icon">{icon}</div>
        <h3>{title}</h3>
        <p>{desc}</p>
      </div>
    </Link>
  );
}
