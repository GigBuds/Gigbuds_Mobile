import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, G, ClipPath } from 'react-native-svg';

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

// Rotating loader
const RotatingLoader = ({ size = 60, speed = 1000 }) => {
  const rotateValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startRotation = () => {
      rotateValue.setValue(0);
      Animated.timing(rotateValue, {
        toValue: 1,
        duration: speed,
        useNativeDriver: true,
      }).start(() => startRotation());
    };

    startRotation();
  }, [rotateValue, speed]);

  const rotate = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const scale = size / 60; // Scale based on original size

  return (
    <View style={styles.container}>
      <AnimatedSvg
        width={size}
        height={(size * 64) / 60} // Maintain aspect ratio
        viewBox="0 0 60 64"
        style={{ transform: [{ rotate }, { scale }] }}
      >
        <Defs>
          <LinearGradient id="paint0_linear_181_33905" x1="42.9268" y1="0" x2="42.9268" y2="40.51" gradientUnits="userSpaceOnUse">
            <Stop stopColor="#FF6B6B" />
            <Stop offset="1" stopColor="#FF8E8E" />
          </LinearGradient>
          <LinearGradient id="paint1_linear_181_33905" x1="28.2957" y1="40.5391" x2="28.2957" y2="64.0004" gradientUnits="userSpaceOnUse">
            <Stop stopColor="#4ECDC4" />
            <Stop offset="1" stopColor="#44B5A8" />
          </LinearGradient>
          <LinearGradient id="paint2_linear_181_33905" x1="50.5382" y1="27.9434" x2="50.5382" y2="64.0001" gradientUnits="userSpaceOnUse">
            <Stop stopColor="#45B7D1" />
            <Stop offset="1" stopColor="#2196F3" />
          </LinearGradient>
          <LinearGradient id="paint3_linear_181_33905" x1="15.5249" y1="22.9561" x2="15.5249" y2="63.9659" gradientUnits="userSpaceOnUse">
            <Stop stopColor="#96CEB4" />
            <Stop offset="1" stopColor="#5CB85C" />
          </LinearGradient>
        </Defs>
        
        <G clipPath="url(#clip0_181_33905)">
          <Path d="M59.5 5.76333V20.5653H26.8037L19.5519 40.51L34.2732 0H53.7604C56.9281 0 59.5 2.58 59.5 5.76333Z" fill="url(#paint0_linear_181_33905)"/>
          <Path d="M51.1369 64.0004H16.9914C16.6706 64.0004 16.3441 63.9889 16.0291 63.9659L30.5499 50.6464L30.5614 50.6579L41.5652 40.5391L51.1369 64.0004Z" fill="url(#paint1_linear_181_33905)"/>
          <Path d="M59.4999 27.9434V58.2368C59.4999 61.4201 56.928 64.0001 53.7603 64.0001H51.1368L41.5651 40.5388H41.5766L36.9998 27.9434H59.4999Z" fill="url(#paint2_linear_181_33905)"/>
          <Path d="M30.5499 50.6465L16.029 63.9659C7.36806 63.4718 0.5 56.2719 0.5 47.4574V22.9561L19.5518 40.5104L19.5404 40.5334L30.5499 50.6465Z" fill="url(#paint3_linear_181_33905)"/>
          <Path d="M34.2732 0L19.5518 40.51L0.5 22.9556V16.543C0.5 7.40672 7.88359 0 16.9914 0H34.2732Z" fill="url(#paint3_linear_181_33905)"/>
        </G>
        
        <Defs>
          <ClipPath id="clip0_181_33905">
            <Path d="M0 0H60V64H0V0Z" fill="white"/>
          </ClipPath>
        </Defs>
      </AnimatedSvg>
    </View>
  );
};

