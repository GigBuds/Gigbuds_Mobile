import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, Text } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, G, ClipPath } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedSvg = Animated.createAnimatedComponent(Svg);

const LoadingComponent = ({ 
  size = 60, 
  speed = 3000, 
  showText = true, 
  loadingText = "Đang tải...",
  animationType = "outline", // "outline", "rotating", "pulsing"
  strokeWidth = 2,
  strokeColor = "#007AFF"
}) => {
  const rotateValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;
  const opacityValue = useRef(new Animated.Value(1)).current;
  const strokeDashoffset1 = useRef(new Animated.Value(1)).current;
  const strokeDashoffset2 = useRef(new Animated.Value(1)).current;
  const strokeDashoffset3 = useRef(new Animated.Value(1)).current;
  const strokeDashoffset4 = useRef(new Animated.Value(1)).current;
  const strokeDashoffset5 = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let animation;

    switch (animationType) {
      case "outline":
        const startOutlineAnimation = () => {
          // Reset all animations
          strokeDashoffset1.setValue(1);
          strokeDashoffset2.setValue(1);
          strokeDashoffset3.setValue(1);
          strokeDashoffset4.setValue(1);
          strokeDashoffset5.setValue(1);

          // Animate each path sequentially with slight overlaps
          Animated.sequence([
            Animated.timing(strokeDashoffset1, {
              toValue: 0,
              duration: speed / 5,
              useNativeDriver: false,
            }),
            Animated.timing(strokeDashoffset2, {
              toValue: 0,
              duration: speed / 5,
              useNativeDriver: false,
            }),
            Animated.timing(strokeDashoffset3, {
              toValue: 0,
              duration: speed / 5,
              useNativeDriver: false,
            }),
            Animated.timing(strokeDashoffset4, {
              toValue: 0,
              duration: speed / 5,
              useNativeDriver: false,
            }),
            Animated.timing(strokeDashoffset5, {
              toValue: 0,
              duration: speed / 5,
              useNativeDriver: false,
            }),
          ]).start(() => {
            // Small delay before restarting
            setTimeout(() => startOutlineAnimation(), 500);
          });
        };
        startOutlineAnimation();
        break;

      case "rotating":
        const startRotation = () => {
          rotateValue.setValue(0);
          Animated.timing(rotateValue, {
            toValue: 1,
            duration: speed,
            useNativeDriver: true,
          }).start(() => startRotation());
        };
        startRotation();
        break;

      case "pulsing":
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
                toValue: 0.7,
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
        break;
    }

    return () => {
      if (animation) {
        animation.stop();
      }
    };
  }, [animationType, speed]);

  const getAnimationStyle = () => {
    switch (animationType) {
      case "rotating":
        const rotate = rotateValue.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg'],
        });
        return { transform: [{ rotate }] };
        
      case "pulsing":
        return { 
          transform: [{ scale: scaleValue }],
          opacity: opacityValue
        };
        
      default:
        return {};
    }
  };

  // Calculate stroke dash arrays for each path (approximate values)
  const pathLengths = {
    path1: 200, // Approximate length for first path
    path2: 150,
    path3: 180,
    path4: 220,
    path5: 160,
  };

  if (animationType === "outline") {
    return (
      <View style={styles.container}>
        <Svg
          width={size}
          height={(size * 64) / 60}
          viewBox="0 0 60 64"
        >
         <Defs>
            <LinearGradient id="stroke_gradient_1" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#FFF33B" />
              <Stop offset="0.67" stopColor="#F3903F" />
              <Stop offset="0.89" stopColor="#ED683C" />
              <Stop offset="1" stopColor="#FF7345" />
            </LinearGradient>
            <LinearGradient id="stroke_gradient_2" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#FFF33B" />
              <Stop offset="0.67" stopColor="#F3903F" />
              <Stop offset="0.89" stopColor="#ED683C" />
              <Stop offset="1" stopColor="#FF7345" />
            </LinearGradient>
            <LinearGradient id="stroke_gradient_3" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#FFF33B" />
              <Stop offset="0.67" stopColor="#F3903F" />
              <Stop offset="0.89" stopColor="#ED683C" />
              <Stop offset="1" stopColor="#FF7345" />
            </LinearGradient>
            <LinearGradient id="stroke_gradient_4" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#FFF33B" />
              <Stop offset="0.67" stopColor="#F3903F" />
              <Stop offset="0.89" stopColor="#ED683C" />
              <Stop offset="1" stopColor="#FF7345" />
            </LinearGradient>
          </Defs>
          
          <G clipPath="url(#clip0_181_33905)">
            <AnimatedPath 
              d="M59.5 5.76333V20.5653H26.8037L19.5519 40.51L34.2732 0H53.7604C56.9281 0 59.5 2.58 59.5 5.76333Z" 
              fill="none"
              stroke="url(#stroke_gradient_1)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={pathLengths.path1}
              strokeDashoffset={strokeDashoffset1.interpolate({
                inputRange: [0, 1],
                outputRange: [0, pathLengths.path1],
              })}
            />
            <AnimatedPath 
              d="M51.1369 64.0004H16.9914C16.6706 64.0004 16.3441 63.9889 16.0291 63.9659L30.5499 50.6464L30.5614 50.6579L41.5652 40.5391L51.1369 64.0004Z" 
              fill="none"
              stroke="url(#stroke_gradient_2)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={pathLengths.path2}
              strokeDashoffset={strokeDashoffset2.interpolate({
                inputRange: [0, 1],
                outputRange: [0, pathLengths.path2],
              })}
            />
            <AnimatedPath 
              d="M59.4999 27.9434V58.2368C59.4999 61.4201 56.928 64.0001 53.7603 64.0001H51.1368L41.5651 40.5388H41.5766L36.9998 27.9434H59.4999Z" 
              fill="none"
              stroke="url(#stroke_gradient_3)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={pathLengths.path3}
              strokeDashoffset={strokeDashoffset3.interpolate({
                inputRange: [0, 1],
                outputRange: [0, pathLengths.path3],
              })}
            />
            <AnimatedPath 
              d="M30.5499 50.6465L16.029 63.9659C7.36806 63.4718 0.5 56.2719 0.5 47.4574V22.9561L19.5518 40.5104L19.5404 40.5334L30.5499 50.6465Z" 
              fill="none"
              stroke="url(#stroke_gradient_4)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={pathLengths.path4}
              strokeDashoffset={strokeDashoffset4.interpolate({
                inputRange: [0, 1],
                outputRange: [0, pathLengths.path4],
              })}
            />
            <AnimatedPath 
              d="M34.2732 0L19.5518 40.51L0.5 22.9556V16.543C0.5 7.40672 7.88359 0 16.9914 0H34.2732Z" 
              fill="none"
              stroke="url(#stroke_gradient_4)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={pathLengths.path5}
              strokeDashoffset={strokeDashoffset5.interpolate({
                inputRange: [0, 1],
                outputRange: [0, pathLengths.path5],
              })}
            />
          </G>
          
          <Defs>
            <ClipPath id="clip0_181_33905">
              <Path d="M0 0H60V64H0V0Z" fill="white"/>
            </ClipPath>
          </Defs>
        </Svg>
        
        {showText && (
          <Text style={styles.loadingText}>{loadingText}</Text>
        )}
      </View>
    );
  }

  // For non-outline animations, keep the filled version
  return (
    <View style={styles.container}>
      <AnimatedSvg
        width={size}
        height={(size * 64) / 60}
        viewBox="0 0 60 64"
        style={getAnimationStyle()}
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
      
      {showText && (
        <Text style={styles.loadingText}>{loadingText}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
});

export default LoadingComponent;