/* @flow strict-local */
/* eslint-disable react-native/no-unused-styles */
import React, { PureComponent } from 'react';
import { StyleSheet, View } from 'react-native';
import type { ViewStyleProp } from 'react-native/Libraries/StyleSheet/StyleSheet';

import type { Node as React$Node } from 'react';
import { BRAND_COLOR } from '../styles';

const styles = StyleSheet.create({
  wrapper: {
    // flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    overflow: 'hidden',
  },
  'top-right': {
    right: 0,
    top: 0,
  },
  'top-left': {
    left: 0,
    top: 0,
  },
  'bottom-right': {
    right: 0,
    bottom: 0,
  },
  'bottom-left': {
    bottom: 0,
    left: 0,
  },
});

type Props = {|
  children: React$Node,
  overlay: React$Node,
  showOverlay: boolean,
  overlaySize: number,
  overlayColor: string,
  overlayPosition: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left',
  style?: ViewStyleProp,
|};

/**
 * Layout component that streamlines how we
 * overlay a component over another component
 *
 * @prop children - Main component to be rendered.
 * @prop overlay - Component to be overlayed over the main one.
 * @prop [showOverlay] - Should the overlay be shown.
 * @prop [overlaySize] - The size of the overlay in pixels,
 * @prop [overlayColor] - The color of the overlay.
 * @prop [overlayPosition] - Overlay position can be one of the following:
 *  * 'top-right'
 *  * 'top-left'
 *  * 'bottom-right'
 *  * 'bottom-left'
 * @prop [style] - Style object applied to the main component.
 */
export default class ComponentWithOverlay extends PureComponent<Props> {
  static defaultProps = {
    showOverlay: true,
    overlaySize: 0,
    overlayColor: BRAND_COLOR,
    overlayPosition: 'top-right',
  };

  render() {
    const {
      children,
      style,
      overlay,
      showOverlay,
      overlayPosition,
      overlaySize,
      overlayColor,
    } = this.props;

    const wrapperStyle = [styles.wrapper, style];
    const overlayStyle = [
      styles.wrapper,
      styles.overlay,
      styles[overlayPosition],
      {
        minWidth: overlaySize,
        height: overlaySize,
        borderRadius: overlaySize,
        backgroundColor: overlayColor,
      },
    ];

    return (
      <View style={wrapperStyle}>
        {children}
        {showOverlay && overlaySize > 0 && <View style={overlayStyle}>{overlay}</View>}
      </View>
    );
  }
}
