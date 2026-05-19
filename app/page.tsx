'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Player } from '@remotion/player';
import {
  BeforeAfterStory,
  computeTotalFrames,
  type MediaInput,
} from '../remotion/templates/BeforeAfterStory';
import type { FontPairId } from '../remotion/fonts/loadFonts';

const DEFAULT_BEFORE_URL = '/samples/before.png';
const DEFAULT_AFTER_URL = '/samples/after.png';
const DEFAULT_BGM_BEFORE_URL = '/bgm/before.wav';
const DEFAULT_BGM_AFTER_URL = '/bgm/after.wav';
const DEFAULT_BGM_BEFORE_LABEL = 'before.wav（デフォルト）';
const DEFAULT_BGM_AFTER_LABEL = 'after.wav（デフォルト）';
const IS_STATIC_BUILD = process.env.NEXT_PUBLIC_STATIC_EXPORT === 'true';
const BEFORE_SLOT_SEC = 4;
const AFTER_SLOT_SEC = 6;

type BgmSlot = {
  url: string | null;
  file: File | null;
  label: string;
  isDefault: boolean;
};

const makeDefaultBgmSlot = (url: string, label: string): BgmSlot => ({
  url,
  file: null,
  label,
  isDefault: true,
});

type MediaSlot = {
  type: 'image' | 'video';
  url: string;
  file: File | null;
  videoDurationSec: number | null;
  startSec: number;
  isLoadingMeta: boolean;
};

const defaultBeforeSlot: MediaSlot = {
  type: 'image',
  url: DEFAULT_BEFORE_URL,
  file: null,
  videoDurationSec: null,
  startSec: 0,
  isLoadingMeta: false,
};

const defaultAfterSlot: MediaSlot = {
  type: 'image',
  url: DEFAULT_AFTER_URL,
  file: null,
  videoDurationSec: null,
  startSec: 0,
  isLoadingMeta: false,
};

const readVideoDuration = (file: File): Promise<number> =>
  new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    const objectUrl = URL.createObjectURL(file);
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(video.duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('動画の読み込みに失敗しました'));
    };
    video.src = objectUrl;
  });

const slotToMediaInput = (slot: MediaSlot, slotSec: number): MediaInput => {
  if (slot.type === 'image') {
    return { type: 'image', url: slot.url };
  }
  const videoLen = slot.videoDurationSec ?? slotSec;
  const sceneSec = Math.min(videoLen, slotSec);
  const maxStart = Math.max(0, videoLen - slotSec);
  const startSec = Math.min(slot.startSec, maxStart);
  return {
    type: 'video',
    url: slot.url,
    startSec,
    durationSec: sceneSec,
  };
};