// Pulsing loader
const PulsingLoader = ({ size = 60, speed = 800 }) => {
  const scaleValue = useRef(new Animated.Value(1)).current;
  const opacityValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const startPulsing = () => {
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scaleValue, {
            toValue: 1.1,
            duration: speed / 2,
            useNativeDriver: true,
          }),
          Animated.timing(scaleValue, {
            toValue: 1,
            duration: speed / 2,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(opacityValue, {
            toValue: 0.6,
            duration: speed / 2,
            useNativeDriver: true,
          }),
          Animated.timing(opacityValue, {
            toValue: 1,
            duration: speed / 2,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => startPulsing());
    };

    startPulsing();
  }, [scaleValue, opacityValue, speed]);

  return (
    <View style={styles.container}>
      <AnimatedSvg
        width={size}
        height={(size * 64) / 60}
        viewBox="0 0 60 64"
        style={{ 
          transform: [{ scale: scaleValue }],
          opacity: opacityValue
        }}
      >
        <Defs>
          <LinearGradient id="paint0_linear_181_33905" x1="42.9268" y1="0" x2="42.9268" y2="40.51" gradientUnits="userSpaceOnUse">
            <Stop stopColor="#FF6B6B" />
            <Stop offset="1" stopColor="#FF8E8E" />
          </LinearGradient>
          <LinearGradient id="paint1_linear_181_33905" x1="28.2957" y1="40.5391" x2="28.2957" y2="64.0004" gradientUnits="userSpaceOnUse">
            <Stop stopColor="#4ECDC4" />
            <Stop offset="1" stopColor="#44B5A8" />
          </LinearGradient>
          <LinearGradient id="paint2_linear_181_33905" x1="50.5382" y1="27.9434" x2="50.5382" y2="64.0001" gradientUnits="userSpaceOnUse">
            <Stop stopColor="#45B7D1" />
            <Stop offset="1" stopColor="#2196F3" />
          </LinearGradient>
          <LinearGradient id="paint3_linear_181_33905" x1="15.5249" y1="22.9561" x2="15.5249" y2="63.9659" gradientUnits="userSpaceOnUse">
            <Stop stopColor="#96CEB4" />
            <Stop offset="1" stopColor="#5CB85C" />
          </LinearGradient>
        </Defs>
        
        <G clipPath="url(#clip0_181_33905)">
          <Path d="M59.5 5.76333V20.5653H26.8037L19.5519 40.51L34.2732 0H53.7604C56.9281 0 59.5 2.58 59.5 5.76333Z" fill="url(#paint0_linear_181_33905)"/>
          <Path d="M51.1369 64.0004H16.9914C16.6706 64.0004 16.3441 63.9889 16.0291 63.9659L30.5499 50.6464L30.5614 50.6579L41.5652 40.5391L51.1369 64.0004Z" fill="url(#paint1_linear_181_33905)"/>
          <Path d="M59.4999 27.9434V58.2368C59.4999 61.4201 56.928 64.0001 53.7603 64.0001H51.1368L41.5651 40.5388H41.5766L36.9998 27.9434H59.4999Z" fill="url(#paint2_linear_181_33905)"/>
          <Path d="M30.5499 50.6465L16.029 63.9659C7.36806 63.4718 0.5 56.2719 0.5 47.4574V22.9561L19.5518 40.5104L19.5404 40.5334L30.5499 50.6465Z" fill="url(#paint3_linear_181_33905)"/>
          <Path d="M34.2732 0L19.5518 40.51L0.5 22.9556V16.543C0.5 7.40672 7.88359 0 16.9914 0H34.2732Z" fill="url(#paint3_linear_181_33905)"/>
        </G>
        
        <Defs>
          <ClipPath id="clip0_181_33905">
            <Path d="M0 0H60V64H0V0Z" fill="white"/>
          </ClipPath>
        </Defs>
      </AnimatedSvg>
    </View>
  );
};

// Bouncing loader
const BouncingLoader = ({ size = 60, speed = 600 }) => {
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startBouncing = () => {
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: -10,
          duration: speed / 2,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: speed / 2,
          useNativeDriver: true,
        }),
      ]).start(() => startBouncing());
    };

    startBouncing();
  }, [translateY, speed]);

  return (
    <View style={styles.container}>
      <AnimatedSvg
        width={size}
        height={(size * 64) / 60}
        viewBox="0 0 60 64"
        style={{ 
          transform: [{ translateY }]
        }}
      >
        <Defs>
          <LinearGradient id="paint0_linear_181_33905" x1="42.9268" y1="0" x2="42.9268" y2="40.51" gradientUnits="userSpaceOnUse">
            <Stop stopColor="#FF6B6B" />
            <Stop offset="1" stopColor="#FF8E8E" />
          </LinearGradient>
          <LinearGradient id="paint1_linear_181_33905" x1="28.2957" y1="40.5391" x2="28.2957" y2="64.0004" gradientUnits="userSpaceOnUse">
            <Stop stopColor="#4ECDC4" />
            <Stop offset="1" stopColor="#44B5A8" />
          </LinearGradient>
          <LinearGradient id="paint2_linear_181_33905" x1="50.5382" y1="27.9434" x2="50.5382" y2="64.0001" gradientUnits="userSpaceOnUse">
            <Stop stopColor="#45B7D1" />
            <Stop offset="1" stopColor="#2196F3" />
          </LinearGradient>
          <LinearGradient id="paint3_linear_181_33905" x1="15.5249" y1="22.9561" x2="15.5249" y2="63.9659" gradientUnits="userSpaceOnUse">
            <Stop stopColor="#96CEB4" />
            <Stop offset="1" stopColor="#5CB85C" />
          </LinearGradient>
        </Defs>
        
        <G clipPath="url(#clip0_181_33905)">
          <Path d="M59.5 5.76333V20.5653H26.8037L19.5519 40.51L34.2732 0H53.7604C56.9281 0 59.5 2.58 59.5 5.76333Z" fill="url(#paint0_linear_181_33905)"/>
          <Path d="M51.1369 64.0004H16.9914C16.6706 64.0004 16.3441 63.9889 16.0291 63.9659L30.5499 50.6464L30.5614 50.6579L41.5652 40.5391L51.1369 64.0004Z" fill="url(#paint1_linear_181_33905)"/>
          <Path d="M59.4999 27.9434V58.2368C59.4999 61.4201 56.928 64.0001 53.7603 64.0001H51.1368L41.5651 40.5388H41.5766L36.9998 27.9434H59.4999Z" fill="url(#paint2_linear_181_33905)"/>
          <Path d="M30.5499 50.6465L16.029 63.9659C7.36806 63.4718 0.5 56.2719 0.5 47.4574V22.9561L19.5518 40.5104L19.5404 40.5334L30.5499 50.6465Z" fill="url(#paint3_linear_181_33905)"/>
          <Path d="M34.2732 0L19.5518 40.51L0.5 22.9556V16.543C0.5 7.40672 7.88359 0 16.9914 0H34.2732Z" fill="url(#paint3_linear_181_33905)"/>
        </G>
        
        <Defs>
          <ClipPath id="clip0_181_33905">
            <Path d="M0 0H60V64H0V0Z" fill="white"/>
          </ClipPath>
        </Defs>
      </AnimatedSvg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});

export { RotatingLoader, PulsingLoader, BouncingLoader };