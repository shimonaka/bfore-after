import {
  AbsoluteFill,
  Img,
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Sequence,
} from 'remotion';
import { fontPairs, type FontPairId } from '../fonts/loadFonts';

export type BeforeAfterStoryProps = {
  hookText: string;
  beforeImageUrl: string;
  afterImageUrl: string;
  menuName: string;
  price?: string;
  duration?: string;
  salonName: string;
  fontPairId: FontPairId;
};

const FPS = 30;

const FRAMES = {
  HOOK_IN: 0,
  HOOK_OUT: 60,
  BEFORE_IN: 60,
  BEFORE_OUT: 180,
  COUNT_3: 180,
  COUNT_2: 210,
  COUNT_1: 240,
  AFTER_IN: 270,
  AFTER_OUT: 450,
  INFO_IN: 450,
  INFO_OUT: 510,
  CTA_IN: 510,
  END: 540,
};

export const BeforeAfterStory: React.FC<BeforeAfterStoryProps> = ({
  hookText,
  beforeImageUrl,
  afterImageUrl,
  menuName,
  price,
  duration,
  salonName,
  fontPairId,
}) => {
  const fonts = fontPairs[fontPairId];

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a0a' }}>
      <Sequence from={FRAMES.HOOK_IN} durationInFrames={FRAMES.HOOK_OUT - FRAMES.HOOK_IN}>
        <HookScene text={hookText} fonts={fonts} />
      </Sequence>

      <Sequence
        from={FRAMES.BEFORE_IN}
        durationInFrames={FRAMES.BEFORE_OUT - FRAMES.BEFORE_IN}
      >
        <PhotoScene imageUrl={beforeImageUrl} label="BEFORE" fonts={fonts} />
      </Sequence>

      <Sequence from={FRAMES.COUNT_3} durationInFrames={30}>
        <CountdownNumber digit={3} fonts={fonts} />
      </Sequence>
      <Sequence from={FRAMES.COUNT_2} durationInFrames={30}>
        <CountdownNumber digit={2} fonts={fonts} />
      </Sequence>
      <Sequence from={FRAMES.COUNT_1} durationInFrames={30}>
        <CountdownNumber digit={1} fonts={fonts} />
      </Sequence>

      <Sequence
        from={FRAMES.AFTER_IN}
        durationInFrames={FRAMES.AFTER_OUT - FRAMES.AFTER_IN}
      >
        <PhotoScene imageUrl={afterImageUrl} label="AFTER" fonts={fonts} dramatic />
      </Sequence>

      <Sequence
        from={FRAMES.INFO_IN}
        durationInFrames={FRAMES.INFO_OUT - FRAMES.INFO_IN}
      >
        <InfoCard
          menuName={menuName}
          price={price}
          duration={duration}
          afterImageUrl={afterImageUrl}
          fonts={fonts}
        />
      </Sequence>

      <Sequence
        from={FRAMES.CTA_IN}
        durationInFrames={FRAMES.END - FRAMES.CTA_IN}
      >
        <SaveCta salonName={salonName} fonts={fonts} />
      </Sequence>
    </AbsoluteFill>
  );
};

type Fonts = (typeof fontPairs)[FontPairId];

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

const PhotoScene: React.FC<{
  imageUrl: string;
  label: string;
  fonts: Fonts;
  dramatic?: boolean;
}> = ({ imageUrl, label, fonts, dramatic }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const scaleStart = dramatic ? 1.0 : 1.0;
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

  const labelOpacity = interpolate(frame, [12, 30, durationInFrames - 18, durationInFrames - 6], [0, 1, 1, 0], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ opacity }}>
      <AbsoluteFill style={{ transform: `scale(${scale})` }}>
        <Img
          src={imageUrl}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </AbsoluteFill>
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

const CountdownNumber: React.FC<{ digit: number; fonts: Fonts }> = ({ digit, fonts }) => {
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
  afterImageUrl: string;
  fonts: Fonts;
}> = ({ menuName, price, duration, afterImageUrl, fonts }) => {
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
      <AbsoluteFill style={{ transform: 'scale(1.05)' }}>
        <Img
          src={afterImageUrl}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </AbsoluteFill>
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
  const scale = interpolate(popIn, [0, 1], [0.8, 1]);

  const fadeOut = interpolate(
    frame,
    [durationInFrames - 10, durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0a0a0a',
        justifyContent: 'center',
        alignItems: 'center',
        opacity: fadeOut,
      }}
    >
      <div style={{ textAlign: 'center', transform: `scale(${scale})` }}>
        <div
          style={{
            display: 'inline-block',
            padding: '20px 56px',
            border: '2px solid #fff',
            borderRadius: 999,
            color: '#fff',
            fontSize: 44,
            fontFamily: fonts.japanese,
            fontWeight: 500,
            letterSpacing: '0.1em',
            marginBottom: 56,
          }}
        >
          保存推奨
        </div>
        <div
          style={{
            color: '#fff',
            fontSize: 40,
            fontFamily: fonts.english,
            letterSpacing: '0.3em',
            opacity: 0.85,
            fontWeight: 400,
          }}
        >
          {salonName}
        </div>
      </div>
    </AbsoluteFill>
  );
};