export default function CreatePage() {
  const [hookText, setHookText] = useState('広がる髪\nもう諦めてた');
  const [menuName, setMenuName] = useState('縮毛矯正＋カット');
  const [price, setPrice] = useState('¥18,000');
  const [duration, setDuration] = useState('2時間30分');
  const [salonName, setSalonName] = useState('SALON TOKYO');
  const [fontPairId, setFontPairId] = useState<FontPairId>('B');
  const [beforeSlot, setBeforeSlot] = useState<MediaSlot>(defaultBeforeSlot);
  const [afterSlot, setAfterSlot] = useState<MediaSlot>(defaultAfterSlot);
  const [bgmBefore, setBgmBefore] = useState<BgmSlot>(() =>
    makeDefaultBgmSlot(DEFAULT_BGM_BEFORE_URL, DEFAULT_BGM_BEFORE_LABEL)
  );
  const [bgmAfter, setBgmAfter] = useState<BgmSlot>(() =>
    makeDefaultBgmSlot(DEFAULT_BGM_AFTER_URL, DEFAULT_BGM_AFTER_LABEL)
  );
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  const blobUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    return () => {
      blobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const handleFile = async (
    file: File | undefined,
    setSlot: React.Dispatch<React.SetStateAction<MediaSlot>>,
    defaultUrl: string
  ) => {
    if (!file) return;
    const isVideo = file.type.startsWith('video/');
    const blobUrl = URL.createObjectURL(file);
    blobUrlsRef.current.push(blobUrl);

    if (!isVideo) {
      setSlot({
        type: 'image',
        url: blobUrl,
        file,
        videoDurationSec: null,
        startSec: 0,
        isLoadingMeta: false,
      });
      return;
    }

    setSlot({
      type: 'video',
      url: blobUrl,
      file,
      videoDurationSec: null,
      startSec: 0,
      isLoadingMeta: true,
    });

    try {
      const sec = await readVideoDuration(file);
      setSlot((prev) =>
        prev.file === file
          ? { ...prev, videoDurationSec: sec, isLoadingMeta: false }
          : prev
      );
    } catch {
      setSlot({
        type: 'image',
        url: defaultUrl,
        file: null,
        videoDurationSec: null,
        startSec: 0,
        isLoadingMeta: false,
      });
    }
  };

  const handleBgmFile = (
    file: File | undefined,
    setSlot: React.Dispatch<React.SetStateAction<BgmSlot>>
  ) => {
    if (!file) return;
    const blobUrl = URL.createObjectURL(file);
    blobUrlsRef.current.push(blobUrl);
    setSlot({
      url: blobUrl,
      file,
      label: file.name,
      isDefault: false,
    });
  };

  const clearBgmBefore = () =>
    setBgmBefore({ url: null, file: null, label: '', isDefault: false });
  const clearBgmAfter = () =>
    setBgmAfter({ url: null, file: null, label: '', isDefault: false });
  const restoreBgmBeforeDefault = () =>
    setBgmBefore(
      makeDefaultBgmSlot(DEFAULT_BGM_BEFORE_URL, DEFAULT_BGM_BEFORE_LABEL)
    );
  const restoreBgmAfterDefault = () =>
    setBgmAfter(
      makeDefaultBgmSlot(DEFAULT_BGM_AFTER_URL, DEFAULT_BGM_AFTER_LABEL)
    );

  const beforeMedia = useMemo(
    () => slotToMediaInput(beforeSlot, BEFORE_SLOT_SEC),
    [beforeSlot]
  );
  const afterMedia = useMemo(
    () => slotToMediaInput(afterSlot, AFTER_SLOT_SEC),
    [afterSlot]
  );

  const totalFrames = useMemo(
    () => computeTotalFrames(beforeMedia, afterMedia),
    [beforeMedia, afterMedia]
  );

  const inputProps = useMemo(
    () => ({
      hookText,
      beforeMedia,
      afterMedia,
      menuName,
      price: price || undefined,
      duration: duration || undefined,
      salonName,
      fontPairId,
      bgmBeforeUrl: bgmBefore.url ?? undefined,
      bgmAfterUrl: bgmAfter.url ?? undefined,
    }),
    [
      hookText,
      beforeMedia,
      afterMedia,
      menuName,
      price,
      duration,
      salonName,
      fontPairId,
      bgmBefore.url,
      bgmAfter.url,
    ]
  );

  const handleDownload = async () => {
    setIsRendering(true);
    setRenderError(null);
    try {
      const formData = new FormData();
      formData.append(
        'meta',
        JSON.stringify({
          hookText,
          menuName,
          price: price || undefined,
          duration: duration || undefined,
          salonName,
          fontPairId,
          beforeMedia: {
            type: beforeMedia.type,
            url: beforeSlot.file ? null : beforeSlot.url,
            startSec: beforeMedia.startSec ?? 0,
            durationSec: beforeMedia.durationSec,
            hasFile: Boolean(beforeSlot.file),
          },
          afterMedia: {
            type: afterMedia.type,
            url: afterSlot.file ? null : afterSlot.url,
            startSec: afterMedia.startSec ?? 0,
            durationSec: afterMedia.durationSec,
            hasFile: Boolean(afterSlot.file),
          },
          bgmBefore: {
            hasFile: Boolean(bgmBefore.file),
            useDefault: bgmBefore.isDefault,
          },
          bgmAfter: {
            hasFile: Boolean(bgmAfter.file),
            useDefault: bgmAfter.isDefault,
          },
        })
      );
      if (beforeSlot.file) formData.append('beforeFile', beforeSlot.file);
      if (afterSlot.file) formData.append('afterFile', afterSlot.file);
      if (bgmBefore.file) formData.append('bgmBeforeFile', bgmBefore.file);
      if (bgmAfter.file) formData.append('bgmAfterFile', bgmAfter.file);

      const res = await fetch('/api/render', {
        method: 'POST',
        body: formData,
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

  return (
    <main className="min-h-screen bg-neutral-50 p-4 md:p-10 overflow-x-hidden">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-2xl md:text-3xl font-medium tracking-tight">
            ビフォーアフター動画
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            写真または動画と文言を入れて、Reels向け縦動画を作成
          </p>
        </header>

        <div className="grid md:grid-cols-[minmax(0,1fr)_400px] gap-8 md:gap-12">
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

            <Section title="写真または動画">
              <div className="grid grid-cols-2 gap-3">
                <MediaUpload
                  label="ビフォー"
                  slot={beforeSlot}
                  defaultUrl={DEFAULT_BEFORE_URL}
                  slotSec={BEFORE_SLOT_SEC}
                  onChange={(f) =>
                    handleFile(f, setBeforeSlot, DEFAULT_BEFORE_URL)
                  }
                  onStartChange={(sec) =>
                    setBeforeSlot((prev) => ({ ...prev, startSec: sec }))
                  }
                />
                <MediaUpload
                  label="アフター"
                  slot={afterSlot}
                  defaultUrl={DEFAULT_AFTER_URL}
                  slotSec={AFTER_SLOT_SEC}
                  onChange={(f) =>
                    handleFile(f, setAfterSlot, DEFAULT_AFTER_URL)
                  }
                  onStartChange={(sec) =>
                    setAfterSlot((prev) => ({ ...prev, startSec: sec }))
                  }
                />
              </div>
              <p className="text-[11px] text-neutral-400 mt-3 leading-relaxed">
                動画の場合：ビフォーは最大{BEFORE_SLOT_SEC}秒・アフターは最大
                {AFTER_SLOT_SEC}秒まで使用されます。長い動画は開始位置スライダーで切り出し位置を調整できます。
              </p>
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

            <Section title="BGM（任意）">
              <div className="space-y-4">
                <BgmPicker
                  label="前半BGM（ビフォー画像の間）"
                  slot={bgmBefore}
                  onChange={(f) => handleBgmFile(f, setBgmBefore)}
                  onClear={clearBgmBefore}
                  onRestoreDefault={restoreBgmBeforeDefault}
                />
                <BgmPicker
                  label="後半BGM（アフター→メニュー→サロン名）"
                  slot={bgmAfter}
                  onChange={(f) => handleBgmFile(f, setBgmAfter)}
                  onClear={clearBgmAfter}
                  onRestoreDefault={restoreBgmAfterDefault}
                />
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  冒頭テロップとカウントダウンは無音、ビフォー/アフター画像の間だけBGMが流れます。BGM が短い場合は自動でループします。
                </p>
              </div>
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
                durationInFrames={totalFrames}
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
              再生ボタンで{(totalFrames / 30).toFixed(0)}秒のプレビュー
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

function MediaUpload({
  label,
  slot,
  defaultUrl,
  slotSec,
  onChange,
  onStartChange,
}: {
  label: string;
  slot: MediaSlot;
  defaultUrl: string;
  slotSec: number;
  onChange: (file: File | undefined) => void;
  onStartChange: (startSec: number) => void;
}) {
  const isDefault = slot.url === defaultUrl;
  const isVideo = slot.type === 'video';
  const videoLen = slot.videoDurationSec ?? 0;
  const canSeek = isVideo && videoLen > slotSec;
  const maxStart = Math.max(0, videoLen - slotSec);
  const usedSec = isVideo
    ? Math.min(videoLen, slotSec)
    : slotSec;

  return (
    <div>
      <label className="block cursor-pointer">
        <div className="text-xs text-neutral-500 mb-1">{label}</div>
        <div className="aspect-[9/16] w-full rounded-lg overflow-hidden border-2 border-dashed border-neutral-300 hover:border-neutral-500 transition relative bg-neutral-100">
          {isVideo ? (
            <video
              src={slot.url}
              className="w-full h-full object-cover"
              muted
              playsInline
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={slot.url}
              alt={label}
              className="w-full h-full object-cover"
            />
          )}
          {isDefault && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-white text-xs font-medium">
                クリックして選択
              </span>
            </div>
          )}
          {isVideo && (
            <div className="absolute top-1.5 right-1.5 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
              動画
            </div>
          )}
        </div>
        <input
          type="file"
          accept="image/*,video/*"
          onChange={(e) => onChange(e.target.files?.[0])}
          className="hidden"
        />
      </label>

      {isVideo && slot.isLoadingMeta && (
        <p className="text-[10px] text-neutral-500 mt-2">
          動画を読み込み中…
        </p>
      )}

      {isVideo && !slot.isLoadingMeta && !canSeek && videoLen > 0 && (
        <p className="text-[10px] text-neutral-500 mt-2 leading-relaxed">
          {videoLen.toFixed(1)}秒の動画 - {usedSec.toFixed(1)}秒まるごと使用
        </p>
      )}

      {isVideo && canSeek && (
        <div className="mt-2">
          <div className="flex justify-between text-[10px] text-neutral-500 mb-1">
            <span>開始位置: {slot.startSec.toFixed(1)}秒</span>
            <span>
              {slot.startSec.toFixed(1)}〜{(slot.startSec + slotSec).toFixed(1)}秒を使用
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={maxStart}
            step={0.1}
            value={Math.min(slot.startSec, maxStart)}
            onChange={(e) => onStartChange(Number(e.target.value))}
            className="w-full accent-black"
          />
          <div className="flex justify-between text-[9px] text-neutral-400">
            <span>0秒</span>
            <span>{videoLen.toFixed(1)}秒</span>
          </div>
        </div>
      )}
    </div>
  );
}

function BgmPicker({
  label,
  slot,
  onChange,
  onClear,
  onRestoreDefault,
}: {
  label: string;
  slot: BgmSlot;
  onChange: (file: File | undefined) => void;
  onClear: () => void;
  onRestoreDefault: () => void;
}) {
  const hasUrl = Boolean(slot.url);
  return (
    <div>
      <div className="text-xs text-neutral-500 mb-1.5">{label}</div>
      {hasUrl ? (
        <div className="bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg text-neutral-600 leading-none flex-shrink-0">
              ♪
            </span>
            <span
              className="text-sm text-neutral-800 truncate flex-1 min-w-0"
              title={slot.label}
            >
              {slot.label}
            </span>
            <button
              onClick={onClear}
              className="text-xs text-neutral-500 hover:text-red-600 px-2 py-1 flex-shrink-0"
              aria-label="BGMを削除"
            >
              削除
            </button>
          </div>
          {slot.url && (
            <audio
              src={slot.url}
              controls
              className="h-8 w-full mt-2"
            />
          )}
        </div>
      ) : (
        <label className="block cursor-pointer">
          <div className="w-full border-2 border-dashed border-neutral-300 hover:border-neutral-500 transition rounded-lg p-3 flex items-center justify-center gap-2 text-neutral-500">
            <span className="text-lg leading-none">♪</span>
            <span className="text-sm">音楽ファイルを選択（BGMなし）</span>
          </div>
          <input
            type="file"
            accept="audio/*"
            onChange={(e) => onChange(e.target.files?.[0])}
            className="hidden"
          />
        </label>
      )}
      <div className="flex gap-3 mt-1.5">
        <label className="text-[11px] text-neutral-500 underline cursor-pointer hover:text-neutral-800">
          別のファイルに差し替え
          <input
            type="file"
            accept="audio/*"
            onChange={(e) => onChange(e.target.files?.[0])}
            className="hidden"
          />
        </label>
        {!slot.isDefault && (
          <button
            onClick={onRestoreDefault}
            className="text-[11px] text-neutral-500 underline hover:text-neutral-800"
          >
            デフォルトに戻す
          </button>
        )}
      </div>
    </div>
  );
}
