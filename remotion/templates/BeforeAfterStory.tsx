import {
  AbsoluteFill,
  Audio,
  Img,
  OffthreadVideo,
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Sequence,
} from 'remotion';
import { fontPairs, type FontPairId } from '../fonts/loadFonts';
import {
  AFTER_SLOT_SEC,
  BEFORE_SLOT_SEC,
  BGM_BASE_VOLUME,
  BGM_FADE_IN_SEC,
  BGM_FADE_OUT_SEC,
  COUNTDOWN_SEC,
  CTA_SEC,
  FPS,
  HOOK_SEC,
  INFO_SEC,
  resolveSceneSeconds,
  type MediaInput,
} from '../lib/timing';

export type { MediaInput } from '../lib/timing';
export { computeTotalFrames, resolveSceneSeconds } from '../lib/timing';

export type BeforeAfterStoryProps = {
  hookText: string;
  beforeMedia: MediaInput;
  afterMedia: MediaInput;
  menuName: string;
  price?: string;
  duration?: string;
  salonName: string;
  fontPairId: FontPairId;
  bgmBeforeUrl?: string;
  bgmAfterUrl?: string;
};

export const BeforeAfterStory: React.FC<BeforeAfterStoryProps> = ({
  hookText,
  beforeMedia,
  afterMedia,
  menuName,
  price,
  duration,
  salonName,
  fontPairId,
  bgmBeforeUrl,
  bgmAfterUrl,
}) => {
  const fonts = fontPairs[fontPairId];

  const beforeSec = resolveSceneSeconds(beforeMedia, BEFORE_SLOT_SEC);
  const afterSec = resolveSceneSeconds(afterMedia, AFTER_SLOT_SEC);

  const hookOut = HOOK_SEC * FPS;
  const beforeIn = hookOut;
  const beforeOut = beforeIn + beforeSec * FPS;
  const count3 = beforeOut;
  const count2 = count3 + FPS;
  const count1 = count2 + FPS;
  const afterIn = count3 + COUNTDOWN_SEC * FPS;
  const afterOut = afterIn + afterSec * FPS;
  const infoIn = afterOut;
  const infoOut = infoIn + INFO_SEC * FPS;
  const ctaIn = infoOut;
  const ctaOut = ctaIn + CTA_SEC * FPS;

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a0a' }}>
      {bgmBeforeUrl && (
        <Sequence from={beforeIn} durationInFrames={beforeOut - beforeIn}>
          <BgmTrack url={bgmBeforeUrl} durationFrames={beforeOut - beforeIn} />
        </Sequence>
      )}
      {bgmAfterUrl && (
        <Sequence from={afterIn} durationInFrames={ctaOut - afterIn}>
          <BgmTrack url={bgmAfterUrl} durationFrames={ctaOut - afterIn} />
        </Sequence>
      )}

      <Sequence from={0} durationInFrames={hookOut}>
        <HookScene text={hookText} fonts={fonts} />
      </Sequence>

      <Sequence from={beforeIn} durationInFrames={beforeOut - beforeIn}>
        <MediaScene media={beforeMedia} label="BEFORE" fonts={fonts} />
      </Sequence>

      <Sequence from={count3} durationInFrames={FPS}>
        <CountdownNumber digit={3} fonts={fonts} />
      </Sequence>
      <Sequence from={count2} durationInFrames={FPS}>
        <CountdownNumber digit={2} fonts={fonts} />
      </Sequence>
      <Sequence from={count1} durationInFrames={FPS}>
        <CountdownNumber digit={1} fonts={fonts} />
      </Sequence>

      <Sequence from={afterIn} durationInFrames={afterOut - afterIn}>
        <MediaScene media={afterMedia} label="AFTER" fonts={fonts} dramatic />
      </Sequence>

      <Sequence from={infoIn} durationInFrames={infoOut - infoIn}>
        <InfoCard
          menuName={menuName}
          price={price}
          duration={duration}
          afterMedia={afterMedia}
          fonts={fonts}
        />
      </Sequence>

      <Sequence from={ctaIn} durationInFrames={ctaOut - ctaIn}>
        <SaveCta salonName={salonName} fonts={fonts} />
      </Sequence>
    </AbsoluteFill>
  );
};

type Fonts = (typeof fontPairs)[FontPairId];

