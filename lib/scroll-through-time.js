'use babel';

import { CompositeDisposable } from 'atom';

function getListener (options) {
  let mainAxis = options.direction == 'left' || options.direction == 'right' ? 'X' : 'Y'
  let crossAxis = mainAxis == 'X' ? 'Y' : 'X'
  let reversed = options.direction == 'right' || options.direction == 'down'
  let keyboard = options.keyboard
  let previousScroll = 0
  let timeout
  return function (e) {
    if (keyboard) {
      if (Math.abs(e['delta' + mainAxis]) < Math.abs(e['delta' + crossAxis]) || !(e.altKey)) {
        return
      }
    } else {
      if (Math.abs(e['delta' + mainAxis]) < Math.abs(e['delta' + crossAxis])) {
        return
      }
    }
    e.stopImmediatePropagation();
    previousScroll += e['delta' + mainAxis]
    clearTimeout(timeout)
    timeout = setTimeout(() => previousScroll = 0, 50)

    if (previousScroll > 50) {
      previousScroll -= 50
      let editor
      if (editor = atom.workspace.getActiveTextEditor()) {
        editor[reversed ? 'undo' : 'redo']()
      }
    } else if (previousScroll < -50) {
      previousScroll += 50
      let editor
      if (editor = atom.workspace.getActiveTextEditor()) {
        editor[reversed ? 'redo' : 'undo']()
      }
    }
  }
}

export default {

  config: {
    active: {
      title: 'Scroll History Active',
      description: 'Enable on Atom startup.',
      type: 'boolean',
      default: true
    },
    direction: {
      title: 'Scroll direction',
      description: 'Set the scroll direction action. Must be up/down on devices without touchpad or sidescroll.',
      type: 'string',
      default: 'down',
      enum: [
        {value: 'left', description: 'Scroll left to undo, right to redo'},
        {value: 'right', description: 'Scroll right to undo, left to redo'},
        {value: 'up', description: 'Scroll up to undo, down to redo'},
        {value: 'down', description: 'Scroll down to undo, up to redo'},
      ],
    },
    keyboardState: {
      title: 'Keyboard + Mouse Support',
      description: 'Enable support for a keyboard modifier key + scroll.',
      type: 'boolean',
      default: false
    }
  },
  subscriptions: null,
  listener: null,
  listenerKeyboard: null,

  activate(state) {
    this.subscriptions = new CompositeDisposable();
    this.listener = getListener({direction: state.direction, keyboard: state.keyboardState})

    if (this.getConfig('active') || state.active) {
      this.setupListener()
    }

    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'scroll-through-time:toggle': () => this.toggle(),
      'scroll-through-time:enable': () => this.toggle(true),
      'scroll-through-time:disable': () => this.toggle(false)
    }));

    this.subscriptions.add(
      atom.config.observe('scroll-through-time.direction', (newValue) => {
        this.removeListener()
        this.listener = getListener({direction: newValue, keyboard: this.getConfig('keyboardState')})
        if (state.active) {
          this.setupListener()
        }
      }));

    this.subscriptions.add(
      atom.config.observe('scroll-through-time.keyboardState', (newValue) => {
          this.removeListener()
          this.listener = getListener({direction: this.getConfig('direction'), keyboard: newValue})
          if (state.active) {
            this.setupListener()
          }
      }));

  },

  deactivate() {
    this.removeListener()
    this.subscriptions.dispose();
  },

  serialize() {
    return atom.config.get('scroll-through-time');
  },

  setupListener() {
    window.addEventListener(
      'mousewheel',
      this.listener,
      {passive: false, capture: true}
    )
  },

  removeListener() {
    window.removeEventListener('mousewheel', this.listener)
  },

  toggle(force) {
    this.active = typeof force !== 'undefined'
      ? force
      : !this.active
    return (
      this.active ?
      this.setupListener() :
      this.removeListener()
    );
  },

  getConfig (config) {
    return atom.config.get(`scroll-through-time.${config}`)
  }

};
