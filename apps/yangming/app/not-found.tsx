import Link from '@/components/Link';

export default function NotFound() {
  return (
    <div className="page-scroll">
      <div className="page empty">
        <p>这一页不在阳明行迹里。</p>
        <p style={{ marginTop: 18 }}>
          <Link className="btn accent" href="/">
            回首页
          </Link>
        </p>
      </div>
    </div>
  );
}
