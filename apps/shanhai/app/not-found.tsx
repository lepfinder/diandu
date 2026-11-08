import Link from '@/components/Link';

export default function NotFound() {
  return (
    <div className="page-scroll">
      <div className="empty">
        <p>这一页不在十八篇里。</p>
        <Link className="btn accent" href="/">回首页</Link>
      </div>
    </div>
  );
}
