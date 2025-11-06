import React, { Component, PureComponent } from 'react'
import debounce from 'lodash/debounce'
import * as color from '../../helpers/color'

export const ColorWrap = (Picker) => {
  // Always use PureComponent for better rendering performance
  const BaseComponent = PureComponent || Component;
  class ColorPicker extends BaseComponent {
    constructor(props) {
      super()

      this.state = {
        ...color.toState(props.color, 0),
      }

      // History management for undo/redo
      this.colorHistory = [this.state]
      this.historyIndex = 0

      this.debounce = debounce((fn, data, event) => {
        fn(data, event)
      }, 100)
    }

    static getDerivedStateFromProps(nextProps, state) {
      return {
        ...color.toState(nextProps.color, state.oldHue),
      }
    }

    handleChange = (data, event) => {
      const isValidColor = color.simpleCheckForValidColor(data)
      if (isValidColor) {
        const colors = color.toState(data, data.h || this.state.oldHue)
        this.setState(colors)
        this.props.onChangeComplete && this.debounce(this.props.onChangeComplete, colors, event)
        this.props.onChange && this.props.onChange(colors, event)

        // Update color history
        this.updateHistory(colors)
      }
    }

    handleSwatchHover = (data, event) => {
      const isValidColor = color.simpleCheckForValidColor(data)
      if (isValidColor) {
        const colors = color.toState(data, data.h || this.state.oldHue)
        this.props.onSwatchHover && this.props.onSwatchHover(colors, event)
      }
    }

    // Update color history
    updateHistory = (newColor) => {
      // If we're not at the latest history entry, trim the history
      if (this.historyIndex < this.colorHistory.length - 1) {
        this.colorHistory = this.colorHistory.slice(0, this.historyIndex + 1)
      }
      
      // Add new color to history
      this.colorHistory.push(newColor)
      
      // Limit history size (optional, but prevents memory issues)
      const MAX_HISTORY = 50
      if (this.colorHistory.length > MAX_HISTORY) {
        this.colorHistory.shift()
      } else {
        this.historyIndex = this.colorHistory.length - 1
      }
    }

    // Undo functionality
    undo = () => {
      if (this.historyIndex > 0) {
        this.historyIndex--
        const previousColor = this.colorHistory[this.historyIndex]
        this.setState(previousColor)
        this.props.onChange && this.props.onChange(previousColor)
        this.props.onChangeComplete && this.props.onChangeComplete(previousColor)
        return true
      }
      return false
    }

    // Redo functionality
    redo = () => {
      if (this.historyIndex < this.colorHistory.length - 1) {
        this.historyIndex++
        const nextColor = this.colorHistory[this.historyIndex]
        this.setState(nextColor)
        this.props.onChange && this.props.onChange(nextColor)
        this.props.onChangeComplete && this.props.onChangeComplete(nextColor)
        return true
      }
      return false
    }

    render() {
      const optionalEvents = {}
      if (this.props.onSwatchHover) {
        optionalEvents.onSwatchHover = this.handleSwatchHover
      }

      return (
        <Picker
          { ...this.props }
          { ...this.state }
          onChange={ this.handleChange }
          undo={ this.undo }
          redo={ this.redo }
          { ...optionalEvents }
        />
      )
    }
  }

  ColorPicker.propTypes = {
    ...Picker.propTypes,
  }

  ColorPicker.defaultProps = {
    ...Picker.defaultProps,
    color: {
      h: 250,
      s: 0.50,
      l: 0.20,
      a: 1,
    },
  }

  return ColorPicker
}

export default ColorWrap