const BgmTrack: React.FC<{ url: string; durationFrames: number }> = ({
  url,
  durationFrames,
}) => {
  const fadeInFrames = Math.round(BGM_FADE_IN_SEC * FPS);
  const fadeOutFrames = Math.round(BGM_FADE_OUT_SEC * FPS);
  const volumeFn = (frame: number) => {
    const fadeIn = interpolate(frame, [0, fadeInFrames], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    const fadeOut = interpolate(
      frame,
      [durationFrames - fadeOutFrames, durationFrames],
      [1, 0],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );
    return Math.min(fadeIn, fadeOut) * BGM_BASE_VOLUME;
  };
  return <Audio src={url} volume={volumeFn} loop />;
};

const HookScene: React.FC<{ text: string; fonts: Fonts }> = ({ text, fonts }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 12, 50, 60], [0, 1, 1, 0], {
    extrapolateRight: 'clamp',
  });
  const translateY = interpolate(frame, [0, 18], [20, 0], {
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0a0a0a',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0 80px',
      }}
    >
      <div
        style={{
          color: '#fff',
          fontSize: 96,
          lineHeight: 1.4,
          fontFamily: fonts.japanese,
          fontWeight: 500,
          textAlign: 'center',
          letterSpacing: '0.05em',
          whiteSpace: 'pre-line',
          opacity,
          transform: `translateY(${translateY}px)`,
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

const MediaLayer: React.FC<{ media: MediaInput; scale: number }> = ({
  media,
  scale,
}) => {
  if (media.type === 'video') {
    const startFrom = Math.round((media.startSec ?? 0) * FPS);
    return (
      <AbsoluteFill style={{ transform: `scale(${scale})` }}>
        <OffthreadVideo
          src={media.url}
          startFrom={startFrom}
          muted
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{ transform: `scale(${scale})` }}>
      <Img
        src={media.url}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    </AbsoluteFill>
  );
};

const MediaScene: React.FC<{
  media: MediaInput;
  label: string;
  fonts: Fonts;
  dramatic?: boolean;
}> = ({ media, label, fonts, dramatic }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const scaleStart = 1.0;
  const scaleEnd = dramatic ? 1.12 : 1.06;
  const scale = interpolate(
    frame,
    [0, durationInFrames],
    [scaleStart, scaleEnd],
    { extrapolateRight: 'clamp' }
  );

  const fadeIn = interpolate(frame, [0, 18], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 12, durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp' }
  );
  const opacity = Math.min(fadeIn, fadeOut);

  const labelOpacity = interpolate(
    frame,
    [12, 30, durationInFrames - 18, durationInFrames - 6],
    [0, 1, 1, 0],
    { extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill style={{ opacity }}>
      <MediaLayer media={media} scale={scale} />
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 75%, rgba(0,0,0,0.4) 100%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 80,
          left: 60,
          color: '#fff',
          fontSize: 36,
          fontFamily: fonts.english,
          letterSpacing: '0.4em',
          fontWeight: 500,
          opacity: labelOpacity,
          textShadow: '0 2px 8px rgba(0,0,0,0.6)',
        }}
      >
        {label}
      </div>
    </AbsoluteFill>
  );
};

const CountdownNumber: React.FC<{ digit: number; fonts: Fonts }> = ({
  digit,
  fonts,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const popIn = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 180, mass: 0.6 },
  });
  const scale = interpolate(popIn, [0, 1], [1.8, 1.0]);

  const opacity = interpolate(frame, [0, 6, 24, 30], [0, 1, 1, 0], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0a0a0a',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          color: '#fff',
          fontSize: 480,
          fontFamily: fonts.english,
          fontWeight: 400,
          lineHeight: 1,
          opacity,
          transform: `scale(${scale})`,
        }}
      >
        {digit}
      </div>
    </AbsoluteFill>
  );
};

const InfoCard: React.FC<{
  menuName: string;
  price?: string;
  duration?: string;
  afterMedia: MediaInput;
  fonts: Fonts;
}> = ({ menuName, price, duration, afterMedia, fonts }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slideIn = spring({
    frame,
    fps,
    config: { damping: 20, stiffness: 100 },
  });
  const translateY = interpolate(slideIn, [0, 1], [60, 0]);
  const opacity = interpolate(frame, [0, 18], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill>
      {afterMedia.type === 'image' ? (
        <AbsoluteFill style={{ transform: 'scale(1.05)' }}>
          <Img
            src={afterMedia.url}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </AbsoluteFill>
      ) : (
        <AbsoluteFill style={{ backgroundColor: '#0a0a0a' }} />
      )}
      <AbsoluteFill
        style={{ backgroundColor: 'rgba(10,10,10,0.55)', backdropFilter: 'blur(4px)' }}
      />
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          opacity,
          transform: `translateY(${translateY}px)`,
        }}
      >
        <div
          style={{
            textAlign: 'center',
            color: '#fff',
            padding: '0 60px',
          }}
        >
          <div
            style={{
              fontSize: 28,
              fontFamily: fonts.english,
              letterSpacing: '0.35em',
              opacity: 0.7,
              marginBottom: 28,
            }}
          >
            MENU
          </div>
          <div
            style={{
              fontSize: 80,
              fontFamily: fonts.japanese,
              fontWeight: 500,
              lineHeight: 1.3,
              marginBottom: 56,
            }}
          >
            {menuName}
          </div>
          {(price || duration) && (
            <div
              style={{
                display: 'flex',
                gap: 80,
                justifyContent: 'center',
                marginBottom: 12,
              }}
            >
              {price && <DataPoint label="PRICE" value={price} fonts={fonts} />}
              {duration && <DataPoint label="TIME" value={duration} fonts={fonts} />}
            </div>
          )}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const DataPoint: React.FC<{ label: string; value: string; fonts: Fonts }> = ({
  label,
  value,
  fonts,
}) => (
  <div style={{ textAlign: 'center', color: '#fff' }}>
    <div
      style={{
        fontSize: 22,
        fontFamily: fonts.english,
        letterSpacing: '0.3em',
        opacity: 0.6,
        marginBottom: 16,
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: 52,
        fontFamily: fonts.japanese,
        fontWeight: 500,
      }}
    >
      {value}
    </div>
  </div>
);

const SaveCta: React.FC<{ salonName: string; fonts: Fonts }> = ({
  salonName,
  fonts,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const popIn = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 160 },
  });
  const scale = interpolate(popIn, [0, 1], [0.85, 1]);

  const fadeIn = interpolate(frame, [0, 12], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 12, durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp' }
  );
  const opacity = Math.min(fadeIn, fadeOut);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0a0a0a',
        justifyContent: 'center',
        alignItems: 'center',
        opacity,
      }}
    >
      <div
        style={{
          color: '#fff',
          fontSize: 64,
          fontFamily: fonts.english,
          letterSpacing: '0.32em',
          fontWeight: 400,
          textAlign: 'center',
          transform: `scale(${scale})`,
        }}
      >
        {salonName}
      </div>
    </AbsoluteFill>
  );
};
