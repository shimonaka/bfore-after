'use client';

import { useState, useEffect, useRef } from 'react';
import { Player } from '@remotion/player';
import { BeforeAfterStory } from '../remotion/templates/BeforeAfterStory';
import type { FontPairId } from '../remotion/fonts/loadFonts';

const DEFAULT_BEFORE = 'https://picsum.photos/seed/before/1080/1920';
const DEFAULT_AFTER = 'https://picsum.photos/seed/after/1080/1920';
const IS_STATIC_BUILD = process.env.NEXT_PUBLIC_STATIC_EXPORT === 'true';

export default function CreatePage() {
  const [hookText, setHookText] = useState('広がる髪、もう諦めてた');
  const [beforeUrl, setBeforeUrl] = useState(DEFAULT_BEFORE);
  const [afterUrl, setAfterUrl] = useState(DEFAULT_AFTER);
  const [menuName, setMenuName] = useState('縮毛矯正＋カット');
  const [price, setPrice] = useState('¥18,000');
  const [duration, setDuration] = useState('2時間30分');
  const [salonName, setSalonName] = useState('SALON TOKYO');
  const [fontPairId, setFontPairId] = useState<FontPairId>('B');
  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  const blobUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    return () => {
      blobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const handleFile = (
    file: File | undefined,
    setUrl: (url: string) => void,
    setFile: (f: File) => void
  ) => {
    if (!file) return;
    const blobUrl = URL.createObjectURL(file);
    blobUrlsRef.current.push(blobUrl);
    setUrl(blobUrl);
    setFile(file);
  };

  const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  const handleDownload = async () => {
    setIsRendering(true);
    setRenderError(null);
    try {
      const beforeImageUrl = beforeFile
        ? await fileToDataUrl(beforeFile)
        : beforeUrl;
      const afterImageUrl = afterFile
        ? await fileToDataUrl(afterFile)
        : afterUrl;

      const res = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hookText,
          beforeImageUrl,
          afterImageUrl,
          menuName,
          price: price || undefined,
          duration: duration || undefined,
          salonName,
          fontPairId,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'unknown' }));
        throw new Error(data.error ?? `status ${res.status}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'salon-before-after.mp4';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      const message = e instanceof Error ? e.message : '不明なエラー';
      setRenderError(message);
    } finally {
      setIsRendering(false);
    }
  };

  const inputProps = {
    hookText,
    beforeImageUrl: beforeUrl,
    afterImageUrl: afterUrl,
    menuName,
    price: price || undefined,
    duration: duration || undefined,
    salonName,
    fontPairId,
  };

  return (
    <main className="min-h-screen bg-neutral-50 p-4 md:p-10">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-2xl md:text-3xl font-medium tracking-tight">
            ビフォーアフター動画
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            写真2枚と文言を入れて、Reels向け縦動画を作成
          </p>
        </header>

        <div className="grid md:grid-cols-[1fr_400px] gap-8 md:gap-12">
          <div className="space-y-6">
            <Section title="冒頭テロップ">
              <label className="block">
                <span className="text-xs text-neutral-500 mb-1 block">
                  悩みを大きく訴求（改行可・中央揃えで表示されます）
                </span>
                <textarea
                  value={hookText}
                  onChange={(e) => setHookText(e.target.value)}
                  rows={3}
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 resize-y leading-relaxed"
                  placeholder="広がる髪、もう諦めてた&#10;面長コンプレックス卒業"
                />
              </label>
            </Section>

            <Section title="写真">
              <div className="grid grid-cols-2 gap-3">
                <PhotoUpload
                  label="ビフォー"
                  url={beforeUrl}
                  isDefault={beforeUrl === DEFAULT_BEFORE}
                  onChange={(f) => handleFile(f, setBeforeUrl, setBeforeFile)}
                />
                <PhotoUpload
                  label="アフター"
                  url={afterUrl}
                  isDefault={afterUrl === DEFAULT_AFTER}
                  onChange={(f) => handleFile(f, setAfterUrl, setAfterFile)}
                />
              </div>
            </Section>

            <Section title="メニュー情報">
              <div className="space-y-3">
                <TextField
                  label="メニュー名"
                  value={menuName}
                  onChange={setMenuName}
                  placeholder="縮毛矯正＋カット"
                  required
                />
                <div className="grid grid-cols-2 gap-3">
                  <TextField
                    label="料金（任意）"
                    value={price}
                    onChange={setPrice}
                    placeholder="¥18,000"
                  />
                  <TextField
                    label="所要時間（任意）"
                    value={duration}
                    onChange={setDuration}
                    placeholder="2時間30分"
                  />
                </div>
              </div>
            </Section>

            <Section title="サロン情報">
              <TextField
                label="サロン名"
                value={salonName}
                onChange={setSalonName}
                placeholder="SALON TOKYO"
                required
              />
            </Section>

            <Section title="フォントスタイル">
              <div className="flex gap-2">
                {(['A', 'B', 'C'] as const).map((id) => (
                  <button
                    key={id}
                    onClick={() => setFontPairId(id)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm border transition ${
                      fontPairId === id
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-neutral-700 border-neutral-300 hover:border-neutral-400'
                    }`}
                  >
                    {id === 'A' && '明朝×英字'}
                    {id === 'B' && '細ゴシック'}
                    {id === 'C' && '丸ゴシック'}
                  </button>
                ))}
              </div>
            </Section>
          </div>

          <div className="md:sticky md:top-6 h-fit">
            <div className="aspect-[9/16] w-full max-w-[360px] mx-auto rounded-2xl overflow-hidden shadow-2xl bg-black">
              <Player
                component={BeforeAfterStory}
                durationInFrames={540}
                fps={30}
                compositionWidth={1080}
                compositionHeight={1920}
                inputProps={inputProps}
                controls
                loop
                acknowledgeRemotionLicense
                style={{ width: '100%', height: '100%' }}
              />
            </div>
            <p className="text-xs text-neutral-500 text-center mt-3">
              再生ボタンで18秒のプレビュー
            </p>

            <div className="mt-6 max-w-[360px] mx-auto">
              {IS_STATIC_BUILD ? (
                <div className="rounded-lg border border-neutral-300 bg-neutral-100 p-4 text-center">
                  <p className="text-sm text-neutral-700 font-medium mb-1">
                    プレビュー版
                  </p>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    動画ダウンロードはローカル環境でのみ利用可能です。
                    <br />
                    リポジトリを clone して
                    <code className="mx-1 px-1.5 py-0.5 bg-white rounded text-[11px] border border-neutral-300">
                      npm run dev
                    </code>
                    で起動してください。
                  </p>
                </div>
              ) : (
                <>
                  <button
                    onClick={handleDownload}
                    disabled={isRendering}
                    className="w-full py-3 px-4 bg-black text-white rounded-lg font-medium text-sm hover:bg-neutral-800 transition disabled:bg-neutral-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isRendering ? (
                      <>
                        <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        生成中…（30秒〜1分）
                      </>
                    ) : (
                      '動画をダウンロード'
                    )}
                  </button>
                  {renderError && (
                    <p className="text-xs text-red-600 mt-2 text-center">
                      エラー: {renderError}
                    </p>
                  )}
                  <p className="text-[11px] text-neutral-400 text-center mt-2 leading-relaxed">
                    初回はバンドル生成のため少し時間がかかります
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-xl border border-neutral-200 p-5">
      <h2 className="text-sm font-medium text-neutral-900 mb-3">{title}</h2>
      {children}
    </section>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs text-neutral-500 mb-1 block">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
      />
    </label>
  );
}

function PhotoUpload({
  label,
  url,
  isDefault,
  onChange,
}: {
  label: string;
  url: string;
  isDefault: boolean;
  onChange: (file: File | undefined) => void;
}) {
  return (
    <label className="block cursor-pointer">
      <div className="text-xs text-neutral-500 mb-1">{label}</div>
      <div className="aspect-[9/16] w-full rounded-lg overflow-hidden border-2 border-dashed border-neutral-300 hover:border-neutral-500 transition relative bg-neutral-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={label}
          className="w-full h-full object-cover"
        />
        {isDefault && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white text-xs font-medium">
              クリックして選択
            </span>
          </div>
        )}
      </div>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => onChange(e.target.files?.[0])}
        className="hidden"
      />
    </label>
  );
}
