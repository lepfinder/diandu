/** 清人《大观园图》横滑长卷预览（网络转载参考图） */
export function GardenScroll() {
  return (
    <section className="garden-scroll-section">
      <div className="garden-scroll-head">
        <h2>清人《大观园图》长卷</h2>
      </div>
      <div className="garden-scroll">
        <img
          src="/images/daguan-scroll.webp"
          alt="清人《大观园图》长卷预览"
          width={2276}
          height={1280}
          draggable={false}
          loading="eager"
          decoding="async"
        />
      </div>
      <p className="garden-scroll-caption">
        清佚名《大观园图》（纸本设色，约 1889–1898）。图源网络转载，仅供学习参阅；正式高清图请以博物馆公开资源为准。
      </p>
    </section>
  );
}
